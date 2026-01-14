/**
 * Generic PDF Schedule Parser
 *
 * This module provides utilities for parsing skating schedules from PDF files.
 * City-specific parsers are implemented as separate functions that use these utilities.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ============================================================================
// Core PDF Utilities
// ============================================================================

/**
 * Download a file from URL to a local path
 * @param {string} url - URL to download
 * @param {string} destPath - Destination file path
 * @returns {Promise<void>}
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    const request = protocol.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 metro-vancouver-skating-scraper' }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

/**
 * Convert PDF to text using pdftotext
 * @param {string} pdfPath - Path to PDF file
 * @param {Object} options - Options for pdftotext
 * @param {boolean} options.layout - Preserve layout (default: true)
 * @param {boolean} options.raw - Raw mode, no layout (default: false)
 * @returns {string} Extracted text
 */
function pdfToText(pdfPath, options = {}) {
  const { layout = true, raw = false } = options;

  let args = [];
  if (layout && !raw) args.push('-layout');
  if (raw) args.push('-raw');
  args.push(pdfPath);
  args.push('-'); // Output to stdout

  try {
    const result = execSync(`pdftotext ${args.join(' ')}`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return result;
  } catch (error) {
    throw new Error(`pdftotext failed: ${error.message}`);
  }
}

/**
 * Download PDF and convert to text
 * @param {string} url - URL of PDF
 * @param {Object} options - Options for pdftotext
 * @returns {Promise<string>} Extracted text
 */
async function fetchPdfText(url, options = {}) {
  const tempPath = `/tmp/pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pdf`;

  try {
    await downloadFile(url, tempPath);
    const text = pdfToText(tempPath, options);
    return text;
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

// ============================================================================
// Time Parsing Utilities
// ============================================================================

/**
 * Parse time string to 24-hour format (HH:MM)
 * Handles: "7:30am", "7:30 AM", "19:30", "7:30-9:00am", etc.
 * @param {string} timeStr - Time string
 * @returns {string|null} Time in HH:MM format or null if parsing fails
 */
function parseTime(timeStr) {
  if (!timeStr) return null;

  const str = timeStr.trim().toLowerCase();

  // Match patterns like "7:30am", "7:30 am", "12:00pm"
  const match12h = str.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  if (match12h) {
    let hours = parseInt(match12h[1]);
    const minutes = match12h[2] ? parseInt(match12h[2]) : 0;
    const period = match12h[3].toLowerCase();

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Match 24-hour format "19:30"
  const match24h = str.match(/(\d{1,2}):(\d{2})/);
  if (match24h) {
    const hours = parseInt(match24h[1]);
    const minutes = parseInt(match24h[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Parse time range string
 * Handles: "7:30-9:00am", "7:30am-9:00am", "7:30am – 9:00pm", "10-11:30am"
 * @param {string} rangeStr - Time range string
 * @returns {{ start: string, end: string }|null} Start and end times in HH:MM format
 */
function parseTimeRange(rangeStr) {
  if (!rangeStr) return null;

  const str = rangeStr.trim();

  // Match ranges with various separators: "-", "–", "—", " to "
  const rangeMatch = str.match(/(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)\s*[-–—]\s*(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)/i);

  if (!rangeMatch) return null;

  let startStr = rangeMatch[1].trim();
  let endStr = rangeMatch[2].trim();

  // If end has am/pm but start doesn't, infer from end
  const endPeriodMatch = endStr.match(/(am|pm)/i);
  if (endPeriodMatch && !startStr.match(/(am|pm)/i)) {
    // Check if start time is likely in the opposite period
    // e.g., "10-1pm" means 10am-1pm, but "7:30-9pm" likely means 7:30pm-9pm
    const startHour = parseInt(startStr.match(/\d+/)[0]);
    const endHour = parseInt(endStr.match(/\d+/)[0]);
    const endPeriod = endPeriodMatch[1].toLowerCase();

    // If start hour > end hour and end is pm, start is likely am
    // e.g., "10-1pm" -> 10am-1pm
    if (startHour > endHour && endPeriod === 'pm') {
      startStr += 'am';
    } else {
      startStr += endPeriod;
    }
  }

  const start = parseTime(startStr);
  const end = parseTime(endStr);

  if (start && end) {
    return { start, end };
  }

  return null;
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Parse date range string
 * Handles: "Jan 5 – Mar 13", "January 5 to March 13, 2026", etc.
 * @param {string} rangeStr - Date range string
 * @param {number} defaultYear - Default year if not specified
 * @returns {{ start: Date, end: Date }|null}
 */
function parseDateRange(rangeStr, defaultYear = new Date().getFullYear()) {
  if (!rangeStr) return null;

  const months = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'sept': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11,
  };

  const str = rangeStr.toLowerCase();

  // Extract year if present
  const yearMatch = str.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : defaultYear;

  // Match patterns like "Jan 5 – Mar 13" or "January 5 to March 13"
  const rangePattern = /([a-z]+)\s*(\d{1,2})(?:st|nd|rd|th)?\s*[-–—to]+\s*([a-z]+)\s*(\d{1,2})(?:st|nd|rd|th)?/i;
  const match = str.match(rangePattern);

  if (match) {
    const startMonth = months[match[1].toLowerCase()];
    const startDay = parseInt(match[2]);
    const endMonth = months[match[3].toLowerCase()];
    const endDay = parseInt(match[4]);

    if (startMonth !== undefined && endMonth !== undefined) {
      const startDate = new Date(year, startMonth, startDay);
      let endDate = new Date(year, endMonth, endDay);

      // If end is before start, it's probably next year
      if (endDate < startDate) {
        endDate = new Date(year + 1, endMonth, endDay);
      }

      return { start: startDate, end: endDate };
    }
  }

  return null;
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get day of week index (0=Sunday, 1=Monday, etc.)
 * @param {string} dayStr - Day name
 * @returns {number|null}
 */
function parseDayOfWeek(dayStr) {
  const days = {
    'sun': 0, 'sunday': 0,
    'mon': 1, 'monday': 1,
    'tue': 2, 'tues': 2, 'tuesday': 2,
    'wed': 3, 'wednesday': 3,
    'thu': 4, 'thur': 4, 'thurs': 4, 'thursday': 4,
    'fri': 5, 'friday': 5,
    'sat': 6, 'saturday': 6,
  };

  const key = dayStr.toLowerCase().trim();
  return days[key] !== undefined ? days[key] : null;
}

/**
 * Generate dates for a specific day of week within a date range
 * @param {number} dayOfWeek - Day of week (0=Sunday)
 * @param {Date} startDate - Start of range
 * @param {Date} endDate - End of range
 * @returns {Date[]}
 */
function getDatesForDayOfWeek(dayOfWeek, startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);

  // Find first occurrence of the day
  while (current.getDay() !== dayOfWeek && current <= endDate) {
    current.setDate(current.getDate() + 1);
  }

  // Collect all occurrences
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

// ============================================================================
// Activity Type Classification
// ============================================================================

/**
 * Determine activity type from activity name
 * @param {string} activityName
 * @returns {string}
 */
function classifyActivity(activityName) {
  const name = activityName.toLowerCase();

  if (name.includes('family') && (name.includes('hockey') || name.includes('ringette'))) {
    return 'Family Hockey';
  }
  if (name.includes('shinny') || name.includes('drop-in hockey') ||
      name.includes('stick and puck') || name.includes('stick & puck') ||
      name.includes('ring, stick') || name.includes('adult hockey') ||
      name.includes('40+ adult') || name.includes('masters') ||
      name.includes('senior') && name.includes('hockey')) {
    return 'Drop-in Hockey';
  }
  if (name.includes('family') || name.includes('parent') || name.includes('tot') ||
      name.includes('playtime') || name.includes('play and skate')) {
    return 'Family Skate';
  }
  if (name.includes('figure')) {
    return 'Figure Skating';
  }
  if (name.includes('toonie') || name.includes('loonie') || name.includes('discount')) {
    return 'Discount Skate';
  }
  if (name.includes('lap skate')) {
    return 'Practice';
  }
  if (name.includes('55+') || name.includes('65+') || name.includes('adult') && name.includes('skate')) {
    return 'Public Skating';
  }

  return 'Public Skating';
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Core utilities
  downloadFile,
  pdfToText,
  fetchPdfText,

  // Time utilities
  parseTime,
  parseTimeRange,

  // Date utilities
  parseDateRange,
  formatDate,
  parseDayOfWeek,
  getDatesForDayOfWeek,

  // Activity classification
  classifyActivity,
};
