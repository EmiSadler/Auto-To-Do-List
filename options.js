function loadAndRenderConfig() {
    chrome.storage.local.get('meetingTypeConfig', ({ meetingTypeConfig }) => {
       renderMeetingTypes(meetingTypeConfig || []);
    });
}

function loadAndRenderExcluded() {
    chrome.storage.local.get('excludedKeywords', ({ excludedKeywords }) => {
        const container = document.getElementById('excluded-keywords-container');
        container.innerHTML = "";
        container.appendChild(buildEditableList(
            'Excluded keywords',
            excludedKeywords || [],
            (newList) => {
                chrome.storage.local.set({ excludedKeywords: newList });
            }
        ));
    });
}

function renderMeetingTypes(types) {
    const container = document.getElementById('meeting-types-container');
    container.innerHTML = "";

    types.forEach((meetingType) => {
        container.appendChild(buildMeetingTypeCard(meetingType, types));
    });
}

function buildMeetingTypeCard(meetingType, allTypes) {
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

    const warnings = validateMeetingType(meetingType, allTypes);
    if (warnings.length > 0) {
        const warningBox = document.createElement('div');
        warningBox.className = 'warning-box';
        warnings.forEach((warning) => {
            const line = document.createElement('p');
            line.textContent = `${warning}`;
            warningBox.appendChild(line);
        });
        card.appendChild(warningBox);
    }

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

function buildEditableList(label, items, onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'editable-list';

  const heading = document.createElement('h4');
  heading.textContent = label;
  wrapper.appendChild(heading);

  const list = document.createElement('ul');

  let currentItems = [...items];

  const renderItems = () => {
    list.innerHTML = "";
    currentItems.forEach((item, index) => {
      const li = document.createElement('li');

      const span = document.createElement('span');
      span.textContent = item;

      const removeButton = document.createElement('button');
      removeButton.textContent = '✕';
      removeButton.className = 'remove-item-button';
      removeButton.addEventListener('click', () => {
        currentItems = currentItems.filter((_, i) => i !== index);
        renderItems();
        onChange(currentItems);
      });

      li.appendChild(span);
      li.appendChild(removeButton);
      list.appendChild(li);
    });
  };

  renderItems();
  wrapper.appendChild(list);

  const addRow = document.createElement('div');
  addRow.className = 'add-item-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = `Add ${label.toLowerCase()}...`;

  const addButton = document.createElement('button');
  addButton.textContent = 'Add';

  const handleAdd = () => {
    const value = input.value.trim();
    if (value === '') {
      return;
    }
    currentItems = [...currentItems, value];
    input.value = '';
    renderItems();
    onChange(currentItems);
  };

  addButton.addEventListener('click', handleAdd);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleAdd();
    }
  });

  addRow.appendChild(input);
  addRow.appendChild(addButton);
  wrapper.appendChild(addRow);

  return wrapper;
}

function updateMeetingTypeField(typeId, field, newValue) {
  chrome.storage.local.get('meetingTypeConfig', ({ meetingTypeConfig }) => {
    const updated = meetingTypeConfig.map((mt) =>
      mt.id === typeId ? { ...mt, [field]: newValue } : mt
    );
    chrome.storage.local.set({ meetingTypeConfig: updated });
  });
}

function deleteMeetingType(typeId) {
  chrome.storage.local.get('meetingTypeConfig', ({ meetingTypeConfig }) => {
    const updated = meetingTypeConfig.filter((mt) => mt.id !== typeId);
    chrome.storage.local.set({ meetingTypeConfig: updated });
  });
}

function addNewMeetingType() {
  const newType = {
    id: crypto.randomUUID(),
    type: "New Meeting Type",
    keywords: [],
    todos: []
  };

  chrome.storage.local.get('meetingTypeConfig', ({ meetingTypeConfig }) => {
    const updated = [...(meetingTypeConfig || []), newType];
    chrome.storage.local.set({ meetingTypeConfig: updated });
  });
}

function validateMeetingType(meetingType, allTypes) {
  const warnings = [];

  if (meetingType.type.trim() === '') {
    warnings.push('This meeting type has no name.');
  }

  if (meetingType.keywords.length === 0) {
    warnings.push('No keywords set — this type will never trigger.');
  }

  const otherTypes = allTypes.filter((mt) => mt.id !== meetingType.id);
  const duplicateKeywords = meetingType.keywords.filter((keyword) =>
    otherTypes.some((other) => other.keywords.includes(keyword))
  );
  if (duplicateKeywords.length > 0) {
    warnings.push(`Keyword(s) also used elsewhere: ${duplicateKeywords.join(', ')} — whichever type comes first will win.`);
  }

  return warnings;
}

function resetToDefaults() {
    const confirmed = confirm(
        "This will erase all your custom meeting types and keywords, and restore the original defaults. This cannot be undone. Continue?"
    );

    if (!confirmed) {
        return;
    }
    chrome.runtime.sendMessage({ action: 'resetToDefaults'});
}

document.getElementById('add-type-button').addEventListener('click', addNewMeetingType);
document.getElementById('reset-defaults-button').addEventListener('click', resetToDefaults);

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
        return;
    }
    if (changes.meetingTypeConfig) {
        loadAndRenderConfig();
    }
    if (changes.excludedKeywords) {
        loadAndRenderExcluded();
    }
});

loadAndRenderConfig();
loadAndRenderExcluded();
