
function openPanel() {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true});
    console.log("background loaded")
}

function connectGoogleAccount() {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
            console.error("Auth failed", chrome.runtime.lastError);
            return;
        }
        chrome.storage.local.set({ authToken: token }, () => {

        });
    });
}

function checkAuthStatus() {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError || !token) {
            chrome.storage.local.set({ authStatus: "disconnected" });
        } else {
            chrome.storage.local.set({ authStatus: "connected" });
        }
    });
}

function fetchTodaysEvents() {
    chrome.storage.local.get('authToken', ({ authToken }) => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime`;

        fetch(url, {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        })
            .then((response) => response.json())
            .then((data) => {
                const justStarted = findJustStartedEvents(data.items);
                console.log("Today's events:", data.items);
                console.log("Just started:", justStarted);
            })
            .catch((error) => {
                console.error("Fetch failed:", error);
            });
        });
    }

function findJustStartedEvents(events) {
    const now = new Date();

    return events.filter((event) => {
        if (!event.start.dateTime) {
            return false;
        }
        const eventStart = new Date(event.start.dateTime);
        const secondsSinceStart = (now - eventStart) / 1000;

        return secondsSinceStart >= 0 && secondsSinceStart <= 90;
    });
}

checkAuthStatus();
openPanel();

chrome.alarms.create('pollCalendar', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pollCalendar') {
        fetchTodaysEvents();
    }
});

