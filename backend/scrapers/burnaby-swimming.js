/**
 * Burnaby swimming schedule scraper
 * Dynamically scrapes HTML tables from burnaby.ca
 */

const { CONFIG } = require('../config');
const { formatDate, determineSwimmingActivityType } = require('../utils');

/**
 * Scrape Burnaby swimming schedules from burnaby.ca HTML tables
 * @param {import('puppeteer').Browser} browser - Puppeteer browser instance
 */
async function scrapeBurnabySwimming(browser) {
  console.error('Scraping Burnaby swimming schedules...');
  const allSessions = [];

  const facilities = CONFIG.burnabySwimming?.facilities || {};
  const page = await browser.newPage();

  try {
    for (const [facilityKey, facility] of Object.entries(facilities)) {
      const url = `https://www.burnaby.ca/recreation-and-arts/programs-and-activities/daily-activities?activity_tid=651&location_ref=${facility.locationRef}`;
      console.error(`  Fetching ${facility.name}...`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extract schedule data from the table
        const scheduleData = await page.evaluate(() => {
          const activities = [];
          const table = document.querySelector('table.site-table--no-border');
          if (!table) return activities;

          const rows = table.querySelectorAll('tr');
          let dayHeaders = [];

          // Find the row with day headers (Monday, Tuesday, etc.)
          for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('th');
            const cellTexts = Array.from(cells).map(c => c.textContent.trim().toLowerCase());
            if (cellTexts.includes('monday') || cellTexts.includes('mon')) {
              dayHeaders = cellTexts;
              break;
            }
          }

          if (dayHeaders.length === 0) return activities;

          // Map day names to numbers
          const dayMap = {
            'monday': 1, 'mon': 1,
            'tuesday': 2, 'tue': 2, 'tues': 2,
            'wednesday': 3, 'wed': 3,
            'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
            'friday': 5, 'fri': 5,
            'saturday': 6, 'sat': 6,
            'sunday': 0, 'sun': 0,
          };

          // Map column index to day number
          const columnDays = dayHeaders.map(h => dayMap[h] ?? null);

          // Process data rows (skip header rows)
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) continue;

            cells.forEach((cell, colIndex) => {
              const dayNum = columnDays[colIndex];
              if (dayNum === null || dayNum === undefined) return;

              // Find activity name in <strong> or <b> tag
              const nameEl = cell.querySelector('strong, b');
              if (!nameEl) return;

              const name = nameEl.textContent.trim();
              if (!name) return;

              // Get the cell text and find the time pattern
              const cellText = cell.textContent;

              // Time patterns like "6-8:55 am", "10 am-1 pm", "9:30-11:25 am"
              const timePatterns = [
                /(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)/i,
                /(\d{1,2}(?::\d{2})?)\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)/i,
              ];

              let start = null, end = null;

              for (const pattern of timePatterns) {
                const match = cellText.match(pattern);
                if (match) {
                  if (match.length === 5) {
                    // Pattern: start startPeriod - end endPeriod
                    const startTime = match[1];
                    const startPeriod = match[2] || match[4]; // Use end period if start not specified
                    const endTime = match[3];
                    const endPeriod = match[4];

                    start = convertTo24Hour(startTime, startPeriod);
                    end = convertTo24Hour(endTime, endPeriod);
                  } else if (match.length === 4) {
                    // Pattern: start - end period
                    const startTime = match[1];
                    const endTime = match[2];
                    const period = match[3];

                    // If start is less than end, they share the same period
                    // Otherwise start is AM and end is PM
                    const startNum = parseFloat(startTime.replace(':', '.'));
                    const endNum = parseFloat(endTime.replace(':', '.'));

                    if (period.toLowerCase() === 'pm' && startNum > endNum) {
                      start = convertTo24Hour(startTime, 'am');
                    } else {
                      start = convertTo24Hour(startTime, period);
                    }
                    end = convertTo24Hour(endTime, period);
                  }
                  break;
                }
              }

              if (start && end) {
                // Get age/notes from <em> tag
                const notesEl = cell.querySelector('em');
                const notes = notesEl ? notesEl.textContent.trim() : null;

                activities.push({
                  name,
                  start,
                  end,
                  day: dayNum,
                  notes,
                });
              }
            });
          }

          function convertTo24Hour(timeStr, period) {
            if (!timeStr) return null;

            let hour, minute = '00';
            if (timeStr.includes(':')) {
              const parts = timeStr.split(':');
              hour = parseInt(parts[0], 10);
              minute = parts[1];
            } else {
              hour = parseInt(timeStr, 10);
            }

            if (!period) return `${hour.toString().padStart(2, '0')}:${minute}`;

            const p = period.toLowerCase();
            if (p === 'pm' && hour !== 12) hour += 12;
            if (p === 'am' && hour === 12) hour = 0;

            return `${hour.toString().padStart(2, '0')}:${minute}`;
          }

          return activities;
        });

        // Generate sessions from scraped data
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 30);

        let count = 0;
        for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          const dayActivities = scheduleData.filter(a => a.day === dayOfWeek);

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
              type: determineSwimmingActivityType(activity.name),
              activityName: activity.name,
              ageRange: activity.notes,
              activityUrl: url,
            });
            count++;
          }
        }

        console.error(`    ${facility.name}: ${scheduleData.length} unique activities, ${count} sessions`);

      } catch (err) {
        console.error(`    Error scraping ${facility.name}: ${err.message}`);
      }
    }
  } finally {
    await page.close();
  }

  console.error(`  Burnaby swimming total: ${allSessions.length} sessions`);
  return allSessions;
}

module.exports = {
  scrapeBurnabySwimming,
};
