/**
 * Richmond PDF Schedule Parser
 *
 * Parses skating schedules from richmond.ca PDF files:
 * - Richmond Ice Centre (RIC)
 * - Minoru Arenas
 */

const {
  fetchPdfText,
  parseTimeRange,
  parseDateRange,
  formatDate,
  parseDayOfWeek,
  getDatesForDayOfWeek,
  classifyActivity,
} = require('../pdf-parser');

// Richmond facility configuration
const FACILITIES = {
  ric: {
    name: 'Richmond Ice Centre',
    lat: 49.13639,
    lng: -123.06669,
    address: '14140 Triangle Rd, Richmond, BC V6W 1K4',
    pdfPattern: /RIC.*Public.*Skate.*Schedule/i,
  },
  minoru: {
    name: 'Minoru Arenas',
    lat: 49.16447,
    lng: -123.14295,
    address: '7551 Minoru Gate, Richmond, BC V6Y 1R8',
    pdfPattern: /Minoru.*Public.*Skate.*Schedule/i,
  },
};

const SCHEDULES_PAGE_URL = 'https://www.richmond.ca/parks-recreation/about/schedules.htm';
const BASE_URL = 'https://www.richmond.ca';

/**
 * Scrape the Richmond schedules page to find PDF URLs
 * @returns {Promise<{ ric: string|null, minoru: string|null }>}
 */
async function findPdfUrls() {
  const https = require('https');

  return new Promise((resolve, reject) => {
    https.get(SCHEDULES_PAGE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 metro-vancouver-skating-scraper' }
    }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        const urls = { ric: null, minoru: null };

        // Find PDF links
        const pdfLinks = data.matchAll(/href="([^"]*\.pdf[^"]*)"/gi);
        for (const match of pdfLinks) {
          let url = match[1];
          if (!url.startsWith('http')) {
            url = BASE_URL + url;
          }

          // Match to facility by URL patterns
          const urlLower = url.toLowerCase();
          if (urlLower.includes('ric_public') || urlLower.includes('ric_drop') ||
              (urlLower.includes('richmond') && urlLower.includes('ice') && urlLower.includes('centre'))) {
            urls.ric = url;
          } else if (urlLower.includes('minoru') && (urlLower.includes('skate') || urlLower.includes('arena'))) {
            urls.minoru = url;
          }
        }

        resolve(urls);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse a Richmond schedule PDF
 * @param {string} pdfText - Raw text from PDF
 * @param {Object} facility - Facility config
 * @returns {Object} Parsed schedule data
 */
function parseRichmondPdf(pdfText, facility) {
  const lines = pdfText.split('\n').map(l => l.trim()).filter(l => l);

  // Find date range (e.g., "WINTER 2026 — JAN 5 – MAR 13")
  let dateRange = null;
  for (const line of lines) {
    const match = line.match(/([A-Z]{3,})\s+\d+\s*[-–—]\s*([A-Z]{3,})\s+\d+/i);
    if (match) {
      dateRange = parseDateRange(line);
      break;
    }
    // Also try "Effective Date: Jan 5 to Feb 24"
    const effectiveMatch = line.match(/effective.*?date.*?:?\s*(.+)/i);
    if (effectiveMatch) {
      dateRange = parseDateRange(effectiveMatch[1]);
      if (dateRange) break;
    }
  }

  if (!dateRange) {
    // Default to current season
    const now = new Date();
    dateRange = {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 2, 31),
    };
  }

  // Parse the schedule grid
  // Richmond PDFs have columns: SUN MON TUE WED THU FRI SAT
  const schedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const cancellations = [];
  const timeChanges = [];

  // Find the header row with days
  let headerIndex = -1;
  let dayColumns = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\bSUN\b.*\bMON\b.*\bTUE\b/i.test(line) || /\bMON\b.*\bTUE\b.*\bWED\b/i.test(line)) {
      headerIndex = i;
      // Map day positions
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      for (const day of dayNames) {
        const idx = line.toUpperCase().indexOf(day);
        if (idx !== -1) {
          dayColumns[parseDayOfWeek(day)] = idx;
        }
      }
      break;
    }
  }

  // Parse activities and their times
  let currentActivity = null;
  const activityPatterns = [
    /public\s*skate/i,
    /adult\s*stick\s*and\s*puck/i,
    /adult\s*and\s*child\s*stick/i,
    /figure\s*skating/i,
    /toonie\s*skate/i,
    /adult\s*\d+\+\s*skate/i,
    /early\s*morning.*hockey/i,
    /adult.*hockey/i,
    /masters?\s*\d+\+.*hockey/i,
    /senior\s*\d+\+.*hockey/i,
    /family.*skate/i,
    /youth\s*stick/i,
  ];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Check for activity name
    for (const pattern of activityPatterns) {
      if (pattern.test(line)) {
        currentActivity = line.replace(/\*+$/, '').trim();
        break;
      }
    }

    // Check for cancellation section
    if (/CANCELLATION|CANCELLED/i.test(line)) {
      // Parse cancellation entries
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        const cancelLine = lines[j];
        if (/cancelled/i.test(cancelLine)) {
          // Extract dates
          const dateMatches = cancelLine.matchAll(/([A-Z][a-z]{2})\s+(\d{1,2})/g);
          for (const match of dateMatches) {
            cancellations.push({
              month: match[1],
              day: parseInt(match[2]),
              activity: currentActivity,
            });
          }
        }
        if (/time\s*change/i.test(cancelLine)) {
          // Extract time changes
          const timeMatch = cancelLine.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
          if (timeMatch) {
            timeChanges.push({
              activity: currentActivity,
              newTime: parseTimeRange(timeMatch[0]),
            });
          }
        }
      }
      break; // Stop at cancellation section
    }

    // Look for time entries
    const timeMatches = [...line.matchAll(/(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/gi)];
    for (const timeMatch of timeMatches) {
      const timeRange = parseTimeRange(timeMatch[0]);
      if (timeRange && currentActivity) {
        // Determine which day(s) this applies to based on column position
        const matchStart = timeMatch.index;

        // Find the day column this time belongs to
        let assignedDay = null;
        let minDistance = Infinity;

        for (const [day, colPos] of Object.entries(dayColumns)) {
          const distance = Math.abs(matchStart - colPos);
          if (distance < minDistance) {
            minDistance = distance;
            assignedDay = parseInt(day);
          }
        }

        if (assignedDay !== null && minDistance < 50) {
          schedule[assignedDay].push({
            name: currentActivity,
            start: timeRange.start,
            end: timeRange.end,
            type: classifyActivity(currentActivity),
          });
        }
      }
    }
  }

  return {
    facility,
    dateRange,
    schedule,
    cancellations,
    timeChanges,
  };
}

