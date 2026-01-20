# Implementation Plan: Smart Multi-User Task Scheduler

This document outlines the design and development roadmap for expanding the Teacher Task Scheduler into a comprehensive, multi-role "Smart Task Scheduler" application.

## 🏗️ Architecture Design

### 1. Enhanced Data Model
We will transition from a simple `users` and `tasks` model to a more robust relational-style structure (still stored in JSON for portability).

- **Users**:
    - `id`: Unique Identifier
    - `username`: String (Unique)
    - `passwordHash`: Securely hashed password
    - `role`: `student` | `teacher` | `general`
    - `preferences`: `{ theme: 'light'|'dark', notifications: boolean }`
- **Tasks**:
    - `id`: Unique Identifier
    - `ownerId`: Reference to the creator
    - `assignedTo`: Reference to a student/group (if assigned by teacher)
    - `title`: String
    - `description`: String
    - `category`: `Study` | `Work` | `Personal` | `Health`
    - `priority`: `Low` | `Medium` | `High`
    - `status`: `Pending` | `In Progress` | `Completed`
    - `deadline`: ISO Date String
    - `reminderTime`: ISO Date String
    - `isRecurring`: `none` | `daily` | `weekly` | `monthly`
    - `attachments`: Array of URLs/File references
- **Classes/Groups** (Teacher-Student Link):
    - `id`: Unique Identifier
    - `teacherId`: Reference to the teacher
    - `name`: Class name (e.g., "Grade 10 Math")
    - `studentIds`: Array of User IDs

### 2. Scalable API Structure
- `POST /api/auth/register`: Signup with role selection.
- `POST /api/auth/login`: JWT-based authentication.
- `GET /api/tasks`: Filtered by user role and ownership.
- `POST /api/tasks/assign`: Teacher-specific endpoint to assign tasks to groups.
- `GET /api/analytics/progress`: Aggregate data for productivity charts.

---

## 🚀 Development Phases

### Phase 1: Core Foundation & Security
- [ ] **Secure Authentication**: Implement `bcryptjs` for password hashing and `jsonwebtoken` for session management.
- [ ] **Role Selection**: Update signup page to allow users to choose their role (Student, Teacher, General).
- [ ] **RBAC Middleware**: Create backend middleware to restrict certain routes (e.g., assigning tasks) to Teachers only.

### Phase 2: Multi-Role Dashboard
- [ ] **Dynamic UI**: Modify `dashboard.html` to render different components based on the logged-in user's role.
- [ ] **Teacher View**: Added "Classroom Management" and "Assignment Hub" panels.
- [ ] **Student View**: Added "Academic Deadlines" and "Teacher Assignments" panels.
- [ ] **General View**: Focus on "Lifestyle Habits" and "Professional Tasks".

### Phase 3: Advanced Task Management
- [ ] **Task Categorization**: Add dropdowns for Category and Priority in the "Add Task" form.
- [ ] **Status Workflow**: Allow transitions between Pending, In Progress, and Completed.
- [ ] **Recurring Logic**: Implement a basic background trigger to recreate recurring tasks upon completion or at scheduled intervals.

### Phase 4: Smart & Integrated Features
- [ ] **Calendar Integration**: Implement a full-page calendar view using a grid layout, syncing with the task list.
- [ ] **Priority Alerts**: Enhance the `notifySound` system to trigger distinct sounds/visuals for `High` priority tasks.
- [ ] **Productivity Analytics**: Use a lightweight chart library (or SVG) to visualize task completion rates.

### Phase 5: Reliability & Experience
- [ ] **Offline Sync**: Use Service Workers to cache the app shell and LocalStorage to queue task operations while offline.
- [ ] **Search & Filter**: Add a real-time search bar and category filters to the task list.
- [ ] **Backup & Restore**: Add an export/import feature for the user's JSON task data.

---

## 🎨 Design Aesthetics
- **Premium Look**: Deep indigo and vibrant teal color palette.
- **Micro-interactions**: Subtle hover scales and smooth transitions.
- **Glassmorphism**: Semi-transparent card backgrounds with backdrop-blur.
- **Dark Mode**: Fully optimized dark theme with high-contrast accessibility.

## 🛠️ Technology Stack (Updated)
- **Frontend**: Vanilla JS (ES6+), CSS3 (Flexbox/Grid), Standard Web APIs.
- **Backend**: Node.js, Express.js.
- **Security**: Bcrypt.js, JWT.
- **Storage**: `data.json` managed via `database.js` wrapper.
