// Cloudflare Worker for scraping Vancouver & Burnaby skating schedules
// Deploy this at: workers.cloudflare.com

export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    try {
      // Check if we have cached data (cache for 1 hour)
      const cache = caches.default;
      const cacheKey = new Request(request.url, request);
      let response = await cache.match(cacheKey);

      if (!response) {
        // No cache, scrape fresh data
        const sessions = await scrapeAllSessions();
        
        const data = {
          success: true,
          lastUpdated: new Date().toISOString(),
          sessions: sessions,
          count: sessions.length
        };

        response = new Response(JSON.stringify(data, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          }
        });

        // Store in cache
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};

async function scrapeAllSessions() {
  const sessions = [];
  
  // Scrape Vancouver
  const vancouverSessions = await scrapeVancouverActivities();
  sessions.push(...vancouverSessions);
  
  // Scrape Burnaby
  const burnabySessions = await scrapeBurnabyActivities();
  sessions.push(...burnabySessions);
  
  return sessions;
}

async function scrapeVancouverActivities() {
  const sessions = [];
  
  // Vancouver uses ActiveNet - we'll fetch their activity search endpoint
  // This is the API that their calendar calls internally
  const baseUrl = 'https://anc.ca.apm.activecommunities.com/vancouver/activity/search';
  
  const facilities = [
    { name: 'Britannia Community Centre', id: 24, lat: 49.2754, lng: -123.0719, address: '1661 Napier St, Vancouver' },
    { name: 'Hillcrest Centre', id: 16, lat: 49.2438, lng: -123.1090, address: '4575 Clancy Loranger Way, Vancouver' },
    { name: 'Kerrisdale Arena', id: 23, lat: 49.2337, lng: -123.1607, address: '5851 West Boulevard, Vancouver' },
    { name: 'Killarney Rink', id: 26, lat: 49.2275, lng: -123.0456, address: '6260 Killarney St, Vancouver' },
    { name: 'Kitsilano Rink', id: 27, lat: 49.2713, lng: -123.1570, address: '2690 Larch St, Vancouver' },
    { name: 'Sunset Community Centre', id: 32, lat: 49.2267, lng: -123.1003, address: '6810 Main St, Vancouver' },
    { name: 'Trout Lake Community Centre', id: 33, lat: 49.2544, lng: -123.0636, address: '3360 Victoria Dr, Vancouver' },
    { name: 'West End Community Centre', id: 34, lat: 49.2863, lng: -123.1353, address: '870 Denman St, Vancouver' }
  ];

  // Activity category IDs for skating (these are standard in ActiveNet)
  // 18 = Ice Skating, 20 = Public Skating
  const categoryIds = [18, 20];
  
  for (const category of categoryIds) {
    try {
      const url = `${baseUrl}?activity_select_param=2&activity_category_ids=${category}&viewMode=list`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) continue;
      
      const html = await response.text();
      
      // Parse the HTML to extract session data
      // ActiveNet typically includes JSON data in script tags
      const jsonMatch = html.match(/var\s+searchResults\s*=\s*({[\s\S]*?});/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        
        // Process activities
        if (data.activities && Array.isArray(data.activities)) {
          for (const activity of data.activities) {
            // Match facility
            const facility = facilities.find(f => 
              activity.location_name?.includes(f.name.split(' ')[0]) ||
              activity.location_id === f.id
            );
            
            if (!facility) continue;
            
            // Extract sessions from activity times
            if (activity.times && Array.isArray(activity.times)) {
              for (const time of activity.times) {
                sessions.push({
                  facility: facility.name,
                  city: 'Vancouver',
                  address: facility.address,
                  lat: facility.lat,
                  lng: facility.lng,
                  date: time.date || time.start_date,
                  startTime: time.start_time || '00:00',
                  endTime: time.end_time || '00:00',
                  type: determineActivityType(activity.name || activity.activity_name)
                });
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error scraping Vancouver category:', category, error);
    }
  }
  
  return sessions;
}

async function scrapeBurnabyActivities() {
  const sessions = [];
  
  const baseUrl = 'https://anc.ca.apm.activecommunities.com/burnaby/activity/search';
  
  const facilities = [
    { name: 'Bill Copeland Sports Centre', lat: 49.2389, lng: -123.0042, address: '3676 Kensington Ave, Burnaby' },
    { name: 'Kensington Arena', lat: 49.2267, lng: -123.0036, address: '6050 McMurray Ave, Burnaby' },
    { name: 'Rosemary Brown Arena', lat: 49.2085, lng: -122.9526, address: '7789 18th St, Burnaby, BC V3N 5E5' }
  ];

  const categoryIds = [18, 20]; // Ice Skating categories
  
  for (const category of categoryIds) {
    try {
      const url = `${baseUrl}?activity_select_param=2&activity_category_ids=${category}&viewMode=list`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) continue;
      
      const html = await response.text();
      
      // Try to find JSON data
      const jsonMatch = html.match(/var\s+searchResults\s*=\s*({[\s\S]*?});/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        
        if (data.activities && Array.isArray(data.activities)) {
          for (const activity of data.activities) {
            const facility = facilities.find(f => 
              activity.location_name?.includes(f.name.split(' ')[0])
            );
            
            if (!facility) continue;
            
            if (activity.times && Array.isArray(activity.times)) {
              for (const time of activity.times) {
                sessions.push({
                  facility: facility.name,
                  city: 'Burnaby',
                  address: facility.address,
                  lat: facility.lat,
                  lng: facility.lng,
                  date: time.date || time.start_date,
                  startTime: time.start_time || '00:00',
                  endTime: time.end_time || '00:00',
                  type: determineActivityType(activity.name || activity.activity_name)
                });
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error scraping Burnaby category:', category, error);
    }
  }
  
  return sessions;
}

function determineActivityType(activityName) {
  const name = activityName?.toLowerCase() || '';
  
  if (name.includes('family') && name.includes('hockey')) {
    return 'Family Hockey';
  }
  if (name.includes('family') && (name.includes('skate') || name.includes('skating'))) {
    return 'Family Skate';
  }
  if (name.includes('figure')) {
    return 'Figure Skating';
  }
  if (name.includes('public')) {
    return 'Public Skating';
  }
  
  // Default to public skating if unclear
  return 'Public Skating';
}
