// DOM Elements
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const fullList = document.getElementById('full-list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const modal = document.getElementById('modal');
const addBtn = document.getElementById('add-btn');
const closeBtn = document.getElementById('close-modal');
const ctx = document.getElementById('expenseChart');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Data State
const localStorageTransactions = JSON.parse(
    localStorage.getItem('transactions')
);

let transactions =
    localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

let expenseChart;

// --- Sidebar Logic ---
function openSidebar() {
    sidebar.classList.add('show');
    sidebarOverlay.classList.add('show');
}

function closeSidebar() {
    sidebar.classList.remove('show');
    sidebarOverlay.classList.remove('show');
}

if (menuBtn) menuBtn.addEventListener('click', openSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);


// --- Modal / Add Transaction Logic ---
if (addBtn) addBtn.addEventListener('click', () => modal.classList.add('show'));
if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a text and amount');
    } else {
        if (isNaN(amount.value)) {
            alert('Please enter a valid number');
            return;
        }

        const transaction = {
            id: generateID(),
            text: text.value,
            amount: +amount.value,
            date: new Date().toLocaleDateString()
        };

        transactions.push(transaction);
        updateLocalStorage();

        // Refresh Current Page Data
        init();

        text.value = '';
        amount.value = '';
        modal.classList.remove('show');
    }
}

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// --- Data Rendering Logic ---

// 1. Transaction List for Dashboard (Recent 5)
function addTransactionDOM(transaction) {
    if (!list) return;

    const sign = transaction.amount < 0 ? '-' : '+';
    const amountClass = transaction.amount < 0 ? 'minus' : 'plus';
    const amountColor = transaction.amount < 0 ? 'var(--danger)' : 'var(--success)';

    const item = document.createElement('li');
    item.innerHTML = `
    <div class="item-info">
      <span class="item-text">${transaction.text}</span>
      <span class="item-date">${transaction.date || 'Today'}</span>
    </div>
    <span class="item-amount" style="color: ${amountColor}">
      ${sign}$${Math.abs(transaction.amount).toFixed(2)}
    </span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">×</button>
  `;

    list.appendChild(item);
}

// 2. Full Transaction List
function updateFullList() {
    if (!fullList) return;
    fullList.innerHTML = '';
    transactions.forEach(transaction => {
        const sign = transaction.amount < 0 ? '-' : '+';
        const amountColor = transaction.amount < 0 ? 'var(--danger)' : 'var(--success)';

        const item = document.createElement('li');
        item.innerHTML = `
        <div class="item-info">
          <span class="item-text">${transaction.text}</span>
          <span class="item-date">${transaction.date || 'Today'}</span>
        </div>
        <span class="item-amount" style="color: ${amountColor}">
          ${sign}$${Math.abs(transaction.amount).toFixed(2)}
        </span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">×</button>
      `;
        fullList.appendChild(item);
    });
}

// 3. Balance Updates
function updateValues() {
    if (!balance) return; // Only on Dashboard

    const amounts = transactions.map(transaction => transaction.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);
    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
        -1
    ).toFixed(2);

    balance.innerText = `$${total}`;
    money_plus.innerText = `+$${income}`;
    money_minus.innerText = `-$${expense}`;
}

// 4. Chart Updates
function updateChart() {
    if (!ctx) return; // Only if chart canvas exists

    const expenseTransactions = transactions.filter(t => t.amount < 0);
    const expenseData = {};

    expenseTransactions.forEach(t => {
        if (expenseData[t.text]) {
            expenseData[t.text] += Math.abs(t.amount);
        } else {
            expenseData[t.text] = Math.abs(t.amount);
        }
    });

    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);

    if (expenseChart) {
        expenseChart.destroy();
    }

    // Check if Chart is defined (from CDN)
    if (typeof Chart !== 'undefined') {
        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses',
                    data: data,
                    backgroundColor: [
                        '#1a1a1a', '#595959', '#9ca3af', '#e5e7eb', '#d1d5db'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { family: 'Inter', size: 12 },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
}

// Global Remove Function
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}
window.removeTransaction = removeTransaction;

// Init function to deciding what to render based on page
function init() {
    // 1. If on Dashboard (list exists)
    if (list) {
        list.innerHTML = '';
        // Show only last 5
        transactions.slice(-5).reverse().forEach(addTransactionDOM);
        updateValues();
        updateChart();
    }

    // 2. If on Transactions Page (fullList exists)
    if (fullList) {
        updateFullList();
    }
}

// Ensure DOM is loaded before running
document.addEventListener('DOMContentLoaded', () => {
    init();
    if (form) form.addEventListener('submit', addTransaction);
});
