/**
 * North Vancouver skating schedule scraper
 * Uses nvrc.ca drop-in schedules with Drupal FullCalendar parsing
 */

const { CONFIG } = require('../config');
const { formatDate } = require('../utils');

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
    scheduleUrl: facility.scheduleUrl || '',
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
    scheduleUrl: facility.scheduleUrl || '',
  };
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

module.exports = {
  scrapeNorthVan,
  parseNorthVanEvent,
  parseNorthVanEventFromDOM,
};
