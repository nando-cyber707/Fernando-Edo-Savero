const DEMO_STORAGE_KEY = 'avana-artha-public-demo-v1';
const DEMO_COA = {
    '1101': 'Kas & Bank',
    '1102': 'Piutang Jasa Konsultasi',
    '1103': 'Uang Muka PPh 23 (Dibayar di Muka)',
    '2101': 'Utang PPN / PPN Keluaran',
    '3101': 'Modal Avana Artha',
    '4101': 'Pendapatan Jasa Konsultasi Pajak',
    '5101': 'Beban Gaji & Honor Konsultan',
    '5102': 'Beban Operasional & Akomodasi Proyek'
};
const DEMO_SEED = {
    clients: [
        { id: 1, name: 'PT Contoh Nusantara', npwp: 'DEMO-NPWP-001', email: 'finance@contoh.example' },
        { id: 2, name: 'CV Karya Bersama', npwp: 'DEMO-NPWP-002', email: 'admin@karya.example' }
    ],
    invoices: [
        { id: 1, invoice_number: 'INV/DEMO/001', client_id: 1, service_description: 'Konsultasi pajak bulanan', subtotal: 3000000, ppn_amount: 330000, pph23_amount: 60000, total_receivable: 3270000, status: 'UNPAID' },
        { id: 2, invoice_number: 'INV/DEMO/002', client_id: 2, service_description: 'Pendampingan pelaporan pajak', subtotal: 5000000, ppn_amount: 550000, pph23_amount: 100000, total_receivable: 5450000, status: 'PAID' }
    ],
    expenses: [
        { id: 1, expense_number: 'EXP/DEMO/001', description: 'Biaya operasional proyek', coa_code: '5102', amount: 450000 }
    ],
    journals: [
        { id: 1, entry_date: '2026-09-01', description: 'Setoran modal awal', ref_number: 'OPEN/DEMO/001', journal_items: [
            { coa_code: '1101', debit: 10000000, credit: 0 },
            { coa_code: '3101', debit: 0, credit: 10000000 }
        ] },
        { id: 2, entry_date: '2026-09-02', description: 'Penagihan Jasa: Konsultasi pajak bulanan', ref_number: 'INV/DEMO/001', journal_items: [
            { coa_code: '1102', debit: 3270000, credit: 0 },
            { coa_code: '1103', debit: 60000, credit: 0 },
            { coa_code: '4101', debit: 0, credit: 3000000 },
            { coa_code: '2101', debit: 0, credit: 330000 }
        ] },
        { id: 3, entry_date: '2026-09-03', description: 'Penagihan Jasa: Pendampingan pelaporan pajak', ref_number: 'INV/DEMO/002', journal_items: [
            { coa_code: '1102', debit: 5450000, credit: 0 },
            { coa_code: '1103', debit: 100000, credit: 0 },
            { coa_code: '4101', debit: 0, credit: 5000000 },
            { coa_code: '2101', debit: 0, credit: 550000 }
        ] },
        { id: 4, entry_date: '2026-09-04', description: 'Pelunasan Piutang Inv #INV/DEMO/002', ref_number: 'PAY-INV/DEMO/002', journal_items: [
            { coa_code: '1101', debit: 5450000, credit: 0 },
            { coa_code: '1102', debit: 0, credit: 5450000 }
        ] },
        { id: 5, entry_date: '2026-09-05', description: 'Pengeluaran: Biaya operasional proyek', ref_number: 'EXP/DEMO/001', journal_items: [
            { coa_code: '5102', debit: 450000, credit: 0 },
            { coa_code: '1101', debit: 0, credit: 450000 }
        ] }
    ]
};
let demoData;

