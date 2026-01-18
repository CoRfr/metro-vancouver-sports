/**
 * Configuration for Metro Vancouver skating schedule scraper
 */

const CONFIG = {
  chromiumPath: process.env.CHROMIUM_PATH || '/snap/bin/chromium',
  headless: true,
  timeout: 60000,

  // Vancouver calendar config - uses ActiveNet API
  vancouver: {
    // Use view=1 and multiple locationIds to get all facilities
    calendarUrl: 'https://anc.ca.apm.activecommunities.com/vancouver/calendars?onlineSiteId=0&no_scroll_top=true&defaultCalendarId=3&locationId=22,23,25,26,27,28,9&displayType=0&view=1',
    apiPattern: '/rest/onlinecalendar/multicenter/events',
    facilities: {
      // Map center_id to facility info (IDs from ActiveNet)
      9: { name: 'West End Community Centre', lat: 49.29048, lng: -123.13653, address: '870 Denman St, Vancouver, BC V6G 2L8' },
      22: { name: 'Hillcrest Centre', lat: 49.24407, lng: -123.10781, address: '4575 Clancy Loranger Way, Vancouver, BC V5Y 2M4' },
      23: { name: 'Kerrisdale Cyclone Taylor Arena', lat: 49.23529, lng: -123.15403, address: '5670 East Blvd, Vancouver, BC V6M 3Y2' },
      25: { name: 'Killarney Rink', lat: 49.22673, lng: -123.04345, address: '6260 Killarney St, Vancouver, BC V5S 2X7' },
      26: { name: 'Kitsilano Rink', lat: 49.26237, lng: -123.16199, address: '2690 Larch St, Vancouver, BC V6K 4K9' },
      27: { name: 'Sunset Rink', lat: 49.22323, lng: -123.09821, address: '6810 Main St, Vancouver, BC V5X 0A1' },
      28: { name: 'Trout Lake Rink', lat: 49.25486, lng: -123.06521, address: '3360 Victoria Dr, Vancouver, BC V5N 4M4' },
    },
    // Fallback facility matching by name
    facilityAliases: {
      'hillcrest': 22,
      'kerrisdale': 23,
      'cyclone taylor': 23,
      'killarney': 25,
      'kitsilano': 26,
      'kits': 26,
      'sunset': 27,
      'trout lake': 28,
      'west end': 9,
    },
  },

  // Burnaby config - uses burnaby.ca daily activities
  burnaby: {
    // Daily activities pages by facility
    dailyActivitiesUrl: 'https://www.burnaby.ca/recreation-and-arts/activities-and-registration/daily-activities',
    // Schedule valid: Jan 5 - Mar 12/13, 2026
    scheduleEnd: '2026-03-13',
    facilities: {
      'kensington': {
        name: 'Kensington Complex',
        lat: 49.27777,
        lng: -122.97553,
        address: '6159 Curtis St, Burnaby, BC V5B 4X7',
        locationRef: '3046',
      },
      'rosemary-brown': {
        name: 'Rosemary Brown Recreation Centre',
        lat: 49.20880,
        lng: -122.95250,
        address: '7789 18th St, Burnaby, BC V3N 5E5',
        locationRef: '6916',
      },
      'bill-copeland': {
        name: 'Bill Copeland Sports Centre',
        lat: 49.25240,
        lng: -122.96537,
        address: '3676 Kensington Ave, Burnaby, BC V5B 4Z6',
        locationRef: '2991',
      },
      'burnaby-lake': {
        name: 'Burnaby Lake Arena',
        lat: 49.25073,
        lng: -122.96543,
        address: '3676 Kensington Ave, Burnaby, BC V5B 4Z6',
        locationRef: '2982',
      },
    },
    // Activity type IDs on burnaby.ca
    activityTypes: {
      656: 'Public Skating',
      657: 'Family Skate',
      658: 'Toonie Skate',
      660: 'Lap Skate',
      661: 'Parent & Tot Skate',
    },
  },

  // North Vancouver config - uses nvrc.ca drop-in schedules
  northvan: {
    dropInUrl: 'https://www.nvrc.ca/drop-in-schedules?activity=551&location=All&service=All',
    facilities: {
      'karen magnussen': {
        name: 'Karen Magnussen Community Centre',
        lat: 49.33232,
        lng: -123.04566,
        address: '2300 Kirkstone Rd, North Vancouver, BC V7J 1Z6',
      },
      'harry jerome': {
        name: 'Harry Jerome Community Recreation Centre',
        lat: 49.32990,
        lng: -123.07048,
        address: '123 East 23rd St, North Vancouver, BC V7L 3E2',
      },
      'canlan': {
        name: 'Canlan Ice Sports North Shore',
        lat: 49.31372,
        lng: -123.00401,
        address: '2411 Mt Seymour Pkwy, North Vancouver, BC V7H 2Y9',
      },
    },
  },

  // West Vancouver config - uses westvancouver.ca daily activities
  westvan: {
    dropInUrl: 'https://westvancouver.ca/parks-recreation/recreation-programs-services/daily-activities-search-results?activity_type=dropins&ages=9/6/8/3/10/12&activities=122/121/119/123&locations=35',
    facility: {
      name: 'West Vancouver Community Centre',
      lat: 49.3415329,
      lng: -123.2338840,
      address: '2121 Marine Dr, West Vancouver, BC V7V 1K5',
    },
  },

  // New Westminster config - uses PerfectMind booking system
  newwest: {
    skatingUrl: 'https://cityofnewwestminster.perfectmind.com/23693/Clients/BookMe4BookingPages/Classes?calendarId=db250b43-ef6b-43c5-979e-3f3d1dab2d67&widgetId=2edd14d7-7dee-4a06-85e1-e211553c48d5&embed=False',
    hockeyUrl: 'https://cityofnewwestminster.perfectmind.com/23693/Clients/BookMe4BookingPages/Classes?calendarId=8008f9e0-3515-4bfd-8e14-b56cc27c5341&widgetId=2edd14d7-7dee-4a06-85e1-e211553c48d5&embed=False',
    facilities: {
      "queen's park arena": {
        name: "Queen's Park Arena",
        lat: 49.21487,
        lng: -122.90604,
        address: '51 3rd Ave, New Westminster, BC V3L 1L7',
      },
      'moody park arena': {
        name: 'Moody Park Arena',
        lat: 49.21554,
        lng: -122.92878,
        address: '701 8th Ave, New Westminster, BC V3M 2R2',
      },
    },
  },

  // Richmond config - hardcoded weekly schedules from PDF
  richmond: {
    facilities: {
      'ric': {
        name: 'Richmond Ice Centre',
        lat: 49.13639,
        lng: -123.06669,
        address: '14140 Triangle Rd, Richmond, BC V6W 1K4',
        url: 'https://www.richmond.ca/parks-recreation/about/schedules.htm',
      },
      'minoru': {
        name: 'Minoru Arenas',
        lat: 49.16447,
        lng: -123.14295,
        address: '7551 Minoru Gate, Richmond, BC V6Y 1R8',
        url: 'https://www.richmond.ca/parks-recreation/about/schedules.htm',
      },
    },
    // Schedule valid: Jan 5 - Mar 13, 2026
    scheduleStart: '2026-01-05',
    scheduleEnd: '2026-03-13',
  },

  // Port Coquitlam config - hardcoded from portcoquitlam.ca PDF
  poco: {
    facility: {
      name: 'Port Coquitlam Community Centre',
      lat: 49.26008,
      lng: -122.77703,
      address: '2150 Wilson Ave, Port Coquitlam, BC V3C 6J5',
    },
    schedulesUrl: 'https://www.portcoquitlam.ca/recreation-parks/skating/public-skates',
    // Schedule valid: Jan 5 - Feb 24, 2026
    scheduleEnd: '2026-02-24',
  },

  // Coquitlam config - hardcoded from coquitlam.ca PDF
  coquitlam: {
    facility: {
      name: 'Poirier Sport and Leisure Complex',
      lat: 49.25460,
      lng: -122.84526,
      address: '633 Poirier St, Coquitlam, BC V3J 6B1',
    },
    schedulesUrl: 'https://www.coquitlam.ca/979/Drop-In-Activities',
    // Schedule valid: Jan 3 - Mar 12, 2026
    scheduleEnd: '2026-03-12',
  },
};

module.exports = { CONFIG };
