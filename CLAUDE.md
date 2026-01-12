# Metro Vancouver Skating Schedule

This project scrapes public skating schedules from various Metro Vancouver recreation centers and presents them in a unified calendar interface.

## Project Structure

```
/
├── index.html              # Main frontend (single-page app)
├── backend/
│   ├── puppeteer-scraper.js  # Main scraper script
│   ├── package.json          # Node.js dependencies
│   └── check-other-facilities.js  # Utility to check for new facilities
├── data/
│   └── schedules/          # Daily JSON files organized by date
│       ├── index.json      # Index with metadata and date list
│       └── YYYY/MM/DD.json # Daily schedule files
└── .github/workflows/
    └── scrape-schedules.yml  # Automated daily scraping
```

## Scraping Methods by City

### Vancouver (API Interception)

**Method:** Intercept ActiveNet calendar API

**URL:** `https://anc.ca.apm.activecommunities.com/vancouver/calendars?onlineSiteId=0&no_scroll_top=true&defaultCalendarId=3&locationId=22,23,25,26,27,28,9&displayType=0&view=1`

**API Endpoint:** `/rest/onlinecalendar/multicenter/events`

**How it works:**
1. Load the calendar page with all facility IDs in `locationId` parameter
2. Intercept the API response containing events for all facilities
3. Parse event data (title, times, description, activity URL)

**Vancouver Facilities (locationId mapping):**
| ID | Facility |
|----|----------|
| 9 | West End Community Centre |
| 22 | Hillcrest Centre |
| 23 | Kerrisdale Cyclone Taylor Arena |
| 25 | Killarney Rink |
| 26 | Kitsilano Rink |
| 27 | Sunset Rink |
| 28 | Trout Lake Rink |

---

### Burnaby (Hardcoded Weekly Pattern)

**Method:** Hardcoded weekly schedules based on burnaby.ca

The Burnaby website displays repeating weekly schedules with "Effective January 5-March 12/13" date ranges. Rather than scraping the complex page structure, schedules are hardcoded and expanded for 30 days.

**Burnaby Facilities:**
- Kensington Arena
- Rosemary Brown Recreation Centre

**Schedule Source:** `https://www.burnaby.ca/recreation-and-arts/activities-and-registration/daily-activities?location_ref=XXXX`

**Note:** When Burnaby updates their schedules (typically quarterly), the hardcoded patterns in `getBurnabySchedules()` need to be updated manually.

---

### North Vancouver (drupalSettings Parsing)

**Method:** Extract events from Drupal FullCalendar settings

**URL:** `https://www.nvrc.ca/drop-in-schedules?activity=551&location=All&service=All`

**How it works:**
1. Load the drop-in schedules page
2. Access `window.drupalSettings.fullCalendarView[0].calendar_options` (JSON string)
3. Parse the JSON and extract the `events` array
4. Parse HTML in event titles to extract activity name and location

**North Vancouver Facilities:**
- Karen Magnussen Community Centre
- Harry Jerome Community Recreation Centre
- Canlan Ice Sports North Shore

**Event Title Format (HTML):**
```html
<div class="event-title"><strong>Adult 19yr+ Skate</strong></div>
<div class="event-location">Karen Magnussen Community Recreation Centre</div>
<div class="event-facility">Arena</div>
```

**Note:** The calendar_options is a JSON STRING that must be parsed, not a direct object.

---

### Outdoor Rinks (Seasonal)

**Method:** Hardcoded seasonal hours

**Facilities:**
- **Robson Square Ice Rink** (Vancouver)
  - Season: November 28 - February 28
  - Hours: Daily 12pm-9pm
  - Free admission
  - URL: https://www.robsonsquare.com/

- **The Shipyards Skate Plaza** (North Vancouver)
  - Season: November 15 - March 29
  - Hours: Daily 12pm-8pm
  - Free admission
  - Ice cleaning: 1:30pm, 3:30pm, 5:30pm (~30min)
  - URL: https://www.cnv.org/parks-recreation/the-shipyards/skate-plaza

---

## Running the Scraper

```bash
cd backend
npm install

# Scrape all cities and output daily files (default for GitHub Actions)
node puppeteer-scraper.js --daily --output ../data/schedules

# Scrape all cities to single JSON file
node puppeteer-scraper.js --output ../data/schedules.json

# Scrape specific cities
node puppeteer-scraper.js --city vancouver --output ../data/schedules.json
node puppeteer-scraper.js --city burnaby --output ../data/schedules.json
node puppeteer-scraper.js --city northvan --output ../data/schedules.json
node puppeteer-scraper.js --city outdoor --output ../data/schedules.json
node puppeteer-scraper.js --city vancouver,outdoor --output ../data/schedules.json

# Debug mode (show browser)
node puppeteer-scraper.js --debug --output ../data/schedules.json
```

---

## Session Data Schema

```typescript
interface Session {
  facility: string;      // "Hillcrest Centre"
  city: string;          // "Vancouver" | "Burnaby" | "North Vancouver"
  address: string;       // Full street address
  lat: number;           // Latitude
  lng: number;           // Longitude
  date: string;          // "2026-01-12"
  startTime: string;     // "11:15"
  endTime: string;       // "12:45"
  type: string;          // Activity type classification
  activityName: string;  // Original activity name
  description?: string;  // Activity description
  ageRange?: string;     // "6-12 yrs with adult" if available
  activityUrl?: string;  // Link to registration page
  eventItemId?: number;  // Vancouver API event ID
}
```

---

## Frontend Features

The web frontend (`index.html`) displays:

**Views:**
- **Day View**: Timeline with duration bars, "NOW" line for today, past events grayed out
- **Week View**: 7-day calendar grid
- **Month View**: Full month calendar

**Session Modal:**
- Activity name and type
- Age range (if available)
- Date and time with relative time ("in 30min")
- Location with Google Maps link
- Distance from user location
- Description
- "Reserve / Register" button
- "Add to Google Calendar" button

**Filters:**
- Activity type (Public Skating, Family Skate, etc.)
- City
- Facility
- Location-based (with geolocation)

**Behavior:**
- After 9pm, defaults to showing tomorrow's schedule

---

## Activity Type Classification

Activities are classified based on keywords:
- **Public Skating**: public, drop-in, toonie, discount, loonie, adult skate
- **Family Skate**: family, parent & tot, preschool
- **Drop-in Hockey**: shinny, drop-in hockey, stick & puck, shoot & score
- **Family Hockey**: family hockey, family fun hockey
- **Figure Skating**: figure
- **Skating Lessons**: lesson, learn, class, canskate
- **Practice**: practice, freestyle, lap skate

---

## Automated Updates

GitHub Actions workflow (`.github/workflows/scrape-schedules.yml`):
- Runs daily at 6 AM UTC (10 PM Pacific)
- Triggered on push to `main` (backend/ changes only)
- Manual trigger via workflow_dispatch

---

## Maintenance Notes

1. **Vancouver API changes**: If ActiveNet updates their API, check the response structure in browser DevTools
2. **Burnaby schedule updates**: Update `getBurnabySchedules()` when burnaby.ca publishes new quarterly schedules
3. **Outdoor rink seasons**: Update season dates annually in `getOutdoorRinks()`
4. **New facilities**: Add facility configs to the relevant section in `puppeteer-scraper.js`
