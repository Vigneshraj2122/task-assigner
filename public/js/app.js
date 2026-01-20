const API_URL = 'http://localhost:3000/api';
const user = JSON.parse(localStorage.getItem('user'));
window.APP = { user: { name: user ? user.username : 'Task Scheduler' } };

if (!user) {
    window.location.href = 'index.html';
}

// --- State Management ---
let allTasks = [];

if (window.AppUI) {
    window.AppUI.initGreeting({ selector: '#welcomeMsg', name: user.username });
} else {
    const welcome = document.getElementById('welcomeMsg');
    if (welcome) welcome.innerText = `Welcome, ${user.username}`;
}

// Set Role-based UI
const roleBadge = document.getElementById('roleBadge');
const greetingEl = document.getElementById('greeting');
if (greetingEl) greetingEl.innerText = `Hi, ${user.username}`;

if (roleBadge) {
    roleBadge.innerText = user.role || 'User';
    const addTaskTitle = document.querySelector('.add-task-card h2');
    if (addTaskTitle) {
        if (user.role === 'student') {
            addTaskTitle.innerHTML = '<i class="fas fa-book"></i> Add Study Task';
            const hub = document.getElementById('studentHub');
            if (hub) {
                hub.style.display = 'block';
                initStudentHub();
            }
        } else if (user.role === 'teacher') {
            addTaskTitle.innerHTML = '<i class="fas fa-chalkboard"></i> Add Class/Task';
            const suite = document.getElementById('teacherSuite');
            if (suite) {
                suite.style.display = 'block';
                loadClasses();
            }
        } else {
            addTaskTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Task';
        }
    }
}

// Load initial data
loadTasks();
loadHabits();

// Digital Clock
const clockEl = document.getElementById('clock');
setInterval(() => {
    const now = new Date();
    if (clockEl) clockEl.innerText = now.toLocaleTimeString();
    checkReminders();
}, 1000);

const addTaskForm = document.getElementById('addTaskForm');
const taskDateInput = document.getElementById('taskDate');

if (taskDateInput) {
    taskDateInput.valueAsDate = new Date();
}

if (addTaskForm) {
    addTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDesc').value;
        const date = document.getElementById('taskDate').value;
        const time = document.getElementById('taskTime').value;
        const category = document.getElementById('taskCategory').value;
        const priority = document.getElementById('taskPriority').value;

        const newTask = {
            title,
            description,
            date,
            time,
            category,
            priority,
            userId: user.id
        };

        try {
            // Optimistic update for immediate feedback
            showNotification(`Saving...`);

            const res = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask)
            });

            if (res.ok) {
                const addedTask = await res.json();
                addTaskForm.reset();
                if (taskDateInput) taskDateInput.valueAsDate = new Date();

                // Fast Local Update
                allTasks.push(addedTask);
                renderTasks(allTasks); handleStreak();

                showNotification(`Task "${title}" added!`);
            }
        } catch (err) {
            console.error(err);
            showNotification('Error saving task');
        }
    });
}

// --- Functions ---

async function loadTasks() {
    try {
        const res = await fetch(`${API_URL}/tasks?userId=${user.id}`);
        allTasks = await res.json();
        renderTasks(allTasks); handleStreak();
    } catch (err) {
        console.error(err);
    }
}

