
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

function renderTodos(todos) {
    const container = document.getElementById('todo-list');
    container.innerHTML = "";

    if (todos.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = "Nothing to do for now, why don't you make a cup of tea?";
        emptyMessage.className = "empty-state";
        container.appendChild(emptyMessage);
        return
    }

    const grouped = groupTodosByMeeting(todos);

    Object.values(grouped).forEach((group) => {
        const meetingHeader = document.createElement('h3');
        meetingHeader.textContent = group.title;
        container.appendChild(meetingHeader);

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
        container.appendChild(list);

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
        })

        addButton.addEventListener('click', handleAdd);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleAdd();
            }
        });
        addRow.appendChild(input);
        addRow.appendChild(addButton);
        container.appendChild(addToggle);
        container.appendChild(addRow);
    });
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
    chrome.storage.local.get('todos', ({ todos }) => {
        renderTodos(todos || []);
    });
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

document.getElementById('new-checklist-button').addEventListener('click', () => {
    document.getElementById('new-checklist-button').style.display = 'none';
    document.getElementById('new-checklist-form').style.display = 'block';
    document.getElementById('new-checklist-title').focus();
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
    console.log("Reconnect button clicked");
    chrome.runtime.sendMessage({ action: 'connectGoogleAccount' });

    setTimeout(() => {
        updateAuthBanner();
    }, 2000);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
        return;
    }
    if (changes.todos) {
        loadAndRenderTodos();
    }    
    if (changes.authStatus) {
        updateAuthBanner();
    }
});

loadAndRenderTodos();
updateAuthBanner();