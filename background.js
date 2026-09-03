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
    },
    {
        type: "Gateway Meeting",
        keywords: ["gateway", "gate way", "gateway meeting"]
    },
    {
        type: "APP Meeting",
        keywords: ["app meeting", "provision plan", "inclusion meeting", "accessibility provision plan", "app"]
    }
];

const EXCLUDED_KEYWORDS = ["lunch", "meditation", "admin", "out of office", "ooo", "busy", "focus time", "commuting", "commute"]

const TODO_TEMPLATES = {
    "Placement Meeting": [
        "Schedule next meeting in Google Calendar",
        "Complete the Review form on Aptem",
        "Create next Review form on Aptem",
        "Update Holiday Handover",
        "Update Learner notes"
    ],
    "Progress Meeting": [
        "Schedule next meeting in Google Calendar",
        "Complete the Review form on Aptem",
        "Create next Review form on Aptem",
        "Update Holiday Handover",
        "Update Learner notes"
    ],
    "Wellbeing Meeting": [
        "Schedule next meeting in Google Calendar",
        "Complete the Review form on Aptem",
        "Create next Review form on Aptem",
        "Update Holiday Handover",
        "Update Learner notes"
    ],
    "Gateway Meeting": [
        "APEX: Upload Portfolio",
        "APEX: Upload Project Brief",
        "APEX: Upload Gateway Form",
        "APEX: Upload Reasonable Adjustments form (optional)",
        "APEX: Check learners details are correct (including address for cert delivery)",
        "APTEM: Complete Gateway Review form",
        "APTEM: Ensure OTJ Hours are correct",
        "APTEM: Create Tracker (Completion of Program) & Upload Gateway Form from meeting",
        "SLACK: Post in apprs-gateway"
    ],
    "APP Meeting": [
        "APTEM: Ensure learner is correctly assigned (Babbage, Lovelace, Turing)",
        "APTEM: Complete APP review form",
        "Schedule follow-up meeting if needed"
    ]
};

const DEFAULT_MEETING_TYPES = [
  {
    id: crypto.randomUUID(),
    type: "Placement Meeting",
    keywords: ["tri-part", "placement meeting", "placement call", "placement"],
    todos: [
      "Schedule next meeting in Google Calendar",
      "Complete the Review form on Aptem",
      "Create next Review form on Aptem",
      "Update Holiday Handover",
      "Update Learner notes"
    ]
  },
  {
    id: crypto.randomUUID(),
    type: "Progress Meeting",
    keywords: ["progress", "progress meeting", "progress call"],
    todos: [
      "Schedule next meeting in Google Calendar",
      "Complete the Review form on Aptem",
      "Create next Review form on Aptem",
      "Update Holiday Handover",
      "Update Learner notes"
    ]
  },
  {
    id: crypto.randomUUID(),
    type: "Wellbeing Meeting",
    keywords: ["wellbeing", "wellbeing meeting", "wellbeing catch-up", "well-being", "well being"],
    todos: [
      "Schedule next meeting in Google Calendar",
      "Complete the Review form on Aptem",
      "Create next Review form on Aptem",
      "Update Holiday Handover",
      "Update Learner notes"
    ]
  },
  {
    id: crypto.randomUUID(),
    type: "Gateway Meeting",
    keywords: ["gateway", "gate way", "gateway meeting"],
    todos: [
      "APEX: Upload Portfolio",
      "APEX: Upload Project Brief",
      "APEX: Upload Gateway Form",
      "APEX: Upload Reasonable Adjustments form (optional)",
      "APEX: Check learners details are correct (including address for cert delivery)",
      "APTEM: Complete Gateway Review form",
      "APTEM: Ensure OTJ Hours are correct",
      "APTEM: Create Tracker (Completion of Program) & Upload Gateway Form from meeting",
      "SLACK: Post in apprs-gateway"
    ]
  },
  {
    id: crypto.randomUUID(),
    type: "APP Meeting",
    keywords: ["app meeting", "provision plan", "inclusion meeting", "accessibility provision plan", "app"],
    todos: [
      "APTEM: Ensure learner is correctly assigned (Babbage, Lovelace, Turing)",
      "APTEM: Complete APP review form",
      "Schedule follow-up meeting if needed"
    ]
  }
];

const DEFAULT_EXCLUDED_KEYWORDS = ["lunch", "meditation", "admin", "out of office", "ooo", "busy", "focus time", "commuting", "commute"];

let currentMeetingTypes = [];
let currentExcludedWords = [];

