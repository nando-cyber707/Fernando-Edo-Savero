document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    loadInitialData();
    loadInvoices();
    loadJournals();

    // Event Handlers
    document.getElementById('form-client').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            name: document.getElementById('client_name').value,
            npwp: document.getElementById('client_npwp').value,
            email: document.getElementById('client_email').value
        };
        const res = await fetch(`${API_BASE_URL}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) { alert('Klien Berhasil Disimpan'); document.getElementById('form-client').reset(); loadInitialData(); }
    });

    document.getElementById('form-invoice').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            invoice_number: document.getElementById('inv_number').value,
            client_id: document.getElementById('inv_client_id').value,
            service_description: document.getElementById('inv_description').value,
            subtotal: document.getElementById('inv_subtotal').value
        };
        const res = await fetch(`${API_BASE_URL}/invoices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) {
            alert('Invoice Diterbitkan & Jurnal Terintegrasi Otomatis Dibuat');
            document.getElementById('form-invoice').reset();
            loadInvoices(); loadJournals(); loadDashboardData();
        }
    });

    document.getElementById('form-expense').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            expense_number: document.getElementById('exp_number').value,
            coa_code: document.getElementById('exp_coa_code').value,
            description: document.getElementById('exp_description').value,
            amount: document.getElementById('exp_amount').value
        };
        const res = await fetch(`${API_BASE_URL}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) {
            alert('Beban Dicatat & Jurnal Terintegrasi Otomatis Dibuat');
            document.getElementById('form-expense').reset();
            loadJournals(); loadDashboardData();
        }
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
    const res = await fetch(`${API_BASE_URL}/dashboard`);
    const data = await res.json();
    document.getElementById('stat-cash').innerText = `Rp ${Number(data.cash).toLocaleString('id-ID')}`;
    document.getElementById('stat-revenue').innerText = `Rp ${Number(data.revenue).toLocaleString('id-ID')}`;
    document.getElementById('stat-receivable').innerText = `Rp ${Number(data.receivable).toLocaleString('id-ID')}`;
    document.getElementById('stat-netincome').innerText = `Rp ${Number(data.netIncome).toLocaleString('id-ID')}`;
}

async function loadInitialData() {
    const res = await fetch(`${API_BASE_URL}/initial-data`);
    const data = await res.json();
    const select = document.getElementById('inv_client_id');
    select.innerHTML = '<option value="">-- Pilih Klien --</option>';
    data.clients.forEach(c => select.innerHTML += `<option value="${c.id}">${c.name}</option>`);
}

async function loadInvoices() {
    const res = await fetch(`${API_BASE_URL}/invoices`);
    const invoices = await res.json();
    const tbody = document.getElementById('invoice-table-body');
    tbody.innerHTML = '';

    invoices.forEach(inv => {
        tbody.innerHTML += `
            <tr class="border-b text-xs">
                <td class="p-3 font-semibold">${inv.invoice_number}</td>
                <td class="p-3">${inv.clients ? inv.clients.name : '-'}</td>
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

async function payInvoice(id) {
    if (!confirm('Proses pelunasan tagihan ini? (Otomatis menambah Kas & Mengurangi Piutang)')) return;
    const res = await fetch(`${API_BASE_URL}/invoices/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: id }) });
    if (res.ok) { loadInvoices(); loadJournals(); loadDashboardData(); }
}

async function loadJournals() {
    const res = await fetch(`${API_BASE_URL}/journals`);
    const journals = await res.json();
    const tbody = document.getElementById('journal-table-body');
    tbody.innerHTML = '';

    journals.forEach(entry => {
        entry.journal_items.forEach((item, index) => {
            tbody.innerHTML += `
                <tr class="${index === 0 ? 'border-t bg-slate-50' : 'border-b'} text-xs">
                    <td class="p-2.5 border">${index === 0 ? entry.entry_date : ''}</td>
                    <td class="p-2.5 border font-semibold">${index === 0 ? `${entry.description} (${entry.ref_number})` : ''}</td>
                    <td class="p-2.5 border ${item.credit > 0 ? 'pl-8 text-slate-600' : 'font-medium'}">${item.coa_code} - ${item.coa.name}</td>
                    <td class="p-2.5 border text-right">${item.debit > 0 ? `Rp ${Number(item.debit).toLocaleString('id-ID')}` : '-'}</td>
                    <td class="p-2.5 border text-right">${item.credit > 0 ? `Rp ${Number(item.credit).toLocaleString('id-ID')}` : '-'}</td>
                </tr>
            `;
        });
    });
}