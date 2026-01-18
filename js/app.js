// Sport configuration
const SPORTS_CONFIG = {
    skating: {
        name: 'Ice Skating',
        dataFile: 'ice-skating.json',
        activityTypes: [
            { id: 'activityAll', value: '__all__', label: 'All', checked: false, isAll: true },
            { id: 'activityPublic', value: 'Public Skating', label: 'Public Skating', checked: true },
            { id: 'activityDiscount', value: '__discount__', label: 'Discount/Free Only', checked: true },
            { id: 'activityFamily', value: 'Family Skate', label: 'Family Skating', checked: true },
            { id: 'activityFigure', value: 'Figure Skating', label: 'Figure Skating', checked: false },
            { id: 'activityLessons', value: 'Skating Lessons', label: 'Lessons', checked: false },
            { id: 'activityPractice', value: 'Practice', label: 'Practice', checked: false },
            { id: 'activityHockey', value: 'Hockey', label: 'Hockey', checked: false },
            { id: 'activityFamilyHockey', value: 'Family Hockey', label: 'Family Hockey', checked: false },
            { id: 'activityDropinHockey', value: 'Drop-in Hockey', label: 'Drop-in Hockey', checked: false },
            { id: 'activityOther', value: 'Skating', label: 'Other', checked: false },
        ]
    },
    swimming: {
        name: 'Swimming',
        dataFile: 'swimming.json',
        activityTypes: [
            { id: 'activityAll', value: '__all__', label: 'All', checked: false, isAll: true },
            { id: 'activityPublicSwim', value: 'Public Swim', label: 'Public Swim', checked: true },
            { id: 'activityLap', value: 'Lap Swim', label: 'Lap Swim', checked: true },
            { id: 'activityFamilySwim', value: 'Family Swim', label: 'Family Swim', checked: true },
            { id: 'activityAdultSwim', value: 'Adult Swim', label: 'Adult Swim', checked: true },
            { id: 'activityAquafit', value: 'Aquafit', label: 'Aquafit', checked: true },
            { id: 'activitySwimLessons', value: 'Lessons', label: 'Lessons', checked: false },
        ]
    }
};

let currentSport = 'skating';
const USE_SAMPLE_DATA = false; // Set to true to use sample data for testing

function getDataUrl() {
    return SPORTS_CONFIG[currentSport]?.dataUrl || './data/schedules.json';
}

const sampleSessions = [
    {
        facility: "Britannia Community Centre",
        city: "Vancouver",
        address: "1661 Napier St, Vancouver",
        lat: 49.2754,
        lng: -123.0719,
        date: "2026-01-15",
        startTime: "12:00",
        endTime: "13:30",
        type: "Public Skating"
    },
    {
        facility: "Hillcrest Centre",
        city: "Vancouver",
        address: "4575 Clancy Loranger Way, Vancouver",
        lat: 49.2438,
        lng: -123.1090,
        date: "2026-01-15",
        startTime: "15:00",
        endTime: "16:30",
        type: "Public Skating"
    },
    {
        facility: "Kerrisdale Arena",
        city: "Vancouver",
        address: "5851 West Boulevard, Vancouver",
        lat: 49.2337,
        lng: -123.1607,
        date: "2026-01-16",
        startTime: "14:00",
        endTime: "15:30",
        type: "Figure Skating"
    },
    {
        facility: "Bill Copeland Sports Centre",
        city: "Burnaby",
        address: "3676 Kensington Ave, Burnaby",
        lat: 49.2389,
        lng: -123.0042,
        date: "2026-01-16",
        startTime: "13:00",
        endTime: "14:30",
        type: "Public Skating"
    },
    {
        facility: "Kensington Arena",
        city: "Burnaby",
        address: "6050 McMurray Ave, Burnaby",
        lat: 49.2267,
        lng: -123.0036,
        date: "2026-01-17",
        startTime: "11:00",
        endTime: "12:30",
        type: "Family Skate"
    },
    {
        facility: "Sunset Community Centre",
        city: "Vancouver",
        address: "6810 Main St, Vancouver",
        lat: 49.2267,
        lng: -123.1003,
        date: "2026-01-17",
        startTime: "16:00",
        endTime: "17:30",
        type: "Family Hockey"
    },
    {
        facility: "Trout Lake Community Centre",
        city: "Vancouver",
        address: "3360 Victoria Dr, Vancouver",
        lat: 49.2544,
        lng: -123.0636,
        date: "2026-01-18",
        startTime: "10:00",
        endTime: "11:30",
        type: "Public Skating"
    },
    {
        facility: "Rosemary Brown Arena",
        city: "Burnaby",
        address: "5930 Humphries Ave, Burnaby",
        lat: 49.2258,
        lng: -122.9892,
        date: "2026-01-18",
        startTime: "14:30",
        endTime: "16:00",
        type: "Family Skate"
    },
    {
        facility: "Britannia Community Centre",
        city: "Vancouver",
        address: "1661 Napier St, Vancouver",
        lat: 49.2754,
        lng: -123.0719,
        date: "2026-01-20",
        startTime: "18:00",
        endTime: "19:30",
        type: "Figure Skating"
    },
    {
        facility: "Hillcrest Centre",
        city: "Vancouver",
        address: "4575 Clancy Loranger Way, Vancouver",
        lat: 49.2438,
        lng: -123.1090,
        date: "2026-01-22",
        startTime: "15:00",
        endTime: "16:30",
        type: "Public Skating"
    },
    {
        facility: "Bill Copeland Sports Centre",
        city: "Burnaby",
        address: "3676 Kensington Ave, Burnaby",
        lat: 49.2389,
        lng: -123.0042,
        date: "2026-01-23",
        startTime: "19:00",
        endTime: "20:30",
        type: "Family Hockey"
    },
    {
        facility: "Kensington Arena",
        city: "Burnaby",
        address: "6050 McMurray Ave, Burnaby",
        lat: 49.2267,
        lng: -123.0036,
        date: "2026-01-24",
        startTime: "11:00",
        endTime: "12:30",
        type: "Family Skate"
    }
];

let allSessions = [];
let filteredSessions = [];
let userLocation = null;
// Default to tomorrow if it's past 9pm
let currentDate = new Date();
if (currentDate.getHours() >= 21) {
    currentDate.setDate(currentDate.getDate() + 1);
}
let viewMode = 'day';
let isLoading = false; // 'day', 'week', or 'month'

const sportFilter = document.getElementById('sportFilter');
const cityFilter = document.getElementById('cityFilter');
const facilityFilter = document.getElementById('facilityFilter');
const activityFiltersContainer = document.getElementById('activityFilters');
const postalCodeInput = document.getElementById('postalCode');
const distanceFilter = document.getElementById('distanceFilter');
const calendar = document.getElementById('calendar');
const currentMonthEl = document.getElementById('currentMonth');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dayViewBtn = document.getElementById('dayViewBtn');
const weekViewBtn = document.getElementById('weekViewBtn');
const monthViewBtn = document.getElementById('monthViewBtn');
const modal = document.getElementById('sessionModal');
const modalClose = document.getElementById('modalClose');
const useLocationBtn = document.getElementById('useLocationBtn');
const mapPanel = document.getElementById('mapPanel');
const mapPanelHeader = document.getElementById('mapPanelHeader');
let facilityMap = null;
let facilityMarkers = {}; // Store markers by facility name for hover interactions
let distanceCircle = null;

// Dynamic daily schedule loading
const loadedDays = new Map(); // Cache: dateStr -> sessions array
let scheduleIndex = null; // Metadata from index.json
const SCHEDULES_BASE = './data/schedules';

