#!/usr/bin/env node
/**
 * Puppeteer-based scraper for Metro Vancouver skating schedules
 *
 * Intercepts the ActiveNet calendar API to get all scheduled events.
 * The API returns individual event occurrences (not series), which is what we need.
 *
 * Usage:
 *   node puppeteer-scraper.js                    # Scrape all and output JSON
 *   node puppeteer-scraper.js --output data.json # Save to file
 *   node puppeteer-scraper.js --ical             # Output iCal format
 *   node puppeteer-scraper.js --debug            # Show browser window
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  chromiumPath: process.env.CHROMIUM_PATH || '/snap/bin/chromium',
  headless: true,
  timeout: 60000,

  // Vancouver calendar config - uses ActiveNet API
  vancouver: {
    // Use view=1 and multiple locationIds to get all facilities
    calendarUrl: 'https://anc.ca.apm.activecommunities.com/vancouver/calendars?onlineSiteId=0&no_scroll_top=true&defaultCalendarId=3&locationId=22,23,25,26,27,28,9&displayType=0&view=1',
    apiPattern: '/rest/onlinecalendar/multicenter/events',
    facilities: {
      // Map center_id to facility info (IDs from ActiveNet)
      9: { name: 'West End Community Centre', lat: 49.2863, lng: -123.1353, address: '870 Denman St, Vancouver' },
      22: { name: 'Hillcrest Centre', lat: 49.2438, lng: -123.1090, address: '4575 Clancy Loranger Way, Vancouver' },
      23: { name: 'Kerrisdale Cyclone Taylor Arena', lat: 49.2337, lng: -123.1607, address: '5851 West Boulevard, Vancouver' },
      25: { name: 'Killarney Rink', lat: 49.2275, lng: -123.0456, address: '6260 Killarney St, Vancouver' },
      26: { name: 'Kitsilano Rink', lat: 49.2713, lng: -123.1570, address: '2690 Larch St, Vancouver' },
      27: { name: 'Sunset Rink', lat: 49.2267, lng: -123.1003, address: '6810 Main St, Vancouver' },
      28: { name: 'Trout Lake Rink', lat: 49.2544, lng: -123.0636, address: '3360 Victoria Dr, Vancouver' },
    },
    // Fallback facility matching by name
    facilityAliases: {
      'hillcrest': 22,
      'kerrisdale': 23,
      'cyclone taylor': 23,
      'killarney': 25,
      'kitsilano': 26,
      'kits': 26,
      'sunset': 27,
      'trout lake': 28,
      'west end': 9,
    },
  },

  // Burnaby config - uses burnaby.ca daily activities
  burnaby: {
    // Daily activities pages by facility
    dailyActivitiesUrl: 'https://www.burnaby.ca/recreation-and-arts/activities-and-registration/daily-activities',
    facilities: {
      'kensington': {
        name: 'Kensington Complex',
        lat: 49.2569,
        lng: -123.0340,
        address: '6159 Curtis St, Burnaby',
        locationRef: '2986', // location_ref parameter
      },
      'rosemary-brown': {
        name: 'Rosemary Brown Recreation Centre',
        lat: 49.2258,
        lng: -122.9892,
        address: '5930 Humphries Ave, Burnaby',
        locationRef: '2991',
      },
      'bill-copeland': {
        name: 'Bill Copeland Sports Centre',
        lat: 49.2389,
        lng: -123.0042,
        address: '3676 Kensington Ave, Burnaby',
        locationRef: '2981',
      },
      'burnaby-lake': {
        name: 'Burnaby Lake Arena',
        lat: 49.2492,
        lng: -122.9567,
        address: '3676 Kensington Ave, Burnaby',
        locationRef: '2982',
      },
    },
    // Activity type IDs on burnaby.ca
    activityTypes: {
      656: 'Public Skating',
      657: 'Family Skate',
      658: 'Toonie Skate',
      660: 'Lap Skate',
      661: 'Parent & Tot Skate',
      // Add more as discovered
    },
  },

  // North Vancouver config - uses nvrc.ca drop-in schedules
  northvan: {
    dropInUrl: 'https://www.nvrc.ca/drop-in-schedules?activity=551&location=All&service=All',
    facilities: {
      'karen magnussen': {
        name: 'Karen Magnussen Community Centre',
        lat: 49.3217,
        lng: -123.0745,
        address: '2300 Kirkstone Rd, North Vancouver',
      },
      'harry jerome': {
        name: 'Harry Jerome Community Recreation Centre',
        lat: 49.3156,
        lng: -123.0689,
        address: '123 East 23rd St, North Vancouver',
      },
      'canlan': {
        name: 'Canlan Ice Sports North Shore',
        lat: 49.3189,
        lng: -123.0231,
        address: '2411 Mt Seymour Pkwy, North Vancouver',
      },
    },
  },

  // West Vancouver config - uses westvancouver.ca daily activities
  westvan: {
    dropInUrl: 'https://westvancouver.ca/parks-recreation/recreation-programs-services/daily-activities-search-results?activity_type=dropins&ages=9/6/8/3/10/12&activities=122/121/119/123&locations=35',
    facility: {
      name: 'West Vancouver Community Centre',
      lat: 49.3270,
      lng: -123.1660,
      address: '2121 Marine Dr, West Vancouver',
    },
  },

  // New Westminster config - uses PerfectMind booking system
  newwest: {
    skatingUrl: 'https://cityofnewwestminster.perfectmind.com/23693/Clients/BookMe4BookingPages/Classes?calendarId=db250b43-ef6b-43c5-979e-3f3d1dab2d67&widgetId=2edd14d7-7dee-4a06-85e1-e211553c48d5&embed=False',
    hockeyUrl: 'https://cityofnewwestminster.perfectmind.com/23693/Clients/BookMe4BookingPages/Classes?calendarId=8008f9e0-3515-4bfd-8e14-b56cc27c5341&widgetId=2edd14d7-7dee-4a06-85e1-e211553c48d5&embed=False',
    facilities: {
      "queen's park arena": {
        name: "Queen's Park Arena",
        lat: 49.2186,
        lng: -122.9082,
        address: '203 First St, New Westminster',
      },
      'moody park arena': {
        name: 'Moody Park Arena',
        lat: 49.2267,
        lng: -122.9350,
        address: '701 8th Ave, New Westminster',
      },
    },
  },
};

/**
 * Launch browser
 */
