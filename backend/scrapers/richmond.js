/**
 * Richmond skating schedule scraper
 * Uses hardcoded weekly patterns from richmond.ca PDFs
 */

const { CONFIG } = require('../config');
const { formatDate } = require('../utils');

/**
 * Get Richmond schedules from hardcoded weekly patterns
 * Based on PDFs from richmond.ca for Spring 2026 (Mar 30 - May 21)
 * Only Richmond Ice Centre has a spring schedule (no Minoru Arenas)
 */
function getRichmondSchedules() {
  console.error('Adding Richmond schedules...');
  const allSessions = [];

  const ricFacility = CONFIG.richmond.facilities['ric'];

  // Cancellations (Spring 2026)
  const cancellations = {
    'adultStickPuck': {
      cancelled: [
        '2026-04-17', // Fri Apr 17: All sessions
        '2026-04-20', // Mon Apr 20: All sessions
      ],
      partialCancelled: {
        '2026-04-23': ['13:30'], // Thu Apr 23: 1:30-3:30pm only
      },
    },
    'earlyMorningHockey': {
      cancelled: ['2026-04-17', '2026-04-20'],
    },
    'figureSkate': {
      cancelled: ['2026-04-23'], // Thu Apr 23
    },
    'masters65Hockey': {
      cancelled: ['2026-04-17', '2026-04-20'],
    },
    'publicSkate': {
      cancelled: ['2026-04-17'], // Fri Apr 17: All sessions
      partialCancelled: {
        '2026-04-20': ['09:00'], // Mon Apr 20: 9:00am-3:00pm only (evening stays if any)
      },
    },
    'senior55Hockey': {
      cancelled: ['2026-04-23'], // Thu Apr 23
    },
  };

  // Richmond Ice Centre weekly schedule (Spring 2026)
  const ricSchedule = {
    0: [ // Sunday
      { name: 'Public Skate', start: '13:00', end: '16:00', type: 'Public Skating', startDate: '2026-04-05', endDate: '2026-05-10' },
    ],
    1: [ // Monday (Mar 30 - May 11)
      { name: 'Early Morning Adult Hockey', start: '08:15', end: '09:30', type: 'Drop-in Hockey', endDate: '2026-05-11', cancelKey: 'earlyMorningHockey' },
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', endDate: '2026-05-11', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', endDate: '2026-05-11', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', endDate: '2026-05-11', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', endDate: '2026-05-11', cancelKey: 'publicSkate' },
      { name: 'Masters 65+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '65+', endDate: '2026-05-11', cancelKey: 'masters65Hockey' },
    ],
    2: [ // Tuesday (Mar 31 - May 19)
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', startDate: '2026-03-31', endDate: '2026-05-19', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', startDate: '2026-03-31', endDate: '2026-05-19', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', startDate: '2026-03-31', endDate: '2026-05-19', cancelKey: 'publicSkate' },
      { name: 'Senior 55+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '55+', startDate: '2026-03-31', endDate: '2026-05-19', cancelKey: 'senior55Hockey' },
      { name: 'Figure Skate', start: '12:00', end: '13:30', type: 'Figure Skating', startDate: '2026-03-31', endDate: '2026-05-19', cancelKey: 'figureSkate' },
      { name: 'Super Masters 70+ Hockey', start: '13:30', end: '15:30', type: 'Drop-in Hockey', age: '70+', startDate: '2026-03-31', endDate: '2026-05-19' },
    ],
    3: [ // Wednesday (Apr 1 - May 20)
      { name: 'Early Morning Adult Hockey', start: '08:15', end: '09:30', type: 'Drop-in Hockey', startDate: '2026-04-01', endDate: '2026-05-20', cancelKey: 'earlyMorningHockey' },
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', startDate: '2026-04-01', endDate: '2026-05-20', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', startDate: '2026-04-01', endDate: '2026-05-20', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', startDate: '2026-04-01', endDate: '2026-05-20', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', startDate: '2026-04-01', endDate: '2026-05-20', cancelKey: 'publicSkate' },
      { name: 'Public Skate', start: '18:30', end: '19:45', type: 'Public Skating', startDate: '2026-04-01', endDate: '2026-05-20', cancelKey: 'publicSkate' },
      { name: 'Masters 65+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '65+', startDate: '2026-04-01', endDate: '2026-05-20', cancelKey: 'masters65Hockey' },
    ],
    4: [ // Thursday (Apr 2 - May 21)
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', startDate: '2026-04-02', endDate: '2026-05-21', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', startDate: '2026-04-02', endDate: '2026-05-21', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', startDate: '2026-04-02', endDate: '2026-05-21', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', startDate: '2026-04-02', endDate: '2026-05-21', cancelKey: 'publicSkate' },
      { name: 'Senior 55+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '55+', startDate: '2026-04-02', endDate: '2026-05-21', cancelKey: 'senior55Hockey' },
      { name: 'Figure Skate', start: '12:00', end: '13:30', type: 'Figure Skating', startDate: '2026-04-02', endDate: '2026-05-21', cancelKey: 'figureSkate' },
    ],
    5: [ // Friday (Apr 3 - May 8)
      { name: 'Early Morning Adult Hockey', start: '08:15', end: '09:30', type: 'Drop-in Hockey', startDate: '2026-04-03', endDate: '2026-05-08', cancelKey: 'earlyMorningHockey' },
      { name: 'Adult Stick and Puck', start: '09:00', end: '11:00', type: 'Drop-in Hockey', startDate: '2026-04-03', endDate: '2026-05-08', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '11:15', end: '13:15', type: 'Drop-in Hockey', startDate: '2026-04-03', endDate: '2026-05-08', cancelKey: 'adultStickPuck' },
      { name: 'Adult Stick and Puck', start: '13:30', end: '15:30', type: 'Drop-in Hockey', startDate: '2026-04-03', endDate: '2026-05-08', cancelKey: 'adultStickPuck' },
      { name: 'Public Skate', start: '09:00', end: '15:00', type: 'Public Skating', startDate: '2026-04-03', endDate: '2026-05-08', cancelKey: 'publicSkate' },
      { name: 'Public Skate', start: '19:00', end: '20:15', type: 'Public Skating', startDate: '2026-04-03', endDate: '2026-05-08', cancelKey: 'publicSkate' },
      { name: 'Masters 65+ Hockey', start: '11:30', end: '13:30', type: 'Drop-in Hockey', age: '65+', startDate: '2026-04-03', endDate: '2026-05-08', cancelKey: 'masters65Hockey' },
    ],
    6: [ // Saturday
      { name: 'Public Skate', start: '13:00', end: '16:00', type: 'Public Skating', startDate: '2026-04-04', endDate: '2026-05-09' },
    ],
  };

  // Helper to check if date/session is cancelled
  const isCancelled = (dateStr, startTime, cancelKey) => {
    if (!cancelKey || !cancellations[cancelKey]) return false;
    const cancel = cancellations[cancelKey];
    // Full day cancellation
    if (cancel.cancelled && cancel.cancelled.includes(dateStr)) return true;
    // Partial cancellation (specific time slot)
    if (cancel.partialCancelled && cancel.partialCancelled[dateStr]) {
      return cancel.partialCancelled[dateStr].includes(startTime);
    }
    return false;
  };

  const scheduleStart = new Date(CONFIG.richmond.scheduleStart + 'T00:00:00');
  const scheduleEnd = new Date(CONFIG.richmond.scheduleEnd + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = today > scheduleStart ? today : scheduleStart;

  let ricCount = 0;
  for (let d = new Date(startDate); d <= scheduleEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayActivities = ricSchedule[d.getDay()] || [];

    for (const activity of dayActivities) {
      if (activity.startDate && dateStr < activity.startDate) continue;
      if (activity.endDate && dateStr > activity.endDate) continue;
      if (isCancelled(dateStr, activity.start, activity.cancelKey)) continue;

      allSessions.push({
        facility: ricFacility.name,
        city: 'Richmond',
        address: ricFacility.address,
        lat: ricFacility.lat,
        lng: ricFacility.lng,
        date: dateStr,
        startTime: activity.start,
        endTime: activity.end,
        type: activity.type,
        activityName: activity.name,
        ageRange: activity.age,
        activityUrl: ricFacility.url,
        facilityUrl: ricFacility.scheduleUrl || '',
        scheduleUrl: ricFacility.scheduleUrl || '',
      });
      ricCount++;
    }
  }
  console.error(`  Richmond Ice Centre: ${ricCount} sessions`);
  console.error(`  Minoru Arenas: 0 sessions (no spring schedule)`);
  console.error(`  Richmond total: ${allSessions.length} sessions`);
  return allSessions;
}

module.exports = {
  getRichmondSchedules,
};
