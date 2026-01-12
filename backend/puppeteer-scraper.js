#!/usr/bin/env node
/**
 * Puppeteer-based scraper for Metro Vancouver skating schedules
 *
 * This scraper handles client-rendered ActiveNet sites by using a real browser
 * to execute JavaScript and extract the schedule data.
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
  // Browser settings
  chromiumPath: process.env.CHROMIUM_PATH || '/snap/bin/chromium',
  headless: true,
  timeout: 60000,

  // Facilities with their coordinates
  facilities: {
    vancouver: [
      { name: 'Britannia Community Centre', aliases: ['Britannia'], lat: 49.2754, lng: -123.0719, address: '1661 Napier St, Vancouver' },
      { name: 'Hillcrest Centre', aliases: ['Hillcrest', 'Hillcrest Arena', 'Hillcrest Rink'], lat: 49.2438, lng: -123.1090, address: '4575 Clancy Loranger Way, Vancouver' },
      { name: 'Kerrisdale Arena', aliases: ['Kerrisdale', 'Kerrisdale Rink'], lat: 49.2337, lng: -123.1607, address: '5851 West Boulevard, Vancouver' },
      { name: 'Killarney Rink', aliases: ['Killarney', 'Killarney Arena'], lat: 49.2275, lng: -123.0456, address: '6260 Killarney St, Vancouver' },
      { name: 'Kitsilano Rink', aliases: ['Kitsilano', 'Kits'], lat: 49.2713, lng: -123.1570, address: '2690 Larch St, Vancouver' },
      { name: 'Sunset Community Centre', aliases: ['Sunset', 'Sunset Arena'], lat: 49.2267, lng: -123.1003, address: '6810 Main St, Vancouver' },
      { name: 'Trout Lake Community Centre', aliases: ['Trout Lake', 'Trout Lake Rink'], lat: 49.2544, lng: -123.0636, address: '3360 Victoria Dr, Vancouver' },
      { name: 'West End Community Centre', aliases: ['West End', 'West End Rink'], lat: 49.2863, lng: -123.1353, address: '870 Denman St, Vancouver' },
      { name: 'Thunderbird Community Centre', aliases: ['Thunderbird', 'Thunderbird Cmty Centre'], lat: 49.2614, lng: -123.2456, address: '2311 Cassiar St, Vancouver' },
    ],
    burnaby: [
      { name: 'Bill Copeland Sports Centre', aliases: ['Bill Copeland', 'Copeland'], lat: 49.2389, lng: -123.0042, address: '3676 Kensington Ave, Burnaby' },
      { name: 'Kensington Arena', aliases: ['Kensington'], lat: 49.2267, lng: -123.0036, address: '6050 McMurray Ave, Burnaby' },
      { name: 'Rosemary Brown Arena', aliases: ['Rosemary Brown', 'RBR', 'Rosemary Brown Recreation Centre'], lat: 49.2258, lng: -122.9892, address: '5930 Humphries Ave, Burnaby' },
    ],
  },

  // Search URLs - multiple searches to capture all skating activities
  searches: [
    { city: 'vancouver', keyword: 'skating', url: 'https://anc.ca.apm.activecommunities.com/vancouver/activity/search?activity_keyword=skating&viewMode=list' },
    { city: 'vancouver', keyword: 'skate', url: 'https://anc.ca.apm.activecommunities.com/vancouver/activity/search?activity_keyword=skate&viewMode=list' },
    { city: 'burnaby', keyword: 'skating', url: 'https://anc.ca.apm.activecommunities.com/burnaby/activity/search?activity_keyword=skating&viewMode=list' },
    { city: 'burnaby', keyword: 'skate', url: 'https://anc.ca.apm.activecommunities.com/burnaby/activity/search?activity_keyword=skate&viewMode=list' },
  ],
};

/**
 * Launch browser and create a new page
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
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  return { browser, page };
}

/**
 * Extract structured data from activity cards
 */
