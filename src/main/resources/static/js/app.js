/* =============================================================
 * TaskNova Front-End Application Logic
 * ============================================================= */

// Global State Object
const STATE = {
    token: localStorage.getItem('tasknova_token') || null,
    user: null,
    activeView: 'dashboard',
    tasks: [],
    categories: [],
    dashboardData: null,
    bulkSelectedIds: new Set(),
    modalSubtasks: [] // Temp array for subtasks when editing/creating a task
};

// API Base Path
const API_BASE = '/api';

// On Document Ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    applyStoredTheme();
    if (STATE.token) {
        verifySession();
    } else {
        showAuthLayer();
    }
}

// -------------------------------------------------------------
// Theme Management
// -------------------------------------------------------------
function applyStoredTheme() {
    const isDark = localStorage.getItem('tasknova_dark') === 'true';
    if (isDark) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    if (isDark) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('tasknova_dark', 'false');
        updateUserDarkMode(false);
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('tasknova_dark', 'true');
        updateUserDarkMode(true);
    }
}

async function updateUserDarkMode(darkMode) {
    if (!STATE.user) return;
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                name: STATE.user.name,
                darkMode: darkMode
            })
        });
        if (response.ok) {
            const updated = await response.json();
            STATE.user = updated;
        }
    } catch (e) {
        console.error("Failed to save theme preference:", e);
    }
}

// -------------------------------------------------------------
// Session & Auth UI
// -------------------------------------------------------------
function showAuthLayer() {
    document.getElementById('auth-layer').style.display = 'flex';
    document.getElementById('app-workspace').style.display = 'none';
}

function hideAuthLayer() {
    document.getElementById('auth-layer').style.display = 'none';
    document.getElementById('app-workspace').style.display = 'grid';
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.getElementById('tab-register').classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

async function verifySession() {
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: getHeaders()
        });
        if (response.ok) {
            STATE.user = await response.json();
            setupUserSession();
        } else {
            handleLogout();
        }
    } catch (e) {
        showToast('Network error during session verification.', 'error');
        handleLogout();
    }
}

function setupUserSession() {
    hideAuthLayer();
    showToast(`Welcome back, ${STATE.user.name}!`, 'success');
    
    // Update User Info display
    document.getElementById('user-display-name').textContent = STATE.user.name;
    document.getElementById('user-display-email').textContent = STATE.user.email;
    document.getElementById('welcome-message').textContent = `Welcome back, ${STATE.user.name}!`;
    
    const avatar = STATE.user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${STATE.user.name}`;
    document.getElementById('user-avatar').src = avatar;
    document.getElementById('profile-avatar-preview').src = avatar;
    document.getElementById('profile-name').value = STATE.user.name;
    document.getElementById('profile-email').value = STATE.user.email;

    // Apply preference theme
    if (STATE.user.darkMode !== undefined) {
        localStorage.setItem('tasknova_dark', STATE.user.darkMode ? 'true' : 'false');
        applyStoredTheme();
    }

    loadCategories();
    loadData();
}

// -------------------------------------------------------------
// REST API Core Handlers
// -------------------------------------------------------------
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STATE.token}`
    };
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            STATE.token = data.token;
            localStorage.setItem('tasknova_token', data.token);
            STATE.user = {
                id: data.userId,
                name: data.name,
                email: data.email,
                avatarUrl: data.avatarUrl,
                darkMode: data.darkMode
            };
            setupUserSession();
        } else {
            const err = await response.json();
            showToast(err.message || 'Authentication failed.', 'error');
        }
    } catch (e) {
        showToast('Connection to auth server failed.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            STATE.token = data.token;
            localStorage.setItem('tasknova_token', data.token);
            STATE.user = {
                id: data.userId,
                name: data.name,
                email: data.email,
                avatarUrl: data.avatarUrl,
                darkMode: data.darkMode
            };
            setupUserSession();
        } else {
            const err = await response.json();
            showToast(err.message || 'Registration failed.', 'error');
        }
    } catch (e) {
        showToast('Connection to server failed.', 'error');
    }
}

function handleLogout() {
    fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
    STATE.token = null;
    STATE.user = null;
    localStorage.removeItem('tasknova_token');
    showAuthLayer();
    showToast('Logged out successfully.', 'info');
}