document.addEventListener('DOMContentLoaded', () => {

    demoData = loadDemoData();
    refreshApplicationData();

    // Event Handlers
    document.getElementById('form-client').addEventListener('submit', async (e) => {
        e.preventDefault();
        demoData.clients.push({
            id: nextId(demoData.clients),
            name: document.getElementById('client_name').value,
            npwp: document.getElementById('client_npwp').value,
            email: document.getElementById('client_email').value
        });
        saveDemoData();
        alert('Klien demo berhasil disimpan di browser ini.');
        document.getElementById('form-client').reset();
        refreshApplicationData();
    });

    document.getElementById('form-invoice').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subtotal = Number(document.getElementById('inv_subtotal').value);
        const ppn = subtotal * 0.11;
        const pph23 = subtotal * 0.02;
        const invoiceNumber = document.getElementById('inv_number').value;
        const description = document.getElementById('inv_description').value;

        demoData.invoices.push({
            id: nextId(demoData.invoices),
                invoice_number: invoiceNumber,
                client_id: Number(document.getElementById('inv_client_id').value),
                service_description: description,
                subtotal,
                ppn_amount: ppn,
                pph23_amount: pph23,
                total_receivable: subtotal + ppn - pph23,
                status: 'UNPAID'
        });
        createJournalEntry(`Penagihan Jasa: ${description}`, invoiceNumber, [
            { coa_code: '1102', debit: subtotal + ppn - pph23, credit: 0 },
            { coa_code: '1103', debit: pph23, credit: 0 },
            { coa_code: '4101', debit: 0, credit: subtotal },
            { coa_code: '2101', debit: 0, credit: ppn }
        ]);
        saveDemoData();
        alert('Invoice demo dan jurnal berhasil dibuat di browser ini.');
        document.getElementById('form-invoice').reset();
        refreshApplicationData();
    });

    document.getElementById('form-expense').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = Number(document.getElementById('exp_amount').value);
        const expenseNumber = document.getElementById('exp_number').value;
        const description = document.getElementById('exp_description').value;
        const coaCode = document.getElementById('exp_coa_code').value;

        demoData.expenses.push({ id: nextId(demoData.expenses), expense_number: expenseNumber, coa_code: coaCode, description, amount });
        createJournalEntry(`Pengeluaran: ${description}`, expenseNumber, [
            { coa_code: coaCode, debit: amount, credit: 0 },
            { coa_code: '1101', debit: 0, credit: amount }
        ]);
        saveDemoData();
        alert('Beban demo dan jurnal berhasil dibuat di browser ini.');
        document.getElementById('form-expense').reset();
        refreshApplicationData();
    });
});

// Navigation Switcher
function switchTab(tab) {
    const tabs = ['dashboard', 'clients', 'invoices', 'expenses', 'journals'];
    tabs.forEach(t => {
        document.getElementById(`view-${t}`).classList.add('hidden');
        document.getElementById(`nav-${t}`).classList.remove('bg-emerald-600', 'text-white');
        document.getElementById(`nav-${t}`).classList.add('text-slate-400');
    });

    document.getElementById(`view-${tab}`).classList.remove('hidden');
    document.getElementById(`nav-${tab}`).classList.add('bg-emerald-600', 'text-white');
    
    const titles = {
        dashboard: 'Dashboard Keuangan',
        clients: 'Master Data Klien Wajib Pajak',
        invoices: 'Penagihan / Invoicing Jasa',
        expenses: 'Pencatatan Beban & Pengeluaran',
        journals: 'Buku Jurnal Umum Terintegrasi'
    };
    document.getElementById('page-title').innerText = titles[tab];
}

// Data Loaders
async function createJournalEntry(description, referenceNumber, items) {
    demoData.journals.push({
        id: nextId(demoData.journals),
        entry_date: new Date().toISOString().slice(0, 10),
        description,
        ref_number: referenceNumber,
        journal_items: items.map(item => ({ ...item }))
    });
}

function loadDemoData() {
    try {
        const saved = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY));
        if (saved && saved.clients && saved.invoices && saved.expenses && saved.journals) return saved;
    } catch (error) {
        console.warn('Data demo lokal tidak dapat dibaca:', error);
    }
    return JSON.parse(JSON.stringify(DEMO_SEED));
}

function saveDemoData() {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoData));
}

function nextId(records) {
    return records.reduce((largest, record) => Math.max(largest, Number(record.id) || 0), 0) + 1;
}

