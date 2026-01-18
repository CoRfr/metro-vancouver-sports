/**
 * Utility functions for Metro Vancouver skating schedule scraper
 */

const { CONFIG } = require('./config');

/**
 * Validate that hardcoded schedules are not expired
 * Returns list of expired schedules, empty if all valid
 */
function validateScheduleDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expired = [];

  // Check Burnaby schedule
  if (CONFIG.burnaby.scheduleEnd) {
    const endDate = new Date(CONFIG.burnaby.scheduleEnd);
    if (today > endDate) {
      expired.push({
        city: 'Burnaby',
        scheduleEnd: CONFIG.burnaby.scheduleEnd,
        function: 'getBurnabySchedules()',
      });
    }
  }

  // Check Richmond schedule
  if (CONFIG.richmond.scheduleEnd) {
    const endDate = new Date(CONFIG.richmond.scheduleEnd);
    if (today > endDate) {
      expired.push({
        city: 'Richmond',
        scheduleEnd: CONFIG.richmond.scheduleEnd,
        function: 'getRichmondSchedules()',
      });
    }
  }

  // Check Port Coquitlam schedule
  if (CONFIG.poco.scheduleEnd) {
    const endDate = new Date(CONFIG.poco.scheduleEnd);
    if (today > endDate) {
      expired.push({
        city: 'Port Coquitlam',
        scheduleEnd: CONFIG.poco.scheduleEnd,
        function: 'getPocoSchedules()',
      });
    }
  }

  // Check Coquitlam schedule
  if (CONFIG.coquitlam.scheduleEnd) {
    const endDate = new Date(CONFIG.coquitlam.scheduleEnd);
    if (today > endDate) {
      expired.push({
        city: 'Coquitlam',
        scheduleEnd: CONFIG.coquitlam.scheduleEnd,
        function: 'getCoquitlamSchedules()',
      });
    }
  }

  return expired;
}

/**
 * Determine activity type from name
 */
function determineActivityType(name) {
  const n = (name || '').toLowerCase();

  if (n.includes('family') && n.includes('hockey')) return 'Family Hockey';
  if (n.includes('shinny') || (n.includes('drop') && n.includes('hockey'))) return 'Drop-in Hockey';
  if (n.includes('stick') && n.includes('puck')) return 'Drop-in Hockey';
  if (n.includes('para') && n.includes('hockey')) return 'Para Hockey';
  if (n.includes('hockey')) return 'Hockey';
  if (n.includes('parent') && (n.includes('tot') || n.includes('preschool'))) return 'Family Skate';
  if ((n.includes('family') || n.includes('tot')) && n.includes('skat')) return 'Family Skate';
  if (n.includes('figure')) return 'Figure Skating';
  if (n.includes('public') || n.includes('drop-in') || n.includes('drop in') ||
      n.includes('toonie') || n.includes('discount') || n.includes('loonie')) return 'Public Skating';
  if (n.includes('adult') && n.includes('skat')) return 'Public Skating';
  if (n.includes('lesson') || n.includes('learn') || n.includes('class') ||
      n.includes('canskate') || n.includes('intro')) return 'Skating Lessons';
  if (n.includes('practice') || n.includes('freestyle')) return 'Practice';

  return 'Skating';
}

/**
 * Check if a swimming activity should be skipped (not actual swimming)
 */
function shouldSkipSwimmingActivity(name) {
  const n = (name || '').toLowerCase();

  // Skip sauna/whirlpool-only activities (not actual swimming)
  if ((n.includes('sauna') || n.includes('whirlpool') || n.includes('hot tub') ||
       n.includes('steam') || n.includes('jacuzzi')) &&
      !n.includes('swim') && !n.includes('pool') && !n.includes('lap') &&
      !n.includes('aqua')) {
    return true;
  }

  return false;
}

/**
 * Determine swimming activity type from name
 */
function determineSwimmingActivityType(name) {
  const n = (name || '').toLowerCase();

  // Lessons and programs
  if (n.includes('lesson') || n.includes('learn') || n.includes('class') ||
      n.includes('preschool swim') || n.includes('youth swim') || n.includes('red cross')) {
    return 'Lessons';
  }

  // Aquafit / Water fitness
  if (n.includes('aquafit') || n.includes('aqua fit') || n.includes('water fitness') ||
      n.includes('aquacise') || n.includes('deep water') || n.includes('hydro')) {
    return 'Aquafit';
  }

  // Lap swim
  if (n.includes('lap') || n.includes('lane swim') || n.includes('lengths')) {
    return 'Lap Swim';
  }

  // Family / Parent-tot swim
  if (n.includes('family') || n.includes('parent') || n.includes('tot') ||
      n.includes('child') && n.includes('swim')) {
    return 'Family Swim';
  }

  // Adult swim
  if (n.includes('adult') && (n.includes('swim') || n.includes('only'))) {
    return 'Adult Swim';
  }

  // Public / Everyone swim
  if (n.includes('public') || n.includes('everyone') || n.includes('all ages') ||
      n.includes('drop-in') || n.includes('drop in') || n.includes('open swim') ||
      n.includes('recreation') || n.includes('leisure')) {
    return 'Public Swim';
  }

  // Length swim / Fitness swim
  if (n.includes('fitness swim') || n.includes('workout')) {
    return 'Lap Swim';
  }

  return 'Public Swim';
}

