const pool = require("../config/db");

exports.employeeDashboard = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'DRAFT')::int AS draft,
         COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')::int AS pending,
         COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved,
         COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
         COALESCE(SUM(amount) FILTER (WHERE status <> 'DRAFT'), 0)::float AS total_claimed
       FROM vouchers
       WHERE employee_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.directorDashboard = async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')::int AS pending_count,
         COUNT(*) FILTER (WHERE status = 'APPROVED'
                          AND approved_at::date = CURRENT_DATE)::int AS approved_today,
         COUNT(*) FILTER (WHERE status = 'REJECTED'
                          AND updated_at::date = CURRENT_DATE)::int AS rejected_today,
         COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING_APPROVAL'), 0)::float
           AS total_pending_amount
       FROM vouchers`
    );

    const recent = await pool.query(
      `SELECT v.id, v.voucher_number, v.title, v.amount, v.status, v.updated_at,
              u.name AS employee_name
       FROM vouchers v
       JOIN users u ON u.id = v.employee_id
       WHERE v.status <> 'DRAFT'
       ORDER BY v.updated_at DESC
       LIMIT 5`
    );

    res.json({ ...stats.rows[0], recent: recent.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.accountsDashboard = async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')::int AS pending,
         COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved,
         COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
         COALESCE(SUM(amount) FILTER (WHERE status = 'APPROVED'), 0)::float
           AS total_approved_amount
       FROM vouchers
       WHERE status <> 'DRAFT'`
    );

    const recent = await pool.query(
      `SELECT v.id, v.voucher_number, v.title, v.amount, v.approved_at,
              u.name AS employee_name
       FROM vouchers v
       JOIN users u ON u.id = v.employee_id
       WHERE v.status = 'APPROVED'
       ORDER BY v.approved_at DESC
       LIMIT 5`
    );

    res.json({ ...stats.rows[0], recent: recent.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};