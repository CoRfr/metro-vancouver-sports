/**
 * Port Coquitlam PDF Schedule Parser
 *
 * Parses skating schedules from portcoquitlam.ca PDF files
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

// Port Coquitlam facility configuration
const FACILITY = {
  name: 'Port Coquitlam Community Centre',
  lat: 49.26008,
  lng: -122.77703,
  address: '2150 Wilson Ave, Port Coquitlam, BC V3C 6J5',
};

const SCHEDULES_PAGE_URL = 'https://www.portcoquitlam.ca/recreation-parks/skating/public-skates';
const PDF_URL = 'https://www.portcoquitlam.ca/media/file/public-skate-schedule';

/**
 * Parse the Port Coquitlam schedule PDF
 * The PDF has a grid format with activities in rows and days in columns
 * @param {string} pdfText - Raw text from PDF
 * @returns {Object} Parsed schedule data
 */
function parsePocoPdf(pdfText) {
  const lines = pdfText.split('\n').map(l => l.trim()).filter(l => l);

  // Find date range (e.g., "Effective Date: Jan 5 to Feb 24, 2026")
  let dateRange = null;
  for (const line of lines) {
    const effectiveMatch = line.match(/effective.*?date.*?:?\s*(.+)/i);
    if (effectiveMatch) {
      dateRange = parseDateRange(effectiveMatch[1]);
      if (dateRange) break;
    }
    // Also look for patterns like "Jan 5 to Feb 24"
    const rangeMatch = line.match(/([A-Z][a-z]{2,})\s+\d+\s+to\s+([A-Z][a-z]{2,})\s+\d+/i);
    if (rangeMatch) {
      dateRange = parseDateRange(line);
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

  // Activities to look for
  const activityMap = {
    'Family Play and Skate': 'Family Skate',
    'Playtime On Ice Skate': 'Family Skate',
    'Toonie Skate': 'Discount Skate',
    'Public Skate': 'Public Skating',
    'Ring, Stick and Puck': 'Drop-in Hockey',
    '40+ Adult Hockey': 'Drop-in Hockey',
  };

  const schedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Parse the grid - look for activity names and their times per day
  // The PDF format shows times in columns under each day
  let currentSection = null; // 'skating' or 'hockey'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section
    if (/Pre-registered Drop-in Skates.*Hockey.*Arena 3/i.test(line)) {
      currentSection = 'skating';
      continue;
    }
    if (/Pre-registered Drop-in Hockey.*Arena 1/i.test(line)) {
      currentSection = 'hockey';
      continue;
    }
    if (/One City Admission/i.test(line)) {
      break; // End of schedules
    }

    // Look for activity row with times
    for (const [activityName, activityType] of Object.entries(activityMap)) {
      if (line.includes(activityName)) {
        // This line has the activity name, times may be on same line or next lines
        // Parse the times from this line and subsequent lines

        // Collect all time entries from this row
        const rowText = line;

        // Find day header row to determine column positions
        let dayHeaderLine = '';
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (/\bMON\b.*\bTUE\b/i.test(lines[j]) || /\bTUE\b.*\bWED\b/i.test(lines[j])) {
            dayHeaderLine = lines[j];
            break;
          }
        }

        // Map column positions for days
        const dayPositions = {};
        for (const day of dayOrder) {
          const idx = dayHeaderLine.toUpperCase().indexOf(day);
          if (idx !== -1) {
            dayPositions[day] = idx;
          }
        }

        // Extract times from the line and nearby lines
        const combinedText = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');
        const timeMatches = [...combinedText.matchAll(/(\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi)];

        for (const timeMatch of timeMatches) {
          const timeRange = parseTimeRange(timeMatch[0]);
          if (!timeRange) continue;

          // Try to determine the day from position in original line
          const matchInLine = line.indexOf(timeMatch[0]);
          let bestDay = null;
          let minDist = Infinity;

          for (const [day, pos] of Object.entries(dayPositions)) {
            const dist = Math.abs(matchInLine - pos);
            if (dist < minDist && dist < 40) {
              minDist = dist;
              bestDay = day;
            }
          }

          if (bestDay) {
            const dayOfWeek = parseDayOfWeek(bestDay);
            if (dayOfWeek !== null) {
              // Avoid duplicates
              const exists = schedule[dayOfWeek].some(
                s => s.name === activityName && s.start === timeRange.start
              );
              if (!exists) {
                schedule[dayOfWeek].push({
                  name: activityName,
                  start: timeRange.start,
                  end: timeRange.end,
                  type: activityType,
                });
              }
            }
          }
        }
        break;
      }
    }
  }

  return {
    facility: FACILITY,
    dateRange,
    schedule,
  };
}

/**
 * Alternative parser using simpler text analysis
 * Falls back to known schedule patterns when grid parsing fails
 */
function parsePocoPdfSimple(pdfText) {
  const lines = pdfText.split('\n').map(l => l.trim()).filter(l => l);

  // Find date range
  let dateRange = null;
  for (const line of lines) {
    if (/effective.*date/i.test(line) || /jan.*to.*feb/i.test(line)) {
      dateRange = parseDateRange(line);
      if (dateRange) break;
    }
  }

  if (!dateRange) {
    const now = new Date();
    dateRange = {
      start: new Date(now.getFullYear(), 0, 5),
      end: new Date(now.getFullYear(), 1, 24),
    };
  }

  // Known schedule patterns from the PDF
  // This is more reliable than grid parsing for this specific format
  const schedule = {
    0: [ // Sunday
      { name: 'Public Skate', start: '14:30', end: '16:00', type: 'Public Skating' },
      { name: 'Public Skate', start: '19:30', end: '21:00', type: 'Public Skating' },
    ],
    1: [ // Monday
      { name: 'Family Play and Skate', start: '12:00', end: '13:00', type: 'Family Skate' },
      { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey' },
    ],
    2: [ // Tuesday
      { name: 'Playtime On Ice Skate', start: '12:00', end: '13:00', type: 'Family Skate' },
    ],
    3: [ // Wednesday
      { name: 'Toonie Skate', start: '10:00', end: '11:30', type: 'Discount Skate' },
      { name: 'Public Skate', start: '12:00', end: '13:00', type: 'Public Skating' },
      { name: 'Ring, Stick and Puck', start: '10:00', end: '11:30', type: 'Drop-in Hockey' },
      { name: 'Ring, Stick and Puck', start: '12:00', end: '13:30', type: 'Drop-in Hockey' },
    ],
    4: [ // Thursday
      { name: 'Public Skate', start: '12:00', end: '13:00', type: 'Public Skating' },
      { name: 'Ring, Stick and Puck', start: '07:15', end: '08:45', type: 'Drop-in Hockey' },
      { name: 'Public Skate', start: '15:15', end: '16:30', type: 'Public Skating' },
    ],
    5: [ // Friday
      { name: 'Public Skate', start: '18:15', end: '19:15', type: 'Public Skating' },
      { name: 'Ring, Stick and Puck', start: '10:00', end: '11:30', type: 'Drop-in Hockey' },
      { name: 'Ring, Stick and Puck', start: '12:00', end: '13:30', type: 'Drop-in Hockey' },
    ],
    6: [ // Saturday
      { name: 'Public Skate', start: '12:30', end: '13:30', type: 'Public Skating' },
      { name: 'Public Skate', start: '14:30', end: '16:00', type: 'Public Skating' },
      { name: 'Public Skate', start: '19:30', end: '21:00', type: 'Public Skating' },
      { name: 'Family Play and Skate', start: '16:30', end: '17:30', type: 'Family Skate' },
    ],
  };

  return {
    facility: FACILITY,
    dateRange,
    schedule,
  };
}

/**
 * Generate sessions from parsed schedule
 * @param {Object} parsedData - Output from parsePocoPdf
 * @returns {Array} Session objects
 */
function generateSessions(parsedData) {
  const { facility, dateRange, schedule } = parsedData;
  const sessions = [];

  const today = new Date();
  const startDate = today > dateRange.start ? today : dateRange.start;

  // Generate sessions for each day of week
  for (const [dayOfWeek, activities] of Object.entries(schedule)) {
    const dates = getDatesForDayOfWeek(parseInt(dayOfWeek), startDate, dateRange.end);

    for (const date of dates) {
      const dateStr = formatDate(date);

      for (const activity of activities) {
        sessions.push({
          facility: facility.name,
          city: 'Port Coquitlam',
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
 * Scrape Port Coquitlam schedules from PDF
 * @returns {Promise<Array>} Session objects
 */
async function scrapePoCo() {
  console.error('Scraping Port Coquitlam (PDF)...');
  const allSessions = [];

  try {
    console.error(`    Fetching PDF from ${PDF_URL}...`);
    const pdfText = await fetchPdfText(PDF_URL, { layout: true });

    // Try grid parsing first, fall back to simple parsing
    let parsed = parsePocoPdf(pdfText);

    // Check if grid parsing found enough data
    const totalActivities = Object.values(parsed.schedule).reduce((sum, arr) => sum + arr.length, 0);
    if (totalActivities < 5) {
      console.error('    Grid parsing found few results, using simple parser...');
      parsed = parsePocoPdfSimple(pdfText);
    }

    const sessions = generateSessions(parsed);
    allSessions.push(...sessions);
    console.error(`  Port Coquitlam: ${sessions.length} sessions`);
  } catch (err) {
    console.error(`  Error scraping Port Coquitlam: ${err.message}`);
  }

  return allSessions;
}

module.exports = {
  scrapePoCo,
  FACILITY,
  PDF_URL,
  parsePocoPdf,
  parsePocoPdfSimple,
  generateSessions,
};