// Get cache buster that changes hourly
function getCacheBuster() {
    return Math.floor(Date.now() / 3600000);
}

// Load the sport-specific index file with metadata
async function loadScheduleIndex() {
    const sportFile = getSportFilename();
    const response = await fetch(`${SCHEDULES_BASE}/index-${sportFile}.json?v=${getCacheBuster()}`);
    if (!response.ok) throw new Error(`Failed to load index: ${response.status}`);
    return await response.json();
}

// Get the sport filename for schedule files (e.g., 'ice-skating.json', 'swimming.json')
function getSportFilename() {
    const config = SPORTS_CONFIG[currentSport];
    return config?.dataFile?.replace('.json', '') || 'ice-skating';
}

// Load a single day's schedule
async function loadDay(dateStr) {
    const cacheKey = `${currentSport}:${dateStr}`;
    if (loadedDays.has(cacheKey)) {
        return loadedDays.get(cacheKey);
    }

    const [year, month, day] = dateStr.split('-');
    const sportFile = getSportFilename();
    const url = `${SCHEDULES_BASE}/${year}/${month}/${day}/${sportFile}.json?v=${getCacheBuster()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Day might not exist (no sessions), return empty
            loadedDays.set(cacheKey, []);
            return [];
        }
        const data = await response.json();
        const sessions = data.sessions || [];
        loadedDays.set(cacheKey, sessions);
        return sessions;
    } catch (e) {
        console.warn(`Could not load ${dateStr}:`, e);
        loadedDays.set(cacheKey, []);
        return [];
    }
}

// Load multiple days in parallel
async function loadDays(dateStrings) {
    const promises = dateStrings.map(d => loadDay(d));
    await Promise.all(promises);
}

// Get dates needed for current view
function getDatesForView() {
    const dates = [];
    if (viewMode === 'day') {
        // Just the current day
        dates.push(formatDateStr(currentDate));
    } else if (viewMode === 'week') {
        // 7 days of the week
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(formatDateStr(d));
        }
    } else {
        // Month view: up to 42 days (6 weeks grid)
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, daysInPrevMonth - i);
            dates.push(formatDateStr(d));
        }
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            dates.push(formatDateStr(new Date(year, month, day)));
        }
        // Next month days
        const remaining = 42 - dates.length;
        for (let day = 1; day <= remaining; day++) {
            dates.push(formatDateStr(new Date(year, month + 1, day)));
        }
    }
    return dates;
}

function formatDateStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getRelativeTimeString(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// Rebuild allSessions from loaded days (only for current sport)
function rebuildAllSessions() {
    allSessions = [];
    const prefix = `${currentSport}:`;
    for (const [cacheKey, sessions] of loadedDays) {
        // Only include sessions for the current sport
        if (cacheKey.startsWith(prefix)) {
            allSessions.push(...sessions);
        }
    }
}

// Update data source counts in the info box
function updateDataSourceCounts() {
    const cityCounts = {};
    for (const session of allSessions) {
        // Map outdoor rinks to "Outdoor" category
        const isOutdoor = session.facility.includes('Robson Square') ||
                          session.facility.includes('Shipyards');
        const city = isOutdoor ? 'Outdoor' : session.city;
        cityCounts[city] = (cityCounts[city] || 0) + 1;
    }

    // Update each data source item
    document.querySelectorAll('.data-source-item').forEach(item => {
        const city = item.dataset.city;
        const countEl = item.querySelector('.data-source-count');
        if (countEl && city) {
            const count = cityCounts[city] || 0;
            countEl.textContent = count > 0 ? `(${count})` : '';
        }
    });
}

// Fetch schedule data - now loads dynamically
async function fetchRealData() {
    if (USE_SAMPLE_DATA) {
        allSessions = [...sampleSessions];
        filteredSessions = [...sampleSessions];
        initializeFilters();
        renderCalendar();
        return;
    }

    try {
        isLoading = true;
        renderLoading();

        // Load index first
        scheduleIndex = await loadScheduleIndex();

        // Update status in info box
        const statusEl = document.getElementById('scheduleStatus');
        if (statusEl && scheduleIndex.lastUpdated) {
            const updateDate = new Date(scheduleIndex.lastUpdated);
            const relativeTime = getRelativeTimeString(updateDate);
            statusEl.innerHTML = `
                <strong>${scheduleIndex.totalSessions} sessions</strong> from ${scheduleIndex.dateRange.start} to ${scheduleIndex.dateRange.end}.<br>
                Last updated: ${relativeTime}
            `;
        }

        // Load days for current view
        const datesToLoad = getDatesForView();
        await loadDays(datesToLoad);

        rebuildAllSessions();
        isLoading = false;

        updateDataSourceCounts();
        initializeFilters();
        filterSessions();
    } catch (error) {
        console.error('Error fetching data:', error);
        isLoading = false;

        // Fall back to sample data
        allSessions = [...sampleSessions];
        filteredSessions = [...sampleSessions];

        const statusEl = document.getElementById('scheduleStatus');
        if (statusEl) {
            statusEl.innerHTML = `
                <strong style="color: #e74c3c;">Could not load live data</strong><br>
                Showing sample sessions instead. Error: ${error.message}
            `;
        }

        initializeFilters();
        renderCalendar();
    }
}

// Load data for view when navigating
async function loadDataForView() {
    const datesToLoad = getDatesForView();
    const newDates = datesToLoad.filter(d => !loadedDays.has(d));

    if (newDates.length > 0) {
        await loadDays(newDates);
        rebuildAllSessions();
        updateDataSourceCounts();
        initializeFilters();
    }
    filterSessions();
}

function renderLoading() {
    const calendar = document.getElementById('calendar');
    calendar.className = 'calendar-grid day-view';
    calendar.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 3rem; margin-bottom: 20px;">⛸️</div>
            <div style="font-size: 1.2rem; color: #667eea; font-weight: 600; margin-bottom: 10px;">
                Loading skating sessions...
            </div>
            <div style="color: #666;">
                Fetching data from Vancouver and Burnaby recreation centers
            </div>
        </div>
    `;
}

function initializeFilters() {
    updateFacilityFilter();
    initDropdownMulti();
}

let dropdownMultiInitialized = false;

function initDropdownMulti() {
    // Only setup global handlers once
    if (!dropdownMultiInitialized) {
        dropdownMultiInitialized = true;

        // Setup dropdown toggle behavior for all dropdowns
        document.querySelectorAll('.dropdown-multi').forEach(dropdown => {
            const trigger = dropdown.querySelector('.dropdown-multi-trigger');
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other dropdowns
                document.querySelectorAll('.dropdown-multi.open').forEach(d => {
                    if (d !== dropdown) d.classList.remove('open');
                });
                dropdown.classList.toggle('open');
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-multi.open').forEach(d => d.classList.remove('open'));
        });

        // Prevent closing when clicking inside menu
        document.querySelectorAll('.dropdown-multi-menu').forEach(menu => {
            menu.addEventListener('click', e => e.stopPropagation());
        });
    }

    // Always update trigger text (this is safe to call multiple times)
    document.querySelectorAll('.dropdown-multi').forEach(updateDropdownTrigger);
}

