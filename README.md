# Auto To-Do List

A Chrome extension that watches your Google Calendar, and when a meeting starts, automatically generates a relevant to-do checklist in a side panel - based on keywords in the meeting title.

## What it does

- Polls your Google Calendar once a minute.
- When a meeting starts, classifies it by keywords in the title/description (e.g. "Wellbeing", "Placement", "Progress").
- Generates a preset checklist of to-dos for that meeting type, shown grouped under the meeting's title in the side panel.
- Certain meeting types (Lunch, Admin, etc.) are excluded entirely - no to-dos generated.
- Unrecognized meetings get a single fallback to-do prompting a manual review.
- To-dos and their checked state persist across browser sessions.

## Prerequisites

- Google Chrome
- A Google account with Calendar access
- A Google Cloud account (free) to create OAuth credentials

## Setup

### 1. Load the extension in Chrome

1. Open `chrome://extensions`.
2. Toggle on **Developer mode** (top right).
3. Click **Load unpacked**, and select this project's folder.
4. Confirm the extension appears with no errors. Copy the **extension ID** shown on its card - you'll need it in the next step.

### 2. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project.
2. Go to **APIs & Services -> Library**, search for **Google Calendar API**, and enable it.
3. Go to **APIs & Services -> OAuth consent screen**. Choose **External**, fill in the required fields, and leave publishing status as **Testing**.
4. Under the consent screen's test users, add the Google account(s) that will use this extension.

### 3. Create OAuth credentials

1. Go to **APIs & Services -> Credentials**.
2. Click **+ Create Credentials -> OAuth Client ID**.
3. Set application type to **Chrome Extension**.
4. Paste in the extension ID you copied in Step 1.
5. Click **Create**. Copy the generated **Client ID** (ends in `.apps.googleusercontent.com`).

### 4. Add the Client ID to the extension

1. Open `manifest.json`.
2. Confirm the `oauth2` key contains your Client ID:
```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID_HERE",
     "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
   }
```
3. Reload the extension on `chrome://extensions`.

### 5. Connect your calendar

1. Click the extension's toolbar icon to open the side panel.
2. If not yet connected, a banner will prompt you to reconnect - click **Reconnect Google Calendar** and sign in.

## Usage

Leave the side panel open (or just installed - it runs in the background regardless). When a meeting starts that matches a known type, its to-dos will appear automatically within about a minute. Check items off as you complete them - this is saved automatically.

## Current meeting types & keywords

See `TAXONOMY.md` for the full list. Summary:

| Type | Example keywords |
|---|---|
| Placement Meeting | placement, tri-part, placement call |
| Progress Meeting | progress, progress call |
| Wellbeing Meeting | wellbeing, well-being, wellbeing catch-up |
| Excluded (no to-dos) | lunch, admin, meditation, ooo, busy, focus time, commute |
| Unrecognized | generates a single fallback review to-do |

To adjust keywords or to-do templates, edit `TAXONOMY.md`/`TEMPLATES.md` for reference, then update `MEETING_TYPES`, `EXCLUDED_KEYWORDS`, and `TODO_TEMPLATES` in `background.js` to match.

## Known limitations

- Single-user only - templates aren't currently customizable per person (see `FUTURE-01` on the project board).
- Requires the browser to be open; polling stops if Chrome is fully closed.
- Auth tokens expire periodically - the reconnect banner will appear automatically when this happens.

## Project structure

- `manifest.json` - extension configuration, permissions, OAuth setup
- `background.js` - service worker: auth, polling, classification, to-do generation, storage
- `panel.html` / `panel.js` / `panel.css` - the side panel UI
- `TAXONOMY.md` - meeting type keyword reference
- `TEMPLATES.md` - to-do content per meeting type
- `SCHEMA.md` - data shapes used across the extension

Project Start Date: 31.7.26
