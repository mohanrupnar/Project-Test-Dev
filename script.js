// JavaScript
// --- Dummy Backend Simulation ---
const DUMMY_DB = JSON.parse(localStorage.getItem('twilight_data')) || [];
let loggedInUser = null;

const backend = {
    async login() {
        return new Promise(resolve => {
            setTimeout(() => {
                const newUser = {
                    id: crypto.randomUUID()
                };
                resolve(newUser);
            }, 500); // Simulate network delay
        });
    },
    async logout() {
        return new Promise(resolve => {
            setTimeout(() => {
                loggedInUser = null;
                resolve();
            }, 300); // Simulate network delay
        });
    },
    async getItems() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(DUMMY_DB);
            }, 200);
        });
    },
    async addItem(item) {
        return new Promise(resolve => {
            setTimeout(() => {
                const newItem = {
                    ...item,
                    id: crypto.randomUUID(),
                    createdBy: loggedInUser ? loggedInUser.id : 'guest',
                    createdAt: new Date().toISOString()
                };
                DUMMY_DB.push(newItem);
                localStorage.setItem('twilight_data', JSON.stringify(DUMMY_DB));
                resolve(newItem);
            }, 500);
        });
    },
    async updateItem(itemId, updateData) {
        return new Promise(resolve => {
            setTimeout(() => {
                const itemIndex = DUMMY_DB.findIndex(item => item.id === itemId);
                if (itemIndex > -1) {
                    DUMMY_DB[itemIndex] = { ...DUMMY_DB[itemIndex], ...updateData };
                    localStorage.setItem('twilight_data', JSON.stringify(DUMMY_DB));
                }
                resolve();
            }, 300);
        });
    },
};

// --- Frontend Logic ---

// DOM elements
const userIdDisplay = document.getElementById('user-id-display');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsButton = document.getElementById('close-settings');
const themeToggle = document.getElementById('theme-toggle');
const scrumViewBtn = document.getElementById('scrum-view-btn');
const kanbanViewBtn = document.getElementById('kanban-view-btn');
const boardContent = document.getElementById('board-content');
const itemForm = document.getElementById('task-form');
const itemTypeSelect = document.getElementById('item-type');
const itemNameInput = document.getElementById('item-name');
const assignedToInput = document.getElementById('assigned-to');

let currentView = 'scrum';
let allItemsData = [];

// Scrum & Kanban Statuses
const scrumStatuses = [
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-500' },
    { id: 'inProgress', title: 'In Progress', color: 'bg-orange-500' },
    { id: 'qa', title: 'QA', color: 'bg-purple-500' },
    { id: 'review', color: 'bg-blue-500' },
    { id: 'done', title: 'Done', color: 'bg-green-500' },
];
const kanbanStatuses = [
    { id: 'toDo', title: 'To Do', color: 'bg-gray-500' },
    { id: 'inProgress', title: 'In Progress', color: 'bg-orange-500' },
    { id: 'testing', title: 'Testing', color: 'bg-purple-500' },
    { id: 'done', title: 'Done', color: 'bg-green-500' },
];

const allStatuses = [
    ...scrumStatuses,
    ...kanbanStatuses
].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);


// --- Auth UI and Logic ---

function updateAuthUI() {
    if (loggedInUser) {
        userIdDisplay.textContent = loggedInUser.id;
        loginButton.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        itemForm.classList.remove('opacity-50', 'pointer-events-none');
        itemForm.querySelector('button').disabled = false;
    } else {
        userIdDisplay.textContent = "Not Logged In";
        loginButton.classList.remove('hidden');
        logoutButton.classList.add('hidden');
        itemForm.classList.add('opacity-50', 'pointer-events-none');
        itemForm.querySelector('button').disabled = true;
    }
}

loginButton.addEventListener('click', async () => {
    const user = await backend.login();
    loggedInUser = user;
    updateAuthUI();
});

logoutButton.addEventListener('click', async () => {
    await backend.logout();
    updateAuthUI();
});


// --- Board & Data Logic ---

// Settings modal functionality
settingsButton.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsButton.addEventListener('click', () => settingsModal.classList.add('hidden'));
window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        settingsModal.classList.add('hidden');
    }
});

// Theme toggle functionality
themeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
    }
});

// View switch functionality
function setActiveViewButton() {
    scrumViewBtn.classList.remove('bg-button', 'text-white', 'border-purple-600');
    kanbanViewBtn.classList.remove('bg-button', 'text-white', 'border-purple-600');
    scrumViewBtn.classList.add('text-secondary', 'border-secondary');
    kanbanViewBtn.classList.add('text-secondary', 'border-secondary');

    if (currentView === 'scrum') {
        scrumViewBtn.classList.add('bg-button', 'text-white', 'border-purple-600');
        scrumViewBtn.classList.remove('text-secondary', 'border-secondary');
    } else {
        kanbanViewBtn.classList.add('bg-button', 'text-white', 'border-purple-600');
        kanbanViewBtn.classList.remove('text-secondary', 'border-secondary');
    }
}

scrumViewBtn.addEventListener('click', () => {
    currentView = 'scrum';
    renderBoard();
    renderItemsToBoard(allItemsData);
    setActiveViewButton();
});
kanbanViewBtn.addEventListener('click', () => {
    currentView = 'kanban';
    renderBoard();
    renderItemsToBoard(allItemsData);
    setActiveViewButton();
});