function updateDropdownTrigger(dropdown) {
    const trigger = dropdown.querySelector('.dropdown-multi-trigger span');
    const checked = dropdown.querySelectorAll('input:checked');
    const total = dropdown.querySelectorAll('input[type="checkbox"]').length;

    if (checked.length === 0 || checked.length === total) {
        // Default to "All" when nothing selected or all selected
        const isCity = dropdown.id === 'cityFilter';
        trigger.textContent = isCity ? 'All Cities' : 'All Facilities';
    } else if (checked.length === 1) {
        trigger.textContent = checked[0].nextElementSibling.textContent;
    } else {
        trigger.textContent = `${checked.length} selected`;
    }
}

function updateFacilityFilter() {
    const menu = facilityFilter.querySelector('.dropdown-multi-menu');
    if (!menu) return;

    // Get unique facilities with their coordinates
    const facilitiesMap = new Map();
    allSessions.forEach(s => {
        if (!facilitiesMap.has(s.facility)) {
            facilitiesMap.set(s.facility, { name: s.facility, lat: s.lat, lng: s.lng, city: s.city });
        }
    });

    let facilities = Array.from(facilitiesMap.values());

    // Sort by distance if user location is available
    if (userLocation) {
        facilities = facilities.map(f => ({
            ...f,
            distance: calculateDistance(userLocation.lat, userLocation.lng, f.lat, f.lng)
        })).sort((a, b) => a.distance - b.distance);
    } else {
        facilities.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Get currently selected facilities
    const currentSelected = new Set(
        Array.from(menu.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
    );
    const isFirstLoad = menu.querySelectorAll('.dropdown-multi-item').length === 0;

    // Preserve search input if it exists
    const existingSearch = menu.querySelector('.facility-search');
    const searchValue = existingSearch ? existingSearch.value : '';

    menu.innerHTML = '';

    // Add search input at the top
    const searchContainer = document.createElement('div');
    searchContainer.className = 'facility-search-container';
    searchContainer.innerHTML = `
        <input type="text" class="facility-search" placeholder="Search facilities..." value="${searchValue}">
    `;
    menu.appendChild(searchContainer);

    // Create container for facility items
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'facility-items';
    menu.appendChild(itemsContainer);

    // Add facility items
    facilities.forEach(f => {
        const isChecked = !isFirstLoad && currentSelected.has(f.name);
        const distanceStr = f.distance !== undefined ? `${f.distance.toFixed(1)} km` : '';
        const cityAbbr = getCityAbbr(f.city);

        const label = document.createElement('label');
        label.className = 'dropdown-multi-item';
        label.dataset.facilityName = f.name.toLowerCase();
        label.dataset.city = f.city.toLowerCase();
        label.innerHTML = `
            <input type="checkbox" value="${f.name}" ${isChecked ? 'checked' : ''}>
            <span>${shortFacilityName(f.name)}</span>
            <span class="item-city">${cityAbbr}</span>
            ${distanceStr ? `<span class="item-distance">${distanceStr}</span>` : ''}
        `;
        label.querySelector('input').addEventListener('change', () => {
            updateDropdownTrigger(facilityFilter);
            filterSessions();
            saveSettings();
        });
        itemsContainer.appendChild(label);
    });

    // Setup search filtering
    const searchInput = menu.querySelector('.facility-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        itemsContainer.querySelectorAll('.dropdown-multi-item').forEach(item => {
            const name = item.dataset.facilityName;
            const city = item.dataset.city;
            const matches = !query || name.includes(query) || city.includes(query);
            item.style.display = matches ? '' : 'none';
        });
    });

    // Prevent dropdown from closing when clicking search input
    searchInput.addEventListener('click', (e) => e.stopPropagation());

    // Focus search when dropdown opens (only add once)
    if (!facilityFilter.dataset.searchFocusSetup) {
        facilityFilter.dataset.searchFocusSetup = 'true';
        facilityFilter.addEventListener('click', () => {
            setTimeout(() => {
                const input = facilityFilter.querySelector('.facility-search');
                if (facilityFilter.classList.contains('open') && input) {
                    input.focus();
                }
            }, 10);
        });
    }

    // Apply existing search filter if any
    if (searchValue) {
        searchInput.dispatchEvent(new Event('input'));
    }

    updateDropdownTrigger(facilityFilter);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function geocodePostalCode(postalCode) {
    const cleanedCode = postalCode.replace(/\s/g, '').toUpperCase();
    if (cleanedCode.length < 6) return null;

    try {
        // Use geocoder.ca for Canadian postal codes
        const response = await fetch(
            `https://geocoder.ca/${cleanedCode}?json=1`
        );
        const data = await response.json();
        if (data && data.latt && data.longt) {
            return {
                lat: parseFloat(data.latt),
                lng: parseFloat(data.longt)
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}

async function handlePostalCodeChange() {
    const postalCode = postalCodeInput.value.trim();
    if (!postalCode) {
        userLocation = null;
        updateFacilityFilter();
        filterSessions();
        saveSettings();
        return;
    }

    const coords = await geocodePostalCode(postalCode);
    if (coords) {
        userLocation = coords;
    } else {
        userLocation = null;
    }
    updateFacilityFilter(); // Re-sort facilities by distance
    filterSessions();
    saveSettings(); // Save userLocation to localStorage
}

async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
        );
        const data = await response.json();
        if (data && data.address && data.address.postcode) {
            return data.address.postcode;
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
    }
    return null;
}

async function useCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    useLocationBtn.textContent = '📍 Getting location...';
    useLocationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            userLocation = { lat, lng };

            const postalCode = await reverseGeocode(lat, lng);
            if (postalCode) {
                postalCodeInput.value = postalCode;
            }

            updateFacilityFilter(); // Re-sort facilities by distance
            filterSessions();
            saveSettings(); // Save userLocation to localStorage
            useLocationBtn.textContent = '📍 Locate';
            useLocationBtn.disabled = false;
        },
        (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to get your location. Please enter your postal code manually.');
            useLocationBtn.textContent = '📍 Locate';
            useLocationBtn.disabled = false;
        }
    );
}

function getSelectedActivityTypes() {
    // Get fresh checkbox elements from DOM
    const checkboxes = activityFiltersContainer.querySelectorAll('input[type="checkbox"]:not([data-all="true"])');
    return Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
}

function filterSessions() {
    const selectedTypes = getSelectedActivityTypes();
    const showDiscount = selectedTypes.includes('__discount__');
    const showPublic = selectedTypes.includes('Public Skating');
    const regularTypes = selectedTypes.filter(t => t !== '__discount__');

    // Get selected cities from multi-select
    const selectedCities = Array.from(cityFilter.querySelectorAll('input:checked')).map(cb => cb.value);
    // Get selected facilities from multi-select
    const selectedFacilities = Array.from(facilityFilter.querySelectorAll('input:checked')).map(cb => cb.value);

    filteredSessions = allSessions.filter(session => {
        const cityMatch = selectedCities.length === 0 || selectedCities.includes(session.city);
        const facilityMatch = selectedFacilities.length === 0 || selectedFacilities.includes(session.facility);

        // Check if this is a discount/free session
        const actName = (session.activityName || '').toLowerCase();
        const isDiscount = actName.includes('toonie') ||
                          actName.includes('discount') ||
                          actName.includes('free') ||
                          actName.includes('loonie') ||
                          actName.includes('$2');

        // Activity type matching
        let activityMatch = false;

        // Discount sessions only shown if Discount filter is checked
        if (isDiscount && session.type === 'Public Skating') {
            activityMatch = showDiscount;
        } else if (session.type === 'Public Skating') {
            // Regular public skating (non-discount)
            activityMatch = showPublic;
        } else {
            // Other types
            activityMatch = regularTypes.includes(session.type);
        }

        let distanceMatch = true;
        if (userLocation && distanceFilter.value !== '999') {
            const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                session.lat,
                session.lng
            );
            distanceMatch = distance <= parseFloat(distanceFilter.value);
        }

        return cityMatch && facilityMatch && distanceMatch && activityMatch;
    });

    renderCalendar();

    // Refresh map if it's open
    if (mapPanel.classList.contains('open') && facilityMap) {
        initMap();
    }
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function getCityAbbr(city) {
    const abbrs = {
        'Vancouver': 'VAN',
        'Burnaby': 'BBY',
        'Richmond': 'RMD',
        'Port Coquitlam': 'PCQ',
        'Coquitlam': 'COQ',
        'North Vancouver': 'NV',
        'West Vancouver': 'WV',
        'New Westminster': 'NW',
        'Langley': 'LGL',
    };
    return abbrs[city] || city.substring(0, 3).toUpperCase();
}

