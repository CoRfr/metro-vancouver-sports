#!/usr/bin/env node
/**
 * Test script for the skating schedule scraper
 * Tests the scraping logic against actual ActiveNet endpoints
 *
 * Usage: node test-scraper.js
 */

// ============================================
// Core scraping functions (extracted from backend-scraper.js)
// ============================================

const VANCOUVER_FACILITIES = [
  { name: 'Britannia Community Centre', id: 24, lat: 49.2754, lng: -123.0719, address: '1661 Napier St, Vancouver' },
  { name: 'Hillcrest Centre', id: 16, lat: 49.2438, lng: -123.1090, address: '4575 Clancy Loranger Way, Vancouver' },
  { name: 'Kerrisdale Arena', id: 23, lat: 49.2337, lng: -123.1607, address: '5851 West Boulevard, Vancouver' },
  { name: 'Killarney Rink', id: 26, lat: 49.2275, lng: -123.0456, address: '6260 Killarney St, Vancouver' },
  { name: 'Kitsilano Rink', id: 27, lat: 49.2713, lng: -123.1570, address: '2690 Larch St, Vancouver' },
  { name: 'Sunset Community Centre', id: 32, lat: 49.2267, lng: -123.1003, address: '6810 Main St, Vancouver' },
  { name: 'Trout Lake Community Centre', id: 33, lat: 49.2544, lng: -123.0636, address: '3360 Victoria Dr, Vancouver' },
  { name: 'West End Community Centre', id: 34, lat: 49.2863, lng: -123.1353, address: '870 Denman St, Vancouver' }
];

const BURNABY_FACILITIES = [
  { name: 'Bill Copeland Sports Centre', lat: 49.2389, lng: -123.0042, address: '3676 Kensington Ave, Burnaby' },
  { name: 'Kensington Arena', lat: 49.2267, lng: -123.0036, address: '6050 McMurray Ave, Burnaby' },
  { name: 'Rosemary Brown Arena', lat: 49.2085, lng: -122.9526, address: '7789 18th St, Burnaby, BC V3N 5E5' }
];

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

  return 'Public Skating';
}

// ============================================
// Test utilities
// ============================================

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function logSubsection(title) {
  console.log('\n' + '-'.repeat(40));
  console.log(title);
  console.log('-'.repeat(40));
}

// ============================================
// Unit Tests
// ============================================

