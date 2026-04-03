/**
 * Coquitlam skating schedule scraper
 * Uses hardcoded weekly patterns from coquitlam.ca PDF
 */

const { CONFIG } = require('../config');
const { formatDate } = require('../utils');

/**
 * Get Coquitlam schedules from hardcoded weekly patterns
 * Based on PDFs from coquitlam.ca
 */
function getCoquitlamSchedules() {
  console.error('Adding Coquitlam schedules...');
  const allSessions = [];

  const facility = CONFIG.coquitlam.facility;
  const scheduleUrl = CONFIG.coquitlam.schedulesUrl;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const periods = [
    // Winter 2026: Jan 3 - Mar 12
    {
      start: '2026-01-03',
      end: '2026-03-12',
      cancelledDays: new Set([]),
      cancelledSlots: new Set([
        '2026-01-18|17:30', // familyStickRingPuck
        '2026-01-25|17:30', // familyStickRingPuck
        '2026-01-18|18:45', // femaleStickRingPuck
        '2026-01-25|18:45', // femaleStickRingPuck
        '2026-01-25|20:00', // adultHockeySun
        '2026-01-24|10:00', // 30plusHockey
        '2026-02-14|10:00', // 30plusHockey
        '2026-01-24|11:30', // stickRingPuckSat1130
        '2026-02-14|11:30', // stickRingPuckSat1130
        '2026-01-23|15:45', // stickRingPuckFri
      ]),
      schedule: {
        0: [ // Sunday
          { name: 'Adult & Child Toonie Skate', start: '09:15', end: '10:15', type: 'Family Skate', age: '0-6 yrs with adult', endDate: '2026-03-01' },
          { name: 'Family Skate', start: '14:45', end: '16:00', type: 'Family Skate', endDate: '2026-03-08' },
          { name: 'Family Stick, Ring & Puck', start: '17:30', end: '18:30', type: 'Family Hockey', endDate: '2026-03-01' },
          { name: 'Female Stick, Ring & Puck', start: '18:45', end: '19:45', type: 'Drop-in Hockey', age: '7 yrs+', endDate: '2026-03-01' },
          { name: 'Adult Hockey', start: '20:00', end: '21:15', type: 'Drop-in Hockey', age: '19 yrs+', endDate: '2026-03-01' },
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
          { name: 'Adult Toonie Skate', start: '09:30', end: '10:30', type: 'Discount Skate', age: '19 yrs+', endDate: '2026-02-27' },
          { name: 'Adult & Child Toonie Skate', start: '11:15', end: '12:15', type: 'Family Skate', age: '0-6 yrs with adult' },
          { name: 'Toonie Skate', start: '12:30', end: '13:30', type: 'Discount Skate' },
          { name: 'Stick, Ring & Puck', start: '15:45', end: '16:45', type: 'Drop-in Hockey', endDate: '2026-02-27' },
          { name: 'Youth Toonie Skate', start: '20:30', end: '21:30', type: 'Discount Skate', age: '13-18 yrs' },
          { name: 'Adult Stick, Ring & Puck', start: '21:45', end: '22:45', type: 'Drop-in Hockey' },
          { name: 'Adult Hockey', start: '22:00', end: '23:15', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        6: [ // Saturday
          { name: '30+ Hockey', start: '10:00', end: '11:15', type: 'Drop-in Hockey', age: '30 yrs+', startDate: '2026-01-10', endDate: '2026-02-28' },
          { name: 'Stick, Ring & Puck', start: '11:30', end: '12:30', type: 'Drop-in Hockey', startDate: '2026-01-10', endDate: '2026-02-28' },
          { name: 'Public Skate', start: '16:45', end: '18:00', type: 'Public Skating' },
          { name: 'Stick, Ring & Puck', start: '18:15', end: '19:15', type: 'Drop-in Hockey', endDate: '2026-02-28' },
          { name: 'Adult Stick, Ring & Puck', start: '19:30', end: '20:30', type: 'Drop-in Hockey', endDate: '2026-02-28' },
        ],
      },
      specialEvents: [
        { date: '2026-02-16', name: 'Family Day Family Skate', start: '14:15', end: '15:30', type: 'Family Skate' },
        { date: '2026-02-16', name: 'Family Day Family Skate', start: '15:45', end: '17:00', type: 'Family Skate' },
        { date: '2026-02-27', name: 'Pro D Day Toonie Skate', start: '13:45', end: '14:45', type: 'Discount Skate' },
      ],
    },

    // Spring Break: Mar 16 - Mar 29, 2026
    {
      start: '2026-03-16',
      end: '2026-03-29',
      cancelledDays: new Set(['2026-03-27']), // No city programs Friday March 27
      cancelledSlots: new Set([]),
      schedule: {
        0: [ // Sunday
          { name: 'Adult & Child Toonie Skate', start: '08:30', end: '09:30', type: 'Family Skate', age: '0-6 yrs with adult' },
          { name: 'Toonie Skate', start: '09:45', end: '11:00', type: 'Discount Skate' },
          { name: 'Toonie Skate', start: '11:15', end: '12:30', type: 'Discount Skate' },
          { name: 'Child Hockey', start: '12:45', end: '13:45', type: 'Drop-in Hockey', age: '9-12 yrs' },
          { name: 'Stick, Ring & Puck', start: '14:00', end: '15:00', type: 'Drop-in Hockey' },
          { name: 'Adult Stick, Ring & Puck', start: '15:15', end: '16:15', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        1: [ // Monday
          { name: 'Stick, Ring & Puck', start: '15:45', end: '16:45', type: 'Drop-in Hockey' },
          { name: 'Family Skate', start: '19:30', end: '20:45', type: 'Family Skate' },
          { name: 'Adult Stick, Ring & Puck', start: '21:00', end: '22:00', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        2: [ // Tuesday
          { name: 'Family Skate', start: '15:45', end: '16:45', type: 'Family Skate' },
          { name: 'Stick, Ring & Puck', start: '19:30', end: '20:30', type: 'Drop-in Hockey' },
          { name: 'Adult Hockey', start: '20:45', end: '22:00', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        3: [ // Wednesday
          { name: 'Stick, Ring & Puck', start: '15:45', end: '16:45', type: 'Drop-in Hockey' },
          { name: 'Family Skate', start: '19:30', end: '20:45', type: 'Family Skate' },
          { name: 'Adult Stick, Ring & Puck', start: '21:00', end: '22:00', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        4: [ // Thursday
          { name: 'Family Skate', start: '15:45', end: '16:45', type: 'Family Skate' },
          { name: 'Female Stick, Ring & Puck', start: '19:30', end: '20:30', type: 'Drop-in Hockey' },
          { name: 'Adult Hockey', start: '20:45', end: '22:00', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        5: [], // Friday - all activities are week 1 only (special events)
        6: [ // Saturday
          { name: '30+ Hockey', start: '10:15', end: '11:30', type: 'Drop-in Hockey', age: '30 yrs+' },
          { name: 'Family Stick, Ring & Puck', start: '11:45', end: '12:45', type: 'Family Hockey' },
          { name: 'Public Skate', start: '13:00', end: '14:15', type: 'Public Skating' },
          { name: 'Public Skate', start: '14:30', end: '15:45', type: 'Public Skating' },
          { name: 'Stick, Ring & Puck', start: '16:00', end: '17:00', type: 'Drop-in Hockey' },
        ],
      },
      specialEvents: [
        // Week 1 only activities (Mar 16-20)
        // Monday Mar 16
        { date: '2026-03-16', name: 'Stick, Ring & Puck', start: '11:45', end: '12:45', type: 'Drop-in Hockey' },
        { date: '2026-03-16', name: 'Family Skate', start: '13:00', end: '14:15', type: 'Family Skate' },
        { date: '2026-03-16', name: 'Stick, Ring & Puck', start: '14:30', end: '15:30', type: 'Drop-in Hockey' },
        // Tuesday Mar 17
        { date: '2026-03-17', name: 'Stick, Ring & Puck', start: '11:45', end: '12:45', type: 'Drop-in Hockey' },
        { date: '2026-03-17', name: 'Family Skate', start: '13:00', end: '14:15', type: 'Family Skate' },
        { date: '2026-03-17', name: 'Stick, Ring & Puck', start: '14:30', end: '15:30', type: 'Drop-in Hockey' },
        // Wednesday Mar 18
        { date: '2026-03-18', name: 'Stick, Ring & Puck', start: '11:45', end: '12:45', type: 'Drop-in Hockey' },
        { date: '2026-03-18', name: 'Family Skate', start: '13:00', end: '14:15', type: 'Family Skate' },
        { date: '2026-03-18', name: 'Stick, Ring & Puck', start: '14:30', end: '15:30', type: 'Drop-in Hockey' },
        // Thursday Mar 19
        { date: '2026-03-19', name: 'Stick, Ring & Puck', start: '11:45', end: '12:45', type: 'Drop-in Hockey' },
        { date: '2026-03-19', name: 'Family Skate', start: '13:00', end: '14:15', type: 'Family Skate' },
        { date: '2026-03-19', name: 'Stick, Ring & Puck', start: '14:30', end: '15:30', type: 'Drop-in Hockey' },
        // Friday Mar 20
        { date: '2026-03-20', name: 'Family Stick, Ring & Puck', start: '12:00', end: '13:00', type: 'Family Hockey' },
        { date: '2026-03-20', name: 'Family Stick, Ring & Puck', start: '13:15', end: '14:15', type: 'Family Hockey' },
        { date: '2026-03-20', name: 'Family Skate', start: '14:30', end: '15:30', type: 'Family Skate' },
        { date: '2026-03-20', name: 'Family Skate', start: '15:45', end: '16:45', type: 'Family Skate' },
        { date: '2026-03-20', name: 'Stick, Ring & Puck', start: '19:30', end: '20:30', type: 'Drop-in Hockey' },
      ],
    },

    // Spring 2026: Apr 12 - Jun 28
    {
      start: '2026-04-12',
      end: '2026-06-28',
      cancelledDays: new Set([
        '2026-05-18', // Victoria Day - regular Monday programs cancelled
      ]),
      cancelledSlots: new Set([
        '2026-05-24|13:30', // Family Skate replaced by Sensory Friendly Skate
      ]),
      schedule: {
        0: [ // Sunday
          { name: 'Family Skate', start: '13:30', end: '14:45', type: 'Family Skate' },
        ],
        1: [ // Monday
          { name: 'Adult & Child Toonie Skate', start: '09:45', end: '11:00', type: 'Family Skate', age: '0-6 yrs with adult' },
          { name: '50+ Toonie Skate', start: '11:15', end: '12:30', type: 'Public Skating', age: '50 yrs+' },
          { name: 'Adult Hockey', start: '22:00', end: '23:15', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        2: [ // Tuesday
          { name: 'Toonie Stick, Ring & Puck', start: '10:30', end: '11:30', type: 'Drop-in Hockey' },
          { name: 'Toonie Skate', start: '11:45', end: '12:45', type: 'Discount Skate' },
        ],
        3: [ // Wednesday
          { name: 'Toonie Skate', start: '20:45', end: '21:45', type: 'Discount Skate' },
          { name: 'Adult Stick, Ring & Puck', start: '22:00', end: '23:00', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        4: [ // Thursday
          { name: 'Toonie Adult Hockey', start: '10:30', end: '11:30', type: 'Drop-in Hockey', age: '19 yrs+' },
          { name: 'Toonie Skate', start: '11:45', end: '12:45', type: 'Discount Skate' },
        ],
        5: [ // Friday
          { name: 'Adult & Child Toonie Skate', start: '09:45', end: '11:00', type: 'Family Skate', age: '0-6 yrs with adult' },
          { name: 'Toonie Skate', start: '11:15', end: '12:30', type: 'Discount Skate' },
          { name: 'Youth Toonie Skate', start: '20:45', end: '21:45', type: 'Discount Skate', age: '11-18 yrs' },
          { name: 'Adult Hockey', start: '22:00', end: '23:15', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
        6: [ // Saturday
          { name: 'Public Skate', start: '16:30', end: '18:00', type: 'Public Skating' },
          { name: 'Family Stick, Ring & Puck', start: '18:15', end: '19:15', type: 'Family Hockey' },
          { name: 'Adult Stick, Ring & Puck', start: '19:30', end: '20:30', type: 'Drop-in Hockey', age: '19 yrs+' },
        ],
      },
      specialEvents: [
        // Victoria Day Monday May 18 - special family skates
        { date: '2026-05-18', name: 'Family Skate', start: '13:00', end: '14:15', type: 'Family Skate' },
        { date: '2026-05-18', name: 'Family Skate', start: '14:30', end: '15:45', type: 'Family Skate' },
        // Sensory Friendly Skate replaces Family Skate on May 24
        { date: '2026-05-24', name: 'Sensory Friendly Skate', start: '13:30', end: '14:45', type: 'Public Skating' },
      ],
    },
  ];

  // Generate sessions from periods
  const todayStr = formatDate(today);
  const scheduleEndStr = CONFIG.coquitlam.scheduleEnd;
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
        if (activity.startDate && dateStr < activity.startDate) continue;

        const slotKey = `${dateStr}|${activity.start}`;
        if (period.cancelledSlots && period.cancelledSlots.has(slotKey)) continue;

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
          facilityUrl: facility.scheduleUrl || '',
          scheduleUrl: facility.scheduleUrl || scheduleUrl,
        });
        sessionCount++;
      }
    }

    // Add special events for this period
    if (period.specialEvents) {
      for (const event of period.specialEvents) {
        if (event.date >= todayStr && event.date <= scheduleEndStr) {
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
            ageRange: event.age,
            activityUrl: scheduleUrl,
            facilityUrl: facility.scheduleUrl || '',
            scheduleUrl: facility.scheduleUrl || scheduleUrl,
          });
          sessionCount++;
        }
      }
    }
  }

  console.error(`  Coquitlam: ${sessionCount} sessions`);
  return allSessions;
}

module.exports = {
  getCoquitlamSchedules,
};
