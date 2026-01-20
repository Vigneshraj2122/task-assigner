const API_URL = 'http://localhost:3000/api';
const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
    window.location.href = 'index.html';
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateRoleBadge();
    loadCalendar();

    // Show teacher controls if role is teacher
    if (user.role === 'teacher') {
        const controls = document.getElementById('teacherControls');
        if (controls) controls.style.display = 'block';
    }
});

function updateRoleBadge() {
    const badge = document.getElementById('roleBadge');
    if (badge) badge.innerText = user.role || 'User';
    const greeting = document.getElementById('greeting');
    if (greeting) greeting.innerText = `Hi, ${user.username}`;
}

async function loadCalendar() {
    try {
        const [tasksRes, holidaysRes] = await Promise.all([
            fetch(`${API_URL}/tasks?userId=${user.id}`),
            fetch(`${API_URL}/holidays`)
        ]);

        const tasks = await tasksRes.json();
        const holidays = await holidaysRes.json();

        renderCalendar(tasks, holidays);
    } catch (err) {
        console.error('Error loading calendar data:', err);
    }
}

function renderCalendar(tasks, holidays) {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarMonthYear');

    // Clear previous days (keep headers)
    const headers = Array.from(grid.querySelectorAll('.calendar-header-day'));
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    title.innerHTML = `<i class="fas fa-calendar-alt"></i> ${monthNames[currentMonth]} ${currentYear}`;

    // Previous month blanks
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day';
        blank.style.opacity = '0.3';
        grid.appendChild(blank);
    }

    const today = new Date();
    const isThisMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        if (isThisMonth && today.getDate() === day) {
            dayEl.classList.add('today');
        }

        const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        dayEl.innerHTML = `<div class="calendar-day-number">${day}</div>`;

        // Filter holidays for this day
        const dayHolidays = holidays.filter(h => h.date === dateStr);
        dayHolidays.forEach(h => {
            const hTag = document.createElement('div');
            hTag.className = 'calendar-task-dot';
            hTag.style.background = 'var(--secondary)';
            hTag.title = `Holiday: ${h.name}`;
            hTag.innerText = `🌴 ${h.name}`;
            dayEl.appendChild(hTag);
            dayEl.style.background = 'rgba(244, 63, 94, 0.05)'; // Subtle pink for holidays
        });

        // Filter tasks for this day
        const dayTasks = tasks.filter(t => t.date === dateStr);
        dayTasks.forEach(t => {
            const taskDot = document.createElement('div');
            const pClass = `p-${(t.priority || 'medium').toLowerCase()}`;
            taskDot.className = `calendar-task-dot ${pClass}`;
            taskDot.title = `${t.time} - ${t.title}`;
            taskDot.innerText = `${t.time} ${t.title}`;
            dayEl.appendChild(taskDot);
        });

        grid.appendChild(dayEl);
    }
}

// Holiday Modal Logic
function openHolidayModal() {
    document.getElementById('holidayModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeHolidayModal() {
    document.getElementById('holidayModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

async function saveHoliday() {
    const name = document.getElementById('holidayName').value;
    const date = document.getElementById('holidayDate').value;

    if (!name || !date) return alert('Name and Date are required');

    try {
        const res = await fetch(`${API_URL}/holidays`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, date, userId: user.id })
        });

        if (res.ok) {
            closeHolidayModal();
            loadCalendar();
        }
    } catch (err) {
        console.error('Error saving holiday:', err);
    }
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    loadCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    loadCalendar();
}