function testDetermineActivityType() {
  logSection('Unit Test: determineActivityType()');

  const testCases = [
    { input: 'Public Skating', expected: 'Public Skating' },
    { input: 'Family Skate', expected: 'Family Skate' },
    { input: 'Family Skating Session', expected: 'Family Skate' },
    { input: 'Family Hockey', expected: 'Family Hockey' },
    { input: 'Figure Skating Practice', expected: 'Figure Skating' },
    { input: 'Ice Skating General', expected: 'Public Skating' }, // Default
    { input: '', expected: 'Public Skating' }, // Empty string
    { input: null, expected: 'Public Skating' }, // Null
    { input: undefined, expected: 'Public Skating' }, // Undefined
  ];

  let passed = 0;
  let failed = 0;

  for (const { input, expected } of testCases) {
    const result = determineActivityType(input);
    const status = result === expected ? 'PASS' : 'FAIL';

    if (result === expected) {
      passed++;
      console.log(`  [${status}] "${input}" -> "${result}"`);
    } else {
      failed++;
      console.log(`  [${status}] "${input}" -> "${result}" (expected: "${expected}")`);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// ============================================
// Integration Tests - Fetch and analyze actual pages
// ============================================

async function testFetchEndpoint(city, url) {
  logSubsection(`Testing ${city} endpoint`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.log(`[FAIL] HTTP error: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    console.log(`Response size: ${html.length} bytes`);

    // Check for various patterns that might contain data
    const patterns = [
      { name: 'var searchResults', regex: /var\s+searchResults\s*=\s*({[\s\S]*?});/ },
      { name: 'window.__INITIAL_STATE__', regex: /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/ },
      { name: '__NEXT_DATA__', regex: /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/ },
      { name: 'JSON-LD', regex: /<script type="application\/ld\+json">([\s\S]*?)<\/script>/ },
      { name: 'data-activities', regex: /data-activities="([^"]*)"/ },
      { name: 'activities array', regex: /"activities"\s*:\s*\[/ },
      { name: 'React root', regex: /<div id="(root|app|__next)"/ },
    ];

    console.log('\nPattern analysis:');
    for (const { name, regex } of patterns) {
      const match = html.match(regex);
      if (match) {
        console.log(`  [FOUND] ${name}`);
        if (name === 'var searchResults') {
          try {
            const data = JSON.parse(match[1]);
            console.log(`    -> Valid JSON, keys: ${Object.keys(data).join(', ')}`);
            if (data.activities) {
              console.log(`    -> Found ${data.activities.length} activities`);
            }
          } catch (e) {
            console.log(`    -> JSON parse error: ${e.message}`);
          }
        }
      } else {
        console.log(`  [NOT FOUND] ${name}`);
      }
    }

    // Check if page appears to be client-side rendered
    const hasReactRoot = /<div id="(root|app|__next)"/.test(html);
    const hasMinimalContent = html.length < 5000;
    const hasNoScriptWarning = /enable JavaScript/i.test(html);

    console.log('\nRendering analysis:');
    console.log(`  React/SPA detected: ${hasReactRoot}`);
    console.log(`  Minimal HTML (likely SPA): ${hasMinimalContent}`);
    console.log(`  "Enable JavaScript" warning: ${hasNoScriptWarning}`);

    // Try to extract any useful data patterns
    const activityMatches = html.match(/activity|skating|skate|rink|arena/gi);
    console.log(`  Keywords found: ${activityMatches ? activityMatches.length : 0} mentions of activity/skating/rink/arena`);

    // Save a sample of the HTML for inspection
    return {
      success: true,
      html,
      isClientRendered: hasReactRoot || hasMinimalContent || hasNoScriptWarning
    };

  } catch (error) {
    console.log(`[FAIL] Fetch error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testActiveNetEndpoints() {
  logSection('Integration Test: ActiveNet Endpoints');

  const endpoints = [
    { city: 'Vancouver', url: 'https://anc.ca.apm.activecommunities.com/vancouver/activity/search?activity_select_param=2&activity_category_ids=18&viewMode=list' },
    { city: 'Vancouver (cat 20)', url: 'https://anc.ca.apm.activecommunities.com/vancouver/activity/search?activity_select_param=2&activity_category_ids=20&viewMode=list' },
    { city: 'Burnaby', url: 'https://anc.ca.apm.activecommunities.com/burnaby/activity/search?activity_select_param=2&activity_category_ids=18&viewMode=list' },
  ];

  const results = [];

  for (const { city, url } of endpoints) {
    const result = await testFetchEndpoint(city, url);
    results.push({ city, url, ...result });

    // Small delay between requests to be polite
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}

// ============================================
// Alternative API exploration
// ============================================

async function exploreAlternativeAPIs() {
  logSection('Exploring Alternative APIs');

  // ActiveNet often has API endpoints that return JSON directly
  const apiEndpoints = [
    {
      name: 'Vancouver API Search',
      url: 'https://anc.ca.apm.activecommunities.com/vancouver/rest/activities/search?activity_select_param=2&activity_category_ids=18'
    },
    {
      name: 'Vancouver Facilities API',
      url: 'https://anc.ca.apm.activecommunities.com/vancouver/rest/facilities'
    },
    {
      name: 'Burnaby API Search',
      url: 'https://anc.ca.apm.activecommunities.com/burnaby/rest/activities/search?activity_select_param=2&activity_category_ids=18'
    },
  ];

  for (const { name, url } of apiEndpoints) {
    logSubsection(name);
    console.log(`URL: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);

      if (response.ok) {
        const text = await response.text();
        console.log(`Response size: ${text.length} bytes`);

        // Try to parse as JSON
        try {
          const data = JSON.parse(text);
          console.log('[SUCCESS] Valid JSON response');
          console.log(`Keys: ${Object.keys(data).join(', ')}`);

          // Show sample of data structure
          if (data.activities || data.results || data.items) {
            const items = data.activities || data.results || data.items;
            console.log(`Found ${items.length} items`);
            if (items.length > 0) {
              console.log('Sample item keys:', Object.keys(items[0]).join(', '));
            }
          }
        } catch (e) {
          console.log(`[INFO] Not JSON: ${text.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      console.log(`[ERROR] ${error.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }
}

// ============================================
// Check if cities have public API docs or iCal feeds
// ============================================

async function checkPublicFeeds() {
  logSection('Checking for Public Calendar Feeds');

  // Many cities publish iCal/RSS feeds for recreation activities
  const feedUrls = [
    { name: 'Vancouver Recreation ICS', url: 'https://vancouver.ca/parks-recreation-culture/ice-rinks.aspx' },
    { name: 'Burnaby Recreation', url: 'https://www.burnaby.ca/recreation-and-arts/skating-and-ice-programs' },
  ];

  for (const { name, url } of feedUrls) {
    console.log(`\nChecking: ${name}`);
    console.log(`URL: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      console.log(`Status: ${response.status}`);

      if (response.ok) {
        const html = await response.text();

        // Look for calendar/feed links
        const icsLinks = html.match(/href="[^"]*\.ics"/gi) || [];
        const rssLinks = html.match(/href="[^"]*(?:rss|feed)[^"]*"/gi) || [];
        const apiLinks = html.match(/href="[^"]*(?:api|json)[^"]*"/gi) || [];

        console.log(`  ICS links found: ${icsLinks.length}`);
        console.log(`  RSS links found: ${rssLinks.length}`);
        console.log(`  API links found: ${apiLinks.length}`);

        if (icsLinks.length > 0) {
          console.log(`  Sample ICS: ${icsLinks[0]}`);
        }
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }
}

// ============================================
// Main test runner
// ============================================

async function main() {
  console.log('Metro Vancouver Skating Scraper - Test Suite');
  console.log('============================================');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Node.js: ${process.version}`);

  // Run unit tests
  const unitTestsPassed = testDetermineActivityType();

  // Run integration tests
  const endpointResults = await testActiveNetEndpoints();

  // Explore alternative APIs
  await exploreAlternativeAPIs();

  // Check for public feeds
  await checkPublicFeeds();

  // Summary
  logSection('Test Summary');

  console.log('\nUnit Tests:');
  console.log(`  determineActivityType: ${unitTestsPassed ? 'PASSED' : 'FAILED'}`);

  console.log('\nEndpoint Tests:');
  for (const result of endpointResults) {
    const status = result.success ? (result.isClientRendered ? 'REACHABLE (client-rendered)' : 'REACHABLE (server-rendered)') : 'FAILED';
    console.log(`  ${result.city}: ${status}`);
  }

  console.log('\nRecommendations:');
  const allClientRendered = endpointResults.every(r => r.isClientRendered);
  if (allClientRendered) {
    console.log('  - ActiveNet appears to use client-side rendering');
    console.log('  - Current regex-based HTML parsing likely will not work');
    console.log('  - Consider: Puppeteer/Playwright for JS rendering');
    console.log('  - Consider: Finding official REST API endpoints');
    console.log('  - Consider: Using city-provided data feeds if available');
  } else {
    console.log('  - Some pages may be server-rendered');
    console.log('  - Test the specific data extraction patterns');
  }
}

main().catch(console.error);
