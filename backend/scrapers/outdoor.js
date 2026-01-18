/**
 * Outdoor rinks skating schedule
 * Hardcoded seasonal hours for Robson Square and Shipyards
 */

const { formatDate } = require('../utils');

/**
 * Get outdoor rink schedules (Robson Square, Shipyards)
 * These have fixed seasonal hours
 */
function getOutdoorRinks() {
  console.error('Adding outdoor rinks...');
  const allSessions = [];

  // Outdoor rink configs with seasonal dates and hours
  // Start from yesterday to account for timezone differences (scraper runs in UTC)
  const today = new Date();
  today.setDate(today.getDate() - 1); // Go back 1 day for Pacific timezone coverage
  const currentMonth = today.getMonth(); // 0-11
  // If we're in Jan-Feb, season started last year; if Nov-Dec, season starts this year
  const seasonYear = currentMonth <= 2 ? today.getFullYear() - 1 : today.getFullYear();

  const outdoorRinks = [
    {
      name: 'Robson Square Ice Rink',
      city: 'Vancouver',
      address: '800 Robson St, Vancouver, BC V6Z 2E7',
      lat: 49.28221,
      lng: -123.12113,
      url: 'https://www.robsonsquare.com/',
      // Season: Nov 28 - Feb 28
      seasonStart: new Date(seasonYear, 10, 28), // Nov 28
      seasonEnd: new Date(seasonYear + 1, 1, 28), // Feb 28
      // Hours: Daily 12pm-9pm
      hours: { start: '12:00', end: '21:00' },
      days: [0, 1, 2, 3, 4, 5, 6],
      type: 'Public Skating',
      note: 'Free outdoor rink',
    },
    {
      name: 'Shipyards Skate Plaza',
      city: 'North Vancouver',
      address: '125 Victory Ship Way, North Vancouver, BC V7L 0B2',
      lat: 49.30958,
      lng: -123.07878,
      url: 'https://www.cnv.org/parks-recreation/the-shipyards/skate-plaza',
      // Season: Nov 15 - March 29
      seasonStart: new Date(seasonYear, 10, 15), // Nov 15
      seasonEnd: new Date(seasonYear + 1, 2, 29), // March 29
      // Hours: Daily 12pm-8pm
      hours: { start: '12:00', end: '20:00' },
      days: [0, 1, 2, 3, 4, 5, 6],
      type: 'Public Skating',
      note: 'Free outdoor rink. Ice cleaning at 1:30pm, 3:30pm, 5:30pm (~30min)',
    },
  ];

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);

  for (const rink of outdoorRinks) {
    // Determine effective date range (within season and within 30 days)
    const startDate = rink.seasonStart > today ? rink.seasonStart : today;
    const endDate = rink.seasonEnd < maxDate ? rink.seasonEnd : maxDate;

    // Skip if outside season
    if (startDate > endDate) {
      console.error(`    ${rink.name}: outside season`);
      continue;
    }

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (!rink.days.includes(d.getDay())) continue;

      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const hours = rink.weekendHours && isWeekend ? rink.weekendHours : (rink.weekdayHours || rink.hours);

      allSessions.push({
        facility: rink.name,
        city: rink.city,
        address: rink.address,
        lat: rink.lat,
        lng: rink.lng,
        date: formatDate(d),
        startTime: hours.start,
        endTime: hours.end,
        type: rink.type,
        activityName: `Free Public Skating`,
        description: rink.note,
        activityUrl: rink.url,
        scheduleUrl: rink.url,
      });
    }
  }

  console.error(`  Outdoor rinks: ${allSessions.length} sessions`);
  return allSessions;
}

module.exports = {
  getOutdoorRinks,
};
