/**
 * New Westminster skating schedule scraper
 * Uses PerfectMind booking system
 */

const { CONFIG } = require('../config');

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
            facilityUrl: facility.scheduleUrl || '',
            scheduleUrl: facility.scheduleUrl || '',
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

module.exports = {
  scrapeNewWest,
};
