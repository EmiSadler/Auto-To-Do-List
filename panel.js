// Sample data for testing

const sampleTodos = [
  {
    id: "1",
    text: "Schedule next meeting in Google Calendar",
    done: false,
    sourceEventId: "evt-wellbeing-1",
    sourceEventTitle: "Matt/Emily - Wellbeing Meeting",
    sourceMeetingType: "Wellbeing Meeting",
    createdAt: Date.now()
  },
  {
    id: "2",
    text: "Complete the Review form on Aptem",
    done: false,
    sourceEventId: "evt-wellbeing-1",
    sourceEventTitle: "Matt/Emily - Wellbeing Meeting",
    sourceMeetingType: "Wellbeing Meeting",
    createdAt: Date.now()
  },
  {
    id: "3",
    text: "Update Learner notes",
    done: true,
    sourceEventId: "evt-placement-1",
    sourceEventTitle: "Matt/Lewis/Emily - Placement Meeting",
    sourceMeetingType: "Placement Meeting",
    createdAt: Date.now()
  }
];

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

    const grouped = groupTodosByMeeting(todos);

    Object.values(grouped).forEach((group) => {
        const meetingHeader = document.createElement('h3');
        meetingHeader.textContent = group.title;
        container.appendChild(meetingHeader);

        const list = document.createElement('li');
        
        group.todos.forEach((todo) => {
            const item = document.createElement('ul');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.done;

            const label = document.createElement('span');
            label.textContent = todo.text;

            item.appendChild(checkbox);
            item.appendChild(label);
            list.appendChild(item);
        });
        container.appendChild(list);
    });
}