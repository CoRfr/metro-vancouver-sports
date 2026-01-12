#!/usr/bin/env node
const puppeteer = require('puppeteer-core');

async function investigate() {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROMIUM_PATH || '/snap/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Search for "skating" (broader term)
  const url = 'https://anc.ca.apm.activecommunities.com/vancouver/activity/search?activity_keyword=skating&viewMode=list';
  console.log('Searching for all skating activities in Vancouver...');
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

  // Wait for cards
  await page.waitForSelector('.activity-card', { timeout: 15000 });

  // Scroll to load more
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 500));
  }

  // Extract all unique locations and activity names
  const data = await page.evaluate(() => {
    const cards = document.querySelectorAll('.activity-card');
    const activities = new Map();

    cards.forEach(card => {
      const nameEl = card.querySelector('.activity-card-info__name a, .activity-card-info__name span');
      const name = nameEl ? nameEl.textContent.trim() : 'Unknown';

      const locationEl = card.querySelector('.activity-card-info__location');
      const location = locationEl ? locationEl.textContent.trim().replace(/^\*/, '') : 'Unknown';

      // Extract the base activity name (before day/time)
      const baseName = name.split(' - ').slice(0, -1).join(' - ') || name;

      const key = location + '|||' + baseName;
      if (!activities.has(key)) {
        activities.set(key, { location, baseName, fullName: name, count: 1 });
      } else {
        activities.get(key).count++;
      }
    });

    return Array.from(activities.values());
  });

  console.log('\nFound ' + data.length + ' unique activity types:\n');

  // Group by location
  const byLocation = {};
  data.forEach(a => {
    if (!byLocation[a.location]) byLocation[a.location] = [];
    byLocation[a.location].push(a.baseName + ' (' + a.count + ')');
  });

  Object.keys(byLocation).sort().forEach(loc => {
    console.log('\n' + loc + ':');
    byLocation[loc].forEach(a => console.log('  - ' + a));
  });

  // Also check which have "public" in the name
  console.log('\n\n=== Activities with "public" or "drop-in" in name ===');
  data.filter(a =>
    a.baseName.toLowerCase().includes('public') ||
    a.baseName.toLowerCase().includes('drop-in')
  ).forEach(a => {
    console.log(a.location + ': ' + a.baseName + ' (' + a.count + ')');
  });

  await browser.close();
}

investigate().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
