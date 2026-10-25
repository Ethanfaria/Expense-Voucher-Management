const pool = require("../config/db");
const fs = require("fs");

async function generateVoucherNumber() {
  const result = await pool.query("SELECT nextval('voucher_number_seq') AS n");
  const year = new Date().getFullYear();
  return `VCH-${year}-${String(result.rows[0].n).padStart(4, "0")}`;
}

function validateForSubmit(v) {
  const errors = [];
  if (!v.department) errors.push("Department is required");
  if (!v.title) errors.push("Expense title is required");
  if (!v.expense_date) errors.push("Expense date is required");
  if (!(Number(v.amount) > 0)) errors.push("Amount must be greater than zero");
  if (!v.employee_signature_path) errors.push("Employee signature is required");
}

exports.createVoucher = async (req, res) => {
  const { expense_date, department, title, category, description, amount } =
    req.body;
  if (amount !== undefined && amount !== null && !(Number(amount) > 0)) {
    return res.status(400).json({ error: "Amount must be greater than zero" });
  }
  try {
    const voucherNumber = await generateVoucherNumber();

    const result = await pool.query(
      `INSERT INTO vouchers
      (voucher_number, expense_date, department, 
      title, category, description, amount, employee_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        voucherNumber,
        expense_date,
        department,
        title,
        category,
        description,
        amount,
        req.user.id,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMyVouchers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM vouchers WHERE employee_id=$1 ORDER BY created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getVoucherById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM vouchers WHERE id=$1 AND employee_id=$2`,
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Voucher not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteDraftVoucher = async (req, res) => {
  try {
    const found = await pool.query(
      `SELECT status FROM vouchers WHERE id=$1 AND employee_id=$2`,
      [req.params.id, req.user.id],
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "Voucher not found" });
    }
    if (found.rows[0].status !== "DRAFT") {
      return res
        .status(400)
        .json({ error: "Only draft vouchers can be deleted" });
    }
    await pool.query(`DELETE FROM vouchers WHERE id=$1 AND status='DRAFT'`, [
      req.params.id,
    ]);
    res.json({ message: "Voucher deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateDraftVoucher = async (req, res) => {
  const { expense_date, department, title, category, description, amount } =
    req.body;
  if (amount !== undefined && amount !== null && !(Number(amount) > 0)) {
    return res.status(400).json({ error: "Amount must be greater than zero" });
  }
  try {
    const found = await pool.query(
      `SELECT status FROM vouchers WHERE id=$1 AND employee_id=$2`,
      [req.params.id, req.user.id],
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "Voucher not found" });
    }
    if (found.rows[0].status !== "DRAFT") {
      return res
        .status(400)
        .json({ error: "Only draft vouchers can be edited" });
    }
    const result = await pool.query(
      `UPDATE vouchers
      SET expense_date=$1, department=$2, title=$3, category=$4,
      description=$5, amount=$6, updated_at=NOW()
      WHERE id=$7 AND employee_id=$8 AND status='DRAFT'
      RETURNING *`,
      [
        expense_date,
        department,
        title,
        category,
        description,
        amount,
        req.params.id,
        req.user.id,
      ],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.submitVoucher = async (req, res) => {
  try {
    const found = await pool.query(
      `SELECT * FROM vouchers WHERE id=$1 AND employee_id=$2`,
      [req.params.id, req.user.id],
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "Voucher not found" });
    }
    const voucher = found.rows[0];
    if (voucher.status !== "DRAFT") {
      return res
        .status(400)
        .json({ error: "Only draft vouchers can be submitted" });
    }
    const errors = validateForSubmit(voucher);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Voucher is incomplete", details: errors });
    }
    const result = await pool.query(
      `UPDATE vouchers
      SET status='PENDING_APPROVAL', updated_at=NOW()
      WHERE id=$1 AND employee_id=$2 AND status='DRAFT'
      RETURNING *`,
      [req.params.id, req.user.id],
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.approveVoucher = async (req, res) => {
  try {
    const found = await pool.query(`SELECT status FROM vouchers WHERE id=$1`, [
      req.params.id,
    ]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "Voucher not found" });
    }
    if (found.rows[0].status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        error: "Only pending vouchers can be approved",
      });
    }
    let signaturePath = null;
    if (req.file) {
      signaturePath = `/uploads/${req.file.filename}`;
    } else {
      const me = await pool.query(
        `SELECT signature_path FROM users WHERE id = $1`,
        [req.user.id],
      );

      signaturePath = me.rows[0]?.signature_path;
    }

    if (!signaturePath) {
      return res.status(400).json({
        error: "Director signature is required",
      });
    }
    const result = await pool.query(
      `UPDATE vouchers
       SET status = 'APPROVED',
           director_id = $1,
           director_signature_path = $2,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
         AND status = 'PENDING_APPROVAL'
       RETURNING *`,
      [req.user.id, signaturePath, req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Voucher could not be approved",
      });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.rejectVoucher = async (req, res) => {
  const { rejection_reason } = req.body;
  if (typeof rejection_reason !== "string" || !rejection_reason.trim()) {
    return res.status(400).json({ error: "Rejection reason is required" });
  }
  try {
    const found = await pool.query(`SELECT status FROM vouchers WHERE id=$1`, [
      req.params.id,
    ]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "Voucher not found" });
    }
    if (found.rows[0].status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        error: "Only pending vouchers can be rejected",
      });
    }
    
    const result = await pool.query(
      `UPDATE vouchers
       SET status = 'REJECTED',
           director_id = $1,
           rejection_reason = $2,
           updated_at = NOW()
       WHERE id = $3
         AND status = 'PENDING_APPROVAL'
       RETURNING *`,
      [req.user.id, rejection_reason.trim(), req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Voucher could not be rejected",
      });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
