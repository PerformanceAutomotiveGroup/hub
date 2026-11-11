const DEALERSHIPS_DATA_URL = 'https://performanceautomotivegroup.github.io/hub/dealership-locations.json';
const GITHUB_ASSETS_BASE = 'https://performanceautomotivegroup.github.io/hub/';

// Helper to normalize store and brand logo paths
function resolveAssetUrl(url) {
if (!url) return '';
if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
return url;
}
// Remove leading slash if present and append to GitHub base
const cleanPath = url.replace(/^\/+/, '');
return GITHUB_ASSETS_BASE + cleanPath;
}

let locations = [];
let markers = [];
let map = null;
let activeInfoWindow = null;
let userCoords = null;
let currentFacilityType = 'all';
let directionsService = null;
let directionsRenderer = null;

// Distance calculation (Haversine km)
function calculateDistance(lat1, lon1, lat2, lon2) {
const R = 6371;
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLon = (lon2 - lon1) * Math.PI / 180;
const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
Math.sin(dLon / 2) * Math.sin(dLon / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return (R * c).toFixed(1);
}

// Global toggle functions
window.toggleSidebar = function() {
const sidebar = document.getElementById('dealer-sidebar');
const icon = document.getElementById('toggle-icon');
if (!sidebar) return;
sidebar.classList.toggle('collapsed');
if (icon) icon.innerText = sidebar.classList.contains('collapsed') ? '❯' : '❮';
if (map) {
setTimeout(() => google.maps.event.trigger(map, 'resize'), 320);
}
};

window.toggleBrandFlyout = function() {
const flyout = document.getElementById('brand-flyout-panel');
if (flyout) flyout.classList.toggle('open');
};

window.resetAllFilters = function() {
const searchInput = document.getElementById('dealer-places-search-bar');
const brandSelect = document.getElementById('brandSelectFilter');
const citySelect = document.getElementById('citySelectFilter');
const nearMeBtn = document.getElementById('near-me-btn');

if (searchInput) searchInput.value = '';
if (brandSelect) brandSelect.value = '';
if (citySelect) citySelect.value = '';
if (nearMeBtn) nearMeBtn.classList.remove('active');

currentFacilityType = 'all';
document.querySelectorAll('.seg-btn').forEach(btn => {
btn.classList.toggle('active', btn.dataset.type === 'all');
});

document.querySelectorAll('.brand-logo-tile').forEach(tile => tile.classList.remove('active'));

closeDirections();
applyFilters();

if (map && markers.length > 0) {
const bounds = new google.maps.LatLngBounds();
markers.forEach(m => bounds.extend(m.getPosition()));
map.fitBounds(bounds);
}
};

window.locateUser = function() {
const btn = document.getElementById('near-me-btn');
if (!navigator.geolocation) {
alert("Geolocation is not supported by your browser.");
return;
}

if (btn) btn.innerHTML = '<span>Locating...</span>';

navigator.geolocation.getCurrentPosition(
(pos) => {
userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
if (btn) {
btn.classList.add('active');
btn.innerHTML = `
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
<path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-7.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
</svg>
<span>Near Me ✓</span>`;
}

// Compute distances
locations.forEach(loc => {
loc.distance = parseFloat(calculateDistance(userCoords.lat, userCoords.lng, loc.lat, loc.lng));
});

// Sort locations ascending by distance
locations.sort((a, b) => (a.distance || 0) - (b.distance || 0));

applyFilters();

if (map) {
map.setCenter(userCoords);
map.setZoom(11);
}
},
(err) => {
console.warn("Geolocation failed:", err);
if (btn) {
btn.innerHTML = '<span>Location off</span>';
setTimeout(() => {
btn.innerHTML = `
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
<path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-7.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
</svg>
<span>Near Me</span>`;
}, 2000);
}
}
);
};

// Start routing directions panel
window.calculateRoute = function(destIndex) {
const loc = locations[destIndex];
if (!loc) return;

const resultsList = document.getElementById('dealer-results-list');
const dirPanel = document.getElementById('dealer-directions-panel');
if (!dirPanel || !resultsList) return;

resultsList.style.display = 'none';
dirPanel.style.display = 'block';

dirPanel.innerHTML = `
<div class="route-actions-group">
<a class="gmaps-launch-btn" href="${loc.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.address)}`}" target="_blank" rel="noopener">
<span>Open Turn-by-Turn in Google Maps</span> ↗
</a>
<button type="button" class="exit-directions-btn" onclick="closeDirections()">← Back to Directory List</button>
</div>
<div id="dir-steps-container" style="font-size:15px; color:#444;">Calculating best route...</div>
`;

const destLatLng = { lat: loc.lat, lng: loc.lng };

if (userCoords) {
runDirections(userCoords, destLatLng);
} else if (navigator.geolocation) {
navigator.geolocation.getCurrentPosition(
(pos) => {
userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
runDirections(userCoords, destLatLng);
},
() => {
document.getElementById('dir-steps-container').innerHTML = `
<p style="color:#666;">Please allow location access, or click the button above to navigate directly on Google Maps.</p>
`;
}
);
}
};

function runDirections(origin, destination) {
if (!directionsService || !directionsRenderer) {
directionsService = new google.maps.DirectionsService();
directionsRenderer = new google.maps.DirectionsRenderer({
map: map,
panel: document.getElementById('dir-steps-container')
});
} else {
directionsRenderer.setMap(map);
directionsRenderer.setPanel(document.getElementById('dir-steps-container'));
}

directionsService.route({
origin: origin,
destination: destination,
travelMode: google.maps.TravelMode.DRIVING
}, (response, status) => {
if (status === 'OK') {
directionsRenderer.setDirections(response);
} else {
const container = document.getElementById('dir-steps-container');
if (container) container.innerHTML = `<p style="color:#d9534f;">Unable to calculate route: ${status}</p>`;
}
});
}

window.closeDirections = function() {
const resultsList = document.getElementById('dealer-results-list');
const dirPanel = document.getElementById('dealer-directions-panel');
if (dirPanel) dirPanel.style.display = 'none';
if (resultsList) resultsList.style.display = 'block';

if (directionsRenderer) {
directionsRenderer.setMap(null);
directionsRenderer.setPanel(null);
}
};

// Filter & Card Render Loop
function applyFilters() {
const query = (document.getElementById('dealer-places-search-bar')?.value || '').toLowerCase().trim();
const brandVal = (document.getElementById('brandSelectFilter')?.value || '').toLowerCase().trim();
const cityVal = (document.getElementById('citySelectFilter')?.value || '').toLowerCase().trim();

let visibleCount = 0;
const bounds = new google.maps.LatLngBounds();

locations.forEach((loc, index) => {
const isCollision = loc.brand === "Performance Collision";

// 1. Facility Type Segment
let passType = true;
if (currentFacilityType === 'dealerships' && isCollision) passType = false;
if (currentFacilityType === 'collision' && !isCollision) passType = false;

// 2. Dual Dropdowns
let passBrand = true;
if (brandVal) {
const bList = (loc.brand || '').toLowerCase().split('/').map(b => b.trim());
passBrand = bList.includes(brandVal);
}

let passCity = true;
if (cityVal && (loc.city || '').toLowerCase().trim() !== cityVal) {
passCity = false;
}

// 3. Search Bar query
let passQuery = true;
if (query) {
const searchTarget = `${loc.name} ${loc.address} ${loc.city} ${loc.brand}`.toLowerCase();
passQuery = searchTarget.includes(query);
}

const isVisible = passType && passBrand && passCity && passQuery;
const cardEl = document.getElementById(`dealer-card-${index}`);

if (cardEl) {
cardEl.style.display = isVisible ? 'block' : 'none';
}

if (markers[index]) {
markers[index].setVisible(isVisible);
if (isVisible) {
bounds.extend(markers[index].getPosition());
visibleCount++;
}
}
});

const countBadge = document.getElementById('visible-dealers-count');
if (countBadge) countBadge.innerText = visibleCount;

// Fit bounds if search narrowed
if (map && visibleCount > 0 && (query || brandVal || cityVal || currentFacilityType !== 'all')) {
map.fitBounds(bounds);
if (visibleCount === 1) map.setZoom(14);
}
}

// Build cards & markers
function renderDealerListAndMarkers() {
const listContainer = document.getElementById('dealer-results-list');
if (!listContainer) return;
listContainer.innerHTML = '';

// Clear existing markers
markers.forEach(m => m.setMap(null));
markers = [];

const bounds = new google.maps.LatLngBounds();

locations.forEach((loc, index) => {
// 1. Build Card
const isCollision = loc.brand === "Performance Collision";
const brandLogoUrl = loc.brandLogo || '';

const card = document.createElement('div');
card.className = 'dealer-location-card';
card.id = `dealer-card-${index}`;

card.innerHTML = `
<div class="card-top-header">
<h5>${loc.name}</h5>
<div class="dealer-brand-logo-badge" title="${loc.brand}">
${brandLogoUrl ? `<img src="${brandLogoUrl}" alt="${loc.brand}" loading="lazy">` : ''}
</div>
</div>
<div class="card-address-txt">${loc.address}</div>
<div class="card-contact-row">
<span>${loc.phone ? `<a href="tel:${loc.phone.replace(/[^0-9]/g, '')}">${loc.phone}</a>` : ''}</span>
${loc.distance !== undefined ? `<span class="dealer-dist-tag">${loc.distance} km</span>` : ''}
</div>

<!-- Quick Services -->
${loc.services && loc.services.length > 0 ? `
<div class="card-service-tags">
${loc.services.map(s => `
<a href="${s.link}" target="_blank" rel="noopener" class="card-service-pill">${s.name}</a>
`).join('')}
</div>
` : ''}

<!-- Actions Grid -->
<div class="card-actions-grid">
<a href="${loc.website}" target="_blank" rel="noopener" class="card-btn btn-card-primary">Website ↗</a>
<button type="button" class="card-btn btn-card-secondary" onclick="calculateRoute(${index})">Directions</button>
</div>
`;

// Click card to center on map
card.addEventListener('click', (e) => {
if (e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'button') return;
selectDealership(index);
});

listContainer.appendChild(card);

// 2. Build Map Marker
const marker = new google.maps.Marker({
position: { lat: loc.lat, lng: loc.lng },
map: map,
title: loc.name,
icon: {
path: google.maps.SymbolPath.CIRCLE,
scale: isCollision ? 7.5 : 8.5,
fillColor: isCollision ? '#E21F2F' : '#0668B3',
fillOpacity: 1,
strokeColor: '#FFFFFF',
strokeWeight: 2
}
});

marker.addListener('click', () => {
selectDealership(index);
});

markers.push(marker);
bounds.extend(marker.getPosition());
});

if (map && markers.length > 0) {
map.fitBounds(bounds);
}
}

function selectDealership(index) {
const loc = locations[index];
const marker = markers[index];
if (!loc || !marker) return;

// Highlight card
document.querySelectorAll('.dealer-location-card').forEach(c => c.classList.remove('active-selected'));
const activeCard = document.getElementById(`dealer-card-${index}`);
if (activeCard) {
activeCard.classList.add('active-selected');
activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// InfoWindow popup
if (activeInfoWindow) activeInfoWindow.close();

const storeLogo = resolveAssetUrl(loc.storeLogo);
const brandLogo = resolveAssetUrl(loc.brandLogo);

activeInfoWindow = new google.maps.InfoWindow({
content: `
<div class="dealer-info-bubble">
<div class="dealer-bubble-logo-container" style="margin-bottom: 8px; display: flex; align-items: center; min-height: 40px;">
${storeLogo ? `
<img src="${storeLogo}" alt="${loc.name}" 
style="max-height: 40px; max-width: 175px; object-fit: contain;" 
onerror="this.onerror=null; ${brandLogo ? `this.src='${brandLogo}';` : `this.style.display='none'; this.nextElementSibling.style.display='block';`}">
<h4 style="display: none; font-size: 14px; font-weight: 700; color: var(--pag-blue, #0668B3); margin: 0;">${loc.name}</h4>
` : `
<h4 style="font-size: 14px; font-weight: 700; color: var(--pag-blue, #0668B3); margin: 0;">${loc.name}</h4>
`}
</div>
<p style="font-size: 13px; color: #555; margin-bottom: 6px; line-height: 1.3;">
${loc.address}<br>
<strong>${loc.phone || ''}</strong>
</p>
<div style="display: flex; gap: 6px; margin-top: 6px;">
<a href="${loc.website}" target="_blank" rel="noopener" class="dealer-bubble-btn" style="padding: 7px 9px; font-size: 13px; text-decoration: none; border-radius: 4px; background: var(--pag-blue, #0668B3); color: #fff; font-weight: 700;">Visit Website</a>
<button type="button" onclick="calculateRoute(${index})" style="padding: 5px 9px; font-size: 11px; border: 1px solid #ccc; border-radius: 4px; background: #fff; color: #333; font-weight: 600; cursor: pointer;">Directions</button>
</div>
</div>
`
});

activeInfoWindow.open(map, marker);
map.panTo(marker.getPosition());
map.setZoom(14);
}

// Populate Brand & City Dropdowns + Floating Flyout dynamically from JSON
function populateFilterControls() {
const brandSelect = document.getElementById('brandSelectFilter');
const citySelect = document.getElementById('citySelectFilter');
const brandFlyoutContainer = document.getElementById('brand-logos-container');

const brandMap = new Map(); // brandName -> brandLogoUrl
const citySet = new Set();

locations.forEach(loc => {
if (loc.city) citySet.add(loc.city.trim());
if (loc.brand) {
loc.brand.split('/').forEach(b => {
const brandName = b.trim();
if (!brandMap.has(brandName) && loc.brandLogo) {
brandMap.set(brandName, loc.brandLogo);
} else if (!brandMap.has(brandName)) {
brandMap.set(brandName, '');
}
});
}
});

// 1. Populate Brand Select
if (brandSelect) {
brandSelect.innerHTML = '<option value="">All Brands</option>';
Array.from(brandMap.keys()).sort().forEach(brand => {
const opt = document.createElement('option');
opt.value = brand;
opt.textContent = brand;
brandSelect.appendChild(opt);
});
brandSelect.addEventListener('change', () => {
applyFilters();
// Sync flyout active tile
const selVal = brandSelect.value.toLowerCase();
document.querySelectorAll('.brand-logo-tile').forEach(tile => {
tile.classList.toggle('active', tile.dataset.brand.toLowerCase() === selVal);
});
});
}

// 2. Populate City Select
if (citySelect) {
citySelect.innerHTML = '<option value="">All Cities</option>';
Array.from(citySet).sort().forEach(city => {
const opt = document.createElement('option');
opt.value = city;
opt.textContent = city;
citySelect.appendChild(opt);
});
citySelect.addEventListener('change', applyFilters);
}

// 3. Populate Floating Brand Flyout Modal from JSON brand mapping
if (brandFlyoutContainer) {
brandFlyoutContainer.innerHTML = '';
const sortedBrands = Array.from(brandMap.keys()).sort();

sortedBrands.forEach(brand => {
const logoUrl = brandMap.get(brand);
if (!logoUrl) return; // Skip brands without a logo

const tile = document.createElement('div');
tile.className = 'brand-logo-tile';
tile.dataset.brand = brand;
tile.innerHTML = `
<img src="${logoUrl}" alt="${brand}" loading="lazy">
<span>${brand}</span>
`;

tile.addEventListener('click', () => {
const isActive = tile.classList.contains('active');
document.querySelectorAll('.brand-logo-tile').forEach(t => t.classList.remove('active'));

if (!isActive) {
tile.classList.add('active');
if (brandSelect) brandSelect.value = brand;
} else {
if (brandSelect) brandSelect.value = '';
}

applyFilters();
toggleBrandFlyout();
});

brandFlyoutContainer.appendChild(tile);
});
}

// Update header counts
const countAll = document.getElementById('count-all');
const countDealers = document.getElementById('count-dealerships');
const countCollision = document.getElementById('count-collision');

const collisionCount = locations.filter(l => l.brand === "Performance Collision").length;
const dealerCount = locations.length - collisionCount;

if (countAll) countAll.innerText = locations.length;
if (countDealers) countDealers.innerText = dealerCount;
if (countCollision) countCollision.innerText = collisionCount;
}

// Setup Event Listeners
function setupEventListeners() {
// Search input
const searchInput = document.getElementById('dealer-places-search-bar');
if (searchInput) {
searchInput.addEventListener('input', applyFilters);
}

// Segmented Type Buttons (All / Dealerships / Collision)
document.querySelectorAll('.seg-btn').forEach(btn => {
btn.addEventListener('click', () => {
document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
currentFacilityType = btn.dataset.type;
applyFilters();
});
});
}

// Master Initialization Function
async function initDealerDirectory() {
const mapCanvas = document.getElementById("dealer-map-canvas");
if (!mapCanvas) return;

// Initialize Map
map = new google.maps.Map(mapCanvas, {
center: { lat: 43.6532, lng: -79.3832 },
zoom: 9,
mapTypeControl: false,
fullscreenControl: true,
streetViewControl: false,
styles: [
{ featureType: "poi.business", stylers: [{ visibility: "off" }] }
]
});

// Fetch Master JSON
try {
const res = await fetch(DEALERSHIPS_DATA_URL);
if (!res.ok) throw new Error(`HTTP error ${res.status}`);
locations = await res.json();
} catch (err) {
console.error("Failed to load dealership locations JSON from GitHub:", err);
const container = document.getElementById('dealer-results-list');
if (container) {
container.innerHTML = `
<div style="padding:24px; text-align:center; color:#c00;">
<p><strong>Unable to load locations directory.</strong></p>
<p style="font-size:12px; color:#666; margin-top:6px;">Please ensure dealerships.json is accessible at ${DEALERSHIPS_DATA_URL}</p>
</div>
`;
}
return;
}

// Setup DOM and Markers
populateFilterControls();
renderDealerListAndMarkers();
setupEventListeners();
}

// Fire on DOM load or Google Maps callback
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
if (window.google && window.google.maps) {
initDealerDirectory();
} else {
window.addEventListener('load', initDealerDirectory);
}
});
} else {
if (window.google && window.google.maps) {
initDealerDirectory();
} else {
window.addEventListener('load', initDealerDirectory);
}
}
