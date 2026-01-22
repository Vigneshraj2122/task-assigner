const API_URL = 'http://localhost:3000/api';
const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    updateUserInfo();
    loadReportData();
});

function updateUserInfo() {
    const badge = document.getElementById('roleBadge');
    if (badge) badge.innerText = user.role || 'User';
    const greeting = document.getElementById('greeting');
    if (greeting) greeting.innerText = `Hi, ${user.username}`;
}

async function loadReportData() {
    try {
        const res = await fetch(`${API_URL}/tasks?userId=${user.id}`);
        const tasks = await res.json();

        processStats(tasks);
        renderCharts(tasks);
    } catch (err) {
        console.error('Error loading report data:', err);
    }
}

function processStats(tasks) {
    const completed = tasks.filter(t => t.status === 'Done');
    const total = tasks.length;
    const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    document.getElementById('completedCount').innerText = completed.length;
    document.getElementById('completionRate').innerText = `${rate}%`;
    document.getElementById('currentStreak').innerText = localStorage.getItem('streak') || 0;
}

function renderCharts(tasks) {
    // 1. Category Chart
    const categories = {};
    tasks.forEach(t => {
        const cat = t.category || 'General';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    const catCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#6366f1', '#f43f5e', '#06b6d4', '#f59e0b', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // 2. Activity Chart (Last 7 days)
    const last7Days = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days.push(dateStr);

        const count = tasks.filter(t => t.date === dateStr).length;
        counts.push(count);
    }

    const actCtx = document.getElementById('activityChart').getContext('2d');
    new Chart(actCtx, {
        type: 'line',
        data: {
            labels: last7Days.map(d => d.split('-').slice(1).join('/')),
            datasets: [{
                label: 'Tasks Created',
                data: counts,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
