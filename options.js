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