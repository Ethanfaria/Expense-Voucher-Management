const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("./config/db");

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const between = (min, max) => min + rand() * (max - min);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const uploadsDir = path.join(__dirname, "../uploads");

const employees = [
  { name: "Alice Employee", email: "employee@test.com", code: "EMP001", department: "Sales" },
  { name: "Ravi Sharma", email: "ravi@test.com", code: "EMP002", department: "Engineering" },
  { name: "Priya Nair", email: "priya@test.com", code: "EMP003", department: "Marketing" },
  { name: "Arjun Mehta", email: "arjun@test.com", code: "EMP004", department: "Finance" },
  { name: "Sneha Kulkarni", email: "sneha@test.com", code: "EMP005", department: "HR" },
  { name: "Rohan Desai", email: "rohan@test.com", code: "EMP006", department: "Operations" },
];

const templates = {
  Travel: [
    ["Client visit - Mumbai", "Train and cab fare for client meeting", 1500, 9000],
    ["Airport transfer", "Cab to and from the airport for a business trip", 600, 3000],
  ],
  Meals: [
    ["Team lunch", "Lunch for the project team after sprint review", 900, 5000],
    ["Client dinner", "Dinner with client after contract discussion", 1800, 8000],
  ],
  Accommodation: [
    ["Hotel stay - Bengaluru", "Two nights during the site visit", 4000, 18000],
    ["Hotel stay - Hyderabad", "One night for the regional training", 2500, 9000],
  ],
  Fuel: [
    ["Fuel reimbursement", "Fuel for field visits this week", 800, 4500],
    ["Fuel - site inspection", "Fuel for the vendor site inspection", 1000, 3500],
  ],
  "Office Supplies": [
    ["Stationery purchase", "Notebooks, pens and folders for the team", 300, 3000],
    ["Printer cartridges", "Replacement cartridges for the office printer", 1500, 6500],
  ],
  Communication: [
    ["Mobile recharge", "Monthly data plan for field work", 299, 2500],
    ["Conference call setup", "Headset and subscription for client calls", 1200, 5000],
  ],
  Other: [
    ["Conference registration", "Registration fee for an industry event", 2000, 15000],
    ["Courier charges", "Courier for signed client documents", 150, 1800],
  ],
};
const categories = Object.keys(templates);

const rejectionReasons = [
  "Receipt is missing. Please attach it and resubmit.",
  "Amount exceeds the policy limit for this category.",
  "Expense date is outside the allowed claim period.",
  "Description is unclear. Please add details and resubmit.",
  "This looks like a duplicate of an earlier claim.",
];

const plan = [
  { status: "DRAFT", complete: true },
  { status: "DRAFT", complete: false },
  { status: "PENDING_APPROVAL" },
  { status: "PENDING_APPROVAL" },
  { status: "PENDING_APPROVAL" },
  { status: "APPROVED" },
  { status: "APPROVED" },
  { status: "APPROVED" },
  { status: "APPROVED" },
  { status: "REJECTED" },
  { status: "REJECTED" },
];

function signatureSvg(name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="110" viewBox="0 0 320 110">
<text x="16" y="62" font-family="'Brush Script MT','Segoe Script','Lucida Handwriting',cursive" font-size="44" fill="#1f2a44">${name}</text>
<path d="M16 84 C 90 70, 170 98, 300 76" stroke="#1f2a44" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;
}

function writeSignature(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const file = `seed-sig-${slug}.svg`;
  fs.writeFileSync(path.join(uploadsDir, file), signatureSvg(name));
  return `/uploads/${file}`;
}