function renderTasks(tasks) {
    const list = document.getElementById('taskList');
    if (!list) return;

    list.innerHTML = '';
    if (tasks.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: #aaa; padding: 2rem;">No tasks yet.</div>`;
        return;
    }

    // Sort by Date/Time
    const sorted = [...tasks].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    sorted.forEach(task => {
        const el = document.createElement('div');
        el.className = `task-item ${task.status === 'Done' ? 'completed' : ''}`;
        const priorityClass = `priority-${task.priority?.toLowerCase() || 'medium'}`;

        el.innerHTML = `
                <div class="task-content">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                        <h3 class="task-title" style="margin:0;">${task.title}</h3>
                        <span class="badge ${priorityClass}">${task.priority || 'Medium'}</span>
                        <span class="badge category-badge">${task.category || 'General'}</span>
                    </div>
                    <div class="task-meta">
                        <span><i class="far fa-calendar"></i> ${task.date}</span>
                        <span><i class="far fa-clock"></i> ${task.time}</span>
                        ${task.description ? `<span><i class="fas fa-align-left"></i> ${task.description}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    ${task.status !== 'Done' ? `
                    <button class="btn-icon btn-check" onclick="markDone('${task.id}')" title="Mark Done">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                    <button class="btn-icon btn-delete" onclick="deleteTask('${task.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        list.appendChild(el);
    });

    renderTimetable(sorted);
    renderSpatialTimeline(sorted);
}

function setView(view) {
    const list = document.getElementById('taskList');
    const spatial = document.getElementById('spatialView');
    const listBtn = document.getElementById('listBtn');
    const spatialBtn = document.getElementById('spatialBtn');
    if (!list || !spatial) return;

    if (view === 'spatial') {
        list.style.display = 'none';
        spatial.style.display = 'block';
        spatialBtn.style.background = 'var(--primary)';
        spatialBtn.style.color = 'white';
        listBtn.style.background = 'transparent';
        listBtn.style.color = 'var(--text-main)';
    } else {
        list.style.display = 'flex';
        spatial.style.display = 'none';
        listBtn.style.background = 'var(--primary)';
        listBtn.style.color = 'white';
        spatialBtn.style.background = 'transparent';
        spatialBtn.style.color = 'var(--text-main)';
    }
}

function renderSpatialTimeline(tasks) {
    const container = document.getElementById('spatialTimeline');
    if (!container) return;
    container.innerHTML = '';

    const sorted = [...tasks].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    sorted.forEach((task, index) => {
        const card = document.createElement('div');
        card.className = 'timeline-card';
        card.style.transform = `translateZ(${index * 20}px)`;
        const priorityClass = `priority-${task.priority?.toLowerCase() || 'medium'}`;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <h3 style="margin:0; font-size:1.2rem;">${task.title}</h3>
                    <p style="margin:5px 0; font-size:0.9rem; color:var(--text-secondary);">${task.description || ''}</p>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <span class="badge ${priorityClass}">${task.priority}</span>
                        <span class="badge category-badge">${task.category}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:800; color:var(--primary-solid);">${task.time}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${task.date}</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function markDone(id) {
    try {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Done' })
        });

        if (res.ok) {
            const updated = await res.json();
            const idx = allTasks.findIndex(t => t.id === id);
            if (idx !== -1) allTasks[idx] = updated;

            renderTasks(allTasks); handleStreak();

            // FX
            const sound = document.getElementById('successSound');
            if (sound) { sound.currentTime = 0; sound.play().catch(() => { }); }
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

            remindNextClass(id);
        }
    } catch (err) {
        console.error(err);
    }
}

async function remindNextClass(completedId) {
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = allTasks.filter(t => t.date === today).sort((a, b) => a.time.localeCompare(b.time));
    const currentIndex = todaysTasks.findIndex(t => t.id === completedId);
    const nextTask = todaysTasks.slice(currentIndex + 1).find(t => t.status !== 'Done');

    if (nextTask) {
        setTimeout(() => {
            alert(`✅ Done! NEXT: "${nextTask.title}" at ${nextTask.time}`);
        }, 800);
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) {
            allTasks = allTasks.filter(t => t.id !== id);
            renderTasks(allTasks); handleStreak();
        }
    } catch (err) {
        console.error(err);
    }
}

function renderTimetable(tasks) {
    const tbody = document.getElementById('timetableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.date === today).sort((a, b) => a.time.localeCompare(b.time));

    updateNextClassHighlight(todaysTasks);

    if (todaysTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#999;">Free day!</td></tr>`;
        return;
    }

    todaysTasks.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:15px;"><strong>${t.time}</strong></td>
            <td style="padding:15px;">${t.title}</td>
            <td style="padding:15px;"><span class="badge ${t.status === 'Done' ? 'priority-low' : 'priority-medium'}">${t.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function updateNextClassHighlight(todaysTasks) {
    const nextClassAlert = document.getElementById('nextClassAlert');
    const nextClassText = document.getElementById('nextClassText');
    if (!nextClassAlert || !nextClassText) return;

    const now = new Date();
    const current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const next = todaysTasks.find(t => t.status !== 'Done' && t.time >= current);

    if (next) {
        nextClassAlert.style.display = 'flex';
        nextClassText.innerText = `${next.title} at ${next.time}`;
    } else {
        nextClassAlert.style.display = 'none';
    }
}

function printTimetable() { window.print(); }

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function checkReminders() {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const date = now.toISOString().split('T')[0];

    // 1. Task Due Now
    const due = allTasks.find(t => t.date === date && t.time === time && t.status !== 'Done');
    if (due && window.lastReminder !== time) {
        window.lastReminder = time;
        triggerUrgentAlert(due);
    }

    // 2. Deadline Risk (15 mins warning)
    const riskTime = new Date(now.getTime() + 15 * 60000);
    const riskStr = `${riskTime.getHours().toString().padStart(2, '0')}:${riskTime.getMinutes().toString().padStart(2, '0')}`;
    const risky = allTasks.find(t => t.date === date && t.time === riskStr && t.status !== 'Done');
    if (risky && window.lastRisk !== riskStr) {
        window.lastRisk = riskStr;
        showNotification(`⚠️ RISK: "${risky.title}" due in 15 mins!`);
    }
}

function triggerUrgentAlert(task) {
    const isHigh = task.priority === 'High';
    const audio = document.getElementById('notifySound');
    if (audio) audio.play().catch(() => { });

    if (isHigh) {
        const pulse = document.createElement('div');
        pulse.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(239,68,68,0.25); z-index:10000; pointer-events:none; animation: pulse 1s infinite;";
        document.body.appendChild(pulse);
        setTimeout(() => pulse.remove(), 5000);
    }

    alert(`${isHigh ? '🚨 URGENT: ' : '🔔 '} ${task.title}\nStarts now!`);
}

function showNotification(msg) {
    const toast = document.createElement('div');
    toast.style = "position:fixed; bottom:20px; right:20px; background:var(--primary); color:white; padding:12px 24px; border-radius:30px; z-index:9999; box-shadow:var(--shadow);";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Teacher Functions
async function loadClasses() {
    const res = await fetch(`${API_URL}/classes?userId=${user.id}`);
    renderClasses(await res.json());
}
function renderClasses(classes) {
    const list = document.getElementById('classList');
    if (!list) return;
    list.innerHTML = '';
    classes.forEach(c => {
        const el = document.createElement('span');
        el.className = 'badge category-badge';
        el.innerHTML = `${c.name} <i class="fas fa-times" onclick="deleteClass('${c.id}')"></i>`;
        list.appendChild(el);
    });
}
async function addClass() {
    const name = document.getElementById('newClassName').value;
    if (!name) return;
    await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId: user.id })
    });
    document.getElementById('newClassName').value = '';
    loadClasses();
}
async function deleteClass(id) {
    if (!confirm('Delete class?')) return;
    await fetch(`${API_URL}/classes/${id}`, { method: 'DELETE' });
    loadClasses();
}

async function aiPlanner() {
    const topic = prompt("Enter a subject or topic for the lesson plan (e.g. Quantum Physics):");
    if (!topic) return;

    showNotification("AI is generating your lesson plan...");

    // Simulating AI generation
    const subtasks = [
        { title: `[AI] Intro to ${topic}`, desc: "Overview and basic concepts", priority: "Medium" },
        { title: `[AI] ${topic} Deep Dive`, desc: "In-depth analysis and examples", priority: "High" },
        { title: `[AI] ${topic} Assessment`, desc: "Review quiz and feedback", priority: "Low" }
    ];

    const today = new Date();

    for (let i = 0; i < subtasks.length; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const task = {
            title: subtasks[i].title,
            description: subtasks[i].desc,
            date: d.toISOString().split('T')[0],
            time: "09:00",
            category: "Work",
            priority: subtasks[i].priority,
            userId: user.id
        };

        await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
    }

    showNotification("Generated 3-day lesson plan!");
    loadTasks();
}

// Student Hub
function initStudentHub() {
    const streak = localStorage.getItem('streak') || 0;
    const streakEl = document.getElementById('streakCounter');
    if (streakEl) streakEl.innerText = `${streak} Days`;

    let pomoTime = 25 * 60;
    let pomoInterval = null;
    const display = document.getElementById('pomodoroTimer');
    const startBtn = document.getElementById('startPomodoro');
    const resetBtn = document.getElementById('resetPomodoro');

    if (startBtn) {
        startBtn.onclick = () => {
            if (pomoInterval) {
                clearInterval(pomoInterval);
                pomoInterval = null;
                startBtn.innerText = 'Start';
            } else {
                pomoInterval = setInterval(() => {
                    pomoTime--;
                    const m = Math.floor(pomoTime / 60);
                    const s = pomoTime % 60;
                    if (display) display.innerText = `${m}:${s.toString().padStart(2, '0')}`;
                    if (pomoTime <= 0) { clearInterval(pomoInterval); alert('Break time!'); }
                }, 1000);
                startBtn.innerText = 'Pause';
            }
        };
    }
    if (resetBtn) {
        resetBtn.onclick = () => {
            clearInterval(pomoInterval);
            pomoInterval = null;
            pomoTime = 25 * 60;
            if (display) display.innerText = "25:00";
            if (startBtn) startBtn.innerText = "Start";
        };
    }
}

// Habits
async function loadHabits() {
    const res = await fetch(`${API_URL}/habits?userId=${user.id}`);
    renderHabits(await res.json());
}
function renderHabits(habits) {
    const list = document.getElementById('habitList');
    if (!list) return;
    list.innerHTML = '';
    habits.forEach(h => {
        const el = document.createElement('div');
        el.style = "display:flex; justify-content:space-between; margin:5px 0;";
        el.innerHTML = `<span>${h.name}</span> <i class="fas fa-trash" onclick="deleteHabit('${h.id}')"></i>`;
        list.appendChild(el);
    });
}
async function addHabit() {
    const name = document.getElementById('newHabitName').value;
    if (!name) return;
    await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId: user.id })
    });
    document.getElementById('newHabitName').value = '';
    loadHabits();
}
async function deleteHabit(id) {
    await fetch(`${API_URL}/habits/${id}`, { method: 'DELETE' });
    loadHabits();
}

