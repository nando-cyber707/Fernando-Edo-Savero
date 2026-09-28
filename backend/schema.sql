-- 1. Chart of Accounts (COA)
CREATE TABLE IF NOT EXISTS coa (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')) NOT NULL
);

-- Seed Data COA Avana Artha Tax Consultant
INSERT INTO coa (code, name, type) VALUES
('1101', 'Kas & Bank', 'Asset'),
('1102', 'Piutang Jasa Konsultasi', 'Asset'),
('1103', 'Uang Muka PPh 23 (Dibayar di Muka)', 'Asset'),
('2101', 'Utang PPN / PPN Keluaran', 'Liability'),
('2102', 'Utang Biaya / Operasional', 'Liability'),
('3101', 'Modal Avana Artha', 'Equity'),
('4101', 'Pendapatan Jasa Konsultasi Pajak', 'Revenue'),
('5101', 'Beban Gaji & Honor Konsultan', 'Expense'),
('5102', 'Beban Operasional & Akomodasi Proyek', 'Expense')
ON CONFLICT (code) DO NOTHING;

-- 2. Master Klien
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    npwp VARCHAR(25),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Invoice (Siklus Pendapatan)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    service_description TEXT NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    ppn_amount NUMERIC(15, 2) NOT NULL,       -- PPN Keluaran 11%
    pph23_amount NUMERIC(15, 2) NOT NULL,     -- PPh 23 2% (Dipotong Klien)
    total_receivable NUMERIC(15, 2) NOT NULL, -- Total Piutang
    status VARCHAR(20) DEFAULT 'UNPAID',      -- UNPAID / PAID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Beban/Pengeluaran Proyek (Siklus Pengeluaran)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    coa_code VARCHAR(10) REFERENCES coa(code),
    amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Jurnal Utama (Header)
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    entry_date DATE DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    ref_number VARCHAR(50)
);

-- 6. Tabel Detail Jurnal (Debit & Kredit)
CREATE TABLE IF NOT EXISTS journal_items (
    id SERIAL PRIMARY KEY,
    journal_id INT REFERENCES journal_entries(id) ON DELETE CASCADE,
    coa_code VARCHAR(10) REFERENCES coa(code),
    debit NUMERIC(15, 2) DEFAULT 0,
    credit NUMERIC(15, 2) DEFAULT 0
);