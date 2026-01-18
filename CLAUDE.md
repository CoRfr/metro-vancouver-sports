# Metro Vancouver Sports Schedules

This project scrapes public skating and swimming schedules from various Metro Vancouver recreation centers and presents them in a unified calendar interface.

## Project Structure

```
/
├── index.html              # Main frontend (HTML only)
├── css/
│   └── styles.css          # All CSS styles
├── js/
│   └── app.js              # All JavaScript
├── backend/
│   ├── puppeteer-scraper.js  # Main scraper script (all cities)
│   ├── package.json          # Node.js dependencies
│   └── check-other-facilities.js  # Utility to check for new facilities
├── data/
│   └── schedules/          # Daily JSON files organized by date and sport
│       ├── index.json      # Index with metadata and date list
│       └── YYYY/MM/DD/     # Daily folders
│           ├── ice-skating.json  # Ice skating schedules
│           └── swimming.json     # Swimming schedules (coming soon)
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
- Kensington Complex
- Rosemary Brown Recreation Centre

**Schedule Source:** `https://www.burnaby.ca/recreation-and-arts/activities-and-registration/daily-activities?location_ref=XXXX`

**Note:** When Burnaby updates their schedules (typically quarterly), the hardcoded patterns in `getBurnabySchedules()` need to be updated manually.

---

### Burnaby Swimming (Dynamic Table Scraping)

**Method:** Dynamic scraping of HTML tables from burnaby.ca

**URL Pattern:** `https://www.burnaby.ca/recreation-and-arts/programs-and-activities/daily-activities?activity_tid=651&location_ref={locationRef}`

**Burnaby Swimming Facilities:**
| Facility | Address | Location Ref |
|----------|---------|--------------|
| Bonsor Recreation Complex | 6550 Bonsor Ave, Burnaby | 2996 |
| Edmonds Community Centre | 7433 Edmonds St, Burnaby | 2336 |
| Eileen Dailly Leisure Pool | 240 Willingdon Ave, Burnaby | 3041 |

**How it works:**
1. Load the daily activities page for each pool (activity_tid=651 for swimming)
2. Find the schedule table with class `site-table--no-border`
3. Parse day headers (Monday, Tuesday, etc.) to determine column mapping
4. For each data cell, extract:
   - Activity name from `<strong>` or `<b>` tag
   - Time from the text (patterns like "6-8:55 am", "10 am-1 pm")
   - Notes/age range from `<em>` tag
5. Expand weekly patterns to 30 days of sessions

**Table Structure:**
```html
<table class="site-table--no-border">
  <tr><th colspan="7">Effective January 5-March 15</th></tr>
  <tr><th>Monday</th><th>Tuesday</th>...</tr>
  <tr>
    <td><strong>Lap Swim</strong><br>6-8:55 am</td>
    <td><strong>Aquafit</strong><br>9-10 am<br><em>Reserve</em></td>
    ...
  </tr>
</table>
```

---

### Richmond (Hardcoded Weekly Pattern)

**Method:** Hardcoded weekly schedules from richmond.ca PDFs

**Schedules Page:** `https://www.richmond.ca/parks-recreation/about/schedules.htm`

**Richmond Facilities:**
- Richmond Ice Centre (14140 Triangle Rd, Richmond, BC V6W 1K4)
- Minoru Arenas (7551 Minoru Gate, Richmond, BC V6Y 1R8)

**Note:** Richmond publishes PDF schedules with grid layouts. The PDFs have a complex column-based format that is brittle to parse automatically. Schedules are hardcoded in `getRichmondSchedules()` and need to be updated manually each season (typically quarterly).

#### How to Update Richmond Schedules

1. **Download the PDFs** from the schedules page:
   - Look for "Richmond Ice Centre" and "Minoru Arenas" PDF links
   - Current URLs typically follow pattern: `RIC_Public_Skate_and_Drop-In_Schedule_Winter*.pdf`

2. **Extract text from PDF** (for reference):
   ```bash
   pdftotext -layout downloaded.pdf - | less
   ```

