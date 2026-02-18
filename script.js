// import Chart from 'chart.js/auto'; // Removed for Vanilla JS


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
const navLinks = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view-section');
const pageTitle = document.getElementById('page-title');

// Sidebar Toggling for Mobile
function openSidebar() {
    sidebar.classList.add('show');
    sidebarOverlay.classList.add('show');
}

function closeSidebar() {
    sidebar.classList.remove('show');
    sidebarOverlay.classList.remove('show');
}

menuBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// View Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));

        // Add active to clicked
        link.classList.add('active');

        // Get target view
        const targetId = link.getAttribute('data-target');
        const targetView = document.getElementById(`${targetId}-view`);

        // Hide all views
        views.forEach(view => view.style.display = 'none');

        // Show target view
        if (targetView) {
            targetView.style.display = 'block';
        }

        // Update Page Title
        pageTitle.innerText = link.innerText;

        // Populate full list if switching to transactions
        if (targetId === 'transactions') {
            updateFullList();
        }

        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    });
});

// Modal Toggling
addBtn.addEventListener('click', () => modal.classList.add('show'));
closeBtn.addEventListener('click', () => modal.classList.remove('show'));
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

const localStorageTransactions = JSON.parse(
    localStorage.getItem('transactions')
);

let transactions =
    localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Chart Instance
let expenseChart;

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a text and amount');
    } else {
        // Simple validation for amount to be number
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

        addTransactionDOM(transaction);

        updateValues();

        updateLocalStorage();

        updateChart();

        text.value = '';
        amount.value = '';
        modal.classList.remove('show');
    }
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
    // Get sign
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');

    // Add class based on value
    const amountClass = transaction.amount < 0 ? 'minus' : 'plus';
    const amountColor = transaction.amount < 0 ? 'var(--danger)' : 'var(--success)';

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

// Update the balance, income and expense
function updateValues() {
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

// Remove transaction by ID
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}

// Make removeTransaction global so onclick in HTML works (module scope issue)
window.removeTransaction = removeTransaction;

// Update local storage transactions
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Update Chart
function updateChart() {
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    const incomeTransactions = transactions.filter(t => t.amount > 0);

    // Grouping expenses by description for a better chart
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

    // If no expenses, show empty chart or handled by Chart.js defaults
    if (data.length === 0) {
        // Optional: Handle empty state
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses',
                data: data,
                backgroundColor: [
                    '#1a1a1a',
                    '#595959',
                    '#9ca3af',
                    '#e5e7eb',
                    '#d1d5db'
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
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Update Full List (Transactions View)
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
        <button class="delete-btn" onclick="removeTransaction(${transaction.id}); updateFullList();">×</button>
      `;
        fullList.appendChild(item);
    });
}

// Init app
function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
    updateChart();
    updateFullList();
}

// Ensure DOM is loaded before running
document.addEventListener('DOMContentLoaded', () => {
    init();
    form.addEventListener('submit', addTransaction);
});
