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
 * Based on "Effective January 5-March 12/13" schedules from burnaby.ca
 */
function getBurnabySchedules() {
  console.error('Adding Burnaby schedules...');
  const allSessions = [];

  // Use facilities from CONFIG
  const facilities = {};
  for (const [key, facility] of Object.entries(CONFIG.burnaby.facilities)) {
    facilities[key] = { ...facility };
  }

  // Weekly schedules from burnaby.ca screenshots
  // Format: { day: [{ name, start, end, age }] }
  const kensingtonSchedule = {
    1: [ // Monday
      { name: 'Lap Skate', start: '09:30', end: '11:30', age: '8 yrs+' },
      { name: 'Toonie Skate', start: '11:45', end: '13:15', age: 'All ages' },
      { name: 'Family Skate', start: '18:00', end: '20:15', age: 'Children with adult 16 yrs+' },
    ],
    4: [ // Thursday
      { name: 'Lap Skate', start: '09:00', end: '10:00', age: '8 yrs+' },
      { name: 'Shoot & Score', start: '10:15', end: '11:30', age: '18 yrs+' },
      { name: 'Toonie Skate', start: '11:45', end: '13:15', age: 'All ages' },
      { name: 'Parent & Tot Skate', start: '13:30', end: '15:15', age: '2-5 yrs with adult' },
    ],
    5: [ // Friday
      { name: 'Public Skate', start: '17:15', end: '19:30', age: 'All ages' },
      { name: 'Family Hockey & Ringette', start: '19:45', end: '20:45', age: '6-12 yrs with adult' },
    ],
  };

  const rosemaryBrownSchedule = {
    1: [ // Monday
      { name: 'Recreational Hockey', start: '10:00', end: '11:15', age: '50 yrs+, Rink B' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink B' },
      { name: 'Parent & Tot Skate', start: '13:15', end: '15:15', age: '2-5 yrs with adult, Rink A' },
      { name: 'Lap Skate', start: '19:30', end: '20:45', age: '8 yrs+, Rink A' },
    ],
    2: [ // Tuesday
      { name: 'Lap Skate', start: '10:15', end: '11:30', age: '8 yrs+, Rink A' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink B' },
      { name: 'Toonie Skate', start: '11:45', end: '13:00', age: 'All ages, Rink A' },
      { name: 'Parent & Tot Skate', start: '13:15', end: '15:15', age: '2-5 yrs with adult, Rink A' },
      { name: 'Public Skate', start: '18:00', end: '20:15', age: 'All ages, Rink A' },
    ],
    3: [ // Wednesday
      { name: 'Recreational Hockey', start: '10:00', end: '11:15', age: '50 yrs+, Rink B' },
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink B' },
      { name: 'Figure Skating', start: '12:15', end: '13:30', age: '16 yrs+, Rink A' },
    ],
    4: [ // Thursday
      { name: 'Shoot & Score', start: '11:30', end: '12:45', age: '18 yrs+, Rink B' },
      { name: 'Toonie Skate', start: '11:45', end: '13:00', age: 'All ages, Rink A' },
      { name: 'Toonie Skate & Activities', start: '15:15', end: '16:45', age: '8-17 yrs, Rink A' },
      { name: 'Family Skate', start: '17:00', end: '19:15', age: 'Children with adults, 16 yrs+, Rink A' },
      { name: 'Lap Skate', start: '19:30', end: '20:45', age: '8 yrs+, Rink A' },
    ],
    5: [ // Friday
      { name: 'Recreational Ringette', start: '10:00', end: '11:15', age: '18 yrs+, Rink A' },
      { name: 'Recreational Hockey', start: '11:30', end: '12:45', age: '18 yrs+, Rink A' },
    ],
    6: [ // Saturday
      { name: 'Public Skate', start: '17:00', end: '19:15', age: 'All ages, Rink A' },
      { name: 'Toonie Skate & Activities', start: '19:30', end: '21:00', age: '13-17 yrs, Rink A' },
    ],
    0: [ // Sunday
      { name: 'Public Skate', start: '13:45', end: '17:00', age: 'All ages, Rink A' },
    ],
  };

  const schedules = [
    { facility: facilities['kensington'], schedule: kensingtonSchedule },
    { facility: facilities['rosemary-brown'], schedule: rosemaryBrownSchedule },
  ];

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);

  for (const { facility, schedule } of schedules) {
    let count = 0;
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayActivities = schedule[d.getDay()];
      if (!dayActivities) continue;

      for (const activity of dayActivities) {
        // Generate dynamic scheduleUrl with activity_tid and location_ref
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
          date: formatDate(d),
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
    console.error(`  ${facility.name}: ${count} sessions`);
  }

  console.error(`  Burnaby total: ${allSessions.length} sessions`);
  return allSessions;
}

module.exports = {
  getBurnabySchedules,
};