// -------------------------------------------------------------
// Category Management
// -------------------------------------------------------------
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
        if (response.ok) {
            STATE.categories = await response.json();
            renderCategories();
            populateCategoryDropdowns();
        }
    } catch (e) {
        console.error("Failed to load categories:", e);
    }
}

function renderCategories() {
    const list = document.getElementById('sidebar-categories');
    list.innerHTML = '';
    
    STATE.categories.forEach(cat => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'category-menu-item';
        item.onclick = (e) => {
            e.preventDefault();
            document.getElementById('filter-category').value = cat.id;
            navigateTo('tasks');
            loadData();
        };

        item.innerHTML = `
            <div class="category-left">
                <span class="cat-dot" style="background: ${cat.colorHex}"></span>
                <span>${cat.name}</span>
            </div>
            <button class="btn-delete-cat" onclick="event.stopPropagation(); deleteCategory(${cat.id})" title="Delete Category">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

function populateCategoryDropdowns() {
    const filterDropdown = document.getElementById('filter-category');
    const formDropdown = document.getElementById('task-category');
    
    // Save current values to restore them
    const currentFilter = filterDropdown.value;
    const currentForm = formDropdown.value;

    filterDropdown.innerHTML = '<option value="">All Categories</option>';
    formDropdown.innerHTML = '<option value="">No Category</option>';

    STATE.categories.forEach(cat => {
        const optionHtml = `<option value="${cat.id}">${cat.name}</option>`;
        filterDropdown.insertAdjacentHTML('beforeend', optionHtml);
        formDropdown.insertAdjacentHTML('beforeend', optionHtml);
    });

    filterDropdown.value = currentFilter;
    formDropdown.value = currentForm;
}

function openAddCategoryModal() {
    document.getElementById('category-modal').classList.add('active');
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-color').value = '#6C5CE7';
}

function closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('active');
}

function setCatColor(color) {
    document.getElementById('cat-color').value = color;
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    const colorHex = document.getElementById('cat-color').value;

    try {
        const response = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, colorHex })
        });

        if (response.ok) {
            closeCategoryModal();
            showToast('Category created!', 'success');
            loadCategories();
        } else {
            showToast('Failed to create category.', 'error');
        }
    } catch (e) {
        showToast('Connection error.', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category? Tasks in this category will not be deleted but will become uncategorized.')) return;
    try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.ok) {
            showToast('Category deleted.', 'info');
            loadCategories();
            // If the category was selected, reset
            if (document.getElementById('filter-category').value === String(id)) {
                document.getElementById('filter-category').value = '';
            }
            loadData();
        } else {
            showToast('Failed to delete category.', 'error');
        }
    } catch (e) {
        showToast('Connection error.', 'error');
    }
}

// -------------------------------------------------------------
// Data Loading & Processing
// -------------------------------------------------------------
function loadData() {
    if (!STATE.token) return;
    loadDashboardSummary();
    loadTasks();
}

async function loadDashboardSummary() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/summary`, { headers: getHeaders() });
        if (response.ok) {
            STATE.dashboardData = await response.json();
            updateDashboardUI();
        }
    } catch (e) {
        console.error("Failed to load dashboard metrics:", e);
    }
}

function updateDashboardUI() {
    if (!STATE.dashboardData) return;
    
    const data = STATE.dashboardData;
    document.getElementById('stat-due-today').textContent = data.dueTodayCount;
    document.getElementById('stat-overdue').textContent = data.overdueCount;
    document.getElementById('stat-completed').textContent = data.completedCount;
    
    // Progress ring update
    const ringText = document.getElementById('stat-progress-text');
    const ringCircle = document.getElementById('dashboard-progress-ring');
    const percentage = data.completionRate || 0;
    
    ringText.textContent = `${Math.round(percentage)}%`;
    
    const circumference = 2 * Math.PI * 34; // r=34 -> 213.63
    const offset = circumference - (percentage / 100) * circumference;
    ringCircle.style.strokeDashoffset = offset;

    // Render Upcoming Due Soon
    const list = document.getElementById('dashboard-upcoming-list');
    list.innerHTML = '';
    
    if (data.upcomingTasks.length === 0) {
        list.innerHTML = '<div class="upcoming-item"><p style="color:var(--text-secondary); font-size:13px;">No tasks due soon.</p></div>';
    } else {
        data.upcomingTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'upcoming-item';
            
            const dueLabel = task.dueDate ? formatDateTime(task.dueDate) : 'No due date';
            const catDot = task.categoryColor ? `<span class="cat-dot" style="background:${task.categoryColor}; margin-right:6px;"></span>` : '';
            const catName = task.categoryName ? `<span class="meta-tag category-tag">${catDot}${task.categoryName}</span>` : '';
            const priorityClass = `priority-${task.priority.toLowerCase()}`;

            item.innerHTML = `
                <div class="upcoming-left">
                    <span class="upcoming-title">${task.title}</span>
                    <div class="upcoming-meta">
                        <span class="meta-tag ${priorityClass}">${task.priority}</span>
                        ${catName}
                        <span class="upcoming-due"><i class="fa-regular fa-clock"></i> ${dueLabel}</span>
                    </div>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="quickToggleComplete(${task.id}, 'COMPLETED')">
                    <i class="fa-solid fa-check"></i> Done
                </button>
            `;
            list.appendChild(item);
        });
    }

    // Draw custom bar chart
    drawCategoryChart(data.tasksByCategory);
}

