# Metro Vancouver Skating Schedule

A web app that aggregates public skating schedules from recreation centers across Metro Vancouver into a unified calendar interface.

**Live site:** [https://metro-vancouver-sports.cor-net.org/](https://metro-vancouver-sports.cor-net.org/)

## Features

- **Unified Calendar** - View skating sessions from multiple cities in one place
- **Multiple Views** - Day, week, and month calendar views
- **Smart Filtering** - Filter by activity type, city, or facility
- **Location Awareness** - Find sessions near you with distance calculations
- **Interactive Map** - See all facilities on a map with hover highlighting
- **Session Details** - Activity info, times, registration links, Google Calendar integration

## Supported Facilities

### Vancouver
- Hillcrest Centre
- Kerrisdale Cyclone Taylor Arena
- Killarney Rink
- Kitsilano Rink
- Sunset Rink
- Trout Lake Rink
- West End Community Centre

### Burnaby
- Kensington Complex
- Rosemary Brown Recreation Centre

### North Vancouver
- Karen Magnussen Community Recreation Centre
- Harry Jerome Community Recreation Centre
- Canlan Ice Sports North Shore

### West Vancouver
- West Vancouver Community Centre

### New Westminster
- Queen's Park Arena
- Moody Park Arena

### Outdoor Rinks (Seasonal)
- Robson Square Ice Rink (Vancouver)
- The Shipyards Skate Plaza (North Vancouver)

## Activity Types

- Public Skating
- Family Skate
- Drop-in Hockey / Shinny
- Figure Skating
- Parent & Tot Skate
- Discount/Toonie Skate

## Data Updates

Schedules are automatically scraped daily at 6 AM UTC (10 PM Pacific) via GitHub Actions.

## Development

### Running the Scraper

```bash
cd backend
npm install

# Scrape all cities
node puppeteer-scraper.js --daily --output ../data/schedules

# Scrape specific city
node puppeteer-scraper.js --city vancouver --output ../data/schedules.json

# Debug mode (show browser)
node puppeteer-scraper.js --debug --output ../data/schedules.json
```

### Project Structure

```
/
├── index.html              # Frontend (single-page app)
├── backend/
│   ├── puppeteer-scraper.js  # Main scraper
│   └── package.json
├── data/
│   └── schedules/          # Daily JSON files
└── .github/workflows/
    └── scrape-schedules.yml  # Automated scraping
```

## Contributing

Feel free to open issues or pull requests for:
- Adding new facilities
- Fixing scraping issues
- UI improvements

## License

MIT
