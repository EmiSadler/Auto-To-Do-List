const MEETING_TYPES = [
    {
        type: "Placement Meeting",
        keywords: ["tri-part", "placement meeting", "placement call", "placement"]
    },
    {
        type: "Progress Meeting",
        keywords: ["progress", "progress meeting", "progress call"]
    },
    {
        type: "Wellbeing Meeting",
        keywords: ["wellbeing", "wellbeing meeting", "wellbeing catch-up", "well-being", "well being"]
    }
];

function titleMatchesType(title, meetingType) {
    const lowerTitle = title.toLowerCase();
    return meetingType.keywords.some((keyword) => lowerTitle.includes(keyword));
}

function classifyMeeting(title, description) {
    const combinedText = `${title} ${description || ""}`;
    for (const meetingType of MEETING_TYPES) {
        if (titleMatchesType(combinedText, meetingType)) {
            return meetingType.type;
        }
    }

    return "unknown";
}


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
                if (!data.items) {
                    console.error("No items in response — likely an auth issue:", data);
                    return;
                }
                const justStarted = findJustStartedEvents(data.items);
                filterUntriggeredEvents(justStarted, (newEvents) => {
                    console.log("New (untriggered) events:", newEvents);
                });
            })
            .catch((error) => {
                console.error("Fetch failed:", error);
            });
        });
    }

function findJustStartedEvents(events) {
    const now = new Date();

    return events.filter((event) => {
        if ( !event.start || !event.start.dateTime) {
            return false;
        }
        const eventStart = new Date(event.start.dateTime);
        const secondsSinceStart = (now - eventStart) / 1000;

        return secondsSinceStart >= 0 && secondsSinceStart <= 90;
    });
}


//This function is to ensure no duplicate events are triggered based on weirdness with the times to prevent duplicating the associated ToDos
function filterUntriggeredEvents(events, callback) {
    chrome.storage.local.get('triggeredEventIds', ({ triggeredEventIds }) => {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const triggered = triggeredEventIds || [];
        const triggeredIds = triggered.map((entry) => entry.id);

        const newEvents = events.filter((event) => !triggeredIds.includes(event.id));

        const now = Date.now();
        const newEntries = newEvents.map((event) => ({ id: event.id, triggeredAt: now }));
        const updatedTriggered = [...triggered, ...newEntries];

        chrome.storage.local.set({ triggeredEventIds: updatedTriggered }, () => {
            callback(newEvents);
        });
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