// Draw HTML5 Canvas Chart dynamically
function drawCategoryChart(categoryData) {
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const categories = Object.keys(categoryData);
    const counts = Object.values(categoryData);
    
    if (categories.length === 0) {
        ctx.fillStyle = '#636e72';
        ctx.font = '14px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('No task category data available.', canvas.width / 2, canvas.height / 2);
        return;
    }

    const padding = 40;
    const chartHeight = canvas.height - padding * 2;
    const chartWidth = canvas.width - padding * 2;
    const maxVal = Math.max(...counts, 1);
    
    const barWidth = Math.min(50, chartWidth / (categories.length * 1.5));
    const gap = (chartWidth - barWidth * categories.length) / (categories.length + 1);

    // Draw Y Axis gridlines and values
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color') || 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary') || '#636e72';
    ctx.font = '10px Outfit';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
        const val = Math.round((maxVal / 4) * i);
        const y = canvas.height - padding - (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        ctx.fillText(String(val), padding - 10, y + 3);
    }

    // Draw Bars
    categories.forEach((catName, index) => {
        const count = categoryData[catName];
        const barHeight = (count / maxVal) * chartHeight;
        const x = padding + gap + (barWidth + gap) * index;
        const y = canvas.height - padding - barHeight;

        // Custom Gradient
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        grad.addColorStop(0, '#6C5CE7');
        grad.addColorStop(1, '#a29bfe');

        // Draw Rounded Bar
        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        } else {
            ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();

        // Count Text on top of bar
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#2d3436';
        ctx.font = 'bold 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(String(count), x + barWidth / 2, y - 6);

        // X label
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary') || '#636e72';
        ctx.font = '11px Outfit';
        
        let label = catName;
        if (label.length > 8) label = label.slice(0, 6) + '..';
        ctx.fillText(label, x + barWidth / 2, canvas.height - padding + 18);
    });
}

async function loadTasks() {
    const status = document.getElementById('filter-priority').parentElement.style.display !== 'none' ? '' : ''; // Dummy check
    const catVal = document.getElementById('filter-category').value;
    const priVal = document.getElementById('filter-priority').value;
    const dueVal = document.getElementById('filter-due').value;
    const sortVal = document.getElementById('sort-by').value;
    const searchVal = document.getElementById('global-search').value;

    let url = `${API_BASE}/tasks?sort=${sortVal}`;
    if (catVal) url += `&category=${catVal}`;
    if (priVal) url += `&priority=${priVal}`;
    if (dueVal) url += `&dueDate=${dueVal}`;
    if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;

    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (response.ok) {
            STATE.tasks = await response.json();
            renderTasksList();
            renderKanbanBoard();
        }
    } catch (e) {
        console.error("Failed to load tasks:", e);
    }
}

