#!/usr/bin/env node
/**
 * Puppeteer-based scraper for Metro Vancouver skating schedules
 *
 * Intercepts the ActiveNet calendar API to get all scheduled events.
 * The API returns individual event occurrences (not series), which is what we need.
 *
 * Usage:
 *   node puppeteer-scraper.js                    # Scrape all and output JSON
 *   node puppeteer-scraper.js --output data.json # Save to file
 *   node puppeteer-scraper.js --daily --output ../data/schedules  # Daily files
 *   node puppeteer-scraper.js --ical             # Output iCal format
 *   node puppeteer-scraper.js --debug            # Show browser window
 *   node puppeteer-scraper.js --city vancouver   # Specific city only
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Import configuration and utilities
const { CONFIG } = require('./config');
const { validateScheduleDates, generateICal } = require('./utils');

// Import scrapers
const {
  scrapeVancouver,
  getBurnabySchedules,
  getRichmondSchedules,
  getPocoSchedules,
  getCoquitlamSchedules,
  scrapeNorthVan,
  scrapeWestVan,
  scrapeNewWest,
  getOutdoorRinks,
} = require('./scrapers');

/**
 * Launch browser
 */
async function createBrowser(debug = false) {
  const browser = await puppeteer.launch({
    executablePath: CONFIG.chromiumPath,
    headless: debug ? false : 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();
  // Wide viewport to show all facility columns at once
  await page.setViewport({ width: 2560, height: 1200 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  return { browser, page };
}

/**
 * Main scraping function
 * @param {Object} options - { debug, cities: ['vancouver', 'burnaby', 'richmond', 'poco', 'coquitlam', 'northvan', 'westvan', 'newwest', 'outdoor'] }
 */
async function scrapeAll(options = {}) {
  const { debug = false, cities = ['vancouver', 'burnaby', 'richmond', 'poco', 'coquitlam', 'northvan', 'westvan', 'newwest', 'outdoor'] } = options;

  // Validate hardcoded schedule dates before scraping
  const expiredSchedules = validateScheduleDates();
  if (expiredSchedules.length > 0) {
    console.error('\n*** SCHEDULE VALIDATION FAILED ***');
    console.error('The following hardcoded schedules have expired and need to be updated:\n');
    for (const schedule of expiredSchedules) {
      console.error(`  ${schedule.city}:`);
      console.error(`    - Schedule ended: ${schedule.scheduleEnd}`);
      console.error(`    - Update function: ${schedule.function}`);
      console.error(`    - See CLAUDE.md for update instructions\n`);
    }
    throw new Error(`Expired schedules: ${expiredSchedules.map(s => s.city).join(', ')}`);
  }

  let browser;
  const allSessions = [];
  const seenKeys = new Set();

  try {
    const { browser: b, page } = await createBrowser(debug);
    browser = b;

    // Scrape Vancouver via API
    if (cities.includes('vancouver')) {
      const vancouverSessions = await scrapeVancouver(page);
      for (const session of vancouverSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Add Burnaby schedules (hardcoded weekly pattern)
    if (cities.includes('burnaby')) {
      const burnabySessions = getBurnabySchedules();
      for (const session of burnabySessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Add Richmond schedules (hardcoded - updated quarterly from PDF)
    if (cities.includes('richmond')) {
      const startTime = Date.now();
      const richmondSessions = getRichmondSchedules();

      for (const session of richmondSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
      console.error(`    (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
    }

    // Add Port Coquitlam schedules (hardcoded - updated quarterly from PDF)
    if (cities.includes('poco')) {
      const startTime = Date.now();
      const pocoSessions = getPocoSchedules();

      for (const session of pocoSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
      console.error(`    (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
    }

    // Add Coquitlam schedules (hardcoded - updated quarterly from PDF)
    if (cities.includes('coquitlam')) {
      const startTime = Date.now();
      const coquitlamSessions = getCoquitlamSchedules();

      for (const session of coquitlamSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
      console.error(`    (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
    }

    // Scrape North Vancouver
    if (cities.includes('northvan')) {
      const northvanSessions = await scrapeNorthVan(browser);
      for (const session of northvanSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Scrape West Vancouver
    if (cities.includes('westvan')) {
      const westvanSessions = await scrapeWestVan(browser);
      for (const session of westvanSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Scrape New Westminster
    if (cities.includes('newwest')) {
      const newwestSessions = await scrapeNewWest(browser);
      for (const session of newwestSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

    // Add outdoor rinks (Robson Square, Shipyards)
    if (cities.includes('outdoor')) {
      const outdoorSessions = getOutdoorRinks();
      for (const session of outdoorSessions) {
        const key = `${session.facility}-${session.date}-${session.startTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allSessions.push(session);
        }
      }
    }

  } finally {
    if (browser) await browser.close();
  }

  // Sort by date and time
  allSessions.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  return {
    success: true,
    lastUpdated: new Date().toISOString(),
    sessions: allSessions,
    count: allSessions.length,
  };
}

/**
 * Write sessions to daily JSON files organized as schedules/YYYY/MM/DD/<sport>.json
 * @param {Object} result - Scraper result with sessions
 * @param {string} outputDir - Output directory path
 * @param {string} sport - Sport type ('ice-skating' or 'swimming')
 */
function writeDailyFiles(result, outputDir, sport = 'ice-skating') {
  // Group sessions by date
  const sessionsByDate = {};
  for (const session of result.sessions) {
    if (!sessionsByDate[session.date]) {
      sessionsByDate[session.date] = [];
    }
    sessionsByDate[session.date].push(session);
  }

  // Write each day's file
  const dates = Object.keys(sessionsByDate).sort();
  for (const dateStr of dates) {
    const [year, month, day] = dateStr.split('-');
    const dirPath = path.join(outputDir, year, month, day);
    fs.mkdirSync(dirPath, { recursive: true });

    const filePath = path.join(dirPath, `${sport}.json`);
    const dayData = {
      date: dateStr,
      sessions: sessionsByDate[dateStr],
      count: sessionsByDate[dateStr].length,
    };
    fs.writeFileSync(filePath, JSON.stringify(dayData, null, 2));
  }

  // Write index file with metadata
  const indexData = {
    success: true,
    lastUpdated: result.lastUpdated,
    totalSessions: result.count,
    dateRange: {
      start: dates[0],
      end: dates[dates.length - 1],
    },
    dates: dates,
  };
  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(indexData, null, 2));

  // Print summary
  console.error(`\n  Schedule Summary:`);
  console.error(`  ─────────────────────────────────────────`);
  console.error(`  Total files: ${dates.length}`);
  console.error(`  Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.error(`  Total sessions: ${result.count}`);
  console.error(`\n  Sessions per day:`);
  for (const dateStr of dates) {
    const count = sessionsByDate[dateStr].length;
    const bar = '█'.repeat(Math.min(count, 30));
    console.error(`    ${dateStr}: ${String(count).padStart(3)} ${bar}`);
  }
  console.error(`  ─────────────────────────────────────────`);

  return dates.length;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const debug = args.includes('--debug');
  const ical = args.includes('--ical');
  const daily = args.includes('--daily');
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

  // Parse city filters: --city vancouver --city burnaby OR --city vancouver,burnaby
  const cityArgs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--city' && args[i + 1]) {
      cityArgs.push(...args[i + 1].split(','));
      i++;
    }
  }
  const cities = cityArgs.length > 0 ? cityArgs : ['vancouver', 'burnaby', 'richmond', 'poco', 'coquitlam', 'northvan', 'westvan', 'newwest', 'outdoor'];

  console.error('Metro Vancouver Skating Schedule Scraper');
  console.error('========================================');
  console.error(`Date: ${new Date().toISOString()}`);
  console.error(`Mode: ${debug ? 'Debug' : 'Headless'}`);
  console.error(`Cities: ${cities.join(', ')}`);
  console.error(`Output: ${daily ? 'Daily files' : 'Single file'}`);
  console.error('');

  try {
    const result = await scrapeAll({ debug, cities });

    if (daily && outputPath) {
      // Write daily files to directory structure
      fs.mkdirSync(outputPath, { recursive: true });
      writeDailyFiles(result, outputPath);
    } else {
      const output = ical ? generateICal(result.sessions) : JSON.stringify(result, null, 2);
      if (outputPath) {
        fs.writeFileSync(outputPath, output);
        console.error(`Output written to: ${outputPath}`);
      } else {
        console.log(output);
      }
    }

    console.error(`\nScraping complete. Found ${result.count} sessions.`);

  } catch (e) {
    console.error('Scraping failed:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

module.exports = { scrapeAll, generateICal, CONFIG, writeDailyFiles };

if (require.main === module) {
  main();
}
