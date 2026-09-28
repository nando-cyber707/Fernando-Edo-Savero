const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Masukkan Project URL dan Publishable Key Supabase Anda
const SUPABASE_URL = 'https://tukxnvkkmrtfzagoryty.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cAgPjEgU9JPP_geaoJB3ZA_etRp_w9f';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Fetch Summary Dashboard Stats
app.get('/api/dashboard', async (req, res) => {
    try {
        const { data: journals } = await supabase.from('journal_items').select('coa_code, debit, credit');
        
        let totalRevenue = 0;
        let totalExpense = 0;
        let totalReceivable = 0;
        let totalCash = 0;

        journals.forEach(item => {
            const deb = parseFloat(item.debit);
            const cred = parseFloat(item.credit);

            if (item.coa_code === '4101') totalRevenue += (cred - deb);
            if (item.coa_code.startsWith('5')) totalExpense += (deb - cred);
            if (item.coa_code === '1102') totalReceivable += (deb - cred);
            if (item.coa_code === '1101') totalCash += (deb - cred);
        });

        res.json({
            revenue: totalRevenue,
            expense: totalExpense,
            netIncome: totalRevenue - totalExpense,
            receivable: totalReceivable,
            cash: totalCash
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Fetch Master Data (Clients & COA)
app.get('/api/initial-data', async (req, res) => {
    try {
        const { data: coa } = await supabase.from('coa').select('*').order('code');
        const { data: clients } = await supabase.from('clients').select('*').order('name');
        res.json({ coa, clients });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Tambah Klien
app.post('/api/clients', async (req, res) => {
    const { name, npwp, email } = req.body;
    const { data, error } = await supabase.from('clients').insert([{ name, npwp, email }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

// 4. Generate Invoice (Auto-Journal Penagihan)
app.post('/api/invoices', async (req, res) => {
    const { invoice_number, client_id, service_description, subtotal } = req.body;

    const sub = parseFloat(subtotal);
    const ppn = sub * 0.11;      // PPN 11%
    const pph23 = sub * 0.02;    // PPh 23 2%
    const total_receivable = sub + ppn - pph23;

    try {
        const { data: inv, error: invErr } = await supabase
            .from('invoices')
            .insert([{ invoice_number, client_id, service_description, subtotal: sub, ppn_amount: ppn, pph23_amount: pph23, total_receivable }])
            .select();
        if (invErr) throw invErr;

        // Auto Journal Entry
        const { data: jHeader } = await supabase
            .from('journal_entries')
            .insert([{ description: `Penagihan Jasa: ${service_description}`, ref_number: invoice_number }])
            .select();

        const journalId = jHeader[0].id;
        const journalItems = [
            { journal_id: journalId, coa_code: '1102', debit: total_receivable, credit: 0 }, // Piutang Usaha
            { journal_id: journalId, coa_code: '1103', debit: pph23, credit: 0 },            // Uang Muka PPh 23
            { journal_id: journalId, coa_code: '4101', debit: 0, credit: sub },             // Pendapatan Jasa
            { journal_id: journalId, coa_code: '2101', debit: 0, credit: ppn }              // Utang PPN
        ];

        await supabase.from('journal_items').insert(journalItems);
        res.json({ message: 'Invoice & Jurnal Berhasil Dibuat', invoice: inv[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Pelunasan Invoice (Auto-Journal Pelunasan Kas)
app.post('/api/invoices/pay', async (req, res) => {
    const { invoice_id } = req.body;
    try {
        const { data: inv } = await supabase.from('invoices').select('*').eq('id', invoice_id).single();
        if (!inv || inv.status === 'PAID') return res.status(400).json({ error: 'Invoice tidak valid atau sudah lunas' });

        // Update status invoice
        await supabase.from('invoices').update({ status: 'PAID' }).eq('id', invoice_id);

        // Auto-Journal Penerimaan Kas
        const { data: jHeader } = await supabase
            .from('journal_entries')
            .insert([{ description: `Pelunasan Piutang Inv #${inv.invoice_number}`, ref_number: `PAY-${inv.invoice_number}` }])
            .select();

        const journalItems = [
            { journal_id: jHeader[0].id, coa_code: '1101', debit: inv.total_receivable, credit: 0 }, // Kas Bertambah
            { journal_id: jHeader[0].id, coa_code: '1102', debit: 0, credit: inv.total_receivable }  // Piutang Berkurang
        ];

        await supabase.from('journal_items').insert(journalItems);
        res.json({ message: 'Pelunasan Berhasil Diberlakukan' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Pencatatan Beban/Pengeluaran Proyek (Auto-Journal Expense)
app.post('/api/expenses', async (req, res) => {
    const { expense_number, description, coa_code, amount } = req.body;
    const amt = parseFloat(amount);

    try {
        const { data: exp, error: expErr } = await supabase
            .from('expenses')
            .insert([{ expense_number, description, coa_code, amount: amt }])
            .select();
        if (expErr) throw expErr;

        // Auto-Journal Beban
        const { data: jHeader } = await supabase
            .from('journal_entries')
            .insert([{ description: `Pengeluaran: ${description}`, ref_number: expense_number }])
            .select();

        const journalItems = [
            { journal_id: jHeader[0].id, coa_code: coa_code, debit: amt, credit: 0 }, // Beban Bertambah
            { journal_id: jHeader[0].id, coa_code: '1101', debit: 0, credit: amt }     // Kas Berkurang
        ];

        await supabase.from('journal_items').insert(journalItems);
        res.json({ message: 'Pengeluaran Berhasil Dicatat' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Get All Invoices
app.get('/api/invoices', async (req, res) => {
    const { data } = await supabase.from('invoices').select('*, clients(name)').order('id', { ascending: false });
    res.json(data || []);
});

// 8. Get Laporan Jurnal Umum
app.get('/api/journals', async (req, res) => {
    const { data } = await supabase
        .from('journal_entries')
        .select('*, journal_items(*, coa(name))')
        .order('id', { ascending: false });
    res.json(data || []);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`SIA Avana Artha Tax Consultant running on port ${PORT}`));