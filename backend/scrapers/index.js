/**
 * Scraper exports
 */

// Skating scrapers
const { scrapeVancouver } = require('./vancouver');
const { getBurnabySchedules } = require('./burnaby');
const { getRichmondSchedules } = require('./richmond');
const { getPocoSchedules } = require('./poco');
const { getCoquitlamSchedules } = require('./coquitlam');
const { scrapeNorthVan } = require('./northvan');
const { scrapeWestVan } = require('./westvan');
const { scrapeNewWest } = require('./newwest');
const { getOutdoorRinks } = require('./outdoor');

// Swimming scrapers
const { scrapeVancouverSwimming } = require('./vancouver-swimming');

module.exports = {
  // Skating
  scrapeVancouver,
  getBurnabySchedules,
  getRichmondSchedules,
  getPocoSchedules,
  getCoquitlamSchedules,
  scrapeNorthVan,
  scrapeWestVan,
  scrapeNewWest,
  getOutdoorRinks,
  // Swimming
  scrapeVancouverSwimming,
};
