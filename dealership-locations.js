let map;
let directionsService;
let directionsRenderer;
let markers = [];
let locations = [];
let activeFacilityType = 'all'; 
let selectedCity = '';         
let searchTerm = '';
let activeCardIndex = null;
let selectedBrand = '';
let userCoords = null;

// PAG OEM Brands & Official Logos
const brandLogos = [
{ name: "Acura", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Acura-1.png" },
{ name: "Audi", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Audi.png" },
{ name: "BMW", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/BMW.png" },
{ name: "Chrysler", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Chrysler-1.png" },
{ name: "Dodge", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Dodge.png" },
{ name: "Ford", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Ford.png" },
{ name: "Genesis", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Genesis.png" },
{ name: "Honda", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Honda.png" },
{ name: "Hyundai", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/02-logo-10-hyundai.png" },
{ name: "INFINITI", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2023/06/INFINITI-Brampton.png" },
{ name: "Jeep", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Jeep.png" },
{ name: "Kia", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/KIA-175_175.png" },
{ name: "Lexus", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Lexus.png" },
{ name: "MINI", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/MINI.png" },
{ name: "Mazda", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/LOGO-15.png" },
{ name: "Mercedes-Benz", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Mercedes-Benz.png" },
{ name: "Mitsubishi", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Mitsbusihi.png" },
{ name: "Nissan", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Nissan.png" },
{ name: "RAM", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/RAM.png" },
{ name: "Subaru", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/logo-21-subaru.png" },
{ name: "Toyota", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/02-logo-22-toyota.png" },
{ name: "Volkswagen", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2019/10/Volkswagen.png" },
{ name: "AutoPlanet", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2020/11/Auto-Planet-Direct-Locations.png" },
{ name: "Collision", logo: "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2025/12/PERF-COLLISION-HORZ-RGB.png" }
];

// Helper: Lookup matching logo URL by brand name
function getBrandLogoUrl(brandString, isCollision) {
if (isCollision) {
return "https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2025/12/PERF-COLLISION-HORZ-RGB.png";
}
if (!brandString) return "";
const primaryBrand = brandString.split('/')[0].trim().toLowerCase();
const match = brandLogos.find(b => b.name.toLowerCase() === primaryBrand || primaryBrand.includes(b.name.toLowerCase()));
return match ? match.logo : "";
}

// Toggle Left Sidebar (matches EV Map behavior)
function toggleSidebar() {
const sidebar = document.getElementById('dealer-sidebar');
const icon = document.getElementById('toggle-icon');
sidebar.classList.toggle('collapsed');
icon.innerText = sidebar.classList.contains('collapsed') ? '❯' : '❮';
}

// Toggle Floating Brand Flyout Panel
function toggleBrandFlyout() {
const panel = document.getElementById('brand-flyout-panel');
panel.classList.toggle('open');
}

// Bootstrap Directory Application
async function initDealerDirectory() {
const res = await fetch('https://performanceautomotivegroup.github.io/hub/dealerships.json');
locations = await res.json();

try {
locations = JSON.parse(rawDataEl.textContent);
} catch (err) {
console.error("Failed to parse locations manifest JSON", err);
return;
}

// Initialize Google Map Canvas centered over Southern Ontario
map = new google.maps.Map(document.getElementById("dealer-map-canvas"), {
center: { lat: 43.68, lng: -79.62 },
zoom: 9.3,
mapTypeControl: false,
streetViewControl: false,
fullscreenControl: false,
styles: [
{ featureType: "poi.business", stylers: [{ visibility: "off" }] },
{ featureType: "transit", stylers: [{ visibility: "simplified" }] }
]
});

directionsService = new google.maps.DirectionsService();
directionsRenderer = new google.maps.DirectionsRenderer({
map: map,
panel: document.getElementById('dealer-directions-panel'),
suppressMarkers: false
});

populateFilterDropdowns();
updateFacetCounts();
buildMarkers();
buildBrandFlyout();
renderCardsList();
setupEventListeners();
}

// Populate dynamic Brand & City dropdown options based on active locations
function populateFilterDropdowns() {
const brandSelect = document.getElementById('brandSelectFilter');
const citySelect = document.getElementById('citySelectFilter');
if (!brandSelect || !citySelect) return;

const brandSet = new Set();
const citySet = new Set();

locations.forEach(loc => {
if (loc.isCollision) {
brandSet.add("Performance Collision");
} else if (loc.brand) {
loc.brand.split('/').forEach(b => brandSet.add(b.trim()));
}
if (loc.city) {
citySet.add(loc.city.trim());
}
});

// Populate Brands
brandSelect.innerHTML = '<option value="">All Brands</option>';
Array.from(brandSet).sort().forEach(brand => {
const opt = document.createElement('option');
opt.value = brand;
opt.textContent = brand;
brandSelect.appendChild(opt);
});

// Populate Cities
citySelect.innerHTML = '<option value="">All Cities</option>';
Array.from(citySet).sort().forEach(city => {
const opt = document.createElement('option');
opt.value = city;
opt.textContent = city;
citySelect.appendChild(opt);
});
}

// Calculate Haversine distance in KM
function computeDistanceKm(lat1, lon1, lat2, lon2) {
const R = 6371;
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLon = (lon2 - lon1) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
Math.sin(dLon/2) * Math.sin(dLon/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
return (R * c).toFixed(1);
}

// Geolocation trigger ("Near Me")
function locateUser() {
const btn = document.getElementById('near-me-btn');
if (!navigator.geolocation) {
return;
}
btn.innerText = 'Locating...';
navigator.geolocation.getCurrentPosition(
(pos) => {
userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
btn.classList.add('active');
btn.innerHTML = `
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
<span>Near Me</span>
`;
locations.forEach(loc => {
loc._dist = parseFloat(computeDistanceKm(userCoords.lat, userCoords.lng, loc.lat, loc.lng));
});
locations.sort((a, b) => (a._dist || 9999) - (b._dist || 9999));
buildMarkers();
renderCardsList();
map.panTo(userCoords);
map.setZoom(11);
},
() => {
btn.innerText = 'Near Me';
},
{ timeout: 7000 }
);
}

// Update Live Facet Counts
function updateFacetCounts() {
const totalAll = locations.length;
const totalCollision = locations.filter(l => l.isCollision).length;
const totalDealerships = totalAll - totalCollision;

document.getElementById('count-all').innerText = totalAll;
document.getElementById('count-dealerships').innerText = totalDealerships;
document.getElementById('count-collision').innerText = totalCollision;
}

// Build Floating Brand Filter Flyout
function buildBrandFlyout() {
const container = document.getElementById('brand-logos-container');
container.innerHTML = '';

brandLogos.forEach(b => {
const tile = document.createElement('div');
tile.className = 'brand-logo-tile';
if (selectedBrand.toLowerCase() === b.name.toLowerCase()) tile.classList.add('active');

tile.innerHTML = `
<img src="${b.logo}" alt="${b.name}" loading="lazy" onerror="this.style.display='none'">
<span>${b.name}</span>
`;

tile.addEventListener('click', () => {
if (selectedBrand.toLowerCase() === b.name.toLowerCase()) {
clearBrandSelection();
} else {
selectedBrand = b.name;
const brandSelect = document.getElementById('brandSelectFilter');
if (brandSelect) {
const matchingOpt = Array.from(brandSelect.options).find(o => o.value.toLowerCase().includes(b.name.toLowerCase()));
if (matchingOpt) brandSelect.value = matchingOpt.value;
}
document.querySelectorAll('.brand-logo-tile').forEach(t => t.classList.remove('active'));
tile.classList.add('active');
document.getElementById('brand-selected-badge').innerText = b.name.split(' ')[0];
toggleBrandFlyout();
renderCardsList();
}
});

container.appendChild(tile);
});
}

function clearBrandSelection() {
selectedBrand = '';
const brandSelect = document.getElementById('brandSelectFilter');
if (brandSelect) brandSelect.value = '';
document.querySelectorAll('.brand-logo-tile').forEach(t => t.classList.remove('active'));
document.getElementById('brand-selected-badge').innerText = '24';
const panel = document.getElementById('brand-flyout-panel');
if (panel.classList.contains('open')) toggleBrandFlyout();
renderCardsList();
}

// Construct Custom Google Maps Markers
function buildMarkers() {
markers.forEach(m => m.setMap(null));
markers = [];

locations.forEach((loc, idx) => {
const pinSvg = loc.isCollision 
? `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
<path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 25 17 25s17-12.2 17-25C34 7.6 26.4 0 17 0z" fill="#E21F2F"/>
<circle cx="17" cy="15" r="7" fill="#ffffff"/>
<path d="M14 12l6 6m0-6l-6 6" stroke="#E21F2F" stroke-width="2" stroke-linecap="round"/>
</svg>`)}`
: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
<path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 25 17 25s17-12.2 17-25C34 7.6 26.4 0 17 0z" fill="#0668B3"/>
<circle cx="17" cy="15" r="7" fill="#ffffff"/>
<circle cx="17" cy="15" r="4.5" fill="#0668B3"/>
</svg>`)}`;

const marker = new google.maps.Marker({
position: { lat: loc.lat, lng: loc.lng },
map: map,
title: loc.name,
icon: {
url: pinSvg,
scaledSize: new google.maps.Size(30, 38),
anchor: new google.maps.Point(15, 38)
}
});

const infoWindow = new google.maps.InfoWindow({
content: `
<div class="dealer-info-bubble">
<h4>${loc.name}</h4>
<p>${loc.address}<br><strong>${loc.phone}</strong></p>
<div style="display:flex; gap:6px;">
<a href="${loc.website}" target="_blank" rel="noopener" class="dealer-bubble-btn">Website</a>
<button type="button" class="dealer-bubble-btn" style="background:#555;" onclick="triggerDirections(${idx})">Route</button>
</div>
</div>
`
});

marker.addListener('click', () => {
markers.forEach(m => m.infoWindow?.close());
infoWindow.open(map, marker);
marker.infoWindow = infoWindow;
highlightCard(idx, true);
});

marker.infoWindow = infoWindow;
markers.push(marker);
});
}

// Filter & Render Sidebar Cards
function renderCardsList() {
const listEl = document.getElementById('dealer-results-list');
listEl.innerHTML = '';

let visibleCount = 0;
const bounds = new google.maps.LatLngBounds();

locations.forEach((loc, index) => {
// 1. Facility Type Segment Filter
let matchesType = true;
if (activeFacilityType === 'dealerships') matchesType = !loc.isCollision;
else if (activeFacilityType === 'collision') matchesType = !!loc.isCollision;

// 2. City Dropdown Filter
let matchesCity = true;
if (selectedCity) {
matchesCity = (loc.city || '').toLowerCase().trim() === selectedCity.toLowerCase().trim();
}

// 3. Brand Filter (synced between dropdown & flyout)
let matchesBrand = true;
if (selectedBrand) {
if (selectedBrand === 'Collision' || selectedBrand === 'Performance Collision') {
matchesBrand = !!loc.isCollision;
} else {
matchesBrand = (loc.brand || '').toLowerCase().includes(selectedBrand.toLowerCase());
}
}

// 4. Search Query (name, address, city, brand)
const query = searchTerm.toLowerCase().trim();
const matchesSearch = !query || 
loc.name.toLowerCase().includes(query) ||
loc.brand.toLowerCase().includes(query) ||
loc.city.toLowerCase().includes(query) ||
loc.address.toLowerCase().includes(query);

const isVisible = matchesType && matchesCity && matchesBrand && matchesSearch;

if (markers[index]) {
markers[index].setMap(isVisible ? map : null);
if (isVisible) {
bounds.extend(markers[index].getPosition());
}
}

if (!isVisible) return;
visibleCount++;

// Get matching brand logo URL
const logoUrl = getBrandLogoUrl(loc.brand, loc.isCollision);

// Build Card Element
const card = document.createElement('div');
card.className = `dealer-location-card ${activeCardIndex === index ? 'active-selected' : ''}`;
card.setAttribute('data-card-idx', index);

card.innerHTML = `
<div class="card-top-header">
<div>
<h5>${loc.name}</h5>
<div class="card-address-txt">${loc.address}</div>
</div>
${logoUrl ? `
<div class="dealer-brand-logo-badge">
<img src="${logoUrl}" alt="${loc.brand}" loading="lazy">
</div>
` : ''}
</div>

<div class="card-contact-row">
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
<a href="tel:${loc.phone.replace(/[^0-9]/g, '')}">${loc.phone}</a>
${loc._dist ? `<span class="dealer-dist-tag">${loc._dist} km away</span>` : ''}
</div>

<!-- Services Quick Links -->
<div class="card-service-tags">
${(loc.services || []).map(s => `
<a href="${s.link}" target="_blank" rel="noopener" class="card-service-pill">${s.name}</a>
`).join('')}
</div>

<!-- Action Buttons -->
<div class="card-actions-grid">
<a href="${loc.website}" target="_blank" rel="noopener" class="card-btn btn-card-primary">Website</a>
<button type="button" class="card-btn btn-card-secondary" onclick="triggerDirections(${index})">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
Directions
</button>
</div>
`;

card.addEventListener('click', (e) => {
if (e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'button') return;
highlightCard(index, false);
});

listEl.appendChild(card);
});

document.getElementById('visible-dealers-count').innerText = visibleCount;

if (visibleCount === 0) {
listEl.innerHTML = `
<div style="padding: 30px 20px; text-align: center; color: #777;">
<p style="font-size:14px; font-weight:600; margin-bottom:6px;">No locations found</p>
<p style="font-size:12.5px;">Try clearing filters or selecting another brand or city.</p>
</div>
`;
} else if (searchTerm || activeFacilityType !== 'all' || selectedBrand || selectedCity) {
map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
}
}

// Highlight Card & Pan Map
function highlightCard(index, scrollCard = true) {
activeCardIndex = index;
const target = locations[index];
if (!target) return;

document.querySelectorAll('.dealer-location-card').forEach(c => c.classList.remove('active-selected'));
const activeCard = document.querySelector(`.dealer-location-card[data-card-idx="${index}"]`);
if (activeCard) {
activeCard.classList.add('active-selected');
if (scrollCard) {
activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
}

map.panTo({ lat: target.lat, lng: target.lng });
map.setZoom(13.5);

if (markers[index]) {
markers.forEach(m => m.infoWindow?.close());
markers[index].infoWindow?.open(map, markers[index]);
}
}

// Turn-by-Turn Route Calculator in Panel (EV Map parity)
function triggerDirections(index) {
const loc = locations[index];
if (!loc) return;

const directionsPanel = document.getElementById('dealer-directions-panel');
const resultsList = document.getElementById('dealer-results-list');

resultsList.style.display = 'none';
directionsPanel.style.display = 'block';

directionsPanel.innerHTML = `
<div class="route-actions-group">
<a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.address)}" target="_blank" rel="noopener" class="gmaps-launch-btn">
Open in Google Maps App
</a>
<button type="button" class="exit-directions-btn" onclick="exitDirections()">
← Back to Dealership List
</button>
</div>
<div id="turn-by-turn-steps">
<p style="font-size:13px; color:#666; text-align:center; padding:15px;">Calculating route from current location...</p>
</div>
`;

if (navigator.geolocation) {
navigator.geolocation.getCurrentPosition(
(pos) => {
const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
const destination = { lat: loc.lat, lng: loc.lng };
directionsService.route({
origin: origin,
destination: destination,
travelMode: google.maps.TravelMode.DRIVING
}, (res, status) => {
if (status === 'OK') {
directionsRenderer.setDirections(res);
directionsRenderer.setPanel(document.getElementById('turn-by-turn-steps'));
} else {
document.getElementById('turn-by-turn-steps').innerHTML = `
<p style="padding:15px; color:#c00;">Route calculation failed. Click "Open in Google Maps App" above for instant directions.</p>
`;
}
});
},
() => {
document.getElementById('turn-by-turn-steps').innerHTML = `
<p style="padding:15px; font-size:13px; color:#555;">Location permission denied. Click "Open in Google Maps App" above to enter your starting point manually.</p>
`;
}
);
}
}

function exitDirections() {
directionsRenderer.setDirections({ routes: [] });
document.getElementById('dealer-directions-panel').style.display = 'none';
document.getElementById('dealer-results-list').style.display = 'block';
}

// Reset All Filters
function resetAllFilters() {
searchTerm = '';
selectedBrand = '';
selectedCity = '';
activeFacilityType = 'all';

document.getElementById('dealer-places-search-bar').value = '';
document.getElementById('brand-selected-badge').innerText = '24';

const brandSelect = document.getElementById('brandSelectFilter');
if (brandSelect) brandSelect.value = '';

const citySelect = document.getElementById('citySelectFilter');
if (citySelect) citySelect.value = '';

document.querySelectorAll('.brand-logo-tile').forEach(t => t.classList.remove('active'));

const segButtons = document.querySelectorAll('.seg-btn');
segButtons.forEach(b => b.classList.remove('active'));
document.getElementById('seg-all').classList.add('active');

const nearBtn = document.getElementById('near-me-btn');
nearBtn.classList.remove('active');
nearBtn.innerHTML = `
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-7.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
<span>Near Me</span>
`;

exitDirections();
renderCardsList();
map.setCenter({ lat: 43.68, lng: -79.62 });
map.setZoom(9.3);
}

// Event Listeners for Filters & Search Bar
function setupEventListeners() {
const searchInput = document.getElementById('dealer-places-search-bar');
searchInput.addEventListener('input', (e) => {
searchTerm = e.target.value;
renderCardsList();
});

// Brand Select Dropdown
const brandSelect = document.getElementById('brandSelectFilter');
brandSelect.addEventListener('change', (e) => {
selectedBrand = e.target.value;

// Sync badge and flyout active state
const badge = document.getElementById('brand-selected-badge');
if (badge) badge.innerText = selectedBrand ? selectedBrand.split(' ')[0] : '24';

document.querySelectorAll('.brand-logo-tile').forEach(tile => {
const name = tile.querySelector('span')?.innerText;
if (selectedBrand && name && (name.toLowerCase() === selectedBrand.toLowerCase() || (selectedBrand.includes('Collision') && name === 'Collision'))) {
tile.classList.add('active');
} else {
tile.classList.remove('active');
}
});

renderCardsList();
});

// City Select Dropdown
const citySelect = document.getElementById('citySelectFilter');
citySelect.addEventListener('change', (e) => {
selectedCity = e.target.value;
renderCardsList();
});

// Tier 1: Facility Type Segmented Control
const segButtons = document.querySelectorAll('.seg-btn');
segButtons.forEach(btn => {
btn.addEventListener('click', () => {
segButtons.forEach(b => b.classList.remove('active'));
btn.classList.add('active');
activeFacilityType = btn.getAttribute('data-type');
renderCardsList();
});
});
}

// Load and bootstrap
window.addEventListener('load', () => {
initDealerDirectory();
});
