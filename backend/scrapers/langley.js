/**
 * Township of Langley skating and swimming schedule scraper
 * Uses PerfectMind booking system (similar to New Westminster)
 */

const { CONFIG } = require('../config');
const { determineActivityType, determineSwimmingActivityType } = require('../utils');

/**
 * Find Langley facility by name matching
 */
function findLangleyFacility(locationText, sport = 'skating') {
  if (!locationText) return null;
  const locLower = locationText.toLowerCase();

  for (const [key, facility] of Object.entries(CONFIG.langley.facilities)) {
    if (locLower.includes(key) || locLower.includes(facility.name.toLowerCase())) {
      // Check if facility supports this sport
      if (sport === 'skating' && facility.hasSkating) return facility;
      if (sport === 'swimming' && facility.hasSwimming) return facility;
    }
  }
  return null;
}

/**
 * Parse PerfectMind page text for sessions
 * Handles two formats:
 * 1. Skating: "Activity Name #12345" followed by time and location
 * 2. Swimming: "Activity Name" followed by time and location (no # number)
 */
async function parsePerfectMindPage(page) {
  return await page.evaluate(() => {
    const events = [];
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let currentDate = null;
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Convert time string to 24h format
    const to24 = (timeStr) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
      if (!match) return null;
      let [, h, m, period] = match;
      h = parseInt(h);
      if (period.toLowerCase() === 'pm' && h < 12) h += 12;
      if (period.toLowerCase() === 'am' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for date header like "Mon, Jan 12th, 2026" or "Sun, Jan 18th, 2026"
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

      // Skip if no current date yet
      if (!currentDate) continue;

      // Check if next line is a time range (indicates current line is activity name)
      const nextLine = lines[i + 1] || '';
      const timeMatch = nextLine.match(/^(\d{1,2}:\d{2}\s*(?:am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:am|pm))$/i);

      if (timeMatch) {
        // Current line is activity name (may or may not have # number)
        let activityName = line;
        // Remove # number if present (skating format)
        const numberMatch = line.match(/^(.+?)\s+#\d+$/);
        if (numberMatch) {
          activityName = numberMatch[1].trim();
        }

        // Skip non-activity lines
        if (activityName.toLowerCase().includes('skip to') ||
            activityName.toLowerCase().includes('filter') ||
            activityName.toLowerCase().includes('login') ||
            activityName.toLowerCase().includes('more info') ||
            activityName.match(/^\d{3}-\d{3}-\d{4}$/)) {
          continue;
        }

        const [, startTimeStr, endTimeStr] = timeMatch;
        const startTime = to24(startTimeStr);
        const endTime = to24(endTimeStr);

        // Location is line after time
        const locationLine = lines[i + 2] || '';

        if (startTime && endTime && activityName) {
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

    return events;
  });
}

/**
 * Scrape Langley skating schedules from PerfectMind
 */
async function scrapeLangleySkating(browser) {
  console.error('Scraping Langley skating...');
  const allSessions = [];
  const seenKeys = new Set();

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    await page.goto(CONFIG.langley.skatingUrl, { waitUntil: 'networkidle0', timeout: 90000 });
    await new Promise(r => setTimeout(r, 5000)); // Wait for dynamic content

    const pageTitle = await page.title();
    console.error(`    Page loaded: ${pageTitle}`);

    const sessions = await parsePerfectMindPage(page);
    console.error(`    Found ${sessions.length} skating activities`);

    // Default facility for skating if no match
    const defaultFacility = CONFIG.langley.facilities['aldergrove'];

    for (const session of sessions) {
      const eventKey = `langley-skating-${session.date}-${session.startTime}-${session.activityName}`;
      if (seenKeys.has(eventKey)) continue;
      seenKeys.add(eventKey);

      // Match facility from location
      const facility = findLangleyFacility(session.location, 'skating') || defaultFacility;

      // Determine activity type
      const type = determineActivityType(session.activityName);

      allSessions.push({
        facility: facility.name,
        city: 'Langley',
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        type,
        activityName: session.activityName,
        activityUrl: CONFIG.langley.skatingUrl,
        facilityUrl: facility.scheduleUrl || '',
        scheduleUrl: facility.scheduleUrl || '',
      });
    }

    console.error(`  Langley skating total: ${allSessions.length} sessions`);

  } catch (e) {
    console.error(`    Error scraping Langley skating: ${e.message}`);
  } finally {
    await page.close();
  }

  return allSessions;
}

/**
 * Scrape Langley swimming schedules from PerfectMind
 */
async function scrapeLangleySwimming(browser) {
  console.error('Scraping Langley swimming...');
  const allSessions = [];
  const seenKeys = new Set();

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    await page.goto(CONFIG.langley.swimmingUrl, { waitUntil: 'networkidle0', timeout: 90000 });
    await new Promise(r => setTimeout(r, 5000)); // Wait for dynamic content

    const pageTitle = await page.title();
    console.error(`    Page loaded: ${pageTitle}`);

    const sessions = await parsePerfectMindPage(page);
    console.error(`    Found ${sessions.length} swimming activities`);

    // Default facility for swimming if no match
    const defaultFacility = CONFIG.langley.facilities['wc blair'];

    for (const session of sessions) {
      const eventKey = `langley-swimming-${session.date}-${session.startTime}-${session.activityName}`;
      if (seenKeys.has(eventKey)) continue;
      seenKeys.add(eventKey);

      // Match facility from location
      const facility = findLangleyFacility(session.location, 'swimming') || defaultFacility;

      // Determine activity type
      const type = determineSwimmingActivityType(session.activityName);

      allSessions.push({
        facility: facility.name,
        city: 'Langley',
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        type,
        activityName: session.activityName,
        activityUrl: CONFIG.langley.swimmingUrl,
        facilityUrl: facility.scheduleUrl || '',
        scheduleUrl: facility.scheduleUrl || '',
      });
    }

    console.error(`  Langley swimming total: ${allSessions.length} sessions`);

  } catch (e) {
    console.error(`    Error scraping Langley swimming: ${e.message}`);
  } finally {
    await page.close();
  }

  return allSessions;
}

module.exports = {
  scrapeLangleySkating,
  scrapeLangleySwimming,
  findLangleyFacility,
};