// -------------------------------------------------------------
// 2.2 Task List Rendering
// -------------------------------------------------------------
function renderTasksList() {
    const container = document.getElementById('task-list-container');
    const emptyState = document.getElementById('empty-state-list');
    container.innerHTML = '';
    
    if (STATE.tasks.length === 0) {
        emptyState.style.display = 'flex';
        container.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    container.style.display = 'flex';

    STATE.tasks.forEach(task => {
        const isChecked = task.status === 'COMPLETED';
        const checkboxClass = isChecked ? 'checked' : '';
        const cardClass = isChecked ? 'completed' : '';
        const priorityClass = `priority-${task.priority.toLowerCase()}`;
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isChecked;

        // Due date format
        const dueText = task.dueDate ? formatDateTime(task.dueDate) : '';
        const dateTag = dueText ? `<span class="meta-tag date-tag ${isOverdue ? 'overdue' : ''}"><i class="fa-regular fa-calendar"></i> ${dueText}</span>` : '';
        
        // Category dot/tag
        const catDot = task.categoryColor ? `<span class="cat-dot" style="background:${task.categoryColor}; margin-right:6px;"></span>` : '';
        const catTag = task.categoryName ? `<span class="meta-tag category-tag">${catDot}${task.categoryName}</span>` : '';

        // Recurrence tag
        const recurTag = task.isRecurring ? `<span class="meta-tag recur-tag"><i class="fa-solid fa-arrows-rotate"></i> ${task.recurrencePattern}</span>` : '';

        // Subtask progress
        let subtaskHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSubs = task.subtasks.filter(s => s.isCompleted).length;
            const totalSubs = task.subtasks.length;
            const percent = (completedSubs / totalSubs) * 100;
            subtaskHtml = `
                <div class="subtask-summary-row" onclick="openEditTaskModal(${task.id})">
                    <i class="fa-solid fa-list-check" style="font-size:11px;"></i>
                    <span>Checklist (${completedSubs}/${totalSubs})</span>
                    <div class="subtask-bar">
                        <div class="subtask-bar-fill" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        }

        const isBulkSelected = STATE.bulkSelectedIds.has(task.id) ? 'checked' : '';

        const card = document.createElement('div');
        card.className = `task-card glass ${cardClass}`;
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-id', task.id);
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);

        card.innerHTML = `
            <div class="task-checkbox-col">
                <input type="checkbox" class="task-select-box" ${isBulkSelected} onchange="toggleBulkSelection(${task.id}, this.checked)">
                <div class="custom-checkbox ${checkboxClass}" onclick="quickToggleComplete(${task.id}, '${task.status}')">
                    <i class="fa-solid fa-check"></i>
                </div>
            </div>
            
            <div class="task-content-col" onclick="openEditTaskModal(${task.id})">
                <div class="task-card-header">
                    <h4 class="task-card-title">${task.title}</h4>
                </div>
                ${task.description ? `<p class="task-card-desc">${task.description}</p>` : ''}
                <div class="task-meta-row">
                    <span class="meta-tag ${priorityClass}">${task.priority}</span>
                    ${catTag}
                    ${dateTag}
                    ${recurTag}
                </div>
                ${subtaskHtml}
            </div>
            
            <div class="task-actions-col">
                <button class="btn-action" onclick="openEditTaskModal(${task.id})" title="Edit Task">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteTask(${task.id})" title="Delete Task">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    // Setup sorting reorder listeners on list container
    setupListReorder();
}

// -------------------------------------------------------------
// 2.3 Kanban Board Rendering & Drag-n-Drop
// -------------------------------------------------------------
function renderKanbanBoard() {
    const listPending = document.getElementById('list-pending');
    const listProgress = document.getElementById('list-inprogress');
    const listCompleted = document.getElementById('list-completed');
    
    listPending.innerHTML = '';
    listProgress.innerHTML = '';
    listCompleted.innerHTML = '';

    let pendingCount = 0;
    let progressCount = 0;
    let completedCount = 0;

    STATE.tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'kanban-card glass';
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-id', task.id);
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);

        const priorityClass = `priority-${task.priority.toLowerCase()}`;
        const catDot = task.categoryColor ? `<span class="cat-dot" style="background:${task.categoryColor}; margin-right:4px;"></span>` : '';
        const catTag = task.categoryName ? `<span class="meta-tag category-tag">${catDot}${task.categoryName}</span>` : '';
        const dueText = task.dueDate ? `<span class="meta-tag date-tag"><i class="fa-regular fa-calendar"></i> ${formatDateTime(task.dueDate, true)}</span>` : '';

        card.innerHTML = `
            <div onclick="openEditTaskModal(${task.id})" style="cursor:pointer; display:flex; flex-direction:column; gap:6px;">
                <span class="kanban-card-title">${task.title}</span>
                ${task.description ? `<p class="kanban-card-desc">${task.description}</p>` : ''}
                <div class="task-meta-row">
                    <span class="meta-tag ${priorityClass}">${task.priority}</span>
                    ${catTag}
                </div>
            </div>
            <div class="kanban-meta-row">
                ${dueText}
                <div class="kanban-actions">
                    <button class="btn-action" onclick="openEditTaskModal(${task.id})" title="Edit"><i class="fa-regular fa-pen-to-square" style="font-size:11px;"></i></button>
                    <button class="btn-action btn-delete" onclick="deleteTask(${task.id})" title="Delete"><i class="fa-regular fa-trash-can" style="font-size:11px;"></i></button>
                </div>
            </div>
        `;

        if (task.status === 'PENDING') {
            listPending.appendChild(card);
            pendingCount++;
        } else if (task.status === 'IN_PROGRESS') {
            listProgress.appendChild(card);
            progressCount++;
        } else if (task.status === 'COMPLETED') {
            listCompleted.appendChild(card);
            completedCount++;
        }
    });

    document.getElementById('count-pending').textContent = pendingCount;
    document.getElementById('count-inprogress').textContent = progressCount;
    document.getElementById('count-completed').textContent = completedCount;
}