3. **PDF Structure:**
   - Header with date range: "WINTER 2026 — JAN 5 – MAR 13"
   - Day columns: SUN | MON | TUE | WED | THU | FRI | SAT
   - Activities stacked vertically in each column:
     ```
     Activity Name
     Time (e.g., 9:00am – 3:00pm)
     Date Range (e.g., Jan 5 – Mar 9)
     ```
   - Cancellations section at bottom

4. **Update `getRichmondSchedules()` in `puppeteer-scraper.js`:**
   - Update `dateRange` (start/end dates)
   - Update `ricSchedule` and `minoruSchedule` objects
   - Each day (0=Sun, 1=Mon, etc.) has array of activities:
     ```javascript
     1: [ // Monday
       { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating' },
       { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey' },
     ],
     ```
   - Update `cancellations` array with dates to skip

5. **Activity Types:**
   - `Public Skating` - Public Skate, Toonie Skate
   - `Drop-in Hockey` - Adult Stick and Puck, Masters 65+ Hockey, Senior 55+ Hockey, Adult Hockey
   - `Figure Skating` - Figure Skating
   - `Family Skate` - Family sessions

---

### Port Coquitlam (Hardcoded Weekly Pattern)

**Method:** Hardcoded weekly schedules from portcoquitlam.ca PDF

**Schedules Page:** `https://www.portcoquitlam.ca/recreation-parks/skating/public-skates`
**PDF URL:** `https://www.portcoquitlam.ca/media/file/public-skate-schedule`

**Port Coquitlam Facilities:**
- Port Coquitlam Community Centre (2150 Wilson Ave, Port Coquitlam, BC V3C 6J5)

**Note:** Schedules are hardcoded in `getPocoSchedules()` and need to be updated manually each season.

#### How to Update Port Coquitlam Schedules

1. **Download the PDF** from the schedules page
2. **View the PDF** to see the schedule grid
3. **Update `getPocoSchedules()` in `puppeteer-scraper.js`:**
   - Update `scheduleEnd` date
   - Update the `schedule` object for each day
   - Each day (0=Sun, 1=Mon, etc.) has array of activities:
     ```javascript
     1: [ // Monday
       { name: 'Family Play and Skate', start: '12:00', end: '13:00', type: 'Family Skate' },
       { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+' },
     ],
     ```

---

### Coquitlam (Hardcoded Weekly Pattern)

**Method:** Hardcoded weekly schedules from coquitlam.ca PDF

**Schedules Page:** `https://www.coquitlam.ca/979/Drop-In-Activities`
**PDF URL:** `https://www.coquitlam.ca/DocumentCenter/View/16098/PSLC-Winter-2026-Arena-Drop-in-Schedule`

**Coquitlam Facilities:**
- Poirier Sport and Leisure Complex (633 Poirier St, Coquitlam, BC V3J 6B1)

**Note:** Schedules are hardcoded in `getCoquitlamSchedules()` and need to be updated manually each season.

#### How to Update Coquitlam Schedules

1. **Download the PDF** from the schedules page
2. **View the PDF** to see the schedule grid with days as columns
3. **Update `getCoquitlamSchedules()` in `puppeteer-scraper.js`:**
   - Update `CONFIG.coquitlam.scheduleEnd` date
   - Update the `schedule` object for each day
   - Update `cancellations`, `endDates`, and `startDates` objects for specific restrictions
   - Update `specialEvents` array for holiday schedules

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

### West Vancouver (DOM Scraping)

**Method:** Scrape drop-in activities from westvancouver.ca

**URL:** `https://westvancouver.ca/parks-recreation/recreation-programs-services/daily-activities-search-results?activity_type=dropins&ages=9/6/8/3/10/12&activities=122/121/119/123&locations=35`

**How it works:**
1. Load the daily activities page with skating activity filters
2. Find all `.dropins-activity` elements which have `data-startdate` attributes
3. Extract activity name from parent `.dropins-category-title` or `.dropins-activity-group-title`
4. Extract time from `.activity-days-time-range` element

