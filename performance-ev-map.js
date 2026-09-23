(function() {
let ev_Map, ev_InfoWindow, directionsService, directionsRenderer;
let ev_Markers = [];
let isPanning = false;

// Discrete Geographic Sectors to force independent 20-result queries across regions
const REGIONAL_SECTORS = [
{
name: "Peel/Halton",
bounds: { north: 43.820, south: 43.480, west: -79.920, east: -79.540 }
},
{
name: "Hamilton/Burlington",
bounds: { north: 43.450, south: 43.150, west: -80.100, east: -79.680 }
},
{
name: "Niagara Peninsula",
bounds: { north: 43.280, south: 42.850, west: -79.550, east: -79.020 }
}
];

function formatConnector(type) {
if (!type) return "Unknown";
const types = { 
'EV_CONNECTOR_TYPE_J1772': 'J1772', 
'EV_CONNECTOR_TYPE_CCS_COMBO_1': 'CCS', 
'EV_CONNECTOR_TYPE_CHADEMO': 'CHAdeMO', 
'EV_CONNECTOR_TYPE_TESLA': 'Tesla' 
};
return types[type] || type.replace('EV_CONNECTOR_TYPE_', '').replace(/_/g, ' ');
}

// Custom #2c68b5 SVG pin matching your updated design
function createCustomEVIcon() {
const pin = document.createElement('div');
pin.className = 'custom-ev-pin';
pin.innerHTML = `
<svg width="22" height="30" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer;">
<!-- Outer Pin Body -->
<path d="M17 41C17 41 32 26.5 32 16.5C32 7.3873 25.2843 0 17 0C8.71573 0 2 7.3873 2 16.5C2 26.5 17 41 17 41Z" fill="#ffffff" stroke="#ffffff" stroke-width="2"/>
<!-- Inner Circular Badge -->
<circle cx="17" cy="16.5" r="14" fill="#2c68b5" stroke="#ffffff" stroke-width="2"/>
<!-- White Lightning Bolt -->
<path d="M17.5 9.5L13 16.5H16.5L15.5 22.5L21.5 15H17.5L18.5 9.5H17.5Z" fill="#ffffff"/>
</svg>
`;
return pin;
}

window.closeEVInfoWindow = function() {
if (ev_InfoWindow) ev_InfoWindow.close();
};

window.triggerNearbySearch = function(lat, lng) {
if (!ev_Map) return;
ev_Map.setCenter({lat: lat, lng: lng});
ev_Map.setZoom(15); 
};

window.clearRoute = function() {
if (directionsRenderer) {
directionsRenderer.setMap(null);
directionsRenderer.setDirections({ routes: [] });
}

// 1. Restore station map pins
ev_Markers.forEach(m => m.map = ev_Map);

// 2. Switch sidebar view back to station search results
const resultsList = document.getElementById('ev-results-list');
const panel = document.getElementById('ev-directions-panel');
const title = document.getElementById('ev-sidebar-title');

if (panel) {
panel.style.display = 'none';
panel.innerHTML = '';
}
if (resultsList) {
resultsList.style.display = 'block';
}
if (title) {
title.innerText = 'EV STATIONS';
}
};

window.calculateRoute = function(destLat, destLng) {
if (!directionsService || !directionsRenderer) return;

const panel = document.getElementById('ev-directions-panel');
const resultsList = document.getElementById('ev-results-list');
const title = document.getElementById('ev-sidebar-title');
const sidebar = document.getElementById('ev-sidebar');
const icon = document.getElementById('toggle-icon');

if (!navigator.geolocation) {
alert("Location services are not supported by your browser. Please enter a starting point manually.");
return;
}

navigator.geolocation.getCurrentPosition(
(position) => {
const origin = { 
lat: position.coords.latitude, 
lng: position.coords.longitude 
};

const destination = { 
lat: parseFloat(destLat), 
lng: parseFloat(destLng) 
};

directionsService.route({
origin: origin,
destination: destination,
travelMode: google.maps.TravelMode.DRIVING
}, (result, status) => {
if (status === 'OK') {
if (ev_InfoWindow) ev_InfoWindow.close();

// Hide pins during active navigation
ev_Markers.forEach(m => m.map = null);

// Ensure sidebar is open to display directions
if (sidebar && sidebar.classList.contains('collapsed')) {
sidebar.classList.remove('collapsed');
if (icon) icon.innerText = '❮';
}

// Swap views inside the sidebar
if (resultsList) resultsList.style.display = 'none';
if (title) title.innerText = 'DIRECTIONS';

if (panel) {
panel.innerHTML = '';
panel.style.display = 'block';

// 1. Container for both action buttons
const btnContainer = document.createElement('div');
btnContainer.className = 'ev-route-actions-group';

// 2. Open in Google Maps navigation button
const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
const gmapsBtn = document.createElement('a');
gmapsBtn.className = 'ev-gmaps-nav-btn';
gmapsBtn.href = gmapsUrl;
gmapsBtn.target = '_blank';
gmapsBtn.rel = 'noopener noreferrer';
gmapsBtn.innerHTML = '<span>Open in Google Maps</span> ↗';

// 3. Exit route button
const resetBtn = document.createElement('button');
resetBtn.className = 'ev-exit-route-btn';
resetBtn.innerHTML = '✕ Exit Directions & View Stations';
resetBtn.onclick = window.clearRoute;

// 4. Append both buttons to the container, then add to panel
btnContainer.appendChild(gmapsBtn);
btnContainer.appendChild(resetBtn);
panel.appendChild(btnContainer);

directionsRenderer.setMap(ev_Map);
directionsRenderer.setPanel(panel);
panel.scrollTop = 0;
}

directionsRenderer.setDirections(result);
} else {
alert("Unable to find a driving route: " + status);
}
});
},
(error) => {
switch(error.code) {
case error.PERMISSION_DENIED:
alert(
"Location access was blocked.\n\n" +
"To view turn-by-turn directions:\n" +
"1. Click the location/padlock icon (🔒) in your browser address bar.\n" +
"2. Set 'Location' permissions to 'Allow'.\n" +
"3. Refresh the page and try again."
);
break;
case error.POSITION_UNAVAILABLE:
alert("Your current location could not be determined. Please ensure device location / GPS is enabled.");
break;
case error.TIMEOUT:
alert("Locating your position timed out. Please check your connection and try again.");
break;
default:
alert("An unknown error occurred while retrieving your location.");
break;
}
},
{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
);
};

async function initMap() {
if (typeof google === 'undefined' || !google.maps || !google.maps.importLibrary) {
setTimeout(initMap, 200);
return;
}

const mapCanvas = document.getElementById("ev-map-canvas");
if (!mapCanvas) {
setTimeout(initMap, 200);
return;
}

try {
const [{ Map }, { Place }, { AdvancedMarkerElement }] = await Promise.all([
google.maps.importLibrary("maps"),
google.maps.importLibrary("places"),
google.maps.importLibrary("marker")
]);

// Framing the Golden Horseshoe corridor (Brampton, Mississauga, Hamilton, Niagara)
ev_Map = new Map(mapCanvas, {
center: { lat: 43.460, lng: -79.670 }, 
zoom: 10,
mapId: "e9da2b0d1db902e558a4a8df",
mapTypeControl: false,
streetViewControl: false,
fullscreenControl: true
});

directionsService = new google.maps.DirectionsService();
directionsRenderer = new google.maps.DirectionsRenderer({
suppressMarkers: false,
polylineOptions: {
strokeColor: "#2c68b5",
strokeWeight: 5,
zIndex: 999
}
});

ev_InfoWindow = new google.maps.InfoWindow();

ev_Map.addListener("idle", async () => {
if (isPanning) { isPanning = false; return; }
fetchStations(Place, AdvancedMarkerElement);
});
} catch (err) { console.error("Initialization Error", err); }
}

async function fetchStations(Place, AdvancedMarkerElement) {
const zoom = ev_Map.getZoom();

// 1. Zoomed In (City/Neighborhood level): Standard viewport query
if (zoom >= 11) {
const bounds = ev_Map.getBounds();
if (!bounds) return;

const request = {
textQuery: "EV Charging Station",
fields: ["displayName", "location", "formattedAddress", "evChargeOptions", "photos", "editorialSummary"],
locationRestriction: bounds,
maxResultCount: 20
};

try {
const { places } = await Place.searchByText(request);
renderUI(places || [], AdvancedMarkerElement);
} catch (e) { console.error("Search failed:", e); }
return;
}

// 2. Zoomed Out (Regional View): 3 Parallel Sector-Restricted Queries (Loads up to 60 stations)
try {
const sectorPromises = REGIONAL_SECTORS.map(sector => {
return Place.searchByText({
textQuery: "EV Charging Station",
fields: ["displayName", "location", "formattedAddress", "evChargeOptions", "photos", "editorialSummary"],
locationRestriction: sector.bounds,
maxResultCount: 20
}).then(res => res.places || []).catch(() => []);
});

const resultsArray = await Promise.all(sectorPromises);

// Deduplicate stations returned across overlapping boundaries
const allPlaces = [];
const seenLocations = new Set();

resultsArray.flat().forEach(place => {
if (!place.location) return;
const key = `${place.location.lat().toFixed(4)},${place.location.lng().toFixed(4)}`;
if (!seenLocations.has(key)) {
seenLocations.add(key);
allPlaces.push(place);
}
});

renderUI(allPlaces, AdvancedMarkerElement);
} catch (e) {
console.error("Multi-sector search failed:", e);
}
}

function renderUI(places, AdvancedMarkerElement) {
ev_Markers.forEach(m => m.map = null);
ev_Markers = [];
const list = document.getElementById('ev-results-list');
if (!list) return;
list.innerHTML = '';

if (!places || places.length === 0) {
list.innerHTML = '<p style="padding:20px; color:#70757a;">No charging stations found in this area. Move the map to explore.</p>';
return;
}

places.forEach((place, index) => {
const pinElement = createCustomEVIcon();
const marker = new AdvancedMarkerElement({
map: ev_Map,
position: place.location,
title: place.displayName,
content: pinElement,
gmpClickable: true 
});
ev_Markers.push(marker);

const card = document.createElement('div');
card.className = 'ev-location-card';
card.id = `ev-card-${index}`;
card.style.cssText = "padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer; background:#fff; font-family:Roboto, Arial, sans-serif;";

const addr = place.formattedAddress || "";

let sidebarPlugs = '';
(place.evChargeOptions?.connectorAggregations || []).forEach(agg => {
sidebarPlugs += `<div style="display:flex; justify-content:space-between; font-size:13px; margin-top:8px;"><span style="color:#2c68b5;">⚡ ${formatConnector(agg.type)}</span><span style="background:#f1f3f4; padding:0 8px; border-radius:4px;">0/${agg.count || 1}</span></div>`;
});

// Card without star ranking
card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:start;"><div style="width:78%"><h5 style="margin:0; font-size:16px; font-weight:500; color:#202124;">${place.displayName}</h5><p style="margin:4px 0; font-size:13px; color:#70757a;">${addr}</p>${sidebarPlugs}</div><div style="text-align:center; color:#2c68b5; font-size:11px;" onclick="event.stopPropagation(); window.calculateRoute(${place.location.lat()}, ${place.location.lng()})"><div style="width:34px; height:34px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">↱</div>Directions</div></div>`;

const select = (e) => {
if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
isPanning = true; 
ev_Map.panTo(place.location);

const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].getURI({maxWidth: 400}) : '';
const aboutText = place.editorialSummary || "Electric vehicle charging station providing reliable power services.";

// InfoWindow popup without star ranking
const infoHtml = `
<div style="width:250px; font-family:Roboto, Arial; background:#fff; border-radius:12px; overflow:hidden; position:relative;">
${photoUrl ? `<div style="width:100%; height:140px; background:url('${photoUrl}') center/cover no-repeat;"></div>` : ''}
<div onclick="window.closeEVInfoWindow()" style="position:absolute; top:12px; right:12px; background:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:22px; z-index:100; color:#3c4043;">×</div>
<div style="padding:16px 16px 0 16px;">
<h2 style="margin:0; font-size:18px; font-weight:400; color:#202124; margin-right:30px;">${place.displayName}</h2>
</div>
<div style="display:flex; border-bottom:1px solid #e0e0e0; margin-top:8px;">
<div id="tab-overview" style="flex:1; text-align:center; padding:12px; color:#2c68b5; border-bottom:3px solid #2c68b5; font-weight:500; cursor:pointer;" onclick="document.getElementById('info-content-about').style.display='none'; document.getElementById('info-content-overview').style.display='block'; this.style.color='#2c68b5'; this.style.borderBottom='3px solid #2c68b5'; document.getElementById('tab-about').style.color='#70757a'; document.getElementById('tab-about').style.borderBottom='none';">Overview</div>
<div id="tab-about" style="flex:1; text-align:center; padding:12px; color:#70757a; font-weight:500; cursor:pointer;" onclick="document.getElementById('info-content-overview').style.display='none'; document.getElementById('info-content-about').style.display='block'; this.style.color='#2c68b5'; this.style.borderBottom='3px solid #2c68b5'; document.getElementById('tab-overview').style.color='#70757a'; document.getElementById('tab-overview').style.borderBottom='none';">About</div>
</div>
<div id="info-content-overview">
<div style="display:flex; justify-content:space-around; padding:16px 8px; border-bottom:1px solid #f1f3f4;">
<div style="text-align:center; cursor:pointer;" onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})">
<div style="width:35px; height:35px; border-radius:50%; background:#2c68b5; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:20px;">↱</div>
<div style="font-size:11px; color:#2c68b5; font-weight:500; margin-top:6px;">Directions</div>
</div>
<div style="text-align:center; cursor:pointer;" onclick="window.triggerNearbySearch(${place.location.lat()}, ${place.location.lng()})">
<div style="width:35px; height:35px; border-radius:50%; border:1px solid #dadce0; color:#2c68b5; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">📍</div>
<div style="font-size:11px; color:#2c68b5; font-weight:500; margin-top:6px;">Nearby</div>
</div>
<div style="text-align:center; cursor:pointer;" onclick="if(navigator.share){navigator.share({title:'${place.displayName}', url:window.location.href})}">
<div style="width:35px; height:35px; border-radius:50%; border:1px solid #dadce0; color:#2c68b5; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">🔗</div>
<div style="font-size:11px; color:#2c68b5; font-weight:500; margin-top:6px;">Share</div>
</div>
</div>
<div style="padding:16px;">
<div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:16px;">
<span style="font-size:14px; color:#3c4043; line-height:1.4;">${addr}</span>
</div>
<div style="display:flex; gap:12px; align-items:center;">
<span style="font-size:14px; color:#188038; font-weight:500;">Open 24 hours ▾</span>
</div>
</div>
</div>
<div id="info-content-about" style="display:none; padding:20px; font-size:14px; color:#3c4043; line-height:1.6;">
<div style="margin-bottom:10px; font-weight:500; color:#202124;">About this location</div>
${aboutText}
</div>
</div>`;

ev_InfoWindow.setOptions({ content: infoHtml, headerDisabled: true });
ev_InfoWindow.open({ anchor: marker, map: ev_Map, shouldFocus: false });

document.querySelectorAll('.ev-location-card').forEach(c => c.style.background = '#fff');
card.style.background = '#f8f9fa';
card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

marker.addListener('gmp-click', (e) => select(e));
card.onclick = (e) => select(e);
list.appendChild(card);
});
}

if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initMap);
} else {
initMap();
}
})();