// Drag & Drop implementation
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.currentTarget;
    draggedElement.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedElement.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
}

function allowDrop(e) {
    e.preventDefault();
}

async function handleDrop(e, status) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}/status?status=${status}`, {
            method: 'PATCH',
            headers: getHeaders()
        });

        if (response.ok) {
            showToast(`Task status updated to ${status.replace('_', ' ')}!`, 'success');
            loadData();
        } else {
            showToast('Failed to update status.', 'error');
        }
    } catch (e) {
        showToast('Connection error.', 'error');
    }
}

// Drag and drop sorting in list view
function setupListReorder() {
    const list = document.getElementById('task-list-container');
    list.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (!dragging) return;
        if (afterElement == null) {
            list.appendChild(dragging);
        } else {
            list.insertBefore(dragging, afterElement);
        }
    });

    list.addEventListener('drop', async () => {
        const items = [...list.querySelectorAll('.task-card')];
        const ids = items.map(i => parseInt(i.getAttribute('data-id')));
        
        try {
            await fetch(`${API_BASE}/tasks/reorder`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(ids)
            });
            // Reload silently to fetch correct order
            loadData();
        } catch (e) {
            console.error("Reorder save failed:", e);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// -------------------------------------------------------------
// Quick Task Actions
// -------------------------------------------------------------
async function quickToggleComplete(taskId, currentStatus) {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}/status?status=${nextStatus}`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (response.ok) {
            showToast(nextStatus === 'COMPLETED' ? 'Task marked complete! 🎉' : 'Task opened.', 'success');
            loadData();
        }
    } catch (e) {
        showToast('Connection error.', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.ok) {
            showToast('Task deleted successfully.', 'info');
            loadData();
        } else {
            showToast('Failed to delete task.', 'error');
        }
    } catch (e) {
        showToast('Connection error.', 'error');
    }
}

// -------------------------------------------------------------
// Bulk Actions
// -------------------------------------------------------------
function toggleBulkSelection(taskId, checked) {
    if (checked) {
        STATE.bulkSelectedIds.add(taskId);
    } else {
        STATE.bulkSelectedIds.delete(taskId);
    }
    updateBulkActionBar();
}

function toggleSelectAllTasks(checkbox) {
    const cards = document.querySelectorAll('.task-select-box');
    cards.forEach(box => {
        box.checked = checkbox.checked;
        const id = parseInt(box.closest('.task-card').getAttribute('data-id'));
        if (checkbox.checked) {
            STATE.bulkSelectedIds.add(id);
        } else {
            STATE.bulkSelectedIds.delete(id);
        }
    });
    updateBulkActionBar();
}

function clearBulkSelection() {
    STATE.bulkSelectedIds.clear();
    const selectAll = document.getElementById('select-all-checkbox');
    if (selectAll) selectAll.checked = false;
    document.querySelectorAll('.task-select-box').forEach(box => box.checked = false);
    updateBulkActionBar();
}

function updateBulkActionBar() {
    const bar = document.getElementById('bulk-actions-bar');
    const label = document.getElementById('bulk-selected-count');
    
    if (STATE.bulkSelectedIds.size > 0) {
        bar.style.display = 'flex';
        label.textContent = `${STATE.bulkSelectedIds.size} task(s) selected`;
    } else {
        bar.style.display = 'none';
    }
}

