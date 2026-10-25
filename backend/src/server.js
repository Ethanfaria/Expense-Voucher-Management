require("dotenv").config();
const {authenticate, requireRole}=require("./middleware/auth.js")
const express = require("express");
const cors = require("cors");
const pool = require("./config/db.js");

const app = express();
app.use(cors());
app.use(express.json());
const authRoutes=require("./routes/authRoutes.js")
app.use("/api/auth",authRoutes)
app.get("/api/health", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ status: "ok", dbTime: result.rows[0].now });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));