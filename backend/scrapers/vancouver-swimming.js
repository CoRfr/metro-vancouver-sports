/**
 * Vancouver swimming schedule scraper
 * Uses ActiveNet calendar API interception (calendar ID 55)
 */

const { CONFIG } = require('../config');
const { determineSwimmingActivityType, shouldSkipSwimmingActivity } = require('../utils');

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
 * Generate ActiveNet calendar URL for a specific swimming facility
 */
function getSwimmingScheduleUrl(centerId) {
  return `https://anc.ca.apm.activecommunities.com/vancouver/calendars?onlineSiteId=0&no_scroll_top=true&defaultCalendarId=55&locationId=${centerId}`;
}

/**
 * Parse a Vancouver swimming API event into a session
 */
function parseVancouverSwimmingEvent(event, facilityInfo, centerId) {
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

  // Generate dynamic schedule URL with specific locationId and swimming calendar ID
  const scheduleUrl = centerId ? getSwimmingScheduleUrl(centerId) : '';
  // Facility URL is the city's facility info page (from config)
  const facilityUrl = facilityInfo.scheduleUrl || '';

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
    facilityUrl,
    scheduleUrl,
  };
}

/**
 * Check if a facility is closed by fetching its info page
 */
async function checkFacilityClosure(page, facility) {
  if (!facility.closureCheckUrl) return false;

  try {
    const response = await page.goto(facility.closureCheckUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    const content = await page.content();
    const lowerContent = content.toLowerCase();

    // Check for closure indicators
    const closurePatterns = [
      'closed until further notice',
      'pool closure',
      'temporarily closed',
      'is closed',
      'currently closed',
    ];

    for (const pattern of closurePatterns) {
      if (lowerContent.includes(pattern)) {
        return true;
      }
    }
  } catch (e) {
    console.error(`    Could not check closure for ${facility.name}: ${e.message}`);
  }

  return false;
}

/**
 * Scrape Vancouver swimming by intercepting the calendar API
 * Uses calendar ID 55 (vs 3 for skating)
 */
async function scrapeVancouverSwimming(page) {
  console.error('Scraping Vancouver Swimming (API intercept)...');

  const allSessions = [];
  const seenEventIds = new Set();
  const closedFacilities = new Set();

  // Check for facility closures first
  for (const [id, facility] of Object.entries(CONFIG.vancouverSwimming.facilities)) {
    if (facility.closureCheckUrl) {
      console.error(`  Checking closure status for ${facility.name}...`);
      const isClosed = await checkFacilityClosure(page, facility);
      if (isClosed) {
        console.error(`    ${facility.name}: CLOSED (from website)`);
        closedFacilities.add(parseInt(id));
      } else {
        console.error(`    ${facility.name}: Open`);
      }
    }
  }

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

        // Skip closed facilities (checked dynamically)
        if (closedFacilities.has(center.center_id)) {
          console.error(`    ${facilityInfo.name}: CLOSED - skipping`);
          continue;
        }

        let addedCount = 0;
        let skippedCount = 0;
        for (const event of center.events || []) {
          if (event.event_item_id && seenEventIds.has(event.event_item_id)) {
            continue;
          }
          if (event.event_item_id) {
            seenEventIds.add(event.event_item_id);
          }

          // Skip non-swimming activities (sauna/whirlpool only)
          const title = (event.title || '').replace(/\|/g, '').trim();
          if (shouldSkipSwimmingActivity(title)) {
            skippedCount++;
            continue;
          }

          const session = parseVancouverSwimmingEvent(event, facilityInfo, center.center_id);
          if (session) {
            allSessions.push(session);
            addedCount++;
          }
        }

        const skippedMsg = skippedCount > 0 ? ` (${skippedCount} skipped)` : '';
        console.error(`    ${facilityInfo.name}: ${addedCount} sessions${skippedMsg}`);
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
