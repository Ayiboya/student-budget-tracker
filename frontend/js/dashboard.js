let barChartInstance = null;
let doughnutChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setupModal();
});

async function loadDashboardData() {
    try {
        const summary = await fetchAPI('/summary');
        const transactionsReq = await fetchAPI('/transactions');
        
        // Update summary cards
        document.getElementById('summary-balance').textContent = summary.balance.toFixed(2);
        document.getElementById('summary-income').textContent = summary.income.toFixed(2);
        document.getElementById('summary-expenses').textContent = summary.expenses.toFixed(2);

        const transactions = transactionsReq.data;
        updateRecentTransactions(transactions);
        updateCharts(transactions);
    } catch (error) {
        console.error(error);
    }
}

function updateRecentTransactions(transactions) {
    const tbody = document.querySelector('#recent-transactions-table tbody');
    tbody.innerHTML = '';
    
    // Only show latest 5
    const recent = transactions.slice(0, 5);
    
    recent.forEach(t => {
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
            </tr>
        `;
    });
}

function updateCharts(transactions) {
    // Process data for charts
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const categoryTotals = {};

    transactions.forEach(t => {
        if (t.type === 'income') monthlyIncome += t.amount;
        if (t.type === 'expense') {
            monthlyExpense += t.amount;
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }
    });

    // Chart Options (Glassmorphism styling)
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. Bar Chart (Income vs Expense)
    const barCtx = document.getElementById('barChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();
    
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount (GHS)',
                data: [monthlyIncome, monthlyExpense],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(239, 68, 68, 0.6)'
                ],
                borderColor: [
                    '#10b981',
                    '#ef4444'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // 2. Doughnut Chart (Expenses by Category)
    const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
    if (doughnutChartInstance) doughnutChartInstance.destroy();

    const categories = Object.keys(categoryTotals);
    const categoryData = Object.values(categoryTotals);
    
    const colors = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'
    ];

    doughnutChartInstance = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: categories.length > 0 ? categories : ['No Expenses'],
            datasets: [{
                data: categoryData.length > 0 ? categoryData : [1],
                backgroundColor: categoryData.length > 0 ? colors : ['rgba(255,255,255,0.1)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

// Modal Logic
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
            await fetchAPI('/transactions', 'POST', payload);
            closeTransactionModal();
            form.reset();
            loadDashboardData(); // Refresh UI
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
}