async function seedData() {
  const reset = process.argv.includes("--reset");
  fs.mkdirSync(uploadsDir, { recursive: true });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const hash = await bcrypt.hash("password123", 10);
    for (const e of employees) {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role, employee_code)
         VALUES ($1, $2, $3, 'EMPLOYEE', $4)
         ON CONFLICT (email) DO NOTHING`,
        [e.name, e.email, hash, e.code]
      );
    }

    const emails = [...employees.map((e) => e.email), "director@test.com"];
    const found = await client.query(
      `SELECT id, name, email FROM users WHERE email = ANY($1)`,
      [emails]
    );
    const byEmail = Object.fromEntries(found.rows.map((u) => [u.email, u]));
    const director = byEmail["director@test.com"];
    if (!director) throw new Error("Director user not found. Run node src/seed.js first.");

    const directorSig = writeSignature(director.name);
    await client.query(`UPDATE users SET signature_path=$1 WHERE id=$2`, [directorSig, director.id]);
    for (const e of employees) e.signature = writeSignature(e.name);

    if (reset) {
      await client.query("TRUNCATE vouchers RESTART IDENTITY");
      await client.query("ALTER SEQUENCE voucher_number_seq RESTART WITH 1");
    }

    const rows = [];
    employees.forEach((emp, ei) => {
      let approvedIdx = 0;
      let rejectedIdx = 0;

      for (const p of plan) {
        const category = pick(categories);
        const [title, description, lo, hi] = pick(templates[category]);
        const amount = Math.round(between(lo, hi) / 5) * 5;

        let createdAgo; 
        let updatedAgo; 
        let today = false;

        if (p.status === "DRAFT") {
          createdAgo = between(6, 24 * 10);
          updatedAgo = Math.max(0.1, createdAgo - between(0.2, 3));
        } else if (p.status === "PENDING_APPROVAL") {
          createdAgo = between(12, 24 * 14);
          updatedAgo = Math.max(0.1, createdAgo - between(0.5, 6));
        } else {
          if (p.status === "APPROVED") {
            today = approvedIdx === 0 && ei % 2 === 0; // 3 approved today
            approvedIdx++;
          } else {
            today = rejectedIdx === 0 && ei % 3 === 0; // 2 rejected today
            rejectedIdx++;
          }
          if (today) {
            createdAgo = between(30, 80);
            updatedAgo = between(0.3, 3);
          } else {
            createdAgo = between(24 * 3, 24 * 70);
            updatedAgo = createdAgo - between(4, Math.min(96, createdAgo - 26));
          }
        }

        const incompleteDraft = p.status === "DRAFT" && !p.complete;
        const decided = p.status === "APPROVED" || p.status === "REJECTED";

        rows.push({
          createdAgo,
          updatedAgo,
          expenseDaysAgo: incompleteDraft
            ? null
            : Math.ceil(createdAgo / 24) + Math.floor(between(0, 4)),
          department: incompleteDraft ? null : emp.department,
          title,
          category: incompleteDraft ? null : category,
          description: incompleteDraft ? null : description,
          amount: incompleteDraft ? null : amount,
          status: p.status,
          employeeId: byEmail[emp.email].id,
          employeeSig: incompleteDraft ? null : emp.signature,
          directorId: decided ? director.id : null,
          directorSig: p.status === "APPROVED" ? directorSig : null,
          rejectionReason: p.status === "REJECTED" ? pick(rejectionReasons) : null,
          isApproved: p.status === "APPROVED",
        });
      }
    });

    rows.sort((a, b) => b.createdAgo - a.createdAgo);

    for (const r of rows) {
      const seq = await client.query("SELECT nextval('voucher_number_seq') AS n");
      const number = `VCH-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(4, "0")}`;

      await client.query(
        `INSERT INTO vouchers (
           voucher_number, voucher_date, expense_date, department, title, category,
           description, amount, status, employee_id, employee_signature_path,
           director_id, director_signature_path, approved_at, rejection_reason,
           created_at, updated_at
         ) VALUES (
           $1,
           (NOW() - $2::float8 * INTERVAL '1 hour')::date,
           (CURRENT_DATE - $3::int),
           $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
           CASE WHEN $16::boolean THEN NOW() - $14::float8 * INTERVAL '1 hour' END,
           $15,
           NOW() - $2::float8 * INTERVAL '1 hour',
           NOW() - $14::float8 * INTERVAL '1 hour'
         )`,
        [
          number, r.createdAgo, r.expenseDaysAgo, r.department, r.title, r.category,
          r.description, r.amount, r.status, r.employeeId, r.employeeSig,
          r.directorId, r.directorSig, r.updatedAgo, r.rejectionReason, r.isApproved,
        ]
      );
    }

    await client.query("COMMIT");

    const summary = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM vouchers GROUP BY status ORDER BY status`
    );
    console.log(reset ? "Reset and seeded." : "Seeded.");
    console.table(summary.rows);
    console.log("All users: password123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();