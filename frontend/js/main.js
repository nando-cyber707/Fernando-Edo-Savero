document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell');
    const authError = document.getElementById('auth-error');
    let appInitialized = false;

    document.getElementById('login-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        authError.classList.add('hidden');
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        });
        if (error) {
            authError.textContent = 'Email atau password tidak valid.';
            authError.classList.remove('hidden');
        }
    });

    document.getElementById('sign-out').addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) showRequestError(error);
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        const isAuthenticated = Boolean(session);
        authScreen.classList.toggle('hidden', isAuthenticated);
        appShell.classList.toggle('hidden', !isAuthenticated);
        if (isAuthenticated && !appInitialized) {
            appInitialized = true;
            refreshApplicationData();
        } else if (!isAuthenticated) {
            appInitialized = false;
        }
    });

    // Event Handlers
    document.getElementById('form-client').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error } = await supabaseClient.from('clients').insert({
            name: document.getElementById('client_name').value,
            npwp: document.getElementById('client_npwp').value,
            email: document.getElementById('client_email').value
        });
        if (error) return showRequestError(error);
        alert('Klien Berhasil Disimpan');
        document.getElementById('form-client').reset();
        loadInitialData();
    });

    document.getElementById('form-invoice').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subtotal = Number(document.getElementById('inv_subtotal').value);
        const ppn = subtotal * 0.11;
        const pph23 = subtotal * 0.02;
        const invoiceNumber = document.getElementById('inv_number').value;
        const description = document.getElementById('inv_description').value;

        try {
            const { error: invoiceError } = await supabaseClient.from('invoices').insert({
                invoice_number: invoiceNumber,
                client_id: document.getElementById('inv_client_id').value,
                service_description: description,
                subtotal,
                ppn_amount: ppn,
                pph23_amount: pph23,
                total_receivable: subtotal + ppn - pph23
            });
            if (invoiceError) throw invoiceError;

            await createJournalEntry(`Penagihan Jasa: ${description}`, invoiceNumber, [
                { coa_code: '1102', debit: subtotal + ppn - pph23, credit: 0 },
                { coa_code: '1103', debit: pph23, credit: 0 },
                { coa_code: '4101', debit: 0, credit: subtotal },
                { coa_code: '2101', debit: 0, credit: ppn }
            ]);

            alert('Invoice Diterbitkan & Jurnal Terintegrasi Otomatis Dibuat');
            document.getElementById('form-invoice').reset();
            await refreshApplicationData();
        } catch (error) {
            showRequestError(error);
        }
    });

    document.getElementById('form-expense').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = Number(document.getElementById('exp_amount').value);
        const expenseNumber = document.getElementById('exp_number').value;
        const description = document.getElementById('exp_description').value;
        const coaCode = document.getElementById('exp_coa_code').value;

        try {
            const { error: expenseError } = await supabaseClient.from('expenses').insert({
                expense_number: expenseNumber,
                coa_code: coaCode,
                description,
                amount
            });
            if (expenseError) throw expenseError;

            await createJournalEntry(`Pengeluaran: ${description}`, expenseNumber, [
                { coa_code: coaCode, debit: amount, credit: 0 },
                { coa_code: '1101', debit: 0, credit: amount }
            ]);

            alert('Beban Dicatat & Jurnal Terintegrasi Otomatis Dibuat');
            document.getElementById('form-expense').reset();
            await refreshApplicationData();
        } catch (error) {
            showRequestError(error);
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
async function createJournalEntry(description, referenceNumber, items) {
    const { data: entry, error: entryError } = await supabaseClient
        .from('journal_entries')
        .insert({ description, ref_number: referenceNumber })
        .select('id')
        .single();
    if (entryError) throw entryError;

    const journalItems = items.map(item => ({ ...item, journal_id: entry.id }));
    const { error: itemsError } = await supabaseClient.from('journal_items').insert(journalItems);
    if (itemsError) throw itemsError;
}

async function refreshApplicationData() {
    try {
        await Promise.all([loadDashboardData(), loadInitialData(), loadInvoices(), loadJournals()]);
    } catch (error) {
        showRequestError(error);
    }
}

function showRequestError(error) {
    console.error('Permintaan gagal:', error);
    alert(`Operasi gagal: ${error.message || 'Periksa koneksi dan hak akses Supabase.'}`);
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
    const { data: journals, error } = await supabaseClient
        .from('journal_items')
        .select('coa_code, debit, credit');
    if (error) throw error;

    const totals = { revenue: 0, expense: 0, receivable: 0, cash: 0 };
    journals.forEach(item => {
        const debit = Number(item.debit) || 0;
        const credit = Number(item.credit) || 0;
        if (item.coa_code === '4101') totals.revenue += credit - debit;
        if (item.coa_code.startsWith('5')) totals.expense += debit - credit;
        if (item.coa_code === '1102') totals.receivable += debit - credit;
        if (item.coa_code === '1101') totals.cash += debit - credit;
    });

    document.getElementById('stat-cash').innerText = `Rp ${totals.cash.toLocaleString('id-ID')}`;
    document.getElementById('stat-revenue').innerText = `Rp ${totals.revenue.toLocaleString('id-ID')}`;
    document.getElementById('stat-receivable').innerText = `Rp ${totals.receivable.toLocaleString('id-ID')}`;
    document.getElementById('stat-netincome').innerText = `Rp ${(totals.revenue - totals.expense).toLocaleString('id-ID')}`;
}

async function loadInitialData() {
    const { data: clients, error } = await supabaseClient.from('clients').select('*').order('name');
    if (error) throw error;
    const select = document.getElementById('inv_client_id');
    select.innerHTML = '<option value="">-- Pilih Klien --</option>';
    clients.forEach(client => select.innerHTML += `<option value="${client.id}">${client.name}</option>`);
}

async function loadInvoices() {
    const { data: invoices, error } = await supabaseClient
        .from('invoices')
        .select('*, clients(name)')
        .order('id', { ascending: false });
    if (error) throw error;
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
    try {
        const { data: invoice, error: invoiceError } = await supabaseClient
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();
        if (invoiceError) throw invoiceError;
        if (invoice.status === 'PAID') throw new Error('Invoice sudah lunas.');

        const { error: updateError } = await supabaseClient
            .from('invoices')
            .update({ status: 'PAID' })
            .eq('id', id);
        if (updateError) throw updateError;

        await createJournalEntry(`Pelunasan Piutang Inv #${invoice.invoice_number}`, `PAY-${invoice.invoice_number}`, [
            { coa_code: '1101', debit: invoice.total_receivable, credit: 0 },
            { coa_code: '1102', debit: 0, credit: invoice.total_receivable }
        ]);
        await refreshApplicationData();
    } catch (error) {
        showRequestError(error);
    }
}

async function loadJournals() {
    const { data: journals, error } = await supabaseClient
        .from('journal_entries')
        .select('*, journal_items(*, coa(name))')
        .order('id', { ascending: false });
    if (error) throw error;
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