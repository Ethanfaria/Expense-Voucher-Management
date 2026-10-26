const { Pool, types } = require("pg");
require("dotenv").config();

types.setTypeParser(1082, (value) => value);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;
