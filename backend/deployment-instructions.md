# Deployment Instructions

## Part 1: Deploy the Cloudflare Worker

### Step 1: Set up Cloudflare Workers
1. Go to [workers.cloudflare.com](https://workers.cloudflare.com)
2. Sign up for a free account (100,000 requests/day free)
3. Click "Create a Service"
4. Name it something like `skating-scraper`

### Step 2: Deploy the Worker Code
1. In the Cloudflare Workers dashboard, click on your new worker
2. Click "Quick Edit"
3. Delete all the sample code
4. Copy and paste the entire code from `scraper.js` artifact
5. Click "Save and Deploy"

### Step 3: Get Your Worker URL
After deploying, you'll get a URL like:
```
https://skating-scraper.YOUR-SUBDOMAIN.workers.dev
```

Copy this URL - you'll need it for the frontend.

### Step 4: Test the Worker
Visit your worker URL in a browser. You should see JSON output with skating sessions:
```json
{
  "success": true,
  "lastUpdated": "2026-01-11T...",
  "sessions": [...],
  "count": 42
}
```

**Note:** The first run might be slow or return empty data if the scraping approach needs adjustment based on the actual ActiveNet HTML structure. We may need to iterate on the scraping logic.

---

## Part 2: Update the Frontend

### Update the HTML app to fetch from your worker:

In the `<script>` section, replace the `sampleSessions` array and add this code at the beginning:

```javascript
let allSessions = [];
let filteredSessions = [];
let userLocation = null;
let currentDate = new Date();
let viewMode = 'day';
let isLoading = true;

// Your Cloudflare Worker URL
const WORKER_URL = 'https://skating-scraper.YOUR-SUBDOMAIN.workers.dev';

// Fetch real data on page load
async function fetchRealData() {
  try {
    isLoading = true;
    renderLoading();
    
    const response = await fetch(WORKER_URL);
    const data = await response.json();
    
    if (data.success && data.sessions) {
      allSessions = data.sessions;
      filteredSessions = [...allSessions];
      isLoading = false;
      initializeFilters();
      filterSessions();
    } else {
      throw new Error('Failed to fetch sessions');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    isLoading = false;
    renderError();
  }
}

function renderLoading() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading skating sessions...</div>';
}

function renderError() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '<div style="text-align: center; padding: 40px; color: #c62828;">Error loading sessions. Please try again later.</div>';
}

// Call this at the end of the script instead of the current initialization
fetchRealData();
```

---

## Part 3: Deploy Frontend to GitHub Pages

1. Create a new GitHub repository
2. Create a file called `index.html`
3. Paste your updated frontend code (with the worker URL)
4. Go to Settings → Pages
5. Select "main" branch
6. Click Save
7. Wait 1-2 minutes
8. Visit: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME`

---

## Troubleshooting

### If the worker returns empty sessions:
The ActiveNet scraping logic might need adjustment. The HTML structure may be different than expected. You can:

1. Visit the ActiveNet pages manually to inspect their structure
2. Update the scraping logic in the worker based on actual HTML
3. Use browser DevTools to see what API calls the calendar makes
4. Consider using Puppeteer/Playwright for JavaScript-rendered content (requires paid Cloudflare plan)

### Alternative: Browser Extension Approach
If scraping proves too difficult, consider building a browser extension that runs client-side and can access the DOM directly.

### Checking Worker Logs
In Cloudflare dashboard:
- Go to your worker
- Click "Logs" tab (Logpush)
- See real-time errors and debugging info

---

## Cost
- **Cloudflare Workers Free Tier**: 100,000 requests/day
- **GitHub Pages**: Free
- **Total**: $0/month for typical usage

---

## Next Steps After Deployment

1. Test with real postal codes
2. Verify distance calculations work
3. Check that all filters function properly
4. Monitor worker logs for any scraping errors
5. Iterate on scraping logic if needed based on actual HTML structure