function seedConfigIfMissing(callback) {
    chrome.storage.local.get(['meetingTypeConfig', 'excludedKeywords'], (result) => {
        const updates = {};
        
        if (result.meetingTypeConfig === undefined) {
            updates.meetingTypeConfig = DEFAULT_MEETING_TYPES;
        }
        if (result.excludedKeywords === undefined) {
            updates.excludedKeywords = DEFAULT_EXCLUDED_KEYWORDS;
        }
        if (Object.keys(updates).length > 0) {
            chrome.storage.local.set(updates, callback);
        } else if (callback) {
            callback();
        }
    });
}

function refreshConfigCache(callback) {
    chrome.storage.local.get(['meetingTypeConfig', 'excludedKeywords'], (result) => {
        currentMeetingTypes = result.meetingTypeConfig || [];
        currentExcludedKeywords = result.excludedKeywords || [];
        if (callback) {
            callback();
        }
    });
}

function generateTodos(meetingType, event) {
    if (meetingType === "excluded") {
        return [];
    }
    const now = Date.now();
    if (meetingType === "unknown") {
        return [
            {
                id: crypto.randomUUID(),
                text: `Review "${event.summary}" - add follow-up items as needed`,
                done: false,
                sourceEventId: event.id,
                sourceEventTitle:event.summary,
                sourceMeetingType: meetingType,
                createdAt: now
            }
        ];
    }

    const matchingType = currentMeetingTypes.find((mt) => mt.type === meetingType);
    const templateItems = matchingType ? matchingType.todos : [];

    return templateItems.map((text) => ({
        id: crypto.randomUUID(),
        text: text,
        done: false,
        sourceEventId: event.id,
        sourceEventTitle: event.summary,
        sourceMeetingType: meetingType,
        createdAt: now
    }));
}

function saveNewTodos(newTodos, callback) {
  chrome.storage.local.get('todos', ({ todos }) => {
    const existingTodos = todos || [];
    const updatedTodos = [...existingTodos, ...newTodos];

    chrome.storage.local.set({ todos: updatedTodos }, () => {
      if (callback) {
        callback(updatedTodos);
      }
    });
  });
}

function titleMatchesType(title, meetingType) {
    const lowerTitle = title.toLowerCase();
    return meetingType.keywords.some((keyword) => lowerTitle.includes(keyword));
}

function classifyMeeting(title, description) {
    const combinedText = `${title} ${description || ""}`.toLowerCase();

    const isExcluded = currentExcludedKeywords.some((keyword) => combinedText.includes(keyword));
    if (isExcluded) {
        return "excluded";
    }

    for (const meetingType of currentMeetingTypes) {
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
        chrome.storage.local.set({ authToken: token, authStatus: "connected" }, () => {

        });
    });
}

function checkAuthStatus() {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError || !token) {
            chrome.storage.local.set({ authStatus: "disconnected" });
        } else {
            chrome.storage.local.set({ authToken: token, authStatus: "connected" });
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
                    checkAuthStatus();
                    return;
                }
                const justStarted = findJustStartedEvents(data.items);
                filterUntriggeredEvents(justStarted, (newEvents) => {
                    processEventsSequentially(newEvents);
            });
            })    
            .catch((error) => {
                console.error("Fetch failed:", error);
            });
        });
    }

function processEventsSequentially(events, index = 0) {
    if (index >= events.length) {
        return;
    }

    const event = events[index];
    const meetingType = classifyMeeting(event.summary, event.description);
    const newTodos = generateTodos(meetingType, event);

    if (newTodos.length > 0) {
        saveNewTodos(newTodos, () => {
            console.log(`Saved ${newTodos.length} to-do(s) for "${event.summary}" (${meetingType})`);
            processEventsSequentially(events, index + 1);
        });
    } else {
        processEventsSequentially(events, index + 1);
    }
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

seedConfigIfMissing(() => {
    refreshConfigCache(() => {
        checkAuthStatus();
        openPanel();
        chrome.alarms.create('pollCalendar', { periodInMinutes: 1 });
    });
});


chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pollCalendar') {
        fetchTodaysEvents();
    }
});

chrome.runtime.onMessage.addListener((message) => {
    console.log("Message received:", message);
    if (message.action === 'connectGoogleAccount') {
        connectGoogleAccount();
    }
    if (message.action === "resetToDefaults") {
        chrome.storage.local.set({
            meetingTypeConfig: DEFAULT_MEETING_TYPES,
            excludedKeywords: DEFAULT_EXCLUDED_KEYWORDS
        });
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
        return;
    }
    if (changes.meetingTypeConfig || changes.excludedKeywords) {
        refreshConfigCache();
    }
});

