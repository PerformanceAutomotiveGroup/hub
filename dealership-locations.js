const DEALERSHIPS_DATA_URL = 'https://performanceautomotivegroup.github.io/hub/dealership-locations.json';

// Brand logos lookup map
const BRAND_LOGOS = {
"Acura": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Acura-1.png",
"Audi": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Audi.png",
"BMW": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/BMW.png",
"Chrysler": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Chrysler-1.png",
"Dodge": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Dodge.png",
"Fiat": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/03-logo-06-fiat.png",
"Ford": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Ford.png",
"Genesis": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Genesis.png",
"Honda": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Honda.png",
"Hyundai": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/02-logo-10-hyundai.png",
"INFINITI": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2023/06/INFINITI-Brampton.png",
"Jeep": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Jeep.png",
"Kia": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/KIA-175_175.png",
"Lexus": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Lexus.png",
"MINI": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/MINI.png",
"Mazda": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/LOGO-15.png",
"Mercedes-Benz": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Mercedes-Benz.png",
"Mercedez-Benz": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Mercedes-Benz.png",
"Mitsubishi": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Mitsbusihi.png",
"Nissan": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Nissan.png",
"RAM": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/RAM.png",
"Subaru": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/logo-21-subaru.png",
"Toyota": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/02-logo-22-toyota.png",
"Volkswagen": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Volkswagen.png",
"AutoPlanet": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2020/11/Auto-Planet-Direct-Locations.png",
"Performance Collision": "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2025/12/PERF-COLLISION-HORZ-RGB.png"
};

let locations = [];
let markers = [];
let map = null;
let activeInfoWindow = null;
let userCoords = null;
let currentFacilityType = 'all';
let directionsService = null;
let directionsRenderer = null;

// Helper to resolve brand logo URL
function getBrandLogoUrl(brandString) {
if (!brandString) return '';
if (brandString.includes('Performance Collision')) {
return BRAND_LOGOS['Performance Collision'];
}
const primaryBrand = brandString.split('/')[0].trim();
return BRAND_LOGOS[primaryBrand] || BRAND_LOGOS['AutoPlanet'] || '';
}

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
<div id="dir-steps-container" style="font-size:13px; color:#444;">Calculating best route...</div>
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
const brandLogoUrl = getBrandLogoUrl(loc.brand);

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

activeInfoWindow = new google.maps.InfoWindow({
content: `
<div class="dealer-info-bubble">
<h4>${loc.name}</h4>
<p>${loc.address}<br><strong>${loc.phone || ''}</strong></p>
<a href="${loc.website}" target="_blank" rel="noopener" class="dealer-bubble-btn">Visit Website</a>
</div>
`
});

activeInfoWindow.open(map, marker);
map.panTo(marker.getPosition());
map.setZoom(14);
}

// Populate Brand & City Dropdowns + Floating Flyout
function populateFilterControls() {
const brandSelect = document.getElementById('brandSelectFilter');
const citySelect = document.getElementById('citySelectFilter');
const brandFlyoutContainer = document.getElementById('brand-logos-container');

const brandSet = new Set();
const citySet = new Set();

locations.forEach(loc => {
if (loc.city) citySet.add(loc.city.trim());
if (loc.brand) {
loc.brand.split('/').forEach(b => brandSet.add(b.trim()));
}
});

// 1. Populate Brand Select
if (brandSelect) {
brandSelect.innerHTML = '<option value="">All Brands</option>';
Array.from(brandSet).sort().forEach(brand => {
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

// 3. Populate Floating Brand Flyout Modal
if (brandFlyoutContainer) {
brandFlyoutContainer.innerHTML = '';
const sortedBrands = Object.keys(BRAND_LOGOS).filter(b => b !== "Mercedez-Benz"); // Deduplicate

sortedBrands.forEach(brand => {
const tile = document.createElement('div');
tile.className = 'brand-logo-tile';
tile.dataset.brand = brand;
tile.innerHTML = `
<img src="${BRAND_LOGOS[brand]}" alt="${brand}" loading="lazy">
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
// Search input with debounce
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