**West Vancouver Facility:**
- West Vancouver Community Centre (Ice Arena)
  - Address: 2121 Marine Dr, West Vancouver

**DOM Structure:**
```html
<div class="dropins-activity" data-startdate="2026-01-15" data-day="Thu">
  <div class="activity-location-time">
    <div class="activity-location">Ice Arena</div>
    <div class="activity-days-time-range">Thu, 6:15 PM-7:45 PM</div>
  </div>
</div>
```

---

### New Westminster (PerfectMind Scraping)

**Method:** Scrape PerfectMind booking system (both skating and hockey pages)

**URLs:**
- Skating: `https://cityofnewwestminster.perfectmind.com/23693/Clients/BookMe4BookingPages/Classes?calendarId=db250b43-ef6b-43c5-979e-3f3d1dab2d67&widgetId=2edd14d7-7dee-4a06-85e1-e211553c48d5`
- Hockey: `https://cityofnewwestminster.perfectmind.com/23693/Clients/BookMe4BookingPages/Classes?calendarId=8008f9e0-3515-4bfd-8e14-b56cc27c5341&widgetId=2edd14d7-7dee-4a06-85e1-e211553c48d5`

**How it works:**
1. Load the drop-in skating booking page
2. Wait for dynamic content to load (10 seconds)
3. Parse page text for date headers like "Mon, Jan 12th, 2026"
4. Extract activity entries with format "Activity Name #NNNNNN"
5. Parse subsequent lines for time range and location

**New Westminster Facilities:**
- Queen's Park Arena
- Moody Park Arena

**Page Structure:**
```
Mon, Jan 13th, 2026
50+ Social Skate  #243704
10:45am - 11:45am
Moody Park Arena - Ice
```

**Note:** PerfectMind renders content dynamically via JavaScript, requiring extended wait times for page load.

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
node puppeteer-scraper.js --city westvan --output ../data/schedules.json
node puppeteer-scraper.js --city newwest --output ../data/schedules.json
node puppeteer-scraper.js --city outdoor --output ../data/schedules.json
node puppeteer-scraper.js --city vancouver,outdoor --output ../data/schedules.json