function refreshApplicationData() {
    loadDashboardData();
    loadInitialData();
    loadInvoices();
    loadJournals();
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

// Data Loaders
async function downloadReportPdf(reportType) {
    const reports = {
        invoices: { bodyId: 'invoice-table-body', title: 'Daftar Tagihan Invoice' },
        journals: { bodyId: 'journal-table-body', title: 'Laporan Jurnal Umum' }
    };
    const report = reports[reportType];

    if (!report || typeof html2pdf !== 'function') {
        alert('Fitur PDF belum tersedia. Periksa koneksi internet dan muat ulang halaman.');
        return;
    }

    const sourceTable = document.getElementById(report.bodyId).closest('table');
    const table = sourceTable.cloneNode(true);
    if (reportType === 'invoices') {
        table.querySelectorAll('tr').forEach(row => row.lastElementChild?.remove());
    }

    table.style.cssText = 'width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:9px;color:#1f2937;';
    table.querySelector('thead').style.display = 'table-header-group';
    table.querySelectorAll('tr').forEach((row, rowIndex) => {
        row.style.breakInside = 'avoid';
        row.style.pageBreakInside = 'avoid';
        row.querySelectorAll('th,td').forEach(cell => {
            cell.textContent = cell.textContent.trim();
            cell.style.cssText = `border:1px solid #cbd5e1;padding:7px 8px;text-align:left;vertical-align:top;${cell.tagName === 'TH' ? 'background:#0f172a;color:#fff;font-weight:700;' : `background:${rowIndex % 2 === 0 ? '#f8fafc' : '#fff'};`}`;
        });
    });

    const documentNode = document.createElement('div');
    documentNode.id = 'pdf-export-document';
    documentNode.style.cssText = 'position:relative;width:1100px;padding:32px;background:#fff;box-sizing:border-box;color:#1f2937;font-family:Arial,sans-serif;';

    const letterhead = document.createElement('div');
    letterhead.style.cssText = 'display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:3px solid #059669;margin-bottom:20px;';
    const mark = document.createElement('div');
    mark.textContent = 'AA';
    mark.style.cssText = 'display:flex;align-items:center;justify-content:center;width:48px;height:48px;background:#0f172a;color:#fff;font-size:18px;font-weight:700;';
    const company = document.createElement('div');
    const companyName = document.createElement('div');
    companyName.textContent = 'AVANA ARTHA';
    companyName.style.cssText = 'font-size:20px;font-weight:700;letter-spacing:1px;color:#0f172a;';
    const companySubtitle = document.createElement('div');
    companySubtitle.textContent = 'TAX CONSULTANT';
    companySubtitle.style.cssText = 'margin-top:3px;font-size:10px;font-weight:600;letter-spacing:1px;color:#047857;';
    company.append(companyName, companySubtitle);
    letterhead.append(mark, company);

    const reportHeading = document.createElement('div');
    reportHeading.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:14px;';
    const title = document.createElement('h1');
    title.textContent = report.title;
    title.style.cssText = 'margin:0;font-size:16px;font-weight:700;color:#0f172a;';
    const printedAt = document.createElement('div');
    printedAt.textContent = `Tanggal cetak: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}`;
    printedAt.style.cssText = 'font-size:9px;color:#475569;white-space:nowrap;';
    reportHeading.append(title, printedAt);
    documentNode.append(letterhead, reportHeading, table);
    document.body.appendChild(documentNode);

    const exportOverlay = document.createElement('div');
    exportOverlay.setAttribute('role', 'status');
    exportOverlay.textContent = 'Menyiapkan PDF...';
    exportOverlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.96);color:#0f172a;font:600 14px Arial,sans-serif;';
    document.body.appendChild(exportOverlay);

    const now = new Date();
    const dateStamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    try {
        await html2pdf().set({
            margin: [10, 10, 12, 10],
            filename: `avana-artha-${reportType}-${dateStamp}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: 0,
                onclone: clonedDocument => {
                    const clonedExport = clonedDocument.getElementById('pdf-export-document');
                    if (clonedExport) {
                        clonedExport.style.visibility = 'visible';
                        clonedExport.style.position = 'static';
                        clonedExport.style.left = 'auto';
                        clonedExport.style.top = 'auto';
                        clonedExport.style.opacity = '1';
                    }
                }
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] }
        }).from(documentNode).save();
    } catch (error) {
        console.error('Gagal membuat PDF:', error);
        alert('PDF gagal dibuat. Silakan coba lagi.');
    } finally {
        documentNode.remove();
        exportOverlay.remove();
    }
}

// Data Loaders
async function loadDashboardData() {
    const totals = { revenue: 0, expense: 0, receivable: 0, cash: 0 };
    demoData.journals.flatMap(entry => entry.journal_items).forEach(item => {
        if (item.coa_code === '4101') totals.revenue += Number(item.credit) - Number(item.debit);
        if (item.coa_code.startsWith('5')) totals.expense += Number(item.debit) - Number(item.credit);
        if (item.coa_code === '1102') totals.receivable += Number(item.debit) - Number(item.credit);
        if (item.coa_code === '1101') totals.cash += Number(item.debit) - Number(item.credit);
    });

    document.getElementById('stat-cash').innerText = `Rp ${totals.cash.toLocaleString('id-ID')}`;
    document.getElementById('stat-revenue').innerText = `Rp ${totals.revenue.toLocaleString('id-ID')}`;
    document.getElementById('stat-receivable').innerText = `Rp ${totals.receivable.toLocaleString('id-ID')}`;
    document.getElementById('stat-netincome').innerText = `Rp ${(totals.revenue - totals.expense).toLocaleString('id-ID')}`;
}

async function loadInitialData() {
    const select = document.getElementById('inv_client_id');
    select.replaceChildren(new Option('-- Pilih Klien --', ''));
    demoData.clients.slice().sort((first, second) => first.name.localeCompare(second.name, 'id'))
        .forEach(client => select.add(new Option(client.name, client.id)));
}

function loadInvoices() {
    const tbody = document.getElementById('invoice-table-body');
    tbody.innerHTML = '';

    demoData.invoices.slice().sort((first, second) => second.id - first.id).forEach(inv => {
        const client = demoData.clients.find(item => item.id === Number(inv.client_id));
        tbody.innerHTML += `
            <tr class="border-b text-xs">
                <td class="p-3 font-semibold">${escapeHtml(inv.invoice_number)}</td>
                <td class="p-3">${escapeHtml(client ? client.name : '-')}</td>
                <td class="p-3">Rp ${Number(inv.subtotal).toLocaleString('id-ID')}</td>
                <td class="p-3">Rp ${Number(inv.ppn_amount).toLocaleString('id-ID')}</td>
                <td class="p-3 text-rose-600">Rp ${Number(inv.pph23_amount).toLocaleString('id-ID')}</td>
                <td class="p-3 font-bold">Rp ${Number(inv.total_receivable).toLocaleString('id-ID')}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                        ${inv.status}
                    </span>
                </td>
                <td class="p-3">
                    ${inv.status === 'UNPAID' ? `<button onclick="payInvoice(${inv.id})" class="bg-blue-600 text-white px-2.5 py-1 rounded text-xs hover:bg-blue-700">Pelunasan</button>` : '-'}
                </td>
            </tr>
        `;
    });
}

function payInvoice(id) {
    if (!confirm('Proses pelunasan tagihan ini? (Otomatis menambah Kas & Mengurangi Piutang)')) return;
    const invoice = demoData.invoices.find(item => item.id === Number(id));
    if (!invoice || invoice.status === 'PAID') return;
    invoice.status = 'PAID';
    createJournalEntry(`Pelunasan Piutang Inv #${escapeHtml(invoice.invoice_number)}`, `PAY-${invoice.invoice_number}`, [
            { coa_code: '1101', debit: invoice.total_receivable, credit: 0 },
            { coa_code: '1102', debit: 0, credit: invoice.total_receivable }
        ]);
    saveDemoData();
    refreshApplicationData();
}

function loadJournals() {
    const tbody = document.getElementById('journal-table-body');
    tbody.innerHTML = '';

    demoData.journals.slice().sort((first, second) => second.id - first.id).forEach(entry => {
        entry.journal_items.forEach((item, index) => {
            tbody.innerHTML += `
                <tr class="${index === 0 ? 'border-t bg-slate-50' : 'border-b'} text-xs">
                    <td class="p-2.5 border">${index === 0 ? entry.entry_date : ''}</td>
                    <td class="p-2.5 border font-semibold">${index === 0 ? `${escapeHtml(entry.description)} (${escapeHtml(entry.ref_number)})` : ''}</td>
                    <td class="p-2.5 border ${item.credit > 0 ? 'pl-8 text-slate-600' : 'font-medium'}">${item.coa_code} - ${DEMO_COA[item.coa_code] || 'Akun Demo'}</td>
                    <td class="p-2.5 border text-right">${item.debit > 0 ? `Rp ${Number(item.debit).toLocaleString('id-ID')}` : '-'}</td>
                    <td class="p-2.5 border text-right">${item.credit > 0 ? `Rp ${Number(item.credit).toLocaleString('id-ID')}` : '-'}</td>
                </tr>
            `;
        });
    });
}