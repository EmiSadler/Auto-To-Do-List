
function groupTodosByMeeting(todos) {
    return todos.reduce((groups, todo) => {
        const eventId = todo.sourceEventId;
        if (!groups[eventId]) {
            groups[eventId] = {
                eventId: todo.sourceEventId,
                title: todo.sourceEventTitle,
                type: todo.sourceMeetingType,
                todos: []
            };
        }
        groups[eventId].todos.push(todo);
        return groups;
    }, {});
}

function addCustomTodo(text, sourceEventId, sourceEventTitle, sourceMeetingType) {
    const newTodo = {
        id: crypto.randomUUID(),
        text: text,
        done: false,
        sourceEventId: sourceEventId,
        sourceEventTitle: sourceEventTitle,
        sourceMeetingType: sourceMeetingType,
        createdAt: Date.now()
    };
    chrome.storage.local.get('todos', ({ todos }) => {
        const updatedTodos = [...(todos || []), newTodo];
        chrome.storage.local.set({ todos: updatedTodos });
    });
}

function renderTodos(todos, groupOrder, collapsedGroups) {
    const container = document.getElementById('todo-list');
    container.innerHTML = "";

    if (todos.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = "Nothing to do for now, why don't you make a cup of tea?";
        emptyMessage.className = "empty-state";
        container.appendChild(emptyMessage);
        return;
    }

    const grouped = groupTodosByMeeting(todos);
    const sortedGroups = sortGroupsByOrder(grouped, groupOrder);
    const currentOrderIds = sortedGroups.map((group) => group.eventId);

    sortedGroups.forEach((group) => {
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'group-wrapper';
        groupWrapper.draggable = true;

        const isCollapsed = collapsedGroups.includes(group.eventId);
        if (isCollapsed) {
            groupWrapper.classList.add('collapsed');
        }

        groupWrapper.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', group.eventId);
            groupWrapper.classList.add('dragging');
        });

        groupWrapper.addEventListener('dragend', () => {
            groupWrapper.classList.remove('dragging');
        });

        groupWrapper.addEventListener('dragover', (event) => {
            event.preventDefault();
            groupWrapper.classList.add('drag-over');
        });

        groupWrapper.addEventListener('dragleave', (event) => {
            if (!groupWrapper.contains(event.relatedTarget)) {
                groupWrapper.classList.remove('drag-over');
            }
        });

        groupWrapper.addEventListener('drop', (event) => {
            event.preventDefault();
            groupWrapper.classList.remove('drag-over');
            const draggedId = event.dataTransfer.getData('text/plain');
            const targetId = group.eventId;
            if (draggedId === targetId) {
                return;
            }
            reorderGroups(draggedId, targetId, currentOrderIds);
        });

        const meetingHeader = document.createElement('h3');
        meetingHeader.textContent = group.title;
        groupWrapper.appendChild(meetingHeader);

        const list = document.createElement('ul');

        group.todos.forEach((todo) => {
            const item = document.createElement('li');
            if (todo.done) {
                item.classList.add('done');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.done;
            checkbox.addEventListener('change', () => {
                item.classList.toggle('done');
                updateTodoDoneState(todo.id, checkbox.checked);
            });

            const label = document.createElement('span');
            label.textContent = todo.text;

            item.appendChild(checkbox);
            item.appendChild(label);
            list.appendChild(item);
        });
        groupWrapper.appendChild(list);

        const addToggle = document.createElement('button');
        addToggle.textContent = '+';
        addToggle.className = 'add-todo-toggle';

        const addRow = document.createElement('div');
        addRow.className = 'add-todo-row';
        addRow.style.display = 'none';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Add a to-do...';

        const addButton = document.createElement('button');
        addButton.textContent = 'Add';

        const handleAdd = () => {
            const text = input.value.trim();
            if (text === '') {
                return;
            }
            addCustomTodo(text, group.eventId, group.title, group.type);
            input.value = '';
            addRow.style.display = 'none';
            addToggle.style.display = 'inline-block';
        };

        addToggle.addEventListener('click', () => {
            addToggle.style.display = 'none';
            addRow.style.display = 'flex';
            input.focus();
        });

        addButton.addEventListener('click', handleAdd);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleAdd();
            }
        });
        addRow.appendChild(input);
        addRow.appendChild(addButton);
        groupWrapper.appendChild(addToggle);
        groupWrapper.appendChild(addRow);

        container.appendChild(groupWrapper);
    });
}

function reorderGroups(draggedId, targetId, currentOrderIds) {
    const draggedIndex = currentOrderIds.indexOf(draggedId);
    const targetIndex = currentOrderIds.indexOf(targetId);
    const withoutDragged = currentOrderIds.filter((id) => id !== draggedId);
    let newIndex = withoutDragged.indexOf(targetId);
    if (draggedIndex < targetIndex) {
        newIndex += 1;
    }
    withoutDragged.splice(newIndex, 0, draggedId);
    chrome.storage.local.set({ groupOrder: withoutDragged });
}