// Create a new column for the board
function createColumn(status, view) {
    const column = document.createElement('div');
    const columnClasses = `w-full flex-shrink-0 rounded-lg shadow-md p-4 bg-column overflow-y-auto space-y-3 lg:w-1/5`;
    const columnClassesKanban = `w-full flex-shrink-0 rounded-lg shadow-md p-4 bg-column overflow-y-auto space-y-3 lg:w-1/6`;

    column.id = status.id;
    column.className = view === 'scrum' ? `${columnClasses} scrum-column` : `${columnClassesKanban} kanban-column`;
    column.innerHTML = `<h2 class="text-sm font-bold text-center uppercase tracking-wide text-primary sticky top-0 bg-column py-2 rounded-t-lg">${status.title}</h2>`;
    column.addEventListener('dragover', (e) => e.preventDefault());
    column.addEventListener('drop', handleDrop);
    return column;
}

let draggedItem = null;

function handleDragStart(e) {
    if (!loggedInUser) {
        e.preventDefault();
        return;
    }
    draggedItem = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItem.dataset.id);
}

async function handleDrop(e) {
    e.preventDefault();
    const newStatus = e.currentTarget.id;
    const itemId = e.dataTransfer.getData('text/plain');

    if (!loggedInUser) return;

    await backend.updateItem(itemId, {
        status: newStatus
    });
    const items = await backend.getItems();
    renderItemsToBoard(items);
    updateMetrics();
}

function renderCard(item) {
    const card = document.createElement('div');
    card.id = `card-${item.id}`;
    card.dataset.id = item.id;
    card.draggable = true;

    let typeText, typeColor;
    switch (item.type) {
        case 'task':
            typeText = 'Task';
            typeColor = 'bg-blue-400';
            break;
        case 'testCase':
            typeText = 'Test Case';
            typeColor = 'bg-green-400';
            break;
        case 'defect':
            typeText = 'Defect';
            typeColor = 'bg-red-400';
            break;
    }

    let priorityColor;
    switch (item.priority) {
        case 'urgent':
            priorityColor = 'bg-red-500';
            break;
        case 'high':
            priorityColor = 'bg-yellow-500';
            break;
        case 'medium':
            priorityColor = 'bg-orange-500';
            break;
        case 'low':
            priorityColor = 'bg-gray-500';
            break;
        default:
            priorityColor = 'bg-gray-500';
            break;
    }

    card.className = 'kanban-card bg-card p-4 rounded-lg shadow-md transition-colors duration-300';
    card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold uppercase px-2 py-1 rounded-full ${typeColor} text-white">${typeText}</span>
            <span class="text-xs font-semibold uppercase px-2 py-1 rounded-full ${priorityColor} text-white">${item.priority}</span>
        </div>
        <p class="font-bold text-primary">${item.name}</p>
        <div class="flex items-center justify-between text-sm text-secondary mt-2">
            <span class="font-semibold text-xs">Assigned to: ${item.assignedTo}</span>
        </div>
        <div class="flex items-center justify-between text-sm text-secondary mt-1">
            <span class="text-xs">Created By: ${item.createdBy}</span>
        </div>
    `;
    card.addEventListener('dragstart', handleDragStart);
    return card;
}

function renderBoard() {
    boardContent.innerHTML = '';
    const statuses = currentView === 'scrum' ? scrumStatuses : kanbanStatuses;
    statuses.forEach(status => {
        boardContent.appendChild(createColumn(status, currentView));
    });
}

function renderItemsToBoard(items) {
    clearColumns();
    items.forEach(item => {
        const statuses = currentView === 'scrum' ? scrumStatuses : kanbanStatuses;
        const isValidStatus = statuses.some(status => status.id === item.status);
        const column = document.getElementById(item.status);

        if (isValidStatus && column) {
            column.appendChild(renderCard(item));
        }
    });
}

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemType = itemTypeSelect.value;
    const itemName = itemNameInput.value.trim();
    const assignedTo = assignedToInput.value.trim();

    if (!loggedInUser) {
        console.error("You must be logged in to add issues.");
        return;
    }

    const newItem = {
        type: itemType,
        name: itemName,
        assignedTo: assignedTo,
        priority: 'medium',
        dueDate: 'N/A',
        status: currentView === 'scrum' ? 'backlog' : 'toDo'
    };

    await backend.addItem(newItem);
    const items = await backend.getItems();
    renderItemsToBoard(items);
    updateMetrics();

    itemNameInput.value = '';
    assignedToInput.value = '';
});

function updateMetrics() {
    const testCases = allItemsData.filter(item => item.type === 'testCase');
    const defects = allItemsData.filter(item => item.type === 'defect');

    const passCount = testCases.filter(tc => tc.status === 'passed').length;
    const failedCount = testCases.filter(tc => tc.status === 'failed').length;
    const holdCount = testCases.filter(tc => tc.status === 'onHold').length;
    const defectCount = defects.length;

    document.getElementById('pass-count').textContent = passCount;
    document.getElementById('failed-count').textContent = failedCount;
    document.getElementById('hold-count').textContent = holdCount;
    document.getElementById('defect-count').textContent = defectCount;
}

function clearColumns() {
    allStatuses.forEach(status => {
        const column = document.getElementById(status.id);
        if (column) {
            Array.from(column.children).forEach(child => {
                if (!child.classList.contains('sticky')) {
                    column.removeChild(child);
                }
            });
        }
    });
}

// Initial setup
async function initializeApp() {
    allItemsData = await backend.getItems();
    renderBoard();
    renderItemsToBoard(allItemsData);
    updateMetrics();
    setActiveViewButton();
    updateAuthUI();
}

initializeApp();
