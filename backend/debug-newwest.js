const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Drop-in Skating URL
  const url = 'https://cityofnewwestminster.perfectmind.com/23693/Clients/BookMe4BookingPages/Classes?calendarId=db250b43-ef6b-43c5-979e-3f3d1dab2d67&widgetId=2edd14d7-7dee-4a06-85e1-e211553c48d5&embed=False';

  console.log('Loading page...');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 10000)); // Wait for dynamic content to load

  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);

  // Parse sessions from page text
  const sessions = await page.evaluate(() => {
    const events = [];
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let currentDate = null;
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for date header like "Mon, Jan 12th, 2026"
      const dateMatch = line.match(/^\w+,\s+(\w+)\s+(\d+)\w*,?\s*(\d{4})?$/);
      if (dateMatch) {
        const [, monthStr, day, year] = dateMatch;
        const monthIdx = months.indexOf(monthStr);
        if (monthIdx !== -1) {
          const y = year ? parseInt(year) : currentYear;
          currentDate = `${y}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        continue;
      }

      // Check for activity name (contains # followed by number)
      const activityMatch = line.match(/^(.+?)\s+#(\d+)$/);
      if (activityMatch && currentDate) {
        const activityName = activityMatch[1].trim();

        // Next line should be time
        const timeLine = lines[i + 1] || '';
        const timeMatch = timeLine.match(/^(\d{1,2}:\d{2}\s*(?:am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:am|pm))$/i);

        // Line after that should be location
        const locationLine = lines[i + 2] || '';

        if (timeMatch) {
          const [, startTimeStr, endTimeStr] = timeMatch;

          // Convert to 24h format
          const to24 = (timeStr) => {
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
            if (!match) return null;
            let [, h, m, period] = match;
            h = parseInt(h);
            if (period.toLowerCase() === 'pm' && h < 12) h += 12;
            if (period.toLowerCase() === 'am' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${m}`;
          };

          const startTime = to24(startTimeStr);
          const endTime = to24(endTimeStr);

          if (startTime && endTime) {
            events.push({
              date: currentDate,
              activityName,
              startTime,
              endTime,
              location: locationLine
            });
          }
        }
      }
    }

    return events;
  });

  console.log(`\nFound ${sessions.length} sessions`);
  console.log(JSON.stringify(sessions.slice(0, 15), null, 2));

  await browser.close();
})();
