const pool = require("../config/db");
const fs = require("fs");

exports.uploadEmployeeSignature = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Signature is required" });
  }
  try {
    const found = await pool.query(
      `SELECT status FROM voucher WHERE id=$1 AND employee_id=$2`,
      [req.params.id, req.user.id],
    );
    if (found.rows.length === 0) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: "Voucher not found" });
    }
    if (found.rows[0].status !== "DRAFT") {
      fs.unlink(req.file.path, () => {});
      return res
        .status(400)
        .json({ error: "Signature can only be added to draft vouchers" });
    }
    const result = await pool.query(
      `UPDATE vouchers
       SET employee_signature_path=$1, updated_at=NOW()
       WHERE id=$2 AND employee_id=$3 AND status='DRAFT'
       RETURNING *`,
      [`/uploads/${req.file.filename}`, req.params.id, req.user.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
