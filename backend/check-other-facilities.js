#!/usr/bin/env node
const puppeteer = require('puppeteer-core');

async function checkFacility(page, facility) {
  const url = `https://anc.ca.apm.activecommunities.com/vancouver/activity/search?activity_keyword=skating+${encodeURIComponent(facility)}&viewMode=list`;
  console.log(`\n=== ${facility} ===`);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

  try {
    await page.waitForSelector('.activity-card', { timeout: 10000 });
  } catch {
    console.log('No results found');
    return;
  }

  const activities = await page.evaluate(() => {
    const cards = document.querySelectorAll('.activity-card');
    return Array.from(cards).slice(0, 5).map(card => {
      const name = card.querySelector('.activity-card-info__name a, .activity-card-info__name span')?.textContent?.trim() || '';
      const location = card.querySelector('.activity-card-info__location')?.textContent?.trim() || '';
      const text = card.innerText;
      return { name, location, snippet: text.substring(0, 200) };
    });
  });

  activities.forEach(a => {
    console.log(`\nActivity: ${a.name}`);
    console.log(`Location: ${a.location}`);
    console.log(`Details: ${a.snippet.replace(/\n/g, ' | ')}`);
  });
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROMIUM_PATH || '/snap/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const facilities = ['Kerrisdale', 'Kitsilano', 'Sunset', 'Trout Lake', 'West End'];

  for (const facility of facilities) {
    await checkFacility(page, facility);
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
}

main().catch(console.error);