async function createBrowser(debug = false) {
  const browser = await puppeteer.launch({
    executablePath: CONFIG.chromiumPath,
    headless: debug ? false : 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();
  // Wide viewport to show all facility columns at once
  await page.setViewport({ width: 2560, height: 1200 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  return { browser, page };
}

/**
 * Scrape Vancouver by intercepting the calendar API
 * The API returns ~1 week of data per request
 */
async function scrapeVancouver(page) {
  console.error('Scraping Vancouver (API intercept)...');

  const allSessions = [];
  const seenEventIds = new Set();

  // Use view=1 with all facility IDs - API returns ~1 week of data
  const calendarUrl = CONFIG.vancouver.calendarUrl;

  let apiData = null;

  const responseHandler = async (response) => {
    const url = response.url();
    if (url.includes(CONFIG.vancouver.apiPattern)) {
      try {
        const text = await response.text();
        apiData = JSON.parse(text);
      } catch (e) {
        // Ignore parse errors
      }
    }
  };

  page.on('response', responseHandler);
  console.error(`  Loading calendar...`);

  try {
    await page.goto(calendarUrl, {
      waitUntil: 'networkidle0',
      timeout: CONFIG.timeout,
    });

    await new Promise(r => setTimeout(r, 3000));

    if (apiData && apiData.body?.center_events) {
      for (const center of apiData.body.center_events) {
        const facilityInfo = CONFIG.vancouver.facilities[center.center_id] || findFacilityByName(center.center_name);

        if (!facilityInfo) {
          console.error(`    Unknown: ${center.center_name} (ID: ${center.center_id})`);
          continue;
        }

        let addedCount = 0;
        for (const event of center.events || []) {
          if (event.event_item_id && seenEventIds.has(event.event_item_id)) {
            continue;
          }
          if (event.event_item_id) {
            seenEventIds.add(event.event_item_id);
          }

          const session = parseVancouverEvent(event, facilityInfo);
          if (session) {
            allSessions.push(session);
            addedCount++;
          }
        }

        console.error(`    ${facilityInfo.name}: ${addedCount} sessions`);
      }
    }
  } catch (e) {
    console.error(`  Error: ${e.message}`);
  }

  page.off('response', responseHandler);

  console.error(`  Vancouver total: ${allSessions.length} sessions`);
  return allSessions;
}

/**
 * Find facility by name matching
 */
function findFacilityByName(name) {
  if (!name) return null;
  const nameLower = name.toLowerCase().replace(/[*]/g, '').trim();

  for (const [alias, centerId] of Object.entries(CONFIG.vancouver.facilityAliases)) {
    if (nameLower.includes(alias)) {
      return CONFIG.vancouver.facilities[centerId];
    }
  }
  return null;
}

/**
 * Parse a Vancouver API event into a session
 */
function parseVancouverEvent(event, facilityInfo) {
  if (!event.start_time || !event.end_time) return null;

  // Parse datetime (format: "2026-01-12 11:15:00")
  const [startDate, startTime] = event.start_time.split(' ');
  const [endDate, endTime] = event.end_time.split(' ');

  // Clean up title (remove | characters)
  const title = (event.title || '').replace(/\|/g, '').trim();

  // Extract age info from description
  let ageRange = '';
  const descText = (event.description || '').replace(/<[^>]+>/g, ' ');
  const ageMatch = descText.match(/(\d+[-–]\d+\s*(?:yrs?|years?))/i);
  if (ageMatch) {
    ageRange = ageMatch[1];
  }

  return {
    facility: facilityInfo.name,
    city: 'Vancouver',
    address: facilityInfo.address,
    lat: facilityInfo.lat,
    lng: facilityInfo.lng,
    date: startDate,
    startTime: startTime.substring(0, 5), // "HH:MM"
    endTime: endTime.substring(0, 5),
    type: determineActivityType(title),
    activityName: title,
    description: descText.substring(0, 200).trim(),
    ageRange,
    activityUrl: event.activity_detail_url || '',
    eventItemId: event.event_item_id,
  };
}

/**
 * Determine activity type from name
 */
function determineActivityType(name) {
  const n = (name || '').toLowerCase();

  if (n.includes('family') && n.includes('hockey')) return 'Family Hockey';
  if (n.includes('shinny') || (n.includes('drop') && n.includes('hockey'))) return 'Drop-in Hockey';
  if (n.includes('stick') && n.includes('puck')) return 'Drop-in Hockey';
  if (n.includes('para') && n.includes('hockey')) return 'Para Hockey';
  if (n.includes('hockey')) return 'Hockey';
  if (n.includes('parent') && (n.includes('tot') || n.includes('preschool'))) return 'Family Skate';
  if ((n.includes('family') || n.includes('tot')) && n.includes('skat')) return 'Family Skate';
  if (n.includes('figure')) return 'Figure Skating';
  if (n.includes('public') || n.includes('drop-in') || n.includes('drop in') ||
      n.includes('toonie') || n.includes('discount') || n.includes('loonie')) return 'Public Skating';
  if (n.includes('adult') && n.includes('skat')) return 'Public Skating';
  if (n.includes('lesson') || n.includes('learn') || n.includes('class') ||
      n.includes('canskate') || n.includes('intro')) return 'Skating Lessons';
  if (n.includes('practice') || n.includes('freestyle')) return 'Practice';

  return 'Skating';
}

/**
 * Get Burnaby schedules from hardcoded weekly patterns
 * Based on "Effective January 5-March 12/13" schedules from burnaby.ca
 */
function getBurnabySchedules() {
  console.error('Adding Burnaby schedules...');
  const allSessions = [];

  // Burnaby facilities
  const facilities = {
    'kensington': {
      name: 'Kensington Complex',
      address: '6159 Curtis St, Burnaby',
      lat: 49.2569, lng: -123.0340,
      url: 'https://www.burnaby.ca/recreation-and-arts/activities-and-registration/daily-activities?location_ref=2986',
    },
    'rosemary-brown': {
      name: 'Rosemary Brown Recreation Centre',
      address: '5930 Humphries Ave, Burnaby',
      lat: 49.2258, lng: -122.9892,
      url: 'https://www.burnaby.ca/recreation-and-arts/activities-and-registration/daily-activities?location_ref=2991',
    },
  };

  // Weekly schedules from burnaby.ca screenshots
  // Format: { day: [{ name, start, end, age }] }
  const kensingtonSchedule = {
    1: [ // Monday
      { name: 'Lap Skate', start: '09:30', end: '11:30', age: '8 yrs+' },
      { name: 'Toonie Skate', start: '11:45', end: '13:15', age: 'All ages' },
      { name: 'Family Skate', start: '18:00', end: '20:15', age: 'Children with adult 16 yrs+' },
    ],
    4: [ // Thursday
      { name: 'Lap Skate', start: '09:00', end: '10:00', age: '8 yrs+' },
      { name: 'Shoot & Score', start: '10:15', end: '11:30', age: '18 yrs+' },
      { name: 'Toonie Skate', start: '11:45', end: '13:15', age: 'All ages' },
      { name: 'Parent & Tot Skate', start: '13:30', end: '15:15', age: '2-5 yrs with adult' },
    ],
    5: [ // Friday
      { name: 'Public Skate', start: '17:15', end: '19:30', age: 'All ages' },
      { name: 'Family Hockey & Ringette', start: '19:45', end: '20:45', age: '6-12 yrs with adult' },
    ],
  };

  const rosemaryBrownSchedule = {
    1: [ // Monday
      { name: 'Recreational Hockey', start: '10:00', end: '11:15', age: '50 yrs+, Rink B' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink B' },
      { name: 'Parent & Tot Skate', start: '13:15', end: '15:15', age: '2-5 yrs with adult, Rink A' },
      { name: 'Lap Skate', start: '19:30', end: '20:45', age: '8 yrs+, Rink A' },
    ],
    2: [ // Tuesday
      { name: 'Lap Skate', start: '10:15', end: '11:30', age: '8 yrs+, Rink A' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink B' },
      { name: 'Toonie Skate', start: '11:45', end: '13:00', age: 'All ages, Rink A' },
      { name: 'Parent & Tot Skate', start: '13:15', end: '15:15', age: '2-5 yrs with adult, Rink A' },
      { name: 'Public Skate', start: '18:00', end: '20:15', age: 'All ages, Rink A' },
    ],
    3: [ // Wednesday
      { name: 'Recreational Hockey', start: '10:00', end: '11:15', age: '50 yrs+, Rink B' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink B' },
      { name: 'Figure Skating', start: '12:15', end: '13:30', age: '16 yrs+, Rink A' },
    ],
    4: [ // Thursday
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink B' },
      { name: 'Toonie Skate', start: '11:45', end: '13:00', age: 'All ages, Rink A' },
      { name: 'Toonie Skate & Activities', start: '15:15', end: '16:45', age: '8-17 yrs, Rink A' },
      { name: 'Family Skate', start: '17:00', end: '19:15', age: 'Children with adults, 16 yrs+, Rink A' },
      { name: 'Lap Skate', start: '19:30', end: '20:45', age: '8 yrs+, Rink A' },
    ],
    5: [ // Friday
      { name: 'Recreational Ringette', start: '10:00', end: '11:15', age: '18 yrs+, Rink A' },
      { name: 'Recreational Hockey', start: '11:30', end: '12:45', age: '18 yrs+, Rink A' },
    ],
    6: [ // Saturday
      { name: 'Public Skate', start: '17:00', end: '19:15', age: 'All ages, Rink A' },
      { name: 'Toonie Skate & Activities', start: '19:30', end: '21:00', age: '13-17 yrs, Rink A' },
    ],
    0: [ // Sunday
      { name: 'Public Skate', start: '13:45', end: '17:00', age: 'All ages, Rink A' },
    ],
  };

  const schedules = [
    { facility: facilities['kensington'], schedule: kensingtonSchedule },
    { facility: facilities['rosemary-brown'], schedule: rosemaryBrownSchedule },
  ];

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);

  for (const { facility, schedule } of schedules) {
    let count = 0;
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayActivities = schedule[d.getDay()];
      if (!dayActivities) continue;

      for (const activity of dayActivities) {
        allSessions.push({
          facility: facility.name,
          city: 'Burnaby',
          address: facility.address,
          lat: facility.lat,
          lng: facility.lng,
          date: formatDate(d),
          startTime: activity.start,
          endTime: activity.end,
          type: determineActivityType(activity.name),
          activityName: activity.name,
          ageRange: activity.age,
          activityUrl: facility.url,
        });
        count++;
      }
    }
    console.error(`  ${facility.name}: ${count} sessions`);
  }

  console.error(`  Burnaby total: ${allSessions.length} sessions`);
  return allSessions;
}

/**
 * Scrape North Vancouver drop-in skating schedules from nvrc.ca
 * Intercepts the FullCalendar API endpoint for reliable headless scraping
 */
async function scrapeNorthVan(browser) {
  console.error('Scraping North Vancouver (NVRC)...');
  const allSessions = [];
  const seenKeys = new Set();

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto(CONFIG.northvan.dropInUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000)); // Wait for calendar to fully load

    const pageTitle = await page.title();
    console.error(`    Page loaded: ${pageTitle}`);

    // Get events from Drupal settings - events are embedded in page's JavaScript
    // Note: calendar_options is a JSON STRING that needs to be parsed
    const calendarEvents = await page.evaluate(() => {
      const events = [];

      // Method 1: Check drupalSettings.fullCalendarView (NVRC's format)
      if (window.drupalSettings && window.drupalSettings.fullCalendarView) {
        for (const viewKey in window.drupalSettings.fullCalendarView) {
          const view = window.drupalSettings.fullCalendarView[viewKey];
          if (view.calendar_options) {
            // calendar_options is a JSON string - parse it
            let opts = view.calendar_options;
            if (typeof opts === 'string') {
              try {
                opts = JSON.parse(opts);
              } catch (e) {
                continue;
              }
            }
            if (opts.events && Array.isArray(opts.events)) {
              events.push(...opts.events);
            }
          }
        }
      }

      // Method 2: Check drupalSettings.fullcalendar (alternate format)
      if (events.length === 0 && window.drupalSettings && window.drupalSettings.fullcalendar) {
        for (const key in window.drupalSettings.fullcalendar) {
          const fc = window.drupalSettings.fullcalendar[key];
          if (fc.events) {
            events.push(...fc.events);
          }
        }
      }

      return events;
    });

    console.error(`    Found ${calendarEvents.length} events from page context`);

    // Parse events from drupalSettings
    for (const event of calendarEvents) {
      const parsed = parseNorthVanEvent(event);
      if (parsed) {
        const eventKey = `${parsed.facility}-${parsed.date}-${parsed.startTime}`;
        if (!seenKeys.has(eventKey)) {
          seenKeys.add(eventKey);
          allSessions.push(parsed);
        }
      }
    }

    console.error(`  North Vancouver: ${allSessions.length} sessions`);

  } catch (e) {
    console.error(`  Error scraping North Vancouver: ${e.message}`);
  } finally {
    await page.close();
  }

  return allSessions;
}

/**
 * Parse North Vancouver event from calendar context
 * NVRC events have HTML in the title field like:
 * <div class="event-title"><strong>Adult 19yr+ Skate</strong></div>
 * <div class="event-location">Karen Magnussen Community Recreation Centre</div>
 * <div class="event-facility">Arena</div>
 */
function parseNorthVanEvent(event) {
  let date, startTime, endTime, activityName, location;

  // Handle different event formats
  if (event.start) {
    // Standard FullCalendar format with ISO dates
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : startDate;
    date = formatDate(startDate);
    startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    // Parse HTML title - extract activity name and location
    const titleHtml = event.title || '';

    // Extract activity name from <strong> or event-title div
    const titleMatch = titleHtml.match(/<strong>([^<]+)<\/strong>/i) ||
                       titleHtml.match(/class="event-title"[^>]*>([^<]+)/i);
    activityName = titleMatch ? titleMatch[1].trim() : titleHtml.replace(/<[^>]+>/g, ' ').trim();

    // Extract location from event-location div
    const locMatch = titleHtml.match(/class="event-location"[^>]*>([^<]+)/i);
    location = locMatch ? locMatch[1].trim() : '';
  } else if (event.rawText) {
    // DOM-scraped format
    return parseNorthVanEventFromDOM(event);
  } else {
    return null;
  }

  // Match facility from location
  let facility = null;
  const searchText = (location || activityName || '').toLowerCase();
  for (const [facKey, fac] of Object.entries(CONFIG.northvan.facilities)) {
    if (searchText.includes(facKey)) {
      facility = fac;
      break;
    }
  }
  if (!facility) facility = CONFIG.northvan.facilities['karen magnussen'];

  // Determine activity type
  const actName = (activityName || '').toLowerCase();
  let type = 'Public Skating';
  if (actName.includes('family') || actName.includes('early years')) type = 'Family Skate';
  else if (actName.includes('stick') || actName.includes('hockey')) type = 'Family Hockey';
  else if (actName.includes('adult')) type = 'Public Skating';

  return {
    facility: facility.name,
    city: 'North Vancouver',
    address: facility.address,
    lat: facility.lat,
    lng: facility.lng,
    date,
    startTime,
    endTime,
    type,
    activityName: activityName.trim(),
    activityUrl: event.url ? `https://www.nvrc.ca${event.url}` : CONFIG.northvan.dropInUrl,
  };
}

/**
 * Parse North Vancouver event from DOM-scraped data
 */
function parseNorthVanEventFromDOM(event) {
  const { date, rawText, startTime, startPeriod, endTime, endPeriod } = event;
  if (!date || !startTime || !endTime) return null;

  // Convert to 24-hour format
  const convertTo24 = (time, period) => {
    let [h, m] = time.split(':').map(Number);
    if (period.toLowerCase() === 'pm' && h < 12) h += 12;
    if (period.toLowerCase() === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const start24 = convertTo24(startTime, startPeriod);
  const end24 = convertTo24(endTime, endPeriod);

  // Extract activity name (text after the time range)
  let activityName = rawText.replace(/\d{1,2}:\d{2}\s*(am|pm)\s*[-–]\s*\d{1,2}:\d{2}\s*(am|pm)/i, '').trim();

  // Match facility from text
  let facility = null;
  const textLower = rawText.toLowerCase();
  for (const [facKey, fac] of Object.entries(CONFIG.northvan.facilities)) {
    if (textLower.includes(facKey)) {
      facility = fac;
      // Remove facility name from activity name
      activityName = activityName.replace(new RegExp(facKey, 'gi'), '').trim();
      activityName = activityName.replace(/Community Recreation Centre|Community Centre|Arena/gi, '').trim();
      break;
    }
  }
  if (!facility) facility = CONFIG.northvan.facilities['karen magnussen'];

  // Determine activity type
  const actName = activityName.toLowerCase();
  let type = 'Public Skating';
  if (actName.includes('family') || actName.includes('early years')) type = 'Family Skate';
  else if (actName.includes('stick') || actName.includes('hockey')) type = 'Family Hockey';

  return {
    facility: facility.name,
    city: 'North Vancouver',
    address: facility.address,
    lat: facility.lat,
    lng: facility.lng,
    date,
    startTime: start24,
    endTime: end24,
    type,
    activityName: activityName.trim(),
    activityUrl: CONFIG.northvan.dropInUrl,
  };
}

/**
 * Scrape West Vancouver drop-in skating schedules from westvancouver.ca
 */
async function scrapeWestVan(browser) {
  console.error('Scraping West Vancouver...');
  const allSessions = [];
  const seenKeys = new Set();

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    await page.goto(CONFIG.westvan.dropInUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    const pageTitle = await page.title();
    console.error(`    Page loaded: ${pageTitle}`);

    // Extract all activities from .dropins-activity elements
    const activities = await page.evaluate(() => {
      const events = [];

      // Find all activity elements
      const activityEls = document.querySelectorAll('.dropins-activity');

      activityEls.forEach(actEl => {
        const dateStr = actEl.getAttribute('data-startdate');
        if (!dateStr) return;

        // Get activity name from parent category
        const categoryEl = actEl.closest('.dropins-category');
        const categoryTitle = categoryEl?.querySelector('.dropins-category-title')?.innerText.trim();

        // Get activity group name
        const groupEl = actEl.closest('.dropins-activity-group');
        const groupTitle = groupEl?.querySelector('.dropins-activity-group-title')?.innerText.trim();

        const activityName = groupTitle || categoryTitle || 'Skating';

        // Get time from activity-location-time
        const locationTimeEl = actEl.querySelector('.activity-location-time');
        const timeRangeEl = actEl.querySelector('.activity-days-time-range');

        let location = 'Ice Arena';
        let startTime = '';
        let endTime = '';

        if (locationTimeEl) {
          const locationEl = locationTimeEl.querySelector('.activity-location');
          if (locationEl) {
            location = locationEl.innerText.trim();
          }
        }

        if (timeRangeEl) {
          const timeText = timeRangeEl.innerText.trim();
          // Parse "Sun, 12:45 PM-2:00 PM"
          const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            const [, startH, startP, endH, endP] = timeMatch;
            // Convert to 24-hour format
            const to24 = (time, period) => {
              let [h, m] = time.split(':').map(Number);
              if (period.toUpperCase() === 'PM' && h < 12) h += 12;
              if (period.toUpperCase() === 'AM' && h === 12) h = 0;
              return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            };
            startTime = to24(startH, startP);
            endTime = to24(endH, endP);
          }
        }

        // Get registration URL
        const registerLink = actEl.querySelector('a.activity-register');
        const activityUrl = registerLink ? registerLink.href : '';

        if (startTime && endTime) {
          events.push({
            date: dateStr,
            activityName,
            location,
            startTime,
            endTime,
            activityUrl
          });
        }
      });

      return events;
    });

    console.error(`    Found ${activities.length} activities`);

    // Convert to session format
    const facility = CONFIG.westvan.facility;
    for (const activity of activities) {
      const eventKey = `${activity.date}-${activity.startTime}-${activity.activityName}`;
      if (seenKeys.has(eventKey)) continue;
      seenKeys.add(eventKey);

      // Determine activity type
      const actName = activity.activityName.toLowerCase();
      let type = 'Public Skating';
      if (actName.includes('family')) type = 'Family Skate';
      else if (actName.includes('hockey') || actName.includes('stick') || actName.includes('puck')) type = 'Drop-in Hockey';
      else if (actName.includes('adult') && actName.includes('skate')) type = 'Public Skating';
      else if (actName.includes('figure') || actName.includes('dance')) type = 'Public Skating';
      else if (actName.includes('toonie')) type = 'Discount Skate';

      allSessions.push({
        facility: facility.name,
        city: 'West Vancouver',
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        date: activity.date,
        startTime: activity.startTime,
        endTime: activity.endTime,
        type,
        activityName: activity.activityName,
        activityUrl: activity.activityUrl || CONFIG.westvan.dropInUrl,
      });
    }

    console.error(`  West Vancouver: ${allSessions.length} sessions`);

  } catch (e) {
    console.error(`  Error scraping West Vancouver: ${e.message}`);
  } finally {
    await page.close();
  }

  return allSessions;
}

/**
 * Scrape New Westminster drop-in skating and hockey schedules from PerfectMind
 */
async function scrapeNewWest(browser) {
  console.error('Scraping New Westminster...');
  const allSessions = [];
  const seenKeys = new Set();

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Scrape both skating and hockey pages
  const urls = [
    { url: CONFIG.newwest.skatingUrl, label: 'Skating' },
    { url: CONFIG.newwest.hockeyUrl, label: 'Hockey' },
  ];

  try {
    for (const { url, label } of urls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await new Promise(r => setTimeout(r, 10000)); // Wait for dynamic content

        const pageTitle = await page.title();
        console.error(`    ${label} page loaded: ${pageTitle}`);

        // Parse sessions from page text - PerfectMind renders events as text blocks
        const sessions = await page.evaluate(() => {
          const events = [];
          const text = document.body.innerText;
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);

          let currentDate = null;
          const currentYear = new Date().getFullYear();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for date header like "Mon, Jan 12th, 2026"
            const dateMatch = line.match(/^\w+,\s+(\w+)\s+(\d+)\w*,?\s*(\d{4})?$/);
            if (dateMatch) {
              const [, monthStr, day, year] = dateMatch;
              const monthIdx = months.indexOf(monthStr);
              if (monthIdx !== -1) {
                const y = year ? parseInt(year) : currentYear;
                currentDate = `${y}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              }
              continue;
            }

            // Check for activity name (contains # followed by number)
            const activityMatch = line.match(/^(.+?)\s+#(\d+)$/);
            if (activityMatch && currentDate) {
              const activityName = activityMatch[1].trim();

              // Next line should be time
              const timeLine = lines[i + 1] || '';
              const timeMatch = timeLine.match(/^(\d{1,2}:\d{2}\s*(?:am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:am|pm))$/i);

              // Line after that should be location
              const locationLine = lines[i + 2] || '';

              if (timeMatch) {
                const [, startTimeStr, endTimeStr] = timeMatch;

                // Convert to 24h format
                const to24 = (timeStr) => {
                  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
                  if (!match) return null;
                  let [, h, m, period] = match;
                  h = parseInt(h);
                  if (period.toLowerCase() === 'pm' && h < 12) h += 12;
                  if (period.toLowerCase() === 'am' && h === 12) h = 0;
                  return `${String(h).padStart(2, '0')}:${m}`;
                };

                const startTime = to24(startTimeStr);
                const endTime = to24(endTimeStr);

                if (startTime && endTime) {
                  events.push({
                    date: currentDate,
                    activityName,
                    startTime,
                    endTime,
                    location: locationLine
                  });
                }
              }
            }
          }

          return events;
        });

        console.error(`    Found ${sessions.length} ${label.toLowerCase()} activities`);

        // Convert to session format with facility matching
        for (const session of sessions) {
          const eventKey = `${session.date}-${session.startTime}-${session.activityName}`;
          if (seenKeys.has(eventKey)) continue;
          seenKeys.add(eventKey);

          // Match facility from location
          let facility = null;
          const locationLower = (session.location || '').toLowerCase();
          for (const [facKey, fac] of Object.entries(CONFIG.newwest.facilities)) {
            if (locationLower.includes(facKey)) {
              facility = fac;
              break;
            }
          }
          // Default to Queen's Park Arena if no match
          if (!facility) facility = CONFIG.newwest.facilities["queen's park arena"];

          // Determine activity type
          const actName = session.activityName.toLowerCase();
          let type = 'Public Skating';
          if (actName.includes('family')) type = 'Family Skate';
          else if (actName.includes('parent') && actName.includes('tot')) type = 'Family Skate';
          else if (actName.includes('figure')) type = 'Figure Skating';
          else if (actName.includes('hockey') || actName.includes('stick') || actName.includes('puck') || actName.includes('shinny')) type = 'Drop-in Hockey';
          else if (actName.includes('adult') || actName.includes('50+')) type = 'Public Skating';

          allSessions.push({
            facility: facility.name,
            city: 'New Westminster',
            address: facility.address,
            lat: facility.lat,
            lng: facility.lng,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            type,
            activityName: session.activityName,
            activityUrl: url,
          });
        }

      } catch (e) {
        console.error(`    Error scraping ${label}: ${e.message}`);
      }
    }

    console.error(`  New Westminster total: ${allSessions.length} sessions`);

  } finally {
    await page.close();
  }

  return allSessions;
}

/**
 * Get outdoor rink schedules (Robson Square, Shipyards)
 * These have fixed seasonal hours
 */
function getOutdoorRinks() {
  console.error('Adding outdoor rinks...');
  const allSessions = [];

  // Outdoor rink configs with seasonal dates and hours
  // Start from yesterday to account for timezone differences (scraper runs in UTC)
  const today = new Date();
  today.setDate(today.getDate() - 1); // Go back 1 day for Pacific timezone coverage
  const currentMonth = today.getMonth(); // 0-11
  // If we're in Jan-Feb, season started last year; if Nov-Dec, season starts this year
  const seasonYear = currentMonth <= 2 ? today.getFullYear() - 1 : today.getFullYear();

  const outdoorRinks = [
    {
      name: 'Robson Square Ice Rink',
      city: 'Vancouver',
      address: '800 Robson St, Vancouver',
      lat: 49.2827,
      lng: -123.1207,
      url: 'https://www.robsonsquare.com/',
      // Season: Nov 28 - Feb 28
      seasonStart: new Date(seasonYear, 10, 28), // Nov 28
      seasonEnd: new Date(seasonYear + 1, 1, 28), // Feb 28
      // Hours: Daily 12pm-9pm
      hours: { start: '12:00', end: '21:00' },
      days: [0, 1, 2, 3, 4, 5, 6],
      type: 'Public Skating',
      note: 'Free outdoor rink',
    },
    {
      name: 'Shipyards Skate Plaza',
      city: 'North Vancouver',
      address: '125 Victory Ship Way, North Vancouver',
      lat: 49.3103,
      lng: -123.0826,
      url: 'https://www.cnv.org/parks-recreation/the-shipyards/skate-plaza',
      // Season: Nov 15 - March 29
      seasonStart: new Date(seasonYear, 10, 15), // Nov 15
      seasonEnd: new Date(seasonYear + 1, 2, 29), // March 29
      // Hours: Daily 12pm-8pm
      hours: { start: '12:00', end: '20:00' },
      days: [0, 1, 2, 3, 4, 5, 6],
      type: 'Public Skating',
      note: 'Free outdoor rink. Ice cleaning at 1:30pm, 3:30pm, 5:30pm (~30min)',
    },
  ];

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);

  for (const rink of outdoorRinks) {
    // Determine effective date range (within season and within 30 days)
    const startDate = rink.seasonStart > today ? rink.seasonStart : today;
    const endDate = rink.seasonEnd < maxDate ? rink.seasonEnd : maxDate;

    // Skip if outside season
    if (startDate > endDate) {
      console.error(`    ${rink.name}: outside season`);
      continue;
    }

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (!rink.days.includes(d.getDay())) continue;

      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const hours = rink.weekendHours && isWeekend ? rink.weekendHours : (rink.weekdayHours || rink.hours);

      allSessions.push({
        facility: rink.name,
        city: rink.city,
        address: rink.address,
        lat: rink.lat,
        lng: rink.lng,
        date: formatDate(d),
        startTime: hours.start,
        endTime: hours.end,
        type: rink.type,
        activityName: `Free Public Skating`,
        description: rink.note,
        activityUrl: rink.url,
      });
    }
  }

  console.error(`  Outdoor rinks: ${allSessions.length} sessions`);
  return allSessions;
}

/**
 * Expand dates from card info (handles recurring patterns)
 */
function expandDates(card) {
  const dates = [];

  // If we have a date range and day patterns, expand
  if (card.dateRangeText && card.dayPatterns.length > 0) {
    // Try full date format first (with year)
    let rangeDates = card.dateRangeText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}/gi);

    // If no year in dates, try "Effective January 5-March 14" format
    if (!rangeDates || rangeDates.length < 2) {
      const effectiveMatch = card.dateRangeText.match(/Effective\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*[-–]\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i);
      if (effectiveMatch) {
        const currentYear = new Date().getFullYear();
        const startDateText = `${effectiveMatch[1]} ${effectiveMatch[2]}, ${currentYear}`;
        const endDateText = `${effectiveMatch[3]} ${effectiveMatch[4]}, ${currentYear}`;
        rangeDates = [startDateText, endDateText];
      }
    }

    // Also try simpler format without "Effective"
    if (!rangeDates || rangeDates.length < 2) {
      const simpleRangeMatch = card.dateRangeText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*[-–to]+\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i);
      if (simpleRangeMatch) {
        const currentYear = new Date().getFullYear();
        const startDateText = `${simpleRangeMatch[1]} ${simpleRangeMatch[2]}, ${currentYear}`;
        const endDateText = `${simpleRangeMatch[3]} ${simpleRangeMatch[4]}, ${currentYear}`;
        rangeDates = [startDateText, endDateText];
      }
    }

    if (rangeDates && rangeDates.length >= 2) {
      const startDate = parseDate(rangeDates[0]);
      const endDate = parseDate(rangeDates[1]);
      if (startDate && endDate) {
        const expanded = expandDateRange(startDate, endDate, card.dayPatterns);
        dates.push(...expanded);
        console.error(`    Expanded "${card.name}": ${rangeDates[0]} to ${rangeDates[1]} (${card.dayPatterns.join(', ')}) -> ${expanded.length} dates`);
      }
    }
  }

  // Fall back to individual dates
  if (dates.length === 0) {
    for (const dateText of card.dateTexts) {
      const date = parseDate(dateText);
      if (date) dates.push(date);
    }
  }

  return dates;
}

/**
 * Expand date range based on day patterns
 */
function expandDateRange(startDateStr, endDateStr, dayPatterns) {
  const dates = [];
  const dayMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6,
    'sundays': 0, 'mondays': 1, 'tuesdays': 2, 'wednesdays': 3,
    'thursdays': 4, 'fridays': 5, 'saturdays': 6,
  };

  const targetDays = dayPatterns.map(d => dayMap[d.toLowerCase()]).filter(d => d !== undefined);
  if (targetDays.length === 0) return [startDateStr];

  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  // Limit to 30 days from today
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);
  const actualEnd = end < maxDate ? end : maxDate;
  const actualStart = start > today ? start : today;

  for (let d = new Date(start); d <= actualEnd; d.setDate(d.getDate() + 1)) {
    if (targetDays.includes(d.getDay())) {
      dates.push(formatDate(d));
    }
  }

  return dates;
}

/**
 * Match Burnaby facility
 */
function matchBurnabyFacility(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const facility of CONFIG.burnaby.facilities) {
    if (t.includes(facility.name.toLowerCase())) return facility;
    for (const alias of (facility.aliases || [])) {
      if (t.includes(alias.toLowerCase())) return facility;
    }
  }
  return null;
}

/**
 * Parse date string to YYYY-MM-DD
 */
function parseDate(dateText) {
  if (!dateText) return null;
  const match = dateText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})?/i);
  if (!match) return null;

  const months = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };

  const month = months[match[1].toLowerCase()];
  const day = match[2].padStart(2, '0');
  const year = match[3] || new Date().getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Parse time range
 */
function parseTimeRange(timeText) {
  if (!timeText) return { startTime: null, endTime: null };
  const match = timeText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
  if (!match) return { startTime: null, endTime: null };
  return {
    startTime: parseTime(match[1]),
    endTime: parseTime(match[2]),
  };
}

/**
 * Parse time to 24h format
 */
function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = (match[3] || '').toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  else if (period === 'AM' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Generate iCal format
 */
function generateICal(sessions) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Metro Vancouver Skating Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Metro Vancouver Public Skating',
  ];

  for (const session of sessions) {
    const uid = `${session.facility.replace(/\s/g, '')}-${session.date}-${session.startTime}`.replace(/[^a-z0-9-]/gi, '-');
    const dtStart = session.date.replace(/-/g, '') + 'T' + session.startTime.replace(/:/g, '') + '00';
    const dtEnd = session.date.replace(/-/g, '') + 'T' + session.endTime.replace(/:/g, '') + '00';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}@metro-vancouver-skating`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;TZID=America/Vancouver:${dtStart}`);
    lines.push(`DTEND;TZID=America/Vancouver:${dtEnd}`);
    lines.push(`SUMMARY:${session.type} - ${session.facility}`);
    lines.push(`LOCATION:${session.address}`);
    lines.push(`DESCRIPTION:${session.activityName}\\n${session.facility}\\n${session.city}`);
    lines.push(`GEO:${session.lat};${session.lng}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Main scraping function
 * @param {Object} options - { debug, cities: ['vancouver', 'burnaby', 'northvan', 'westvan', 'newwest', 'outdoor'] }
 */
async function scrapeAll(options = {}) {
  const { debug = false, cities = ['vancouver', 'burnaby', 'northvan', 'westvan', 'newwest', 'outdoor'] } = options;

  let browser;
  const allSessions = [];
  const seenKeys = new Set();

  try {
    const { browser: b, page } = await createBrowser(debug);
    browser = b;

    // Scrape Vancouver via API
    if (cities.includes('vancouver')) {
      const vancouverSessions = await scrapeVancouver(page);
      for (const session of vancouverSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Add Burnaby schedules (hardcoded weekly pattern)
    if (cities.includes('burnaby')) {
      const burnabySessions = getBurnabySchedules();
      for (const session of burnabySessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Scrape North Vancouver
    if (cities.includes('northvan')) {
      const northvanSessions = await scrapeNorthVan(browser);
      for (const session of northvanSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Scrape West Vancouver
    if (cities.includes('westvan')) {
      const westvanSessions = await scrapeWestVan(browser);
      for (const session of westvanSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Scrape New Westminster
    if (cities.includes('newwest')) {
      const newwestSessions = await scrapeNewWest(browser);
      for (const session of newwestSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Add outdoor rinks (Robson Square, Shipyards)
    if (cities.includes('outdoor')) {
      const outdoorSessions = getOutdoorRinks();
      for (const session of outdoorSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

  } finally {
    if (browser) await browser.close();
  }

  // Sort by date and time
  allSessions.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  return {
    success: true,
    lastUpdated: new Date().toISOString(),
    sessions: allSessions,
    count: allSessions.length,
  };
}

/**
 * Write sessions to daily JSON files organized as schedules/YYYY/MM/DD.json
 */
function writeDailyFiles(result, outputDir) {
  // Group sessions by date
  const sessionsByDate = {};
  for (const session of result.sessions) {
    if (!sessionsByDate[session.date]) {
      sessionsByDate[session.date] = [];
    }
    sessionsByDate[session.date].push(session);
  }

  // Write each day's file
  const dates = Object.keys(sessionsByDate).sort();
  for (const dateStr of dates) {
    const [year, month, day] = dateStr.split('-');
    const dirPath = path.join(outputDir, year, month);
    fs.mkdirSync(dirPath, { recursive: true });

    const filePath = path.join(dirPath, `${day}.json`);
    const dayData = {
      date: dateStr,
      sessions: sessionsByDate[dateStr],
      count: sessionsByDate[dateStr].length,
    };
    fs.writeFileSync(filePath, JSON.stringify(dayData, null, 2));
  }

  // Write index file with metadata
  const indexData = {
    success: true,
    lastUpdated: result.lastUpdated,
    totalSessions: result.count,
    dateRange: {
      start: dates[0],
      end: dates[dates.length - 1],
    },
    dates: dates,
  };
  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(indexData, null, 2));

  // Print summary
  console.error(`\n  Schedule Summary:`);
  console.error(`  ─────────────────────────────────────────`);
  console.error(`  Total files: ${dates.length}`);
  console.error(`  Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.error(`  Total sessions: ${result.count}`);
  console.error(`\n  Sessions per day:`);
  for (const dateStr of dates) {
    const count = sessionsByDate[dateStr].length;
    const bar = '█'.repeat(Math.min(count, 30));
    console.error(`    ${dateStr}: ${String(count).padStart(3)} ${bar}`);
  }
  console.error(`  ─────────────────────────────────────────`);

  return dates.length;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const debug = args.includes('--debug');
  const ical = args.includes('--ical');
  const daily = args.includes('--daily');
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

  // Parse city filters: --city vancouver --city burnaby OR --city vancouver,burnaby
  const cityArgs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--city' && args[i + 1]) {
      cityArgs.push(...args[i + 1].split(','));
      i++;
    }
  }
  const cities = cityArgs.length > 0 ? cityArgs : ['vancouver', 'burnaby', 'northvan', 'westvan', 'newwest', 'outdoor'];

  console.error('Metro Vancouver Skating Schedule Scraper');
  console.error('========================================');
  console.error(`Date: ${new Date().toISOString()}`);
  console.error(`Mode: ${debug ? 'Debug' : 'Headless'}`);
  console.error(`Cities: ${cities.join(', ')}`);
  console.error(`Output: ${daily ? 'Daily files' : 'Single file'}`);
  console.error('');

  try {
    const result = await scrapeAll({ debug, cities });

    if (daily && outputPath) {
      // Write daily files to directory structure
      fs.mkdirSync(outputPath, { recursive: true });
      writeDailyFiles(result, outputPath);
    } else {
      const output = ical ? generateICal(result.sessions) : JSON.stringify(result, null, 2);
      if (outputPath) {
        fs.writeFileSync(outputPath, output);
        console.error(`Output written to: ${outputPath}`);
      } else {
        console.log(output);
      }
    }

    console.error(`\nScraping complete. Found ${result.count} sessions.`);

  } catch (e) {
    console.error('Scraping failed:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

module.exports = { scrapeAll, generateICal, CONFIG };

if (require.main === module) {
  main();
}