/**
 * Parse date string to YYYY-MM-DD
 */
function parseDate(dateText) {
  if (!dateText) return null;
  const match = dateText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})?/i);
  if (!match) return null;

  const months = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };

  const month = months[match[1].toLowerCase()];
  const day = match[2].padStart(2, '0');
  const year = match[3] || new Date().getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Parse time range
 */
function parseTimeRange(timeText) {
  if (!timeText) return { startTime: null, endTime: null };
  const match = timeText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
  if (!match) return { startTime: null, endTime: null };
  return {
    startTime: parseTime(match[1]),
    endTime: parseTime(match[2]),
  };
}

/**
 * Parse time to 24h format
 */
function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = (match[3] || '').toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  else if (period === 'AM' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Expand dates from card info (handles recurring patterns)
 */
function expandDates(card) {
  const dates = [];

  // If we have a date range and day patterns, expand
  if (card.dateRangeText && card.dayPatterns.length > 0) {
    // Try full date format first (with year)
    let rangeDates = card.dateRangeText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}/gi);

    // If no year in dates, try "Effective January 5-March 14" format
    if (!rangeDates || rangeDates.length < 2) {
      const effectiveMatch = card.dateRangeText.match(/Effective\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*[-–]\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i);
      if (effectiveMatch) {
        const currentYear = new Date().getFullYear();
        const startDateText = `${effectiveMatch[1]} ${effectiveMatch[2]}, ${currentYear}`;
        const endDateText = `${effectiveMatch[3]} ${effectiveMatch[4]}, ${currentYear}`;
        rangeDates = [startDateText, endDateText];
      }
    }

    // Also try simpler format without "Effective"
    if (!rangeDates || rangeDates.length < 2) {
      const simpleRangeMatch = card.dateRangeText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*[-–to]+\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i);
      if (simpleRangeMatch) {
        const currentYear = new Date().getFullYear();
        const startDateText = `${simpleRangeMatch[1]} ${simpleRangeMatch[2]}, ${currentYear}`;
        const endDateText = `${simpleRangeMatch[3]} ${simpleRangeMatch[4]}, ${currentYear}`;
        rangeDates = [startDateText, endDateText];
      }
    }

    if (rangeDates && rangeDates.length >= 2) {
      const startDate = parseDate(rangeDates[0]);
      const endDate = parseDate(rangeDates[1]);
      if (startDate && endDate) {
        const expanded = expandDateRange(startDate, endDate, card.dayPatterns);
        dates.push(...expanded);
        console.error(`    Expanded "${card.name}": ${rangeDates[0]} to ${rangeDates[1]} (${card.dayPatterns.join(', ')}) -> ${expanded.length} dates`);
      }
    }
  }

  // Fall back to individual dates
  if (dates.length === 0) {
    for (const dateText of card.dateTexts) {
      const date = parseDate(dateText);
      if (date) dates.push(date);
    }
  }

  return dates;
}

/**
 * Expand date range based on day patterns
 */
function expandDateRange(startDateStr, endDateStr, dayPatterns) {
  const dates = [];
  const dayMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6,
    'sundays': 0, 'mondays': 1, 'tuesdays': 2, 'wednesdays': 3,
    'thursdays': 4, 'fridays': 5, 'saturdays': 6,
  };

  const targetDays = dayPatterns.map(d => dayMap[d.toLowerCase()]).filter(d => d !== undefined);
  if (targetDays.length === 0) return [startDateStr];

  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  // Limit to 30 days from today
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);
  const actualEnd = end < maxDate ? end : maxDate;
  const actualStart = start > today ? start : today;

  for (let d = new Date(start); d <= actualEnd; d.setDate(d.getDate() + 1)) {
    if (targetDays.includes(d.getDay())) {
      dates.push(formatDate(d));
    }
  }

  return dates;
}

/**
 * Generate iCal format
 */
function generateICal(sessions) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Metro Vancouver Skating Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Metro Vancouver Public Skating',
  ];

  for (const session of sessions) {
    const uid = `${session.facility.replace(/\s/g, '')}-${session.date}-${session.startTime}`.replace(/[^a-z0-9-]/gi, '-');
    const dtStart = session.date.replace(/-/g, '') + 'T' + session.startTime.replace(/:/g, '') + '00';
    const dtEnd = session.date.replace(/-/g, '') + 'T' + session.endTime.replace(/:/g, '') + '00';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}@metro-vancouver-skating`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;TZID=America/Vancouver:${dtStart}`);
    lines.push(`DTEND;TZID=America/Vancouver:${dtEnd}`);
    lines.push(`SUMMARY:${session.type} - ${session.facility}`);
    lines.push(`LOCATION:${session.address}`);
    lines.push(`DESCRIPTION:${session.activityName}\\n${session.facility}\\n${session.city}`);
    lines.push(`GEO:${session.lat};${session.lng}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

module.exports = {
  validateScheduleDates,
  determineActivityType,
  determineSwimmingActivityType,
  shouldSkipSwimmingActivity,
  parseDate,
  formatDate,
  parseTimeRange,
  parseTime,
  expandDates,
  expandDateRange,
  generateICal,
};
