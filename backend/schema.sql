CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL
                CHECK (role IN ('EMPLOYEE', 'DIRECTOR', 'ACCOUNTS')),
  employee_code VARCHAR(30),
  signature_path TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vouchers (
  id                        SERIAL PRIMARY KEY,
  voucher_number            VARCHAR(30) UNIQUE NOT NULL,
  voucher_date              DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_date              DATE,
  department                VARCHAR(100),
  title                     VARCHAR(200),
  category                  VARCHAR(100),
  description               TEXT,
  amount                    NUMERIC(12,2),
  status                    VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED')),
  employee_id               INT NOT NULL REFERENCES users(id),
  employee_signature_path   TEXT,
  director_id               INT REFERENCES users(id),
  director_signature_path   TEXT,
  approved_at               TIMESTAMP,
  rejection_reason          TEXT,
  created_at                TIMESTAMP DEFAULT NOW(),
  updated_at                TIMESTAMP DEFAULT NOW()
);

CREATE SEQUENCE voucher_number_seq START 1;