async function extractActivityCards(page) {
  return await page.evaluate(() => {
    const cards = document.querySelectorAll('.activity-card');
    const results = [];

    cards.forEach(card => {
      try {
        // Check if cancelled
        const isCancelled = card.textContent.toLowerCase().includes('cancelled');
        if (isCancelled) return;

        // Get activity name from the link
        const nameLink = card.querySelector('.activity-card-info__name a, .activity-card-info__name span');
        const name = nameLink ? nameLink.textContent.trim() : '';

        // Get location
        const locationEl = card.querySelector('.activity-card-info__location');
        const location = locationEl ? locationEl.textContent.trim().replace(/^\*/, '') : '';

        // Get date - look for date elements
        const dateEl = card.querySelector('.activity-card-info__date, [class*="date"]');
        let dateText = '';
        if (dateEl) {
          dateText = dateEl.textContent.trim();
        } else {
          // Try to find date in card text (format: "Month DD, YYYY" or "Month DD, YYYY to Month DD, YYYY")
          const cardText = card.textContent;
          const dateMatch = cardText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/);
          if (dateMatch) {
            dateText = dateMatch[0];
          }
        }

        // Get time - look for time patterns
        let timeText = '';
        const cardText = card.textContent;
        const timeMatch = cardText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
        if (timeMatch) {
          timeText = timeMatch[0];
        }

        // Get reference number
        const refMatch = cardText.match(/#(\d+)/);
        const refNumber = refMatch ? refMatch[1] : '';

        // Get openings count
        const openingsMatch = cardText.match(/Openings\s*(\d+)/i);
        const openings = openingsMatch ? parseInt(openingsMatch[1], 10) : null;

        results.push({
          name,
          location,
          dateText,
          timeText,
          refNumber,
          openings,
        });
      } catch (e) {
        // Skip malformed cards
      }
    });

    return results;
  });
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateText) {
  if (!dateText) return null;

  // Handle "Month DD, YYYY" format
  const match = dateText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})?/i);
  if (match) {
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

  return null;
}

/**
 * Parse time string to 24h format
 */
function parseTime(timeStr) {
  if (!timeStr) return null;

  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  return null;
}

/**
 * Parse time range to start and end times
 */
function parseTimeRange(timeText) {
  if (!timeText) return { startTime: null, endTime: null };

  const match = timeText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  if (match) {
    return {
      startTime: parseTime(match[1]),
      endTime: parseTime(match[2]),
    };
  }

  return { startTime: null, endTime: null };
}

/**
 * Match location text to a facility
 */
function matchFacility(locationText, city) {
  if (!locationText) return null;

  const facilities = CONFIG.facilities[city.toLowerCase()] || [];
  const locationLower = locationText.toLowerCase();

  for (const facility of facilities) {
    // Check main name
    if (locationLower.includes(facility.name.toLowerCase())) {
      return facility;
    }
    // Check aliases
    for (const alias of facility.aliases || []) {
      if (locationLower.includes(alias.toLowerCase())) {
        return facility;
      }
    }
  }

  return null;
}

/**
 * Determine activity type from name
 */
function determineActivityType(activityName) {
  const name = (activityName || '').toLowerCase();

  // Hockey types
  if (name.includes('family') && name.includes('hockey')) {
    return 'Family Hockey';
  }
  if (name.includes('shinny') || (name.includes('drop') && name.includes('hockey'))) {
    return 'Drop-in Hockey';
  }
  if (name.includes('hockey') && !name.includes('figure')) {
    return 'Hockey';
  }

  // Family skating (including parent & tot, parent & preschooler)
  if (name.includes('parent') && (name.includes('tot') || name.includes('preschool'))) {
    return 'Family Skate';
  }
  if ((name.includes('family') || name.includes('parent') || name.includes('tot')) &&
      (name.includes('skate') || name.includes('skating'))) {
    return 'Family Skate';
  }

  // Figure skating
  if (name.includes('figure')) {
    return 'Figure Skating';
  }

  // Public/drop-in skating (including toonie/discount sessions)
  if (name.includes('public') || name.includes('drop-in') || name.includes('drop in') ||
      name.includes('toonie') || name.includes('discount') || name.includes('loonie')) {
    return 'Public Skating';
  }

  // Lessons/classes
  if (name.includes('lesson') || name.includes('learn') || name.includes('class') ||
      name.includes('level') || name.includes('beginner') || name.includes('intermediate') ||
      name.includes('canskate') || name.includes('can skate') ||
      name.includes('pre-') || name.includes('intro')) {
    return 'Skating Lessons';
  }

  // Practice/freestyle
  if (name.includes('practice') || name.includes('freestyle') || name.includes('free skate')) {
    return 'Practice';
  }

  // Default - general skating
  return 'Skating';
}

/**
 * Scrape a single search URL
 */
