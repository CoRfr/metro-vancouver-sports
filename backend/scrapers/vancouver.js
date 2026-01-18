/**
 * Vancouver skating schedule scraper
 * Uses ActiveNet calendar API interception
 */

const { CONFIG } = require('../config');
const { determineActivityType } = require('../utils');

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
 * Generate ActiveNet calendar URL for a specific facility
 */
function getVancouverScheduleUrl(centerId, calendarId = 3) {
  return `https://anc.ca.apm.activecommunities.com/vancouver/calendars?onlineSiteId=0&no_scroll_top=true&defaultCalendarId=${calendarId}&locationId=${centerId}`;
}

/**
 * Parse a Vancouver API event into a session
 */
function parseVancouverEvent(event, facilityInfo, centerId) {
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

  // Generate dynamic schedule URL with specific locationId
  const scheduleUrl = centerId ? getVancouverScheduleUrl(centerId) : (facilityInfo.scheduleUrl || '');

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
    scheduleUrl,
  };
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

          const session = parseVancouverEvent(event, facilityInfo, center.center_id);
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

module.exports = {
  scrapeVancouver,
  parseVancouverEvent,
  findFacilityByName,
  getVancouverScheduleUrl,
};
