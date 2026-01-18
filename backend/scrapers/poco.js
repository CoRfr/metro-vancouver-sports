/**
 * Port Coquitlam skating schedule scraper
 * Uses hardcoded weekly patterns from portcoquitlam.ca PDF
 */

const { CONFIG } = require('../config');
const { formatDate } = require('../utils');

/**
 * Get Port Coquitlam schedules from hardcoded weekly patterns
 * Based on PDF from portcoquitlam.ca for Winter 2026 (Jan 5 - Feb 24)
 */
function getPocoSchedules() {
  console.error('Adding Port Coquitlam schedules...');
  const allSessions = [];

  const facility = CONFIG.poco.facility;
  const scheduleUrl = 'https://www.portcoquitlam.ca/recreation-parks/skating/public-skates';

  // Date range for Winter 2026
  const startDate = new Date();
  const scheduleEnd = new Date(CONFIG.poco.scheduleEnd);

  // Weekly schedule
  const schedule = {
    0: [ // Sunday
      { name: 'Public Skate', start: '14:30', end: '16:00', type: 'Public Skating' },
      { name: 'Public Skate', start: '19:30', end: '21:00', type: 'Public Skating' },
    ],
    1: [ // Monday
      { name: 'Family Play and Skate', start: '12:00', end: '13:00', type: 'Family Skate' },
      { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+' },
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

  // Generate sessions
  let sessionCount = 0;
  for (let d = new Date(startDate); d <= scheduleEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayActivities = schedule[d.getDay()] || [];

    for (const activity of dayActivities) {
      allSessions.push({
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
        ageRange: activity.age,
        activityUrl: scheduleUrl,
        facilityUrl: facility.scheduleUrl || '',
        scheduleUrl: facility.scheduleUrl || scheduleUrl,
      });
      sessionCount++;
    }
  }

  console.error(`  Port Coquitlam: ${sessionCount} sessions`);
  return allSessions;
}

module.exports = {
  getPocoSchedules,
};