async function bulkMarkComplete(isComplete) {
    const status = isComplete ? 'COMPLETED' : 'PENDING';
    const promises = [...STATE.bulkSelectedIds].map(id => {
        return fetch(`${API_BASE}/tasks/${id}/status?status=${status}`, {
            method: 'PATCH',
            headers: getHeaders()
        });
    });

    try {
        await Promise.all(promises);
        showToast('Bulk update completed!', 'success');
        clearBulkSelection();
        loadData();
    } catch (e) {
        showToast('Failed to update some tasks.', 'error');
    }
}

async function bulkDelete() {
    if (!confirm(`Are you sure you want to delete the ${STATE.bulkSelectedIds.size} selected tasks?`)) return;
    const promises = [...STATE.bulkSelectedIds].map(id => {
        return fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    });

    try {
        await Promise.all(promises);
        showToast('Bulk deletion completed.', 'info');
        clearBulkSelection();
        loadData();
    } catch (e) {
        showToast('Failed to delete some tasks.', 'error');
    }
}

// -------------------------------------------------------------
// Search & Filter Event Handlers
// -------------------------------------------------------------
let searchTimeout = null;
function triggerSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadData();
    }, 400); // Debounce search calls
}

// -------------------------------------------------------------
// Modals: Add / Edit Task Form logic
// -------------------------------------------------------------
function openAddTaskModal() {
    document.getElementById('task-modal-title').textContent = 'Add New Task';
    document.getElementById('task-form').reset();
    document.getElementById('task-id-field').value = '';
    
    // Hide subtask and recurrence fields for creating since it's cleaner
    document.getElementById('subtasks-section').style.display = 'none';
    document.getElementById('recurrence-pattern-group').style.display = 'none';
    
    document.getElementById('task-modal').classList.add('active');
}

async function openEditTaskModal(id) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, { headers: getHeaders() });
        if (response.ok) {
            const task = await response.json();
            
            document.getElementById('task-modal-title').textContent = 'Edit Task';
            document.getElementById('task-id-field').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-desc').value = task.description || '';
            
            if (task.dueDate) {
                // Parse LocalDateTime format (yyyy-MM-ddTHH:mm)
                document.getElementById('task-due').value = task.dueDate.slice(0, 16);
            } else {
                document.getElementById('task-due').value = '';
            }
            
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-category').value = task.categoryId || '';
            
            const recurringCheckbox = document.getElementById('task-recurring');
            recurringCheckbox.checked = task.isRecurring || false;
            
            const recurGroup = document.getElementById('recurrence-pattern-group');
            if (task.isRecurring) {
                recurGroup.style.display = 'block';
                document.getElementById('task-recur-pattern').value = task.recurrencePattern;
            } else {
                recurGroup.style.display = 'none';
                document.getElementById('task-recur-pattern').value = 'NONE';
            }

            // Load subtasks
            STATE.modalSubtasks = task.subtasks || [];
            renderModalSubtasks();
            document.getElementById('subtasks-section').style.display = 'block';

            document.getElementById('task-modal').classList.add('active');
        }
    } catch (e) {
        showToast('Failed to load task details.', 'error');
    }
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
}

function toggleRecurrenceSelect(checkbox) {
    const group = document.getElementById('recurrence-pattern-group');
    if (checkbox.checked) {
        group.style.display = 'block';
        document.getElementById('task-recur-pattern').value = 'DAILY';
    } else {
        group.style.display = 'none';
        document.getElementById('task-recur-pattern').value = 'NONE';
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('task-id-field').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const dueDateVal = document.getElementById('task-due').value;
    const priority = document.getElementById('task-priority').value;
    const categoryId = document.getElementById('task-category').value;
    const isRecurring = document.getElementById('task-recurring').checked;
    const recurrencePattern = document.getElementById('task-recur-pattern').value;

    const payload = {
        title,
        description,
        priority,
        isRecurring,
        recurrencePattern
    };

    if (dueDateVal) payload.dueDate = dueDateVal;
    if (categoryId) payload.categoryId = parseInt(categoryId);

    const isEdit = id !== '';
    const url = isEdit ? `${API_BASE}/tasks/${id}` : `${API_BASE}/tasks`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeTaskModal();
            showToast(isEdit ? 'Task updated!' : 'Task added!', 'success');
            loadData();
        } else {
            const err = await response.json();
            showToast(err.message || 'Validation error saving task.', 'error');
        }
    } catch (e) {
        showToast('Connection error.', 'error');
    }
}