function shortFacilityName(facility) {
    // Map long facility names to shorter versions for compact display
    const shortNames = {
        'Hillcrest Centre': 'Hillcrest',
        'Kerrisdale Cyclone Taylor Arena': 'Kerrisdale',
        'Killarney Rink': 'Killarney',
        'Kitsilano Rink': 'Kitsilano',
        'Sunset Rink': 'Sunset',
        'Trout Lake Rink': 'Trout Lake',
        'West End Community Centre': 'West End',
        'Kensington Complex': 'Kensington',
        'Rosemary Brown Recreation Centre': 'Rosemary Brown',
        'Bill Copeland Sports Centre': 'Bill Copeland',
        'Burnaby Lake Arena': 'Burnaby Lake',
        'Karen Magnussen Community Centre': 'Karen Magnussen',
        'Harry Jerome Community Recreation Centre': 'Harry Jerome',
        'Canlan Ice Sports North Shore': 'Canlan',
        'West Vancouver Community Centre': 'West Van CC',
        'Robson Square Ice Rink': 'Robson Square',
        'Shipyards Skate Plaza': 'Shipyards',
        "Queen's Park Arena": "Queen's Park",
        'Moody Park Arena': 'Moody Park',
    };
    return shortNames[facility] || facility.split(' ').slice(0, 2).join(' ');
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
}

function calculateDuration(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
}

function getRelativeTime(dateStr, timeStr) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (dateStr !== todayStr) return null;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const sessionTime = new Date(now);
    sessionTime.setHours(hours, minutes, 0, 0);

    const diffMs = sessionTime - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < -60) {
        const hoursAgo = Math.round(-diffMins / 60);
        return `${hoursAgo}h ago`;
    } else if (diffMins < 0) {
        return `${-diffMins}min ago`;
    } else if (diffMins === 0) {
        return 'now';
    } else if (diffMins < 60) {
        return `in ${diffMins}min`;
    } else {
        const hoursFromNow = Math.round(diffMins / 60);
        return `in ${hoursFromNow}h`;
    }
}

function isDiscountSession(session) {
    const actName = (session.activityName || '').toLowerCase();
    return actName.includes('toonie') ||
           actName.includes('discount') ||
           actName.includes('free') ||
           actName.includes('loonie') ||
           actName.includes('$2');
}

function getSessionClass(session) {
    // Check for discount/free sessions first (skating only)
    if (currentSport === 'skating' && isDiscountSession(session)) return 'discount';

    const type = typeof session === 'string' ? session : session.type;

    // Skating types
    if (type === 'Public Skating') return 'public';
    if (type === 'Family Skate') return 'family';
    if (type === 'Family Hockey') return 'hockey';
    if (type === 'Figure Skating') return 'figure';

    // Swimming types
    if (type === 'Public Swim') return 'public-swim';
    if (type === 'Lap Swim') return 'lap-swim';
    if (type === 'Family Swim') return 'family-swim';
    if (type === 'Adult Swim') return 'adult-swim';
    if (type === 'Aquafit') return 'aquafit';
    if (type === 'Lessons') return 'swim-lessons';

    return currentSport === 'swimming' ? 'public-swim' : 'public';
}

function renderCalendar() {
    if (viewMode === 'day') {
        renderDayView();
    } else if (viewMode === 'week') {
        renderWeekView();
    } else {
        renderMonthView();
    }
}

