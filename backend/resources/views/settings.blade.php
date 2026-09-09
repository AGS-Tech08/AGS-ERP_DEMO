<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AGS ERP Settings</title>
    <style>
        :root { color-scheme: light; font-family: Arial, sans-serif; background: #f4f7fb; color: #1f2937; }
        body { margin: 0; } main { max-width: 1120px; margin: 32px auto; padding: 0 20px 40px; }
        h1 { margin-bottom: 6px; } .notice { min-height: 20px; color: #065f46; } .error { color: #b91c1c; }
        .card { background: #fff; border: 1px solid #dbe2ea; border-radius: 10px; padding: 24px; margin-top: 20px; box-shadow: 0 1px 2px #0000000d; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; }
        label { display: grid; gap: 6px; font-size: 14px; font-weight: 600; } input, textarea, select { box-sizing: border-box; width: 100%; padding: 9px; border: 1px solid #bcc8d6; border-radius: 6px; font: inherit; } textarea { min-height: 76px; }
        button { padding: 9px 14px; border: 0; border-radius: 6px; background: #1d4ed8; color: #fff; font: inherit; cursor: pointer; } button.danger { background: #b91c1c; } button.secondary { background: #475569; } .actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; } th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 14px; } .inline { display: flex; align-items: center; gap: 8px; } .inline input { width: auto; }
        .token { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; } @media (max-width: 650px) { .token { grid-template-columns: 1fr; } table { display: block; overflow-x: auto; } }
    </style>
</head>
<body>
<main>
    <h1>Company Settings</h1>
    <p>Manage company details, invoice bank accounts, and invoice numbering.</p>
    <div class="token">
        <input id="api-token" type="password" placeholder="Paste Sanctum API token">
        <button id="save-token" type="button" class="secondary">Save token</button>
        <button id="load-settings" type="button">Load settings</button>
    </div>
    <p id="notice" class="notice"></p>

    <section class="card">
        <h2>Company Profile</h2>
        <form id="company-form">
            <div class="grid">
                <label>Company name<input name="company_name" required></label>
                <label>GSTIN<input name="gstin" maxlength="20"></label>
                <label>PAN<input name="pan" maxlength="20"></label>
                <label>Phone<input name="phone" maxlength="30"></label>
                <label>Email<input name="email" type="email"></label>
                <label>Website<input name="website"></label>
                <label>City<input name="city"></label>
                <label>State<input name="state"></label>
                <label>Pincode<input name="pincode"></label>
            </div>
            <label>Address<textarea name="address"></textarea></label>
            <div class="actions"><button type="submit">Save company profile</button></div>
        </form>
        <form id="logo-form" class="actions"><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required><button type="submit" class="secondary">Upload logo</button></form>
    </section>

    <section class="card">
        <h2>Invoice Number Settings</h2>
        <form id="invoice-form">
            <div class="grid">
                <label>Invoice prefix<input name="prefix" required maxlength="30"></label>
                <label>Starting number<input name="start_number" type="number" min="1" required></label>
                <label>Next sequence number<input name="next_number" type="number" min="1" required></label>
                <label>Number padding<input name="number_padding" type="number" min="1" max="12" required></label>
                <label>Financial year start month<select name="financial_year_start_month"><option value="4">April</option><option value="1">January</option><option value="7">July</option></select></label>
                <label class="inline"><input name="include_date" type="checkbox"> Include invoice date</label>
                <label class="inline"><input name="include_financial_year" type="checkbox"> Include financial year</label>
            </div>
            <div class="actions"><button type="submit">Save numbering settings</button><button id="preview-invoice" type="button" class="secondary">Preview next invoice</button></div>
        </form>
        <p id="invoice-preview"></p>
    </section>

    <section class="card">
        <h2>Bank Accounts</h2>
        <form id="bank-form">
            <input name="id" type="hidden">
            <div class="grid">
                <label>Bank name<input name="bank_name" required></label>
                <label>Account holder name<input name="account_holder_name" required></label>
                <label>Account number<input name="account_number" maxlength="50" required></label>
                <label>IFSC code<input name="ifsc_code" maxlength="20" required></label>
                <label>Branch<input name="branch"></label>
                <label>Account type<select name="account_type"><option>Current</option><option>Savings</option><option>Overdraft</option><option>Other</option></select></label>
                <label>UPI ID (optional)<input name="upi_id"></label>
                <label class="inline"><input name="is_active" type="checkbox" checked> Active for invoices</label>
            </div>
            <div class="actions"><button type="submit">Save bank account</button><button id="cancel-bank-edit" type="button" class="secondary">Clear form</button></div>
        </form>
        <table><thead><tr><th>Bank</th><th>Holder</th><th>Account</th><th>IFSC</th><th>Status</th><th>Actions</th></tr></thead><tbody id="bank-list"></tbody></table>
    </section>
</main>
<script>
const tokenInput = document.querySelector('#api-token');
const notice = document.querySelector('#notice');
tokenInput.value = localStorage.getItem('ags_erp_token') || '';

function message(text, error = false) { notice.textContent = text; notice.className = error ? 'notice error' : 'notice'; }
function token() { return tokenInput.value.trim(); }
async function api(path, options = {}) {
    if (!token()) throw new Error('Enter a valid API token first.');
    const headers = { Accept: 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) };
    const response = await fetch(`/api${path}`, { ...options, headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || Object.values(body.errors || {}).flat().join(' ') || 'Request failed.');
    return body;
}
function fill(form, data) { Object.entries(data || {}).forEach(([key, value]) => { const field = form.elements[key]; if (!field) return; field.type === 'checkbox' ? field.checked = Boolean(value) : field.value = value ?? ''; }); }
function formData(form) { return Object.fromEntries(new FormData(form).entries()); }

async function loadSettings() {
    try {
        const [company, invoices, banks] = await Promise.all([api('/company-profile'), api('/invoice-number-settings'), api('/bank-accounts')]);
        fill(document.querySelector('#company-form'), company.data);
        fill(document.querySelector('#invoice-form'), invoices.data);
        renderBanks(banks.data);
        message('Settings loaded.');
    } catch (error) { message(error.message, true); }
}
function renderBanks(banks) {
    document.querySelector('#bank-list').innerHTML = banks.map(bank => `<tr><td>${escapeHtml(bank.bank_name)}</td><td>${escapeHtml(bank.account_holder_name)}</td><td>${escapeHtml(bank.account_number_masked)}</td><td>${escapeHtml(bank.ifsc_code)}</td><td>${bank.is_active ? 'Active' : 'Inactive'}</td><td><button type="button" class="secondary" data-edit="${bank.id}">Edit</button> <button type="button" class="danger" data-delete="${bank.id}">Delete</button></td></tr>`).join('');
    document.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editBank(banks.find(bank => bank.id === Number(button.dataset.edit))));
    document.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => deleteBank(button.dataset.delete));
}
function escapeHtml(value) { const node = document.createElement('span'); node.textContent = value ?? ''; return node.innerHTML; }
function editBank(bank) { const form = document.querySelector('#bank-form'); fill(form, bank); form.elements.account_number.value = ''; form.elements.account_number.required = false; form.elements.account_number.placeholder = `Leave blank to keep ${bank.account_number_masked}`; window.scrollTo({ top: form.offsetTop - 20, behavior: 'smooth' }); }
function clearBankForm() { const form = document.querySelector('#bank-form'); form.reset(); form.elements.id.value = ''; form.elements.is_active.checked = true; form.elements.account_number.required = true; form.elements.account_number.placeholder = ''; }
async function deleteBank(id) { if (!confirm('Delete this bank account?')) return; try { await api(`/bank-accounts/${id}`, { method: 'DELETE' }); await loadSettings(); message('Bank account deleted.'); } catch (error) { message(error.message, true); } }

document.querySelector('#save-token').onclick = () => { localStorage.setItem('ags_erp_token', token()); message('API token saved in this browser.'); };
document.querySelector('#load-settings').onclick = loadSettings;
document.querySelector('#company-form').onsubmit = async event => { event.preventDefault(); try { await api('/company-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData(event.target)) }); message('Company profile saved.'); } catch (error) { message(error.message, true); } };
document.querySelector('#logo-form').onsubmit = async event => { event.preventDefault(); try { await api('/company-profile/logo', { method: 'POST', body: new FormData(event.target) }); message('Company logo uploaded.'); event.target.reset(); } catch (error) { message(error.message, true); } };
document.querySelector('#invoice-form').onsubmit = async event => { event.preventDefault(); const data = formData(event.target); data.include_date = event.target.elements.include_date.checked ? 1 : 0; data.include_financial_year = event.target.elements.include_financial_year.checked ? 1 : 0; try { await api('/invoice-number-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); message('Invoice settings saved.'); } catch (error) { message(error.message, true); } };
document.querySelector('#preview-invoice').onclick = async () => { try { const result = await api('/invoice-number-settings/preview'); document.querySelector('#invoice-preview').textContent = `Next invoice: ${result.data.invoice_no}`; } catch (error) { message(error.message, true); } };
document.querySelector('#bank-form').onsubmit = async event => { event.preventDefault(); const form = event.target; const data = formData(form); data.is_active = form.elements.is_active.checked ? 1 : 0; if (!data.account_number) delete data.account_number; const id = data.id; delete data.id; try { await api(id ? `/bank-accounts/${id}` : '/bank-accounts', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); clearBankForm(); await loadSettings(); message('Bank account saved.'); } catch (error) { message(error.message, true); } };
document.querySelector('#cancel-bank-edit').onclick = clearBankForm;
</script>
</body>
</html>