async function scrapeSearch(page, search) {
  const { city, keyword, url } = search;
  console.error(`Scraping ${city} - "${keyword}"...`);

  try {
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: CONFIG.timeout,
    });

    // Wait for cards to load
    try {
      await page.waitForSelector('.activity-card', { timeout: 15000 });
    } catch (e) {
      console.error(`  No results found for "${keyword}" in ${city}`);
      return [];
    }

    // Scroll to load more results if available
    await autoScroll(page);

    // Extract card data
    const rawCards = await extractActivityCards(page);
    console.error(`  Found ${rawCards.length} activities`);

    // Parse into structured sessions
    const sessions = [];
    for (const card of rawCards) {
      const facility = matchFacility(card.location, city) || matchFacility(card.name, city);
      if (!facility) {
        console.error(`  Could not match facility: ${card.location || card.name}`);
        continue;
      }

      const date = parseDate(card.dateText);
      const { startTime, endTime } = parseTimeRange(card.timeText);

      if (!date) {
        console.error(`  Could not parse date: ${card.dateText}`);
        continue;
      }

      sessions.push({
        facility: facility.name,
        city: city.charAt(0).toUpperCase() + city.slice(1),
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        date,
        startTime: startTime || '00:00',
        endTime: endTime || '00:00',
        type: determineActivityType(card.name),
        activityName: card.name,
        openings: card.openings,
        refNumber: card.refNumber,
      });
    }

    return sessions;

  } catch (e) {
    console.error(`  Error scraping ${city} - "${keyword}":`, e.message);
    return [];
  }
}

/**
 * Auto scroll to load all results
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(timer);
        resolve();
      }, 5000);
    });
  });

  // Wait for any lazy-loaded content
  await new Promise(r => setTimeout(r, 1000));
}

/**
 * Generate iCal format from sessions
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
    // Create UID
    const uid = `${session.refNumber || session.facility.replace(/\s/g, '')}-${session.date}-${session.startTime}`.replace(/[^a-z0-9-]/gi, '-');

    // Format date and time for iCal (YYYYMMDDTHHMMSS)
    const dtStart = session.date.replace(/-/g, '') + 'T' + session.startTime.replace(/:/g, '') + '00';
    const dtEnd = session.date.replace(/-/g, '') + 'T' + session.endTime.replace(/:/g, '') + '00';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}@metro-vancouver-skating`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;TZID=America/Vancouver:${dtStart}`);
    lines.push(`DTEND;TZID=America/Vancouver:${dtEnd}`);
    lines.push(`SUMMARY:${session.type} - ${session.facility}`);
    lines.push(`LOCATION:${session.address}`);
    lines.push(`DESCRIPTION:${session.type} at ${session.facility}\\n${session.city}\\nOpenings: ${session.openings ?? 'Unknown'}`);
    lines.push(`GEO:${session.lat};${session.lng}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Main scraping function
 */
async function scrapeAll(options = {}) {
  const { debug = false, searches = CONFIG.searches } = options;

  let browser;
  const allSessions = [];
  const seenKeys = new Set();

  try {
    const { browser: b, page } = await createBrowser(debug);
    browser = b;

    for (const search of searches) {
      const sessions = await scrapeSearch(page, search);

      // Deduplicate by facility + date + time
      for (const session of sessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }

      // Be polite between requests
      await new Promise(r => setTimeout(r, 2000));
    }

  } finally {
    if (browser) {
      await browser.close();
    }
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
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const debug = args.includes('--debug');
  const ical = args.includes('--ical');
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;

  console.error('Metro Vancouver Skating Schedule Scraper');
  console.error('========================================');
  console.error(`Date: ${new Date().toISOString()}`);
  console.error(`Mode: ${debug ? 'Debug' : 'Headless'}`);
  console.error(`Output: ${ical ? 'iCal' : 'JSON'}`);
  console.error('');

  try {
    const result = await scrapeAll({ debug });

    let output;
    if (ical) {
      output = generateICal(result.sessions);
    } else {
      output = JSON.stringify(result, null, 2);
    }

    if (outputFile) {
      fs.writeFileSync(outputFile, output);
      console.error(`Output written to: ${outputFile}`);
    } else {
      console.log(output);
    }

    console.error(`\nScraping complete. Found ${result.count} sessions.`);

  } catch (e) {
    console.error('Scraping failed:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { scrapeAll, generateICal, CONFIG };

// Run if called directly
if (require.main === module) {
  main();
}