/**
 * Generate sessions from parsed schedule
 * @param {Object} parsedData - Output from parseRichmondPdf
 * @returns {Array} Session objects
 */
function generateSessions(parsedData) {
  const { facility, dateRange, schedule, cancellations } = parsedData;
  const sessions = [];

  const today = new Date();
  const startDate = today > dateRange.start ? today : dateRange.start;

  // Build cancellation lookup
  const cancelledDates = new Set();
  for (const cancel of cancellations) {
    // Convert month/day to full date
    const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                       'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
    const month = monthMap[cancel.month];
    if (month !== undefined) {
      const year = dateRange.start.getFullYear();
      const date = new Date(year, month, cancel.day);
      cancelledDates.add(`${formatDate(date)}-${cancel.activity}`);
    }
  }

  // Generate sessions for each day of week
  for (const [dayOfWeek, activities] of Object.entries(schedule)) {
    const dates = getDatesForDayOfWeek(parseInt(dayOfWeek), startDate, dateRange.end);

    for (const date of dates) {
      const dateStr = formatDate(date);

      for (const activity of activities) {
        // Check if cancelled
        const cancelKey = `${dateStr}-${activity.name}`;
        if (cancelledDates.has(cancelKey)) continue;

        sessions.push({
          facility: facility.name,
          city: 'Richmond',
          address: facility.address,
          lat: facility.lat,
          lng: facility.lng,
          date: dateStr,
          startTime: activity.start,
          endTime: activity.end,
          type: activity.type,
          activityName: activity.name,
          activityUrl: SCHEDULES_PAGE_URL,
        });
      }
    }
  }

  return sessions;
}

/**
 * Scrape Richmond schedules from PDFs
 * @returns {Promise<Array>} Session objects
 */
async function scrapeRichmond() {
  console.error('Scraping Richmond (PDF)...');
  const allSessions = [];

  try {
    // Find PDF URLs
    const pdfUrls = await findPdfUrls();
    console.error(`    Found PDFs: RIC=${pdfUrls.ric ? 'yes' : 'no'}, Minoru=${pdfUrls.minoru ? 'yes' : 'no'}`);

    // Process each facility
    for (const [key, facility] of Object.entries(FACILITIES)) {
      const pdfUrl = pdfUrls[key];
      if (!pdfUrl) {
        console.error(`    Warning: No PDF found for ${facility.name}`);
        continue;
      }

      try {
        console.error(`    Parsing ${facility.name}...`);
        const pdfText = await fetchPdfText(pdfUrl, { layout: true });
        const parsed = parseRichmondPdf(pdfText, facility);
        const sessions = generateSessions(parsed);
        allSessions.push(...sessions);
        console.error(`      ${sessions.length} sessions`);
      } catch (err) {
        console.error(`    Error parsing ${facility.name}: ${err.message}`);
      }
    }

    console.error(`  Richmond total: ${allSessions.length} sessions`);
  } catch (err) {
    console.error(`  Error scraping Richmond: ${err.message}`);
  }

  return allSessions;
}

module.exports = {
  scrapeRichmond,
  FACILITIES,
  findPdfUrls,
  parseRichmondPdf,
  generateSessions,
};
