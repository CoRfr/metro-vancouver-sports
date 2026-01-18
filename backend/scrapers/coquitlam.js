/**
 * Coquitlam skating schedule scraper
 * Uses hardcoded weekly patterns from coquitlam.ca PDF
 */

const { CONFIG } = require('../config');
const { formatDate } = require('../utils');

/**
 * Get Coquitlam schedules from hardcoded weekly patterns
 * Based on PDF from coquitlam.ca for Winter 2026 (Jan 3 - Mar 12)
 */
function getCoquitlamSchedules() {
  console.error('Adding Coquitlam schedules...');
  const allSessions = [];

  const facility = CONFIG.coquitlam.facility;
  const scheduleUrl = CONFIG.coquitlam.schedulesUrl;

  const startDate = new Date();
  const scheduleEnd = new Date(CONFIG.coquitlam.scheduleEnd);

  // Cancellations and end dates for specific activities
  const cancellations = {
    'familyStickRingPuck': ['2026-01-18', '2026-01-25'],
    'femaleStickRingPuck': ['2026-01-18', '2026-01-25'],
    'adultHockeySun': ['2026-01-25'],
    '30plusHockey': ['2026-01-24', '2026-02-14'],
    'stickRingPuckSat1130': ['2026-01-24', '2026-02-14'],
    'adultStickRingPuckSat': ['2026-01-24', '2026-02-14'],
    'stickRingPuckFri': ['2026-01-23'],
  };

  const endDates = {
    'adultChildSun': '2026-03-01',
    'familySkate': '2026-03-08',
    'familyStickRingPuck': '2026-03-01',
    'femaleStickRingPuck': '2026-03-01',
    'adultHockeySun': '2026-03-01',
    'adultToonieSkate': '2026-02-27',
    'stickRingPuckFri': '2026-02-27',
    '30plusHockey': '2026-02-28',
    'stickRingPuckSat1130': '2026-02-28',
    'stickRingPuckSat615': '2026-02-28',
    'adultStickRingPuckSat': '2026-02-28',
  };

  const startDates = {
    '30plusHockey': '2026-01-10',
    'stickRingPuckSat1130': '2026-01-10',
  };

  // Weekly schedule
  const schedule = {
    0: [ // Sunday
      { name: 'Adult & Child Toonie Skate', start: '09:15', end: '10:15', type: 'Family Skate', age: '0-6 yrs with adult', key: 'adultChildSun' },
      { name: 'Family Skate', start: '14:45', end: '16:00', type: 'Family Skate', key: 'familySkate' },
      { name: 'Family Stick, Ring & Puck', start: '17:30', end: '18:30', type: 'Family Hockey', key: 'familyStickRingPuck' },
      { name: 'Female Stick, Ring & Puck', start: '18:45', end: '19:45', type: 'Drop-in Hockey', age: '7 yrs+', key: 'femaleStickRingPuck' },
      { name: 'Adult Hockey', start: '20:00', end: '21:15', type: 'Drop-in Hockey', age: '19 yrs+', key: 'adultHockeySun' },
    ],
    1: [ // Monday
      { name: 'Adult & Child Toonie Skate', start: '12:15', end: '13:15', type: 'Family Skate', age: '0-6 yrs with adult' },
      { name: '50+ Toonie Skate', start: '13:30', end: '14:45', type: 'Public Skating', age: '50 yrs+' },
      { name: 'Stick, Ring & Puck', start: '15:30', end: '16:30', type: 'Drop-in Hockey' },
      { name: 'Toonie Skate', start: '20:15', end: '21:15', type: 'Discount Skate' },
    ],
    2: [ // Tuesday
      { name: 'Toonie Stick, Ring & Puck', start: '10:00', end: '11:00', type: 'Drop-in Hockey' },
      { name: 'Toonie Stick, Ring & Puck', start: '11:15', end: '12:15', type: 'Drop-in Hockey' },
      { name: 'Toonie Skate', start: '12:30', end: '13:30', type: 'Discount Skate' },
    ],
    3: [ // Wednesday
      { name: 'Stick, Ring & Puck', start: '15:30', end: '16:30', type: 'Drop-in Hockey' },
    ],
    4: [ // Thursday
      { name: 'Toonie Adult Hockey', start: '10:00', end: '11:00', type: 'Drop-in Hockey', age: '19 yrs+' },
      { name: 'Toonie Stick, Ring & Puck', start: '11:15', end: '12:15', type: 'Drop-in Hockey' },
      { name: 'Toonie Skate', start: '12:30', end: '13:30', type: 'Discount Skate' },
    ],
    5: [ // Friday
      { name: 'Adult Toonie Skate', start: '09:30', end: '10:30', type: 'Discount Skate', age: '19 yrs+', key: 'adultToonieSkate' },
      { name: 'Adult & Child Toonie Skate', start: '11:15', end: '12:15', type: 'Family Skate', age: '0-6 yrs with adult' },
      { name: 'Toonie Skate', start: '12:30', end: '13:30', type: 'Discount Skate' },
      { name: 'Stick, Ring & Puck', start: '15:45', end: '16:45', type: 'Drop-in Hockey', key: 'stickRingPuckFri' },
      { name: 'Youth Toonie Skate', start: '20:30', end: '21:30', type: 'Discount Skate', age: '13-18 yrs' },
      { name: 'Adult Stick, Ring & Puck', start: '21:45', end: '22:45', type: 'Drop-in Hockey' },
      { name: 'Adult Hockey', start: '22:00', end: '23:15', type: 'Drop-in Hockey', age: '19 yrs+' },
    ],
    6: [ // Saturday
      { name: '30+ Hockey', start: '10:00', end: '11:15', type: 'Drop-in Hockey', age: '30 yrs+', key: '30plusHockey' },
      { name: 'Stick, Ring & Puck', start: '11:30', end: '12:30', type: 'Drop-in Hockey', key: 'stickRingPuckSat1130' },
      { name: 'Public Skate', start: '16:45', end: '18:00', type: 'Public Skating' },
      { name: 'Stick, Ring & Puck', start: '18:15', end: '19:15', type: 'Drop-in Hockey', key: 'stickRingPuckSat615' },
      { name: 'Adult Stick, Ring & Puck', start: '19:30', end: '20:30', type: 'Drop-in Hockey', key: 'adultStickRingPuckSat' },
    ],
  };

  // Special events
  const specialEvents = [
    { date: '2026-02-16', name: 'Family Day Family Skate', start: '14:15', end: '15:30', type: 'Family Skate' },
    { date: '2026-02-16', name: 'Family Day Family Skate', start: '15:45', end: '17:00', type: 'Family Skate' },
    { date: '2026-02-27', name: 'Pro D Day Toonie Skate', start: '13:45', end: '14:45', type: 'Discount Skate' },
  ];

  // Generate sessions
  let sessionCount = 0;
  for (let d = new Date(startDate); d <= scheduleEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayActivities = schedule[d.getDay()] || [];

    for (const activity of dayActivities) {
      // Check start date restriction
      if (activity.key && startDates[activity.key] && dateStr < startDates[activity.key]) continue;

      // Check end date restriction
      if (activity.key && endDates[activity.key] && dateStr > endDates[activity.key]) continue;

      // Check cancellations
      if (activity.key && cancellations[activity.key] && cancellations[activity.key].includes(dateStr)) continue;

      allSessions.push({
        facility: facility.name,
        city: 'Coquitlam',
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
      });
      sessionCount++;
    }
  }

  // Add special events
  for (const event of specialEvents) {
    if (event.date >= formatDate(startDate) && event.date <= formatDate(scheduleEnd)) {
      allSessions.push({
        facility: facility.name,
        city: 'Coquitlam',
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        date: event.date,
        startTime: event.start,
        endTime: event.end,
        type: event.type,
        activityName: event.name,
        activityUrl: scheduleUrl,
      });
      sessionCount++;
    }
  }

  console.error(`  Coquitlam: ${sessionCount} sessions`);
  return allSessions;
}

module.exports = {
  getCoquitlamSchedules,
};