// -------------------------------------------------------------
// Subtask checklist inline modal handlers
// -------------------------------------------------------------
function renderModalSubtasks() {
    const list = document.getElementById('modal-subtasks-list');
    list.innerHTML = '';

    STATE.modalSubtasks.forEach(sub => {
        const isChecked = sub.isCompleted ? 'checked' : '';
        const item = document.createElement('li');
        item.className = 'modal-subtask-item';
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" ${isChecked} onchange="toggleModalSubtask(${sub.id}, this.checked)">
                <span>${sub.title}</span>
            </div>
            <button type="button" onclick="deleteModalSubtask(${sub.id})"><i class="fa-regular fa-trash-can"></i></button>
        `;
        list.appendChild(item);
    });
}

async function addModalSubtask() {
    const taskId = document.getElementById('task-id-field').value;
    const input = document.getElementById('new-subtask-title');
    const title = input.value.trim();
    if (!title) return;

    if (!taskId) {
        showToast('Please save the task first before adding subtasks.', 'info');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/subtasks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                taskId: parseInt(taskId),
                title,
                isCompleted: false
            })
        });

        if (response.ok) {
            const added = await response.json();
            STATE.modalSubtasks.push(added);
            input.value = '';
            renderModalSubtasks();
            loadData();
        }
    } catch (e) {
        showToast('Error saving subtask.', 'error');
    }
}

async function toggleModalSubtask(id, isCompleted) {
    try {
        const response = await fetch(`${API_BASE}/subtasks/${id}?isCompleted=${isCompleted}`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (response.ok) {
            const updated = await response.json();
            // Update in array
            const idx = STATE.modalSubtasks.findIndex(s => s.id === id);
            if (idx !== -1) {
                STATE.modalSubtasks[idx] = updated;
            }
            loadData();
        }
    } catch (e) {
        showToast('Error updating subtask.', 'error');
    }
}

async function deleteModalSubtask(id) {
    try {
        const response = await fetch(`${API_BASE}/subtasks/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.ok) {
            STATE.modalSubtasks = STATE.modalSubtasks.filter(s => s.id !== id);
            renderModalSubtasks();
            loadData();
        }
    } catch (e) {
        showToast('Error deleting subtask.', 'error');
    }
}

// -------------------------------------------------------------
// Profile Settings Modal
// -------------------------------------------------------------
function openProfileModal() {
    document.getElementById('profile-modal').classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

function updateAvatarPreview(val) {
    const seed = val.trim() || STATE.user.name;
    document.getElementById('profile-avatar-preview').src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('profile-name').value;
    const seed = document.getElementById('profile-avatar-seed').value.trim();
    const password = document.getElementById('profile-password').value;

    const payload = { name };
    if (seed) payload.avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
    if (password) payload.password = password;

    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            STATE.user = await response.json();
            closeProfileModal();
            showToast('Profile updated!', 'success');
            
            // Apply changes
            document.getElementById('user-display-name').textContent = STATE.user.name;
            document.getElementById('user-avatar').src = STATE.user.avatarUrl;
            document.getElementById('welcome-message').textContent = `Welcome back, ${STATE.user.name}!`;
            document.getElementById('profile-password').value = '';
            document.getElementById('profile-avatar-seed').value = '';
        } else {
            showToast('Failed to update profile.', 'error');
        }
    } catch (e) {
        showToast('Connection error.', 'error');
    }
}

// -------------------------------------------------------------
// Utilities & Toast Helpers
// -------------------------------------------------------------
function navigateTo(viewName) {
    STATE.activeView = viewName;
    
    // Manage Sidebar active class
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    
    const activeMenu = document.getElementById(`menu-${viewName}`);
    if (activeMenu) activeMenu.classList.add('active');

    // Manage Views visibility
    document.querySelectorAll('.content-view').forEach(view => view.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    // Filter controls configuration
    const filterControls = document.querySelector('.filter-controls');
    if (viewName === 'dashboard') {
        filterControls.style.display = 'none';
    } else {
        filterControls.style.display = 'flex';
    }

    loadData();
}

function formatDateTime(isoString, short = false) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    
    const options = short 
        ? { month: 'short', day: 'numeric' } 
        : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        
    return date.toLocaleDateString('en-US', options);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-circle-xmark"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // Fade out and remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}
