/**
 * Vancouver swimming schedule scraper
 * Uses ActiveNet calendar API interception (calendar ID 55)
 */

const { CONFIG } = require('../config');
const { determineSwimmingActivityType } = require('../utils');

/**
 * Find swimming facility by name matching
 */
function findSwimmingFacilityByName(name) {
  if (!name) return null;
  const nameLower = name.toLowerCase().replace(/[*]/g, '').trim();

  for (const [alias, centerId] of Object.entries(CONFIG.vancouverSwimming.facilityAliases)) {
    if (nameLower.includes(alias)) {
      return CONFIG.vancouverSwimming.facilities[centerId];
    }
  }
  return null;
}

/**
 * Parse a Vancouver swimming API event into a session
 */
function parseVancouverSwimmingEvent(event, facilityInfo) {
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
    type: determineSwimmingActivityType(title),
    activityName: title,
    description: descText.substring(0, 200).trim(),
    ageRange,
    activityUrl: event.activity_detail_url || '',
    eventItemId: event.event_item_id,
  };
}

/**
 * Scrape Vancouver swimming by intercepting the calendar API
 * Uses calendar ID 55 (vs 3 for skating)
 */
async function scrapeVancouverSwimming(page) {
  console.error('Scraping Vancouver Swimming (API intercept)...');

  const allSessions = [];
  const seenEventIds = new Set();

  const calendarUrl = CONFIG.vancouverSwimming.calendarUrl;

  let apiData = null;

  const responseHandler = async (response) => {
    const url = response.url();
    if (url.includes(CONFIG.vancouverSwimming.apiPattern)) {
      try {
        const text = await response.text();
        apiData = JSON.parse(text);
      } catch (e) {
        // Ignore parse errors
      }
    }
  };

  page.on('response', responseHandler);
  console.error(`  Loading swimming calendar...`);

  try {
    await page.goto(calendarUrl, {
      waitUntil: 'networkidle0',
      timeout: CONFIG.timeout,
    });

    await new Promise(r => setTimeout(r, 3000));

    if (apiData && apiData.body?.center_events) {
      for (const center of apiData.body.center_events) {
        const facilityInfo = CONFIG.vancouverSwimming.facilities[center.center_id] || findSwimmingFacilityByName(center.center_name);

        if (!facilityInfo) {
          console.error(`    Unknown pool: ${center.center_name} (ID: ${center.center_id})`);
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

          const session = parseVancouverSwimmingEvent(event, facilityInfo);
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

  console.error(`  Vancouver Swimming total: ${allSessions.length} sessions`);
  return allSessions;
}

module.exports = {
  scrapeVancouverSwimming,
  parseVancouverSwimmingEvent,
  findSwimmingFacilityByName,
};
