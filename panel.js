// Sample data for testing

// const sampleTodos = [
//   {
//     id: "1",
//     text: "Schedule next meeting in Google Calendar",
//     done: false,
//     sourceEventId: "evt-wellbeing-1",
//     sourceEventTitle: "Matt/Emily - Wellbeing Meeting",
//     sourceMeetingType: "Wellbeing Meeting",
//     createdAt: Date.now()
//   },
//   {
//     id: "2",
//     text: "Complete the Review form on Aptem",
//     done: false,
//     sourceEventId: "evt-wellbeing-1",
//     sourceEventTitle: "Matt/Emily - Wellbeing Meeting",
//     sourceMeetingType: "Wellbeing Meeting",
//     createdAt: Date.now()
//   },
//   {
//     id: "3",
//     text: "Update Learner notes",
//     done: true,
//     sourceEventId: "evt-placement-1",
//     sourceEventTitle: "Matt/Lewis/Emily - Placement Meeting",
//     sourceMeetingType: "Placement Meeting",
//     createdAt: Date.now()
//   }
// ];

function groupTodosByMeeting(todos) {
    return todos.reduce((groups, todo) => {
        const eventId = todo.sourceEventId;
        if (!groups[eventId]) {
            groups[eventId] = {
                title: todo.sourceEventTitle,
                todos: []
            };
        }
        groups[eventId].todos.push(todo);
        return groups;
    }, {});
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
    if (area === 'local') {
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