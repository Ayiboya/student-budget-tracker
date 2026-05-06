document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    setupModal();
});

let allTransactions = [];
let editingTransactionId = null;

async function loadTransactions() {
    try {
        const response = await fetchAPI('/transactions');
        allTransactions = response.data;
        const transactions = response.data;
        const tbody = document.querySelector('#all-transactions-table tbody');
        tbody.innerHTML = '';
        
        if(transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No transactions found.</td></tr>';
            return;
        }

        transactions.forEach(t => {
            const badgeClass = t.type === 'income' ? 'success' : 'danger';
            const amountPrefix = t.type === 'income' ? '+' : '-';
            
            tbody.innerHTML += `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.description}</td>
                    <td>${t.category}</td>
                    <td><span class="badge ${t.type}">${t.type}</span></td>
                    <td style="color: var(--${badgeClass}); font-weight: 600;">
                        ${amountPrefix} GHS ${t.amount.toFixed(2)}
                    </td>
                    <td>
                        <button onclick="editTransaction(${t.id})" class="btn" style="padding: 0.25rem 0.5rem; background: rgba(37, 99, 235, 0.1); color: var(--accent); margin-right: 0.5rem;"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteTransaction(${t.id})" class="btn" style="padding: 0.25rem 0.5rem; background: rgba(239, 68, 68, 0.1); color: var(--danger);"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error(error);
    }
}

async function deleteTransaction(id) {
    if(confirm('Are you sure you want to delete this transaction?')) {
        try {
            await fetchAPI(`/transactions/${id}`, 'DELETE');
            loadTransactions();
        } catch (error) {
            console.error(error);
        }
    }
}

function setupModal() {
    const form = document.getElementById('addTransactionForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            type: document.getElementById('transType').value,
            amount: parseFloat(document.getElementById('transAmount').value),
            category: document.getElementById('transCategory').value,
            description: document.getElementById('transDesc').value,
            date: document.getElementById('transDate').value
        };

        try {
            if (editingTransactionId) {
                await fetchAPI(`/transactions/${editingTransactionId}`, 'PUT', payload);
            } else {
                await fetchAPI('/transactions', 'POST', payload);
            }
            closeTransactionModal();
            form.reset();
            loadTransactions();
        } catch (error) {
            console.error(error);
        }
    });
}

function openTransactionModal() {
    document.getElementById('transactionModal').classList.add('active');
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.remove('active');
    document.getElementById('addTransactionForm').reset();
    document.querySelector('#transactionModal h2').innerText = 'Add Transaction';
    editingTransactionId = null;
}

function editTransaction(id) {
    const t = allTransactions.find(x => x.id === id);
    if(!t) return;
    
    document.getElementById('transType').value = t.type;
    document.getElementById('transAmount').value = t.amount;
    document.getElementById('transCategory').value = t.category;
    document.getElementById('transDesc').value = t.description;
    document.getElementById('transDate').value = t.date;
    
    document.querySelector('#transactionModal h2').innerText = 'Edit Transaction';
    editingTransactionId = id;
    
    openTransactionModal();
}

function exportToPDF() {
    const element = document.querySelector('.glass-card');
    const opt = {
        margin:       0.5,
        filename:     'Transactions_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