function updateTodoDoneState(todoId, newDoneValue) {
    chrome.storage.local.get('todos', ({ todos }) => {
        const updatedTodos = (todos || []).map((todo) => {
            if (todo.id === todoId) {
                return { ...todo, done: newDoneValue };
            }
            return todo;
        });
        chrome.storage.local.set({ todos: updatedTodos });
    });
}

function loadAndRenderTodos() {
    chrome.storage.local.get(['todos', 'groupOrder', 'collapsedGroups'], ({ todos, groupOrder, collapsedGroups }) => {
        renderTodos(todos || [], groupOrder || [], collapsedGroups || []);
    });
}

function sortGroupsByOrder(grouped, groupOrder) {
    const allIds = Object.keys(grouped);
    const knownOrder = groupOrder.filter((id) => allIds.includes(id));
    const unknownIds = allIds.filter((id) => !knownOrder.includes(id));
    return [...knownOrder, ...unknownIds].map((id) => grouped[id]);
}

function updateAuthBanner() {
    chrome.storage.local.get('authStatus', ({ authStatus }) => {
        const banner = document.getElementById('reconnect-banner');
        banner.style.display = authStatus === 'disconnected' ? 'block' : 'none';
    });
}

function clearCompletedTodos() {
    chrome.storage.local.get('todos', ({ todos }) => {
        const remaining = (todos || []).filter((todo) => !todo.done);
        chrome.storage.local.set({ todos: remaining });
    });
}

function createStandaloneChecklist(title, firstItemText) {
    const eventId = crypto.randomUUID();
    const now = Date.now();

    const newTodo = {
        id: crypto.randomUUID(),
        text: firstItemText,
        done: false,
        sourceEventId: eventId,
        sourceEventTitle: title,
        sourceMeetingType: "custom",
        createdAt: now
    };

    chrome.storage.local.get('todos', ({ todos }) => {
        const updatedTodos = [...(todos || []), newTodo];
        chrome.storage.local.set({ todos: updatedTodos });
    });
}

function applyTheme() {
    chrome.storage.local.get('themeOverride', ({ themeOverride }) => {
        let theme;

        if (themeOverride === 'dark' || themeOverride === 'light') {
            theme = themeOverride;
        } else {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.body.setAttribute('data-theme', theme);

        const toggleButton = document.getElementById('theme-toggle-button');
        if (toggleButton) {
            toggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    });
}

function toggleTheme() {
    chrome.storage.local.get('themeOverride', ({ themeOverride }) => {
        const currentlyDark = document.body.getAttribute('data-theme') === 'dark';
        const newOverride = currentlyDark ? 'light' : 'dark';

        chrome.storage.local.set({ themeOverride: newOverride }, () => {
            applyTheme();
        });
    });
}

document.getElementById('new-checklist-button').addEventListener('click', () => {
    document.getElementById('new-checklist-button').style.display = 'none';
    document.getElementById('new-checklist-form').style.display = 'block';
    document.getElementById('new-checklist-title').focus();
});

document.getElementById('new-checklist-cancel').addEventListener('click', () => {
    document.getElementById('new-checklist-title').value = '';
    document.getElementById('new-checklist-item').value = '';
    document.getElementById('new-checklist-form').style.display = 'none';
    document.getElementById('new-checklist-button').style.display = 'inline-block';
});

document.getElementById('new-checklist-submit').addEventListener('click', () => {
    const titleInput = document.getElementById('new-checklist-title');
    const itemInput = document.getElementById('new-checklist-item');

    const title = titleInput.value.trim();
    const itemText = itemInput.value.trim();

    if (title === '' || itemText === '') {
        return;
    }

    createStandaloneChecklist(title, itemText);

    titleInput.value = '';
    itemInput.value = '';
    document.getElementById('new-checklist-form').style.display = 'none';
    document.getElementById('new-checklist-button').style.display = 'inline-block';
});

document.getElementById('clear-completed-button').addEventListener('click', () => {
    clearCompletedTodos();
});

document.getElementById('reconnect-button').addEventListener('click', () => {
    const button = document.getElementById('reconnect-button');
    button.disabled = true;
    button.textContent = 'Connecting...';

    chrome.runtime.sendMessage({ action: 'connectGoogleAccount' });

    setTimeout(() => {
        updateAuthBanner();
        button.disabled = false;
        button.textContent = 'Reconnect Google Calendar';
    }, 2000);
});

document.getElementById('theme-toggle-button').addEventListener('click', toggleTheme);

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
        return;
    }
    if (changes.todos || changes.groupOrder) {
        loadAndRenderTodos();
    }
    if (changes.authStatus) {
        updateAuthBanner();
    }
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyTheme();
});

applyTheme();
loadAndRenderTodos();
updateAuthBanner();