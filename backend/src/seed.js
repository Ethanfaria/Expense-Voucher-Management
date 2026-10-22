const bcrypt = require("bcrypt");
const pool = require("./config/db");

const users = [
  {
    name: "Alice Employee",
    email: "employee@test.com",
    role: "EMPLOYEE",
    code: "EMP001",
  },
  {
    name: "Dave Director",
    email: "director@test.com",
    role: "DIRECTOR",
    code: null,
  },
  {
    name: "Amy Accounts",
    email: "accounts@test.com",
    role: "ACCOUNTS",
    code: null,
  },
];

async function seed() {
  try {
    const hash = await bcrypt.hash("password123", 10);
    for (const u of users) {
      await pool.query(
        `INSERT INTO users(name, email, password_hash, role, employee_code)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING`,
        [u.name, u.email, hash, u.role, u.code],
      );
    }
    console.log("Seed success, password123");
  } catch (err) {
    console.log("Seed failed: ", err.message);
  } finally {
    pool.end();
  }
}
seed();
