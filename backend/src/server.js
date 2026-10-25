require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db.js");
const voucherRoutes = require("./routes/voucherRoutes");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
const authRoutes = require("./routes/authRoutes.js");
app.use("/api/auth", authRoutes);
app.get("/api/health", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ status: "ok", dbTime: result.rows[0].now });
});
app.use("/api/vouchers", voucherRoutes);

app.use("/uploads", express.static(path.join(__dirname,"../uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));