function renderDayView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayOfWeek = dayNames[currentDate.getDay()];

    currentMonthEl.textContent = `${dayOfWeek}, ${monthNames[month]} ${day}, ${year}`;

    calendar.className = 'calendar-grid day-view';

    const daySessions = filteredSessions.filter(s => s.date === dateStr)
        .sort((a, b) => {
            // Primary sort by time
            const timeCompare = a.startTime.localeCompare(b.startTime);
            if (timeCompare !== 0) return timeCompare;
            // Secondary sort by distance (closer first) when location available
            if (userLocation) {
                const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
                const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
                return distA - distB;
            }
            return 0;
        });

    // Build day view with date picker and timeline
    const today = new Date();
    const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate 8 days: yesterday + today + next 6 days
    let dayButtonsHtml = '';
    for (let offset = -1; offset <= 6; offset++) {
        const btnDate = new Date(currentDate);
        btnDate.setDate(currentDate.getDate() + offset);
        const btnDateStr = `${btnDate.getFullYear()}-${String(btnDate.getMonth() + 1).padStart(2, '0')}-${String(btnDate.getDate()).padStart(2, '0')}`;
        const btnTodayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isSelected = offset === 0;
        const isTodayBtn = btnDateStr === btnTodayStr;
        const isWeekend = btnDate.getDay() === 0 || btnDate.getDay() === 6;
        const classes = [isSelected ? 'selected' : '', isTodayBtn ? 'is-today' : '', isWeekend ? 'is-weekend' : ''].filter(Boolean).join(' ');

        dayButtonsHtml += `
            <button class="${classes}" onclick="goToDate('${btnDateStr}')">
                <span class="day-name">${shortDayNames[btnDate.getDay()]}</span>
                <span class="day-num">${btnDate.getDate()}</span>
            </button>
        `;
    }

    let html = `
        <div class="day-view-header">
            <div class="day-picker">
                <div class="day-picker-nav">
                    <button class="nav-btn" onclick="changeDay(-7)" title="Previous week">««</button>
                    <button class="nav-btn" onclick="changeDay(-1)" title="Previous day">‹</button>
                </div>
                <div class="day-picker-days">
                    ${dayButtonsHtml}
                </div>
                <div class="day-picker-nav">
                    <button class="nav-btn" onclick="changeDay(1)" title="Next day">›</button>
                    <button class="nav-btn" onclick="changeDay(7)" title="Next week">»»</button>
                </div>
                <input type="date" id="datePicker" value="${dateStr}" onchange="goToDate(this.value)" title="Pick a date">
            </div>
        </div>
    `;

    if (daySessions.length === 0) {
        html += `
            <div class="no-sessions-message">
                <div>No sessions scheduled for this day</div>
                <div style="margin-top: 10px; font-size: 0.9rem;">Try selecting different filters or another date</div>
            </div>
        `;
    } else {
        // Find time range for this day's sessions
        const startHour = Math.max(6, Math.min(...daySessions.map(s => parseInt(s.startTime.split(':')[0]))) - 1);
        const endHour = Math.min(23, Math.max(...daySessions.map(s => parseInt(s.endTime.split(':')[0]))) + 1);

        html += `<div class="timeline-container">`;
        html += `<div class="timeline-hours">`;
        for (let h = startHour; h <= endHour; h++) {
            const displayHour = h % 12 || 12;
            const ampm = h >= 12 ? 'PM' : 'AM';
            html += `<div class="timeline-hour">${displayHour}:00 ${ampm}</div>`;
        }
        html += `</div>`;

        html += `<div class="timeline-grid">`;
        for (let h = startHour; h <= endHour; h++) {
            html += `<div class="timeline-hour-line"></div>`;
        }

        // Check if this is today
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const currentMinutes = isToday ? (now.getHours() - startHour) * 60 + now.getMinutes() : -1;

        // Calculate columns for overlapping events
        const events = daySessions.map(session => {
            const [startH, startM] = session.startTime.split(':').map(Number);
            const [endH, endM] = session.endTime.split(':').map(Number);
            return {
                session,
                start: startH * 60 + startM,
                end: endH * 60 + endM,
                column: 0,
                totalColumns: 1,
                layer: 0
            };
        });

        // Assign columns to overlapping events (capped at MAX_COLUMNS)
        const MAX_COLUMNS = 5;
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            // Find overlapping events that come before this one
            const overlapping = events.slice(0, i).filter(e =>
                e.end > event.start && e.start < event.end
            );
            // Find first available column (with wraparound if > MAX_COLUMNS)
            const usedColumns = overlapping.map(e => e.column % MAX_COLUMNS);
            let col = 0;
            while (usedColumns.includes(col) && col < MAX_COLUMNS) col++;
            // If all columns are used, layer on top with offset
            if (col >= MAX_COLUMNS) {
                col = overlapping.length % MAX_COLUMNS;
            }
            event.column = col;
            // Track the layer (0 = first layer, 1+ = stacked)
            event.layer = Math.floor(overlapping.filter(e => e.column === col).length);
        }

        // Calculate total columns for each event group (capped at MAX_COLUMNS)
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const overlapping = events.filter(e =>
                e.end > event.start && e.start < event.end
            );
            const maxCol = Math.min(Math.max(...overlapping.map(e => e.column)) + 1, MAX_COLUMNS);
            overlapping.forEach(e => e.totalColumns = Math.max(e.totalColumns, maxCol));
        }

        // Render sessions as positioned blocks
        events.forEach(({ session, start, end, column, totalColumns, layer }) => {
            const startMinutes = start - startHour * 60;
            const durationMins = end - start;
            const durationStr = formatDuration(durationMins);
            const relativeTime = getRelativeTime(dateStr, session.startTime);
            const relativeStr = relativeTime ? ` - ${relativeTime}` : '';

            const top = startMinutes; // 1px per minute
            const height = Math.max(durationMins, 55); // minimum 55px to fit time, name, location

            // Calculate horizontal position based on column
            const width = (100 / totalColumns) - 1;
            const left = column * (100 / totalColumns);

            // For stacked events (layer > 0), add z-index and slight visual offset
            const zIndex = layer > 0 ? 10 + layer : 1;
            const topOffset = layer > 0 ? layer * 3 : 0; // Slight vertical offset for visibility
            const layerStyle = layer > 0 ? `z-index: ${zIndex}; box-shadow: -2px 2px 4px rgba(0,0,0,0.2);` : '';

            const sessionClass = getSessionClass(session);
            const activityName = session.activityName || session.type;
            const facilityKey = session.facility.replace(/[^a-zA-Z0-9]/g, '-');

            // Check if session has ended (for past styling)
            const [endH, endM] = session.endTime.split(':').map(Number);
            const isPast = isToday && (endH * 60 + endM) < (now.getHours() * 60 + now.getMinutes());
            const pastClass = isPast ? ' past' : '';

            html += `
                <div class="timeline-event ${sessionClass}${pastClass}"
                     style="top: ${top + topOffset}px; height: ${height}px; left: ${left}%; width: ${width}%; ${layerStyle}"
                     data-facility="${facilityKey}"
                     onmouseenter="highlightMapMarker('${facilityKey}')"
                     onmouseleave="clearMapMarkerHighlights()"
                     onclick='showSessionDetails(${JSON.stringify(session).replace(/'/g, "&apos;")})'>
                    <div class="timeline-event-city">${getCityAbbr(session.city)}</div>
                    <div class="timeline-event-time">${formatTime(session.startTime)} - ${formatTime(session.endTime)}</div>
                    <div class="timeline-event-name">${activityName}</div>
                    <div class="timeline-event-location">${session.facility}</div>
                </div>
            `;
        });

        // Add "now" line if it's today and current time is within the displayed range
        if (isToday && currentMinutes >= 0 && currentMinutes <= (endHour - startHour + 1) * 60) {
            html += `<div class="timeline-now-line" style="top: ${currentMinutes}px;"></div>`;
        }

        html += `</div></div>`;
    }

    calendar.innerHTML = html;
}

function renderWeekView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get start of week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    currentMonthEl.textContent = `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${year}`;

    calendar.className = 'calendar-grid week-view';

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
        const daySessions = filteredSessions.filter(s => s.date === dateStr)
            .sort((a, b) => {
                const timeCompare = a.startTime.localeCompare(b.startTime);
                if (timeCompare !== 0) return timeCompare;
                if (userLocation) {
                    const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
                    const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
                    return distA - distB;
                }
                return 0;
            });

        const isToday = dateStr === todayStr;
        const isOtherMonth = dayDate.getMonth() !== month;

        let sessionsHTML = '';
        if (daySessions.length > 0) {
            sessionsHTML = '<div class="day-sessions">';
            daySessions.slice(0, 4).forEach(session => {
                const activityName = session.activityName || session.type;
                const facilityKey = session.facility.replace(/[^a-zA-Z0-9]/g, '-');
                sessionsHTML += `<div class="session-pill ${getSessionClass(session)}" data-facility="${facilityKey}" onmouseenter="highlightMapMarker('${facilityKey}')" onmouseleave="clearMapMarkerHighlights()" onclick='showSessionDetails(${JSON.stringify(session).replace(/'/g, "&apos;")})'>${formatTime(session.startTime)} ${shortFacilityName(session.facility)}</div>`;
            });
            if (daySessions.length > 4) {
                sessionsHTML += `<div class="session-pill" style="background: #f5f5f5; color: #666; cursor: default;">+${daySessions.length - 4} more</div>`;
            }
            sessionsHTML += '</div>';
        }

        html += `<div class="calendar-day${isToday ? ' today' : ''}${isOtherMonth ? ' other-month' : ''}" onclick="goToDateView('${dateStr}')">
            <div class="day-number">${dayDate.getDate()}</div>
            ${sessionsHTML}
        </div>`;
    }

    calendar.innerHTML = html;
}

function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;

    calendar.className = 'calendar-grid';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let html = `
        <div class="calendar-day-header">Sun</div>
        <div class="calendar-day-header">Mon</div>
        <div class="calendar-day-header">Tue</div>
        <div class="calendar-day-header">Wed</div>
        <div class="calendar-day-header">Thu</div>
        <div class="calendar-day-header">Fri</div>
        <div class="calendar-day-header">Sat</div>
    `;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const daySessions = filteredSessions.filter(s => s.date === dateStr);
        const isToday = dateStr === todayStr;

        let sessionsHTML = '';
        if (daySessions.length > 0) {
            sessionsHTML = '<div class="day-sessions">';
            daySessions.slice(0, 3).forEach(session => {
                const facilityKey = session.facility.replace(/[^a-zA-Z0-9]/g, '-');
                sessionsHTML += `<div class="session-pill ${getSessionClass(session)}" data-facility="${facilityKey}" onmouseenter="highlightMapMarker('${facilityKey}')" onmouseleave="clearMapMarkerHighlights()" onclick='event.stopPropagation(); showSessionDetails(${JSON.stringify(session).replace(/'/g, "&apos;")})'>${formatTime(session.startTime)} ${session.facility.split(' ')[0]}</div>`;
            });
            if (daySessions.length > 3) {
                sessionsHTML += `<div class="session-pill" style="background: #f5f5f5; color: #666; cursor: default;">+${daySessions.length - 3} more</div>`;
            }
            sessionsHTML += '</div>';
        }

        html += `<div class="calendar-day${isToday ? ' today' : ''}" onclick="goToDateView('${dateStr}')">
            <div class="day-number">${day}</div>
            ${sessionsHTML}
        </div>`;
    }

    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        html += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }

    calendar.innerHTML = html;
}

// Day navigation functions
async function changeDay(delta) {
    currentDate.setDate(currentDate.getDate() + delta);
    await loadDataForView();
}

async function goToDate(dateStr) {
    currentDate = new Date(dateStr + 'T00:00:00');
    await loadDataForView();
}

async function goToToday() {
    currentDate = new Date();
    await loadDataForView();
}

async function goToDateView(dateStr) {
    currentDate = new Date(dateStr + 'T00:00:00');
    viewMode = 'day';
    updateViewButtons();
    await loadDataForView();
}

function updateViewButtons() {
    dayViewBtn.classList.toggle('active', viewMode === 'day');
    weekViewBtn.classList.toggle('active', viewMode === 'week');
    monthViewBtn.classList.toggle('active', viewMode === 'month');
}

window.changeDay = changeDay;
window.goToDate = goToDate;
window.goToToday = goToToday;
window.goToDateView = goToDateView;

function showSessionDetails(session) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    const activityName = session.activityName || session.type;
    modalTitle.textContent = activityName;

    const durationMins = calculateDuration(session.startTime, session.endTime);
    const durationStr = formatDuration(durationMins);
    const relativeTime = getRelativeTime(session.date, session.startTime);
    const relativeStr = relativeTime ? ` (${relativeTime})` : '';

    let distanceHTML = '';
    if (userLocation) {
        const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            session.lat,
            session.lng
        );
        distanceHTML = `<div class="session-detail"><strong>Distance:</strong>${distance.toFixed(1)} km away</div>`;
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.address || session.facility + ', ' + session.city)}`;

    const ageRangeHTML = session.ageRange ? `<div class="session-detail"><strong>Age Range:</strong>${session.ageRange}</div>` : '';
    const descriptionHTML = session.description ? `<div class="session-detail"><strong>Description:</strong>${session.description}</div>` : '';
    const reserveButtonHTML = session.activityUrl ? `<a href="${session.activityUrl}" target="_blank" class="add-to-calendar" style="display: block; text-align: center; text-decoration: none; margin-top: 10px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">Reserve / Register</a>` : '';
    const scheduleHTML = session.scheduleUrl ? `<div class="session-detail"><strong>Schedule:</strong><a href="${session.scheduleUrl}" target="_blank" style="color: #667eea;">View facility schedule</a></div>` : '';

    modalBody.innerHTML = `
        <div class="session-detail">
            <strong>Activity:</strong>
            ${activityName}
        </div>
        <div class="session-detail">
            <strong>Type:</strong>
            ${session.type}
        </div>
        ${ageRangeHTML}
        <div class="session-detail">
            <strong>Date:</strong>
            ${new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${relativeStr}
        </div>
        <div class="session-detail">
            <strong>Time:</strong>
            ${formatTime(session.startTime)} - ${formatTime(session.endTime)} (${durationStr})
        </div>
        <div class="session-detail">
            <strong>Location:</strong>
            <a href="${mapsUrl}" target="_blank" style="color: #667eea;">${session.facility}</a>
        </div>
        <div class="session-detail">
            <strong>Address:</strong>
            ${session.address}, ${session.city}
        </div>
        ${distanceHTML}
        ${scheduleHTML}
        ${descriptionHTML}
        ${reserveButtonHTML}
        <button class="add-to-calendar" onclick='addToGoogleCalendar(${JSON.stringify(session).replace(/'/g, "&apos;")})'>
            📅 Add to Google Calendar
        </button>
    `;
    
    modal.classList.add('active');
}

function addToGoogleCalendar(session) {
    const startDateTime = `${session.date}T${session.startTime}:00`;
    const endDateTime = `${session.date}T${session.endTime}:00`;
    
    const title = encodeURIComponent(`${session.type} - ${session.facility}`);
    const details = encodeURIComponent(`${session.type} at ${session.facility}`);
    const location = encodeURIComponent(session.address);
    const start = startDateTime.replace(/[-:]/g, '');
    const end = endDateTime.replace(/[-:]/g, '');

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
    window.open(url, '_blank');
}

// View toggle buttons
dayViewBtn.addEventListener('click', async () => {
    viewMode = 'day';
    updateViewButtons();
    await loadDataForView();
});

weekViewBtn.addEventListener('click', async () => {
    viewMode = 'week';
    updateViewButtons();
    await loadDataForView();
});

monthViewBtn.addEventListener('click', async () => {
    viewMode = 'month';
    updateViewButtons();
    await loadDataForView();
});

// Navigation buttons - behavior depends on view mode
prevBtn.addEventListener('click', async () => {
    if (viewMode === 'day') {
        currentDate.setDate(currentDate.getDate() - 1);
    } else if (viewMode === 'week') {
        currentDate.setDate(currentDate.getDate() - 7);
    } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
    }
    await loadDataForView();
});

nextBtn.addEventListener('click', async () => {
    if (viewMode === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
    } else if (viewMode === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
    } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    await loadDataForView();
});

modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// Update activity checkboxes when sport changes
function updateActivityFilters() {
    const config = SPORTS_CONFIG[currentSport];
    if (!config) return;

    let html = '<span class="activity-label">Activity Types:</span>';
    config.activityTypes.forEach(type => {
        const extraClass = type.isAll ? ' all-toggle' : '';
        html += `
            <label class="activity-checkbox${extraClass}">
                <input type="checkbox" id="${type.id}" value="${type.value}" ${type.checked ? 'checked' : ''} ${type.isAll ? 'data-all="true"' : ''}>
                <span>${type.label}</span>
            </label>
        `;
    });
    activityFiltersContainer.innerHTML = html;

    // Re-attach event listeners with "All" toggle logic
    const allCheckbox = activityFiltersContainer.querySelector('input[data-all="true"]');
    const otherCheckboxes = activityFiltersContainer.querySelectorAll('input:not([data-all="true"])');

    if (allCheckbox) {
        allCheckbox.addEventListener('change', () => {
            otherCheckboxes.forEach(cb => {
                cb.checked = allCheckbox.checked;
            });
            filterSessions();
        });
    }

    otherCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            // Update "All" checkbox state
            if (allCheckbox) {
                const allChecked = Array.from(otherCheckboxes).every(c => c.checked);
                allCheckbox.checked = allChecked;
            }
            filterSessions();
        });
    });
}

// Handle sport change
function updateSportTheme() {
    // Remove all sport classes
    document.body.classList.remove('sport-skating', 'sport-swimming');
    // Add current sport class
    document.body.classList.add(`sport-${currentSport}`);
}

// Sport dropdown handler
const sportTrigger = sportFilter.querySelector('.dropdown-single-trigger');
sportTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown-multi.open, .dropdown-single.open').forEach(d => {
        if (d !== sportFilter) d.classList.remove('open');
    });
    sportFilter.classList.toggle('open');
});

sportFilter.querySelectorAll('.dropdown-single-item:not(.disabled)').forEach(item => {
    item.addEventListener('click', () => {
        sportFilter.querySelectorAll('.dropdown-single-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        currentSport = item.dataset.value;
        // Update trigger text and icon
        const trigger = sportFilter.querySelector('.dropdown-single-trigger');
        trigger.innerHTML = `
            <span class="sport-icon">${item.querySelector('.sport-icon').textContent}</span>
            <span>${item.querySelector('span:nth-child(2)').textContent}</span>
        `;
        sportFilter.classList.remove('open');
        updateSportTheme();
        updateActivityFilters();
        saveSettings(); // Save sport selection
        fetchRealData();
    });
});

// Close sport dropdown when clicking outside
document.addEventListener('click', () => {
    sportFilter.classList.remove('open');
});
sportFilter.querySelector('.dropdown-single-menu').addEventListener('click', e => e.stopPropagation());

let postalCodeTimeout;
let isRestoringSettings = false;
postalCodeInput.addEventListener('input', () => {
    if (isRestoringSettings) return;
    clearTimeout(postalCodeTimeout);
    postalCodeTimeout = setTimeout(handlePostalCodeChange, 1000);
});

useLocationBtn.addEventListener('click', useCurrentLocation);

window.showSessionDetails = showSessionDetails;
window.addToGoogleCalendar = addToGoogleCalendar;

// localStorage settings persistence
const STORAGE_KEY = 'skatingScheduleSettings';

function saveSettings() {
    const selectedCities = Array.from(cityFilter.querySelectorAll('input:checked')).map(cb => cb.value);
    const selectedFacilities = Array.from(facilityFilter.querySelectorAll('input:checked')).map(cb => cb.value);

    // Load existing activity types to preserve other sport's settings
    const existingSettings = loadSettings() || {};
    const existingActivityTypes = existingSettings.activityTypes || {};

    // Save activity types per-sport
    const activityTypes = {
        ...existingActivityTypes,
        [currentSport]: getSelectedActivityTypes()
    };

    const settings = {
        postalCode: postalCodeInput.value,
        userLocation: userLocation,
        cities: selectedCities,
        facilities: selectedFacilities,
        distance: distanceFilter.value,
        viewMode: viewMode,
        activityTypes: activityTypes,
        currentSport: currentSport,
        darkMode: document.body.classList.contains('dark-mode'),
        darkModeExplicit: window._darkModeExplicit || false
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Could not save settings:', e);
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;
        return JSON.parse(saved);
    } catch (e) {
        console.warn('Could not load settings:', e);
        return null;
    }
}

function applySettings(settings) {
    if (!settings) return;

    // Apply sport selection first (before other settings that depend on it)
    if (settings.currentSport && SPORTS_CONFIG[settings.currentSport]) {
        currentSport = settings.currentSport;
        // Update sport dropdown UI
        const sportItems = sportFilter.querySelectorAll('.dropdown-single-item');
        sportItems.forEach(item => {
            item.classList.toggle('selected', item.dataset.value === currentSport);
        });
        const selectedItem = sportFilter.querySelector(`.dropdown-single-item[data-value="${currentSport}"]`);
        if (selectedItem) {
            const trigger = sportFilter.querySelector('.dropdown-single-trigger');
            trigger.innerHTML = `
                <span class="sport-icon">${selectedItem.querySelector('.sport-icon').textContent}</span>
                <span>${selectedItem.querySelector('span:nth-child(2)').textContent}</span>
            `;
        }
    }

    // Apply location (prevent triggering geocode)
    isRestoringSettings = true;
    if (settings.postalCode) {
        postalCodeInput.value = settings.postalCode;
    }
    if (settings.userLocation) {
        userLocation = settings.userLocation;
    }
    isRestoringSettings = false;

    // Apply filters
    if (settings.cities && Array.isArray(settings.cities)) {
        cityFilter.querySelectorAll('input').forEach(cb => {
            cb.checked = settings.cities.includes(cb.value);
        });
    }
    if (settings.distance) {
        distanceFilter.value = settings.distance;
    }
    if (settings.viewMode) {
        viewMode = settings.viewMode;
        updateViewButtons();
    }

    // Activity types will be applied after data loads
    if (settings.activityTypes) {
        window._savedActivityTypes = settings.activityTypes;
    }

    // Apply dark mode
    if (settings.darkModeExplicit) {
        // User explicitly set dark mode preference
        window._darkModeExplicit = true;
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        }
    } else {
        // No explicit preference - use time-based default
        // Dark mode: 8 PM (20:00) to 6 AM (06:00)
        const hour = new Date().getHours();
        const shouldBeDark = hour >= 20 || hour < 6;
        if (shouldBeDark) {
            document.body.classList.add('dark-mode');
        }
    }
}

function applySavedActivityTypes() {
    const savedAllSports = window._savedActivityTypes;
    if (!savedAllSports) return;

    // Get saved types for the current sport (supports both old flat format and new per-sport format)
    const saved = Array.isArray(savedAllSports) ? savedAllSports : savedAllSports[currentSport];
    if (!saved) return;

    const checkboxes = activityFiltersContainer.querySelectorAll('input[type="checkbox"]:not([data-all="true"])');
    checkboxes.forEach(cb => {
        cb.checked = saved.includes(cb.value);
    });

    // Update "All" checkbox
    const allCheckbox = activityFiltersContainer.querySelector('input[data-all="true"]');
    if (allCheckbox) {
        const otherCheckboxes = activityFiltersContainer.querySelectorAll('input:not([data-all="true"])');
        allCheckbox.checked = Array.from(otherCheckboxes).every(c => c.checked);
    }
}

// Save settings when distance filter changes
distanceFilter.addEventListener('change', () => {
    updateFacilityFilter(); // Update facility distances display
    filterSessions();
    saveSettings();
    initMap(); // Redraw map with updated radius circle
});

// Save on view mode change
const originalDayClick = dayViewBtn.onclick;
dayViewBtn.addEventListener('click', saveSettings);
weekViewBtn.addEventListener('click', saveSettings);
monthViewBtn.addEventListener('click', saveSettings);

// Save after postal code change
const originalHandlePostalCode = handlePostalCodeChange;
handlePostalCodeChange = async function() {
    await originalHandlePostalCode.call(this);
    saveSettings();
};

// Save after geolocation
const originalUseCurrentLocation = useCurrentLocation;
useCurrentLocation = async function() {
    await originalUseCurrentLocation.call(this);
    saveSettings();
};

// Wrap updateActivityFilters to apply saved types and add save listeners
const originalUpdateActivityFilters = updateActivityFilters;
updateActivityFilters = function() {
    originalUpdateActivityFilters();
    applySavedActivityTypes();

    // Add save listeners to new checkboxes
    const checkboxes = activityFiltersContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', saveSettings);
    });
};

// Apply facility filter after data loads (needs facility list populated)
const originalFetchRealData = fetchRealData;
fetchRealData = async function() {
    await originalFetchRealData();
    const saved = loadSettings();

    // Restore userLocation if it was saved (needed for distance filtering)
    if (saved?.userLocation) {
        userLocation = saved.userLocation;
    }

    // Update facility filter with distances now that userLocation is set
    updateFacilityFilter();

    if (saved?.facilities && Array.isArray(saved.facilities)) {
        facilityFilter.querySelectorAll('input').forEach(cb => {
            cb.checked = saved.facilities.includes(cb.value);
        });
        updateDropdownTrigger(facilityFilter);
    }
    if (saved?.cities && Array.isArray(saved.cities)) {
        cityFilter.querySelectorAll('input').forEach(cb => {
            cb.checked = saved.cities.includes(cb.value);
        });
        updateDropdownTrigger(cityFilter);
    }
    filterSessions();
};

// Map functionality
function initMap() {
    if (facilityMap) {
        facilityMap.remove();
    }
    facilityMarkers = {}; // Reset markers store

    // Center on Metro Vancouver
    facilityMap = L.map('facilityMap').setView([49.25, -123.1], 11);

    // Use dark tiles in dark mode
    const isDarkMode = document.body.classList.contains('dark-mode');
    const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = isDarkMode
        ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'
        : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer(tileUrl, { attribution }).addTo(facilityMap);

    // Update map title with session count
    const mapTitle = document.getElementById('mapTitle');
    mapTitle.textContent = `${filteredSessions.length} Sessions at ${new Set(filteredSessions.map(s => s.facility)).size} Facilities`;

    // Group filtered sessions by facility (respects current filters)
    const facilitySessions = {};
    filteredSessions.forEach(session => {
        const key = `${session.facility}-${session.lat}-${session.lng}`;
        if (!facilitySessions[key]) {
            facilitySessions[key] = {
                facility: session.facility,
                city: session.city,
                address: session.address,
                lat: session.lat,
                lng: session.lng,
                sessions: []
            };
        }
        facilitySessions[key].sessions.push(session);
    });

    // Color markers by city
    const cityColors = {
        'Vancouver': '#1976d2',
        'Burnaby': '#7b1fa2',
        'Richmond': '#f57c00',
        'Port Coquitlam': '#5d4037',
        'Coquitlam': '#6d4c41',
        'North Vancouver': '#388e3c',
        'West Vancouver': '#00796b',
        'New Westminster': '#c2185b',
        'Langley': '#455a64'
    };

    // Add markers for each facility
    const markers = [];
    Object.values(facilitySessions).forEach(facility => {
        // Check if it's an outdoor rink
        const isOutdoor = facility.facility.includes('Robson Square') ||
                          facility.facility.includes('Shipyards');
        const color = isOutdoor ? '#ef6c00' : (cityColors[facility.city] || '#666');
        const facilityKey = facility.facility.replace(/[^a-zA-Z0-9]/g, '-');

        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-icon" data-facility="${facilityKey}" style="
                background: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
                transition: transform 0.2s;
            ">${facility.sessions.length}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([facility.lat, facility.lng], { icon: markerIcon });

        // Store marker reference for hover interactions
        facilityMarkers[facilityKey] = { marker, element: null };

        // Create popup content
        const upcomingSessions = facility.sessions
            .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
            .slice(0, 5);

        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.address || facility.facility + ', ' + facility.city)}`;
        const scheduleUrl = facility.sessions[0]?.scheduleUrl || '';
        let popupContent = `
            <div style="min-width: 200px;">
                <a href="${mapsUrl}" target="_blank" style="font-size: 14px; font-weight: bold; color: #1976d2; text-decoration: none;">${facility.facility}</a><br>
                <a href="${mapsUrl}" target="_blank" style="color: #666; font-size: 12px; text-decoration: none;">${facility.address} ↗</a><br>
                ${scheduleUrl ? `<a href="${scheduleUrl}" target="_blank" style="color: #667eea; font-size: 12px; text-decoration: none;">View Schedule ↗</a><br>` : ''}
                <span style="color: ${color}; font-weight: 600;">${facility.sessions.length} upcoming sessions</span>
                <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
        `;

        upcomingSessions.forEach(session => {
            const dateObj = new Date(session.date + 'T00:00:00');
            const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            popupContent += `
                <div style="margin-bottom: 6px; font-size: 12px;">
                    <strong>${dateStr}</strong> ${formatTime(session.startTime)}-${formatTime(session.endTime)}<br>
                    <span style="color: #555;">${session.activityName || session.type}</span>
                </div>
            `;
        });

        if (facility.sessions.length > 5) {
            popupContent += `<div style="color: #667eea; font-size: 11px;">+${facility.sessions.length - 5} more sessions</div>`;
        }

        popupContent += '</div>';
        marker.bindPopup(popupContent);
        marker.addTo(facilityMap);
        markers.push(marker);

        // Add hover handlers for marker -> calendar highlighting
        marker.on('mouseover', () => highlightCalendarEvents(facilityKey));
        marker.on('mouseout', () => clearCalendarHighlights());
    });

    // Add distance circle if user location is set
    if (userLocation && distanceFilter.value !== '999') {
        const radiusKm = parseFloat(distanceFilter.value);
        distanceCircle = L.circle([userLocation.lat, userLocation.lng], {
            radius: radiusKm * 1000,
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5'
        }).addTo(facilityMap);

        // Add user location marker
        const userIcon = L.divIcon({
            className: 'user-marker',
            html: `<div style="
                background: #e74c3c;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
            .bindPopup('Your location')
            .addTo(facilityMap);

        // Fit map to show all markers and the circle
        const group = L.featureGroup([...markers, distanceCircle]);
        facilityMap.fitBounds(group.getBounds().pad(0.1));
    } else if (markers.length > 0) {
        // Fit map to show all markers
        const group = L.featureGroup(markers);
        facilityMap.fitBounds(group.getBounds().pad(0.1));
    }
}

// Highlight calendar events for a facility
function highlightCalendarEvents(facilityKey) {
    document.querySelectorAll(`[data-facility="${facilityKey}"]`).forEach(el => {
        el.classList.add('highlighted');
    });
}

// Clear all calendar highlights
function clearCalendarHighlights() {
    document.querySelectorAll('.timeline-event.highlighted, .session-pill.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });
}

// Highlight map marker for a facility
function highlightMapMarker(facilityKey) {
    const markerEl = document.querySelector(`.marker-icon[data-facility="${facilityKey}"]`);
    if (markerEl) {
        markerEl.classList.add('map-marker-highlighted');
    }
}

// Clear all map marker highlights
function clearMapMarkerHighlights() {
    document.querySelectorAll('.marker-icon.map-marker-highlighted').forEach(el => {
        el.classList.remove('map-marker-highlighted');
    });
}

// Toggle map panel
function toggleMapPanel() {
    const isOpen = mapPanel.classList.toggle('open');
    if (isOpen) {
        // Small delay to ensure panel is visible before initializing map
        setTimeout(() => {
            initMap();
            facilityMap.invalidateSize();
        }, 100);
    }
}

mapPanelHeader.addEventListener('click', toggleMapPanel);

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    window._darkModeExplicit = true; // User explicitly set preference
    saveSettings();
}
darkModeToggle.addEventListener('click', toggleDarkMode);

// Initialize app
const savedSettings = loadSettings();
applySettings(savedSettings);

// If no saved settings, apply time-based dark mode default
if (!savedSettings) {
    const hour = new Date().getHours();
    const shouldBeDark = hour >= 20 || hour < 6;
    if (shouldBeDark) {
        document.body.classList.add('dark-mode');
    }
}

updateSportTheme();      // Set sport-themed background
updateActivityFilters(); // Set up activity filters for current sport
renderCalendar();        // Render empty calendar immediately

// If we have a postal code but no userLocation, geocode it
if (postalCodeInput.value && !userLocation) {
    geocodePostalCode(postalCodeInput.value).then(coords => {
        if (coords) {
            userLocation = coords;
            updateFacilityFilter();
            filterSessions();
            saveSettings();
        }
    });
}

fetchRealData();         // Then fetch data
