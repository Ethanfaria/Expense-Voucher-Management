require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db.js");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ status: "ok", dbTime: result.rows[0].now });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));