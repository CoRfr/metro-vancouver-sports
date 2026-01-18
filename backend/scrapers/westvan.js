/**
 * West Vancouver skating schedule scraper
 * Uses westvancouver.ca daily activities DOM scraping
 */

const { CONFIG } = require('../config');
const { formatDate } = require('../utils');

/**
 * Scrape West Vancouver drop-in skating schedules from westvancouver.ca
 */
async function scrapeWestVan(browser) {
  console.error('Scraping West Vancouver...');
  const allSessions = [];
  const seenKeys = new Set();

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    // Add date range parameters to get full schedule
    const today = new Date();
    const startDate = formatDate(today);
    const endDate = formatDate(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)); // 60 days ahead
    const url = `${CONFIG.westvan.dropInUrl}&start_date=${startDate}&end_date=${endDate}`;

    // Use longer timeout and domcontentloaded for faster initial load in CI environments
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    // Wait for dynamic content to render
    await new Promise(r => setTimeout(r, 8000));

    const pageTitle = await page.title();
    console.error(`    Page loaded: ${pageTitle}`);

    // Extract all activities from .dropins-activity elements
    const activities = await page.evaluate(() => {
      const events = [];

      // Find all activity elements
      const activityEls = document.querySelectorAll('.dropins-activity');

      activityEls.forEach(actEl => {
        const dateStr = actEl.getAttribute('data-startdate');
        if (!dateStr) return;

        // Get activity name from parent category
        const categoryEl = actEl.closest('.dropins-category');
        const categoryTitle = categoryEl?.querySelector('.dropins-category-title')?.textContent.trim();

        // Get activity group name
        const groupEl = actEl.closest('.dropins-activity-group');
        const groupTitle = groupEl?.querySelector('.dropins-activity-group-title')?.textContent.trim();

        const activityName = groupTitle || categoryTitle || 'Skating';

        // Get time from activity-location-time
        const locationTimeEl = actEl.querySelector('.activity-location-time');
        const timeRangeEl = actEl.querySelector('.activity-days-time-range');

        let location = 'Ice Arena';
        let startTime = '';
        let endTime = '';

        if (locationTimeEl) {
          const locationEl = locationTimeEl.querySelector('.activity-location');
          if (locationEl) {
            location = locationEl.textContent.trim();
          }
        }

        if (timeRangeEl) {
          const timeText = timeRangeEl.textContent.trim();
          // Parse "Sun, 12:45 PM-2:00 PM"
          const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            const [, startH, startP, endH, endP] = timeMatch;
            // Convert to 24-hour format
            const to24 = (time, period) => {
              let [h, m] = time.split(':').map(Number);
              if (period.toUpperCase() === 'PM' && h < 12) h += 12;
              if (period.toUpperCase() === 'AM' && h === 12) h = 0;
              return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            };
            startTime = to24(startH, startP);
            endTime = to24(endH, endP);
          }
        }

        // Get registration URL
        const registerLink = actEl.querySelector('a.activity-register');
        const activityUrl = registerLink ? registerLink.href : '';

        if (startTime && endTime) {
          events.push({
            date: dateStr,
            activityName,
            categoryName: categoryTitle || '',
            location,
            startTime,
            endTime,
            activityUrl
          });
        }
      });

      return events;
    });

    console.error(`    Found ${activities.length} activities`);

    // Convert to session format
    const facility = CONFIG.westvan.facility;
    for (const activity of activities) {
      const eventKey = `${activity.date}-${activity.startTime}-${activity.activityName}`;
      if (seenKeys.has(eventKey)) continue;
      seenKeys.add(eventKey);

      // Determine activity type - check both activity name and category
      const actName = activity.activityName.toLowerCase();
      const catName = (activity.categoryName || '').toLowerCase();
      let type = 'Public Skating';

      // First check category for hockey-related activities
      if (catName.includes('hockey') || catName.includes('stick and puck')) {
        type = 'Drop-in Hockey';
      } else if (actName.includes('family')) {
        type = 'Family Skate';
      } else if (actName.includes('hockey') || actName.includes('stick') || actName.includes('puck')) {
        type = 'Drop-in Hockey';
      } else if (actName.includes('figure') || actName.includes('dance')) {
        type = 'Figure Skating';
      } else if (actName.includes('toonie')) {
        type = 'Discount Skate';
      }

      allSessions.push({
        facility: facility.name,
        city: 'West Vancouver',
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        date: activity.date,
        startTime: activity.startTime,
        endTime: activity.endTime,
        type,
        activityName: activity.activityName,
        activityUrl: activity.activityUrl || CONFIG.westvan.dropInUrl,
      });
    }

    console.error(`  West Vancouver: ${allSessions.length} sessions`);

  } catch (e) {
    console.error(`  Error scraping West Vancouver: ${e.message}`);
  } finally {
    await page.close();
  }

  return allSessions;
}

module.exports = {
  scrapeWestVan,
};
