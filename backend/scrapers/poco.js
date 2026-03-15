/**
 * Port Coquitlam skating schedule scraper
 * Uses hardcoded weekly patterns from portcoquitlam.ca PDFs
 */

const { CONFIG } = require('../config');
const { formatDate } = require('../utils');

/**
 * Get Port Coquitlam schedules from hardcoded weekly patterns
 * Based on PDFs from portcoquitlam.ca
 */
function getPocoSchedules() {
  console.error('Adding Port Coquitlam schedules...');
  const allSessions = [];

  const facility = CONFIG.poco.facility;
  const scheduleUrl = 'https://www.portcoquitlam.ca/recreation-parks/skating/public-skates';

  const periods = [
    // Winter 2: Feb 25 - Mar 15, 2026 (Arena 3 skating + Arena 1 hockey ending Mar 12)
    {
      start: '2026-02-25',
      end: '2026-03-15',
      cancelledDays: new Set([]),
      cancelledSlots: new Set([
        '2026-03-13|12:00', // Fri Toonie Skate cancelled (tournament)
        '2026-03-14|16:30', // Sat Family Play and Skate cancelled (tournament)
        '2026-03-14|19:30', // Sat Public Skate 7:30-9pm cancelled (tournament)
      ]),
      schedule: {
        0: [ // Sunday
          { name: 'Family Play and Skate', start: '12:30', end: '13:45', type: 'Family Skate' },
          { name: 'Public Skate', start: '14:30', end: '16:00', type: 'Public Skating' },
        ],
        1: [ // Monday
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+', endDate: '2026-03-12' },
        ],
        2: [ // Tuesday
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: 'Ring, Stick and Puck', start: '07:15', end: '08:45', type: 'Drop-in Hockey' },
        ],
        3: [ // Wednesday
          { name: 'Playtime on Ice Skate', start: '10:00', end: '11:30', type: 'Family Skate' },
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+', endDate: '2026-03-12' },
          { name: 'Ring, Stick and Puck', start: '12:00', end: '13:30', type: 'Drop-in Hockey', endDate: '2026-03-12' },
        ],
        4: [ // Thursday
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: 'Ring, Stick and Puck', start: '07:15', end: '08:45', type: 'Drop-in Hockey' },
        ],
        5: [ // Friday
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: 'Family Play and Skate', start: '18:15', end: '19:15', type: 'Family Skate' },
          { name: 'Public Skate', start: '19:30', end: '21:00', type: 'Public Skating' },
          { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+', endDate: '2026-03-12' },
          { name: 'Ring, Stick and Puck', start: '12:00', end: '13:30', type: 'Drop-in Hockey', endDate: '2026-03-12' },
        ],
        6: [ // Saturday
          { name: 'Family Play and Skate', start: '16:30', end: '17:30', type: 'Family Skate' },
          { name: 'Public Skate', start: '14:30', end: '16:00', type: 'Public Skating' },
          { name: 'Public Skate', start: '19:30', end: '21:00', type: 'Public Skating' },
        ],
      },
    },

    // Spring Break: Mar 16 - Mar 28, 2026 (Arena 3)
    {
      start: '2026-03-16',
      end: '2026-03-28',
      cancelledDays: new Set(['2026-03-27']), // No city programs Friday March 27
      cancelledSlots: new Set([
        '2026-03-23|15:30', // No R/S/P Mon Mar 23 3:30-5pm (tournament)
        '2026-03-23|17:30', // No Female R/S/P Mon Mar 23 5:30-7pm (tournament)
        '2026-03-25|15:30', // No R/S/P Wed Mar 25 3:30-5pm (tournament)
        '2026-03-25|17:30', // No Female R/S/P Wed Mar 25 5:30-7pm (tournament)
      ]),
      schedule: {
        0: [ // Sunday
          { name: 'Public Skate', start: '14:30', end: '16:00', type: 'Public Skating' },
        ],
        1: [ // Monday
          { name: 'Toonie Skate', start: '12:00', end: '13:30', type: 'Discount Skate' },
          { name: 'Family Play and Skate', start: '14:00', end: '15:15', type: 'Family Skate' },
          { name: 'Ring, Stick and Puck', start: '08:00', end: '09:30', type: 'Drop-in Hockey' },
          { name: 'Ring, Stick and Puck', start: '15:30', end: '17:00', type: 'Drop-in Hockey' },
          { name: 'Female Only Ring, Stick & Puck', start: '17:30', end: '19:00', type: 'Drop-in Hockey' },
          { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+' },
        ],
        2: [ // Tuesday
          { name: 'Toonie Skate', start: '12:00', end: '13:30', type: 'Discount Skate' },
          { name: 'Family Play and Skate', start: '10:00', end: '11:30', type: 'Family Skate' },
          { name: 'Ring, Stick and Puck', start: '13:45', end: '15:15', type: 'Drop-in Hockey' },
          { name: 'Female Only Ring, Stick & Puck', start: '08:00', end: '09:30', type: 'Drop-in Hockey' },
        ],
        3: [ // Wednesday
          { name: 'Toonie Skate', start: '12:00', end: '13:30', type: 'Discount Skate' },
          { name: 'Family Play and Skate', start: '14:00', end: '15:15', type: 'Family Skate' },
          { name: 'Ring, Stick and Puck', start: '08:00', end: '09:30', type: 'Drop-in Hockey' },
          { name: 'Ring, Stick and Puck', start: '15:30', end: '17:00', type: 'Drop-in Hockey' },
          { name: 'Female Only Ring, Stick & Puck', start: '17:30', end: '19:00', type: 'Drop-in Hockey' },
          { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+' },
        ],
        4: [ // Thursday
          { name: 'Toonie Skate', start: '12:00', end: '13:30', type: 'Discount Skate' },
          { name: 'Family Play and Skate', start: '10:00', end: '11:30', type: 'Family Skate' },
          { name: 'Ring, Stick and Puck', start: '13:45', end: '15:15', type: 'Drop-in Hockey' },
          { name: 'Female Only Ring, Stick & Puck', start: '08:00', end: '09:30', type: 'Drop-in Hockey' },
        ],
        5: [ // Friday
          { name: 'Toonie Skate', start: '12:00', end: '13:30', type: 'Discount Skate' },
          { name: 'Family Play and Skate', start: '14:00', end: '15:15', type: 'Family Skate' },
          { name: 'Family Play and Skate', start: '18:15', end: '19:15', type: 'Family Skate' },
          { name: 'Ring, Stick and Puck', start: '08:00', end: '09:30', type: 'Drop-in Hockey' },
          { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+' },
        ],
        6: [ // Saturday
          { name: 'Public Skate', start: '19:30', end: '21:00', type: 'Public Skating' },
          { name: 'Family Play and Skate', start: '16:30', end: '17:45', type: 'Family Skate' },
          { name: 'Public Skate', start: '14:30', end: '16:00', type: 'Public Skating' },
        ],
      },
    },

    // No programs Mar 29

    // Spring: Mar 30 - Apr 30, 2026 (Arena 3 only)
    {
      start: '2026-03-30',
      end: '2026-04-30',
      cancelledDays: new Set([
        '2026-04-03', // Good Friday - no programs
        '2026-04-06', // Easter Monday - no programs
      ]),
      cancelledSlots: new Set([
        '2026-04-17|19:30', // No Fri Apr 17 Public Skate 7:30-9pm
        '2026-04-24|13:15', // No Fri Apr 24 R/S/P 1:15-2:30pm
      ]),
      schedule: {
        0: [], // Sunday - no programs
        1: [ // Monday
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+' },
        ],
        2: [ // Tuesday
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: 'Ring, Stick and Puck', start: '07:15', end: '08:45', type: 'Drop-in Hockey' },
          { name: 'Ring, Stick and Puck', start: '13:15', end: '14:30', type: 'Drop-in Hockey' },
        ],
        3: [ // Wednesday
          { name: 'Playtime on Ice Skate', start: '10:00', end: '11:30', type: 'Family Skate' },
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
        ],
        4: [ // Thursday
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: 'Ring, Stick and Puck', start: '07:15', end: '08:45', type: 'Drop-in Hockey' },
          { name: 'Ring, Stick and Puck', start: '13:15', end: '14:30', type: 'Drop-in Hockey' },
        ],
        5: [ // Friday
          { name: 'Toonie Skate', start: '12:00', end: '13:00', type: 'Discount Skate' },
          { name: 'Family Play and Skate', start: '18:15', end: '19:15', type: 'Family Skate' },
          { name: 'Public Skate', start: '19:30', end: '21:00', type: 'Public Skating' },
          { name: '40+ Adult Hockey', start: '10:00', end: '11:30', type: 'Drop-in Hockey', age: '40+' },
          { name: 'Ring, Stick and Puck', start: '13:15', end: '14:30', type: 'Drop-in Hockey' },
        ],
        6: [], // Saturday - no programs
      },
    },
  ];

  // Generate sessions from periods
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);
  const scheduleEndStr = CONFIG.poco.scheduleEnd;
  let sessionCount = 0;

  for (const period of periods) {
    if (period.end > scheduleEndStr) continue;

    const startDateStr = period.start > todayStr ? period.start : todayStr;
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(period.end + 'T00:00:00');

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      if (period.cancelledDays && period.cancelledDays.has(dateStr)) continue;

      const dayActivities = period.schedule[d.getDay()] || [];

      for (const activity of dayActivities) {
        if (activity.endDate && dateStr > activity.endDate) continue;

        const slotKey = `${dateStr}|${activity.start}`;
        if (period.cancelledSlots && period.cancelledSlots.has(slotKey)) continue;

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
  }

  console.error(`  Port Coquitlam: ${sessionCount} sessions`);
  return allSessions;
}

module.exports = {
  getPocoSchedules,
};
