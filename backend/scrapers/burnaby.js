/**
 * Burnaby skating schedule scraper
 * Uses hardcoded weekly patterns from burnaby.ca
 */

const { CONFIG } = require('../config');
const { formatDate, determineActivityType } = require('../utils');

/**
 * Get activity type ID for Burnaby schedule URL
 * Maps activity names to burnaby.ca activity_tid values
 */
function getBurnabyActivityTid(activityName) {
  const name = (activityName || '').toLowerCase();

  // Map activity names to their activity_tid on burnaby.ca
  if (name.includes('parent') && name.includes('tot')) return 661; // Parent & Tot Skate
  if (name.includes('family') && name.includes('skate')) return 657; // Family Skate
  if (name.includes('toonie')) return 658; // Toonie Skate
  if (name.includes('lap skate')) return 660; // Lap Skate
  if (name.includes('public')) return 656; // Public Skating

  // No specific activity_tid for hockey/ringette/figure skating
  return null;
}

/**
 * Get Burnaby schedules from hardcoded weekly patterns
 * Spring 2026: March 30 - June 18 (only Rosemary Brown has ice)
 * Kensington, Bill Copeland, and Burnaby Lake switched to floor season
 */
function getBurnabySchedules() {
  console.error('Adding Burnaby schedules...');
  const allSessions = [];

  const facility = CONFIG.burnaby.facilities['rosemary-brown'];
  const scheduleEnd = new Date(CONFIG.burnaby.scheduleEnd + 'T00:00:00');

  // Weekly schedule from burnaby.ca (Effective March 30 - June 18)
  const schedule = {
    1: [ // Monday
      { name: 'Recreational Hockey', start: '10:00', end: '11:15', age: '50 yrs+, Rink A' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink A' },
    ],
    2: [ // Tuesday
      { name: 'Shoot & Score', start: '10:00', end: '11:15', age: '18 yrs+, Rink A' },
      { name: 'Toonie Skate', start: '11:45', end: '13:00', age: 'All ages, Rink A' },
    ],
    3: [ // Wednesday
      { name: 'Lap Skate', start: '10:00', end: '11:15', age: '8 yrs+, Rink A' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink A' },
      { name: 'Figure Skating', start: '13:00', end: '14:15', age: '16 yrs+, Rink A' },
    ],
    4: [ // Thursday
      { name: 'Toonie Skate', start: '11:45', end: '13:00', age: 'All ages, Rink A' },
      { name: 'Toonie Skate & Activities', start: '15:15', end: '16:45', age: '8-17 yrs, Rink A' },
    ],
    5: [ // Friday
      { name: 'Recreational Ringette', start: '10:00', end: '11:15', age: '18 yrs+, Rink A' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink A' },
    ],
    6: [ // Saturday
      { name: 'Recreational Hockey', start: '13:00', end: '14:15', age: '50 yrs+, Rink A' },
      { name: 'Parent & Tot Skate', start: '13:15', end: '15:15', age: '2-5 yrs with adult 16 yrs+, Rink A' },
      { name: 'Family Skate', start: '17:00', end: '18:15', age: 'Children with adults 16 yrs+, Rink A' },
      { name: 'Lap Skate', start: '18:30', end: '19:45', age: '8 yrs+, Rink A' },
    ],
    0: [ // Sunday
      { name: 'Public Skate', start: '13:45', end: '16:00', age: 'All ages, Rink A' },
      { name: 'Parent & Tot Skate', start: '16:15', end: '17:15', age: '2-5 yrs with adult 16 yrs+, Rink A' },
    ],
  };

  // Easter weekend (April 3-6) has modified schedule
  const easterDates = new Set(['2026-04-03', '2026-04-04', '2026-04-05', '2026-04-06']);
  const easterEvents = [
    // Friday April 3
    { date: '2026-04-03', name: 'Parent & Tot Skate', start: '09:30', end: '10:45', age: '2-5 yrs with adult 16 yrs+, Rink A' },
    { date: '2026-04-03', name: 'Public Skate', start: '11:45', end: '15:15', age: 'All ages, Rink A' },
    // Saturday April 4
    { date: '2026-04-04', name: 'Public Skate', start: '11:00', end: '13:15', age: 'All ages, Rink A' },
    { date: '2026-04-04', name: 'Parent & Tot Skate', start: '13:15', end: '15:15', age: '2-5 yrs with adult 16 yrs+, Rink A' },
    { date: '2026-04-04', name: 'Public Skate', start: '15:30', end: '17:45', age: 'All ages, Rink A' },
    // Sunday April 5
    { date: '2026-04-05', name: 'Recreational Hockey', start: '10:00', end: '11:15', age: '50 yrs+, Rink A' },
    { date: '2026-04-05', name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink A' },
    { date: '2026-04-05', name: 'Family Skate', start: '17:00', end: '18:15', age: 'Children with adults 16 yrs+, Rink A' },
    { date: '2026-04-05', name: 'Lap Skate', start: '18:30', end: '19:45', age: '8 yrs+, Rink A' },
    // Monday April 6
    { date: '2026-04-06', name: 'Parent & Tot Skate', start: '09:45', end: '11:00', age: '2-5 yrs with adult 16 yrs+, Rink A' },
    { date: '2026-04-06', name: 'Parent & Tot Skate', start: '16:15', end: '17:15', age: '2-5 yrs with adult 16 yrs+, Rink A' },
    { date: '2026-04-06', name: 'Toonie Skate & Activities', start: '18:00', end: '19:15', age: '8-17 yrs, Rink A' },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);
  if (endDate > scheduleEnd) endDate.setTime(scheduleEnd.getTime());

  let count = 0;
  for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);

    // Easter weekend uses special schedule
    if (easterDates.has(dateStr)) continue;

    const dayActivities = schedule[d.getDay()];
    if (!dayActivities) continue;

    for (const activity of dayActivities) {
      const activityTid = getBurnabyActivityTid(activity.name);
      let scheduleUrl = CONFIG.burnaby.dailyActivitiesUrl;
      if (activityTid) {
        scheduleUrl += `?activity_tid=${activityTid}&location_ref=${facility.locationRef}`;
      } else {
        scheduleUrl += `?location_ref=${facility.locationRef}`;
      }

      allSessions.push({
        facility: facility.name,
        city: 'Burnaby',
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        date: dateStr,
        startTime: activity.start,
        endTime: activity.end,
        type: determineActivityType(activity.name),
        activityName: activity.name,
        ageRange: activity.age,
        activityUrl: scheduleUrl,
        facilityUrl: facility.facilityUrl || '',
        scheduleUrl: scheduleUrl,
      });
      count++;
    }
  }

  // Add Easter events that fall within our date range
  const todayStr = formatDate(today);
  const endDateStr = formatDate(endDate);
  for (const event of easterEvents) {
    if (event.date >= todayStr && event.date <= endDateStr) {
      const activityTid = getBurnabyActivityTid(event.name);
      let scheduleUrl = CONFIG.burnaby.dailyActivitiesUrl;
      if (activityTid) {
        scheduleUrl += `?activity_tid=${activityTid}&location_ref=${facility.locationRef}`;
      } else {
        scheduleUrl += `?location_ref=${facility.locationRef}`;
      }

      allSessions.push({
        facility: facility.name,
        city: 'Burnaby',
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        date: event.date,
        startTime: event.start,
        endTime: event.end,
        type: determineActivityType(event.name),
        activityName: event.name,
        ageRange: event.age,
        activityUrl: scheduleUrl,
        facilityUrl: facility.facilityUrl || '',
        scheduleUrl: scheduleUrl,
      });
      count++;
    }
  }

  console.error(`  ${facility.name}: ${count} sessions`);
  console.error(`  Burnaby total: ${allSessions.length} sessions`);
  return allSessions;
}

module.exports = {
  getBurnabySchedules,
};
