/**
 * Scraper exports
 */

const { scrapeVancouver } = require('./vancouver');
const { getBurnabySchedules } = require('./burnaby');
const { getRichmondSchedules } = require('./richmond');
const { getPocoSchedules } = require('./poco');
const { getCoquitlamSchedules } = require('./coquitlam');
const { scrapeNorthVan } = require('./northvan');
const { scrapeWestVan } = require('./westvan');
const { scrapeNewWest } = require('./newwest');
const { getOutdoorRinks } = require('./outdoor');

module.exports = {
  scrapeVancouver,
  getBurnabySchedules,
  getRichmondSchedules,
  getPocoSchedules,
  getCoquitlamSchedules,
  scrapeNorthVan,
  scrapeWestVan,
  scrapeNewWest,
  getOutdoorRinks,
};
