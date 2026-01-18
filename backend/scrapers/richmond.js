/**
 * Richmond skating schedule scraper
 * Uses hardcoded weekly patterns from richmond.ca PDFs
 */

const { CONFIG } = require('../config');
const { formatDate } = require('../utils');

/**
 * Get Richmond schedules from hardcoded weekly patterns
 * Based on PDFs from richmond.ca for Winter 2026 (Jan 5 - Mar 13)
 */
function getRichmondSchedules() {
  console.error('Adding Richmond schedules...');
  const allSessions = [];

  const ricFacility = CONFIG.richmond.facilities['ric'];
  const minoruFacility = CONFIG.richmond.facilities['minoru'];

  // Cancellations and time changes (format: 'YYYY-MM-DD')
  const ricCancellations = {
    // Adult and Child Stick and Puck - Fri cancelled on these dates
    'adultChildStickPuck': ['2026-01-31', '2026-02-07', '2026-02-14'],
    // Adult Evening Hockey - Mon Feb 16 cancelled
    'adultEveningHockey': ['2026-02-16'],
    // Adult Stick and Puck - Fri Feb 6, Mon Feb 16 cancelled
    'adultStickPuck': { cancelled: ['2026-02-06', '2026-02-16'] },
    // Adult Weekend Hockey - Sun Feb 8, Feb 15 cancelled
    'adultWeekendHockey': ['2026-02-08', '2026-02-15'],
    // Early Morning Adult Hockey - Fri Feb 6, Mon Feb 16 cancelled
    'earlyMorningHockey': ['2026-02-06', '2026-02-16'],
    // Masters 65+ Hockey - Fri Feb 6, Mon Feb 16 cancelled
    'masters65Hockey': ['2026-02-06', '2026-02-16'],
    // Public Skate - Fri Feb 6, Mon Feb 16 cancelled; Tue Feb 3, Feb 10 time change
    'publicSkate': {
      cancelled: ['2026-02-06', '2026-02-16'],
      timeChanges: {
        '2026-02-03': { start: '09:30', end: '15:00' },
        '2026-02-10': { start: '09:30', end: '15:00' },
      },
    },
  };

  const minoruCancellations = {
    // Adult Toonie Skate - Mon Feb 16 cancelled
    'adultToonieSkate': ['2026-02-16'],
    // Figure Skating - Tue Jan 13 time change to 12:00-1:15pm (note: Jan 13 is a Monday, PDF may have error)
    'figureSkating': {
      timeChanges: { '2026-01-14': { start: '12:00', end: '13:15' } }, // Assuming Tue Jan 14
    },
    // Public Skate - Sat Jan 24 time change to 2:15-4:30pm
    'publicSkate': {
      timeChanges: { '2026-01-24': { start: '14:15', end: '16:30' } },
    },
  };

  // Richmond Ice Centre weekly schedule
  const ricSchedule = {
    0: [ // Sunday (Jan 5 - Mar 9)
      { name: 'Early Morning Adult Hockey', start: '07:30', end: '09:00', type: 'Drop-in Hockey', cancelKey: 'earlyMorningHockey' },
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', cancelKey: 'publicSkate' },
      { name: 'Masters 65+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '65+', cancelKey: 'masters65Hockey' },
      { name: 'Adult Evening Hockey', start: '19:30', end: '20:45', type: 'Drop-in Hockey', cancelKey: 'adultEveningHockey' },
    ],
    1: [ // Monday (Jan 6 - Mar 10)
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', cancelKey: 'publicSkate' },
      { name: 'Senior 55+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '55+' },
    ],
    2: [ // Tuesday (Jan 7 - Mar 11)
      { name: 'Early Morning Adult Hockey', start: '07:30', end: '09:00', type: 'Drop-in Hockey', cancelKey: 'earlyMorningHockey' },
      { name: 'Figure Skating', start: '09:00', end: '10:30', type: 'Figure Skating' },
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', cancelKey: 'publicSkate' },
      { name: 'Masters 65+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '65+', cancelKey: 'masters65Hockey' },
    ],
    3: [ // Wednesday (Jan 8 - Mar 12)
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', cancelKey: 'publicSkate' },
      { name: 'Senior 55+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '55+' },
    ],
    4: [ // Thursday (starts Jan 16 - Mar 13)
      { name: 'Early Morning Adult Hockey', start: '07:30', end: '08:45', type: 'Drop-in Hockey', startDate: '2026-01-16', cancelKey: 'earlyMorningHockey' },
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', startDate: '2026-01-16', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', startDate: '2026-01-16', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', startDate: '2026-01-16', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', startDate: '2026-01-16', cancelKey: 'publicSkate' },
      { name: 'Masters 65+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '65+', startDate: '2026-01-16', cancelKey: 'masters65Hockey' },
    ],
    5: [ // Friday (Jan 17 - Mar 7)
      { name: 'Adult and Child Stick and Puck', start: '09:15', end: '10:30', type: 'Family Hockey', age: '12 yrs and under with adult', startDate: '2026-01-17', endDate: '2026-03-07', cancelKey: 'adultChildStickPuck' },
      { name: 'Adult and Child Stick and Puck', start: '10:45', end: '12:00', type: 'Family Hockey', age: '12 yrs and under with adult', startDate: '2026-01-17', endDate: '2026-03-07', cancelKey: 'adultChildStickPuck' },
    ],
    6: [ // Saturday (Jan 18 - Mar 8)
      { name: 'Adult Weekend Hockey', start: '13:30', end: '14:45', type: 'Drop-in Hockey', startDate: '2026-01-18', endDate: '2026-03-08', cancelKey: 'adultWeekendHockey' },
    ],
  };

  // Minoru Arenas weekly schedule
  const minoruSchedule = {
    0: [ // Sunday (Jan 5 - Mar 9)
      { name: 'Adult Toonie Skate', start: '12:15', end: '13:15', type: 'Discount Skate', cancelKey: 'adultToonieSkate' },
      { name: 'Public Skate', start: '14:00', end: '17:00', type: 'Public Skating', startDate: '2026-01-11' },
    ],
    1: [ // Monday (Jan 6 - Mar 10)
      { name: 'Adult Toonie Skate', start: '12:15', end: '13:15', type: 'Discount Skate', cancelKey: 'adultToonieSkate' },
      // Feb 16 only: Family Day special events (added as special dates below)
    ],
    2: [ // Tuesday
      { name: 'Adult 55+ Skate', start: '10:00', end: '11:00', type: 'Public Skating', age: '55+', startDate: '2026-01-14' },
      { name: 'Figure Skating', start: '12:00', end: '13:30', type: 'Figure Skating', startDate: '2026-01-06', cancelKey: 'figureSkating' },
    ],
    3: [ // Wednesday
      { name: 'Adult Stick and Puck', start: '11:30', end: '13:30', type: 'Drop-in Hockey' },
      { name: 'Adult Toonie Skate', start: '12:15', end: '13:15', type: 'Discount Skate' },
      { name: 'Public Skate', start: '18:15', end: '19:30', type: 'Public Skating' },
    ],
    4: [], // Thursday - nothing regular
    5: [ // Friday
      { name: 'Public Skate', start: '18:45', end: '20:00', type: 'Public Skating', cancelKey: 'publicSkate' },
    ],
    6: [ // Saturday
      { name: 'Public Skate', start: '14:00', end: '17:00', type: 'Public Skating', cancelKey: 'publicSkate' },
    ],
  };

  // Special one-time events
  const specialEvents = [
    // Family Day Feb 16 at Minoru
    { facility: minoruFacility, date: '2026-02-16', name: 'Family Day Skate', start: '12:00', end: '16:00', type: 'Family Skate' },
    { facility: minoruFacility, date: '2026-02-16', name: 'Family Day Adult and Child Stick and Puck', start: '13:00', end: '14:15', type: 'Family Hockey', age: '12 yrs and under with adult' },
    { facility: minoruFacility, date: '2026-02-16', name: 'Family Day Adult and Child Stick and Puck', start: '14:30', end: '15:45', type: 'Family Hockey', age: '12 yrs and under with adult' },
    { facility: minoruFacility, date: '2026-02-16', name: 'Family Day Youth Stick and Puck', start: '16:00', end: '17:15', type: 'Drop-in Hockey', age: 'Youth' },
  ];

  const scheduleStart = new Date(CONFIG.richmond.scheduleStart);
  const scheduleEnd = new Date(CONFIG.richmond.scheduleEnd);
  const today = new Date();
  const startDate = today > scheduleStart ? today : scheduleStart;

  // Helper to check if date is cancelled
  const isCancelled = (dateStr, cancelKey, cancellations) => {
    if (!cancelKey || !cancellations[cancelKey]) return false;
    const cancel = cancellations[cancelKey];
    if (Array.isArray(cancel)) return cancel.includes(dateStr);
    if (cancel.cancelled) return cancel.cancelled.includes(dateStr);
    return false;
  };

  // Helper to get time change
  const getTimeChange = (dateStr, cancelKey, cancellations) => {
    if (!cancelKey || !cancellations[cancelKey]) return null;
    const cancel = cancellations[cancelKey];
    if (cancel.timeChanges && cancel.timeChanges[dateStr]) {
      return cancel.timeChanges[dateStr];
    }
    return null;
  };

  // Process RIC schedule
  let ricCount = 0;
  for (let d = new Date(startDate); d <= scheduleEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayActivities = ricSchedule[d.getDay()] || [];

    for (const activity of dayActivities) {
      // Check start/end date restrictions
      if (activity.startDate && dateStr < activity.startDate) continue;
      if (activity.endDate && dateStr > activity.endDate) continue;

      // Check cancellation
      if (isCancelled(dateStr, activity.cancelKey, ricCancellations)) continue;

      // Check for time change
      const timeChange = getTimeChange(dateStr, activity.cancelKey, ricCancellations);
      const startTime = timeChange ? timeChange.start : activity.start;
      const endTime = timeChange ? timeChange.end : activity.end;

      allSessions.push({
        facility: ricFacility.name,
        city: 'Richmond',
        address: ricFacility.address,
        lat: ricFacility.lat,
        lng: ricFacility.lng,
        date: dateStr,
        startTime,
        endTime,
        type: activity.type,
        activityName: activity.name,
        ageRange: activity.age,
        activityUrl: ricFacility.url,
      });
      ricCount++;
    }
  }
  console.error(`  Richmond Ice Centre: ${ricCount} sessions`);

  // Process Minoru schedule
  let minoruCount = 0;
  for (let d = new Date(startDate); d <= scheduleEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayActivities = minoruSchedule[d.getDay()] || [];

    for (const activity of dayActivities) {
      // Check start/end date restrictions
      if (activity.startDate && dateStr < activity.startDate) continue;
      if (activity.endDate && dateStr > activity.endDate) continue;

      // Check cancellation
      if (isCancelled(dateStr, activity.cancelKey, minoruCancellations)) continue;

      // Check for time change
      const timeChange = getTimeChange(dateStr, activity.cancelKey, minoruCancellations);
      const startTime = timeChange ? timeChange.start : activity.start;
      const endTime = timeChange ? timeChange.end : activity.end;

      allSessions.push({
        facility: minoruFacility.name,
        city: 'Richmond',
        address: minoruFacility.address,
        lat: minoruFacility.lat,
        lng: minoruFacility.lng,
        date: dateStr,
        startTime,
        endTime,
        type: activity.type,
        activityName: activity.name,
        ageRange: activity.age,
        activityUrl: minoruFacility.url,
      });
      minoruCount++;
    }
  }

  // Add special events
  for (const event of specialEvents) {
    if (event.date >= formatDate(startDate) && event.date <= formatDate(scheduleEnd)) {
      allSessions.push({
        facility: event.facility.name,
        city: 'Richmond',
        address: event.facility.address,
        lat: event.facility.lat,
        lng: event.facility.lng,
        date: event.date,
        startTime: event.start,
        endTime: event.end,
        type: event.type,
        activityName: event.name,
        ageRange: event.age,
        activityUrl: event.facility.url,
      });
      minoruCount++;
    }
  }
  console.error(`  Minoru Arenas: ${minoruCount} sessions`);

  console.error(`  Richmond total: ${allSessions.length} sessions`);
  return allSessions;
}

module.exports = {
  getRichmondSchedules,
};