async function aiPlanner() {
    const topic = prompt("Enter a subject or topic for the lesson plan (e.g. Quantum Physics):");
    if (!topic) return;
    showNotification("AI is generating your lesson plan...");
    const subtasks = [
        { title: `[AI] Intro to ${topic}`, desc: "Overview and basic concepts", priority: "Medium" },
        { title: `[AI] ${topic} Deep Dive`, desc: "In-depth analysis and examples", priority: "High" },
        { title: `[AI] ${topic} Assessment`, desc: "Review quiz and feedback", priority: "Low" }
    ];
    const today = new Date();
    for(let i=0; i<subtasks.length; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const task = {
            title: subtasks[i].title, description: subtasks[i].desc,
            date: d.toISOString().split('T')[0], time: "09:00",
            category: "Work", priority: subtasks[i].priority, userId: user.id
        };
        await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
    }
    showNotification("Generated 3-day lesson plan!");
    loadTasks();
}

function handleStreak() {
    const lastDone = localStorage.getItem('lastDoneDate');
    const today = new Date().toISOString().split('T')[0];
    if (lastDone !== today) {
        let streak = parseInt(localStorage.getItem('streak') || '0');
        streak++;
        localStorage.setItem('streak', streak.toString());
        localStorage.setItem('lastDoneDate', today);
        const streakEl = document.getElementById('streakCounter');
        if (streakEl) streakEl.innerText = `${streak} Days`;
        showNotification(` Streak updated: ${streak} Days!`);
    }
}