# Debug mode (show browser)
node puppeteer-scraper.js --debug --output ../data/schedules.json
```

---

## Local Testing

To test the frontend locally:

```bash
# From project root
./serve.sh
```

This starts a Python HTTP server on port 8080. Open http://localhost:8080 in your browser.

---

## Session Data Schema

```typescript
interface Session {
  facility: string;      // "Hillcrest Centre"
  city: string;          // "Vancouver" | "Burnaby" | "North Vancouver" | "West Vancouver" | "New Westminster"
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
3. **Richmond schedule updates**: Update `getRichmondSchedules()` when richmond.ca publishes new quarterly PDFs
4. **Port Coquitlam schedule updates**: Update `getPocoSchedules()` when portcoquitlam.ca publishes new PDFs
5. **Outdoor rink seasons**: Update season dates annually in `getOutdoorRinks()`
6. **New facilities**: Add facility configs to the relevant section in `puppeteer-scraper.js`

---

## Adding a New City

### Step-by-Step Guide

1. **Research the city's recreation website:**
   - Find their ice arena / skating schedules page
   - Determine the data format (API, PDF, HTML table, Drupal, PerfectMind, etc.)
   - Note the URL patterns and schedule structure

2. **Add city configuration to `CONFIG` in `puppeteer-scraper.js`:**
   ```javascript
   cityname: {
     facilities: {
       'facility-key': {
         name: 'Facility Full Name',
         lat: 49.XXXXX,
         lng: -122.XXXXX,
         address: 'Full Address, City, BC Postal Code',
       },
     },
     schedulesUrl: 'https://city-website.ca/schedules',
   },
   ```

3. **Get GPS coordinates using OSM Nominatim:**
   ```bash
   curl -s "https://nominatim.openstreetmap.org/search?q=Facility+Name+City+BC&format=json" | jq '.[0] | {lat, lon}'
   ```
   - Use the facility name and city in the query
   - Results return `lat` and `lon` fields

4. **Create a scraping function:**
   - For **API-based** (like Vancouver): Intercept network requests
   - For **Drupal** (like North Vancouver): Extract from `drupalSettings`
   - For **PerfectMind** (like New Westminster): Parse rendered page text
   - For **PDF/static schedules** (like Burnaby, Richmond, Port Coquitlam): Create `getCitySchedules()` function with hardcoded weekly patterns

5. **Add the city to the scraper:**
   - Add to the `scrapeAll()` function in `puppeteer-scraper.js`
   - Add city name to the `cities` array in function signature and CLI help

6. **Update the frontend:**
   - `js/app.js`: Add city to `cityColors` object (in `initMap` function) with a unique color
   - `js/app.js`: Add city abbreviation to the `abbrs` object in `getCityAbbr` function
   - `css/styles.css`: Add CSS class `.legend-dot.citykey { background: #color; }`
   - `index.html`: Add legend HTML item in `.map-legend` div
   - `index.html`: Add data source entry in `.data-sources` div (for "Disclaimer & About" section)

7. **Update documentation:**
   - Add city section to this file (CLAUDE.md)
   - Add to README.md if it exists

### Session Object Structure

Each scraped session must have these fields:
```javascript
{
  facility: 'Facility Name',
  city: 'City Name',
  address: 'Full Address',
  lat: 49.XXXXX,
  lng: -122.XXXXX,
  date: '2026-01-15',      // YYYY-MM-DD
  startTime: '14:30',       // HH:MM (24-hour)
  endTime: '16:00',
  type: 'Public Skating',   // Activity type classification
  activityName: 'Public Skate',
  activityUrl: 'https://...',  // Optional: link to registration
  ageRange: '6-12 yrs',        // Optional
  description: '...',          // Optional
}
```

### Testing

```bash
cd backend
node puppeteer-scraper.js --city cityname --output /tmp/test.json
cat /tmp/test.json | jq '.sessions | length'
cat /tmp/test.json | jq '.sessions[0]'
```

---

## Finding Facility Addresses & GPS Coordinates

When adding or updating facility information, use the official city websites to find accurate addresses:

### Official Facility Pages

| City | URL | Notes |
|------|-----|-------|
| **Vancouver** | `https://vancouver.ca/parks-recreation-culture/{facility-name}.aspx` | e.g., `hillcrest-centre`, `sunset-community-centre` |
| **Burnaby** | `https://www.burnaby.ca/recreation-and-arts/recreation-facilities/{facility-name}` | e.g., `kensington-complex`, `rosemary-brown-recreation-centre` |
| **North Vancouver** | `https://www.nvrc.ca/facilities-fields/locations-hours/community-recreation-centres/{facility-name}` | e.g., `karen-magnussen-community-recreation` |
| **West Vancouver** | `https://westvancouver.ca/parks-recreation/community-centres` | May require manual lookup |
| **New Westminster** | `https://www.newwestcity.ca/parks-and-recreation/facilities/arenas` | Individual arena pages |

### Finding GPS Coordinates (OSM Nominatim)

Use OpenStreetMap's Nominatim API to find coordinates:

```bash
# Search by facility name and city
curl -s "https://nominatim.openstreetmap.org/search?q=Poirier+Sport+Leisure+Complex+Coquitlam+BC&format=json" | jq '.[0] | {lat, lon}'

# Search by address
curl -s "https://nominatim.openstreetmap.org/search?q=633+Poirier+St+Coquitlam+BC&format=json" | jq '.[0] | {lat, lon}'
```

The API returns `lat` and `lon` as strings - convert to numbers for the config.

**Example Response:**
```json
{
  "lat": "49.25460",
  "lon": "-122.84526"
}
```

### Address Format

Use full addresses with postal codes: `Street Address, City, BC Postal Code`

Example: `51 3rd Ave, New Westminster, BC V3L 1L7`
