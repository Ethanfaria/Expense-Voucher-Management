const pool = require("../config/db");

exports.saveMySignature = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Signature image is required" });
  }
  try {
    const result = await pool.query(
      `UPDATE users SET signature_path=$1 WHERE id=$2
            RETURNING id, name, email, role, signature_path`,
      ["/uploads/${req.file.filename}", req.user.id],
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
