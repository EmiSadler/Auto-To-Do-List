function loadAndRenderConfig() {
    chrome.storage.local.get('meetingTypeConfig', ({ meetingTypeConfig }) => {
       renderMeetingTypes(meetingTypeConfig || []);
    });
}

function renderMeetingTypes(types) {
    const container = document.getElementById('meeting-types-container');
    container.innerHTML = "";

    types.forEach((meetingType) => {
        container.appendChild(buildMeetingTypeCard(meetingType));
    });
}

function buildMeetingTypeCard(meetingType) {
    const card = document.createElement('div');
    card.className = 'type-card';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'type-name-input';
    nameInput.value = meetingType.type;
    nameInput.addEventListener('change', () => {
        updateMeetingTypeField(meetingType.id, 'type', nameInput.value.trim());
    });

    const deleteTypeButton = document.createElement('button');
    deleteTypeButton.textContent = 'Delete this meeting type';
    deleteTypeButton.className = 'delete-type-button';
    deleteTypeButton.addEventListener('click', () => {
        if (confirm(`Delete "${meetingType.type}"? This can't be undone.`)) {
            deleteMeetingType(meetingType.id);
        }
    });

    card.appendChild(nameInput);
    card.appendChild(deleteTypeButton);

    card.appendChild(buildEditableList(
        'Keywords',
        meetingType.keywords,
        (newList) => updateMeetingTypeField(meetingType.id, 'keywords', newList)
    ));

    card.appendChild(buildEditableList(
        'To-do items',
        meetingType.todos,
        (newList) => updateMeetingTypeField(meetingType.id, 'todos', newList)
    ));

    return card;
}