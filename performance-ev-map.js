document.addEventListener("DOMContentLoaded", () => { 
const dataScript = document.getElementById('locationsData');
if (!dataScript) return;
let locations;
try {
locations = JSON.parse(dataScript.textContent);
} catch (e) {
console.error("JSON parsing error:", e);
return;
}

const container = document.getElementById('locationsList');
if (!container) return;
const markers = [];
const infoWindows = [];
let map;
let directionsService;
let directionsRenderer;
let selectedMode = 'DRIVING';

const cityFilter = document.getElementById('cityFilter');
const endSelect = document.querySelector('.end-location');

/* ----- Populate city filter and end select defaults ----- */
if (cityFilter) {
cityFilter.innerHTML = '';
const defaultCity = document.createElement('option');
defaultCity.value = '';
defaultCity.textContent = 'All Cities';
cityFilter.appendChild(defaultCity);
}

if (endSelect) {
endSelect.innerHTML = '';
const defaultEnd = document.createElement('option');
defaultEnd.value = '';
defaultEnd.textContent = 'Select a location';
endSelect.appendChild(defaultEnd);
}

const citiesSet = new Set();

/* ----- Create cards ----- */
locations.forEach((loc, index) => {
const card = document.createElement('div');
card.className = 'location-card';
card.setAttribute('data-city', loc.city);
card.setAttribute('data-index', index);

/* ----- Card content ----- */
const h5 = document.createElement('h5');
h5.textContent = loc.name;
card.appendChild(h5);

const pAddress = document.createElement('p');
pAddress.textContent = loc.address;
card.appendChild(pAddress);

const pCity = document.createElement('p');
pCity.textContent = loc.city;
card.appendChild(pCity);

/* ----- Actions container ----- */
const actionsDiv = document.createElement('div');
actionsDiv.className = 'actions';

const directionsBtn = document.createElement('a');
directionsBtn.target = "_blank";
directionsBtn.rel = "noopener";
directionsBtn.className = 'btn btn-outline';
directionsBtn.textContent = 'Map';

actionsDiv.appendChild(directionsBtn);
card.appendChild(actionsDiv);

/* ----- Append card to container ----- */
container.appendChild(card);

citiesSet.add(loc.city);

/* ----- Populate end-location dropdown once ----- */
if (endSelect && index === 0) {
endSelect.innerHTML = '';
const defaultEnd = document.createElement('option');
defaultEnd.value = '';
defaultEnd.textContent = 'Select a location';
endSelect.appendChild(defaultEnd);
locations.forEach((locOption, idx) => {
const opt = document.createElement('option');
opt.value = idx;
opt.textContent = locOption.name;
endSelect.appendChild(opt);
});
}

/* ----- Card click behavior to show marker ----- */
card.addEventListener('click', () => {
const marker = markers[index];
const infoWindow = infoWindows[index];

/* Close all other info windows */
infoWindows.forEach(iw => iw.close());

/* Open this card's marker info window */
infoWindow.open(map, marker);

/* Highlight the clicked card */
document.querySelectorAll('.location-card').forEach(c => c.style.border = 'none');
card.style.border = '2px solid #2c68b5';
card.style.borderRadius = '8px';

google.maps.event.addListenerOnce(infoWindows[index], 'domready', () => {
const iwContainer = document.querySelector('.gm-style-iw');
if (!iwContainer) return;

/* ----- Container Styling ----- */
iwContainer.style.padding = '20px 15px';
iwContainer.style.fontSize = '14px';
iwContainer.style.color = '#333';
iwContainer.style.cursor = 'pointer';
iwContainer.style.fontWeight = '600';
iwContainer.style.borderTop = '1px solid #2c68b5';
iwContainer.style.boxSizing = 'border-box';

/* ----- Title ----- */
const title = iwContainer.querySelector('strong');
if (title) {
title.style.display = 'block';
title.style.color = '#2c68b5';
title.style.marginBottom = '4px';
title.style.borderBottom = '1px solid #777';
title.style.paddingBottom = '2px';
}

/* ----- Address ----- */
const iwAddress = document.createElement('p');
iwAddress.textContent = locations[index].address+ ', ' + loc.city;
iwAddress.style.margin = '4px 0 6px 0';
iwAddress.style.fontWeight = '400';
iwAddress.style.color = '#555';
iwContainer.appendChild(iwAddress);

/* ----- Get Directions link ----- */
const learnMore = document.createElement('a');
learnMore.textContent = 'Get Directions >';
learnMore.className = 'btn btn-primary';
iwContainer.appendChild(learnMore);

learnMore.addEventListener('click', () => {
const directionsSection = document.querySelector('.map-sidebar--directions__modes');
if (directionsSection) directionsSection.scrollIntoView({
	behavior: 'smooth',
	block: 'start'
});
if (endSelect) {
	endSelect.value = String(index);
	endSelect.dispatchEvent(new Event('change', {
		bubbles: true
	}));
	endSelect.focus();
}
});

const getevdirections = document.createElement('a');
getevdirections.textContent = 'Google Maps >';
getevdirections.href = `https://www.google.com/maps/dir/?api=1&destination=${locations[index].lat},${locations[index].lng}`;
getevdirections.target = "_blank";
getevdirections.rel = "noopener";
getevdirections.style.color = '#2c68b5';
getevdirections.style.fontWeight = '500';
getevdirections.style.fontSize = '13px';
getevdirections.style.display = 'block';
getevdirections.style.marginTop = '6px';
iwContainer.appendChild(getevdirections);
});

/* Scroll map into view */
const mapElement = document.getElementById('map');
if (mapElement) mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* Center map on marker */
map.panTo(marker.getPosition());
});
});

/* ----- Populate city filter dropdown ----- */
if (cityFilter) {
Array.from(citiesSet).sort().forEach(city => {
const opt = document.createElement('option');
opt.value = city;
opt.textContent = city;
cityFilter.appendChild(opt);
});
}

/* ----- Initialize map and markers ----- */
function initMap() {
map = new google.maps.Map(document.getElementById("map"), {
center: { lat: 43.65107, lng: -79.347015 },
zoom: 10
});

directionsService = new google.maps.DirectionsService();
directionsRenderer = new google.maps.DirectionsRenderer({ map: map, panel: document.querySelector('.directions-results') });

locations.forEach((loc, index) => {
/* ----- Create marker ----- */
const marker = new google.maps.Marker({
map: map,
position: { lat: loc.lat, lng: loc.lng },
title: loc.name,
icon: {
url: 'https://performanceautoprod-com.cdn-convertus.com/uploads/sites/24/2026/02/EV-charging-station-yellow-blk.png',
scaledSize: new google.maps.Size(32, 32),
}
});

/* ----- Info window ----- */
const infoWindow = new google.maps.InfoWindow({ content: `${loc.name}`});

/* ----- Marker click behavior ----- */
marker.addListener('click', () => {
infoWindows.forEach(iw => iw.close());
infoWindow.open(map, marker);

/* Highlight the card */
document.querySelectorAll('.location-card').forEach(c => c.style.border = 'none');
const activeCard = Array.from(document.querySelectorAll('.location-card'))
.find(c => c.textContent.includes(loc.name));
if (activeCard) {
activeCard.style.border = '2px solid #2c68b5';
activeCard.style.borderRadius = '8px';
}

/* InfoWindow customization and Get Directions link */
google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
const iwContainer = document.querySelector('.gm-style-iw');

if (iwContainer) {
/* ----- Container Styling ----- */
iwContainer.style.padding = '20px 15px';
iwContainer.style.fontSize = '14px';
iwContainer.style.color = '#333';
iwContainer.style.cursor = 'pointer';
iwContainer.style.fontWeight = '600';
iwContainer.style.borderTop = '1px solid #2c68b5';
iwContainer.style.boxSizing = 'border-box'; /* ensure consistent sizing */

/* ----- Title Styling ----- */
const title = iwContainer.querySelector('strong');
if (title) {
title.style.display = 'block';
title.style.color = '#2c68b5';
title.style.marginBottom = '4px';
title.style.borderBottom = '1px solid #777';
title.style.paddingBottom = '2px';
}

/* ----- Address Styling ----- */
const iwAddress = document.createElement('p');
iwAddress.textContent = loc.address + ', ' + loc.city;
iwAddress.style.margin = '4px 0 6px 0';
iwAddress.style.fontWeight = '400';
iwAddress.style.color = '#555';
iwContainer.appendChild(iwAddress);

/* ----- Get Directions Link ----- */
const learnMore = document.createElement('a');
learnMore.textContent = 'Get Directions >';
learnMore.className = 'btn btn-primary';
iwContainer.appendChild(learnMore);

learnMore.addEventListener('click', () => {
const directionsSection = document.querySelector('.map-sidebar--directions__modes');
if (directionsSection) directionsSection.scrollIntoView({
	behavior: 'smooth',
	block: 'start'
});
if (endSelect) {
	endSelect.value = String(index);
	endSelect.dispatchEvent(new Event('change', {
		bubbles: true
	}));
	endSelect.focus();
}
});

const getevdirections = document.createElement('a');
getevdirections.textContent = 'Google Maps >';
getevdirections.href = `https://www.google.com/maps/dir/?api=1&destination=${locations[index].lat},${locations[index].lng}`;
getevdirections.target = "_blank";
getevdirections.rel = "noopener";
getevdirections.style.color = '#2c68b5';
getevdirections.style.fontWeight = '500';
getevdirections.style.fontSize = '13px';
getevdirections.style.display = 'block';
getevdirections.style.marginTop = '6px';
iwContainer.appendChild(getevdirections);
}
});

});

markers.push(marker);
infoWindows.push(infoWindow);
});
}

/* ----- Filter locations ----- */
function filterLocations() {
const city = cityFilter ? cityFilter.value : '';
const cards = document.querySelectorAll('#locationsList .location-card');
let anyVisible = false;
const bounds = new google.maps.LatLngBounds();

cards.forEach(card => {
const cardCity = card.getAttribute('data-city');
const markerIndex = parseInt(card.getAttribute('data-index'), 10);

const visible = !city || cardCity === city;

card.style.display = visible ? 'inline-block' : 'none';
if (markers[markerIndex]) {
markers[markerIndex].setMap(visible ? map : null);
if (visible) bounds.extend(markers[markerIndex].getPosition());
}
if (visible) anyVisible = true;
});

if (anyVisible && !bounds.isEmpty()) {
map.fitBounds(bounds);
}

const noResults = document.getElementById('noResults');
if (noResults) noResults.style.display = anyVisible ? 'none' : 'block';
}

/* ----- Reset filters ----- */
function resetFilters() {
if (cityFilter) cityFilter.value = '';
if (endSelect) endSelect.value = '';
if (directionsRenderer) directionsRenderer.setDirections({
routes: []
});
filterLocations();
infoWindows.forEach(iw => iw.close());
document.querySelectorAll('.location-card').forEach(card => card.style.border = 'none');

if (map) {
const bounds = new google.maps.LatLngBounds();
markers.forEach(marker => bounds.extend(marker.getPosition()));
map.fitBounds(bounds);
}
selectedMode = 'DRIVING';
document.querySelectorAll('.mode-button').forEach(btn => {
btn.style.background = '#e5e7eb';
btn.style.color = '#000';
});

const drivingBtn = document.querySelector('.mode-button[data-mode="DRIVING"]');
if (drivingBtn) {
drivingBtn.style.background = '#2c68b5';
drivingBtn.style.color = '#fff';
}
}

/* ----- MODE BUTTONS ----- */
document.querySelectorAll('.mode-button').forEach(button => {
button.addEventListener('click', () => {
document.querySelectorAll('.mode-button').forEach(b => {
b.style.background = '#e5e7eb';
b.style.color = '#000';
});

button.style.background = '#2c68b5';
button.style.color = '#fff';
selectedMode = button.dataset.mode;
const start = document.querySelector('.start-location').value;
const endIndex = endSelect ? endSelect.value : '';
if (start && endIndex !== "") {
const destination = {
lat: locations[endIndex].lat,
lng: locations[endIndex].lng
};

directionsService.route({
origin: start,
destination: destination,
travelMode: google.maps.TravelMode[selectedMode]
}, (result, status) => {
if (status === 'OK') directionsRenderer.setDirections(result);
else document.querySelector('.directions-results').innerHTML = `Could not calculate directions: ${status}`;
});
}
});
}); 

/* ----- GET DIRECTIONS ----- */
const getDirBtn = document.querySelector('.get-directions');
if (getDirBtn) {
getDirBtn.addEventListener('click', () => {
const start = document.querySelector('.start-location').value;
const endIndex = endSelect ? endSelect.value : '';
const results = document.querySelector('.directions-results');
const infoDiv = document.querySelector('.directions-results-info');
if (infoDiv) infoDiv.style.display = 'none';
if (!start || endIndex === "") {
results.innerHTML = 'Please enter your address and select a dealership.';
return;
}

const destination = {
lat: locations[endIndex].lat,
lng: locations[endIndex].lng
};

directionsService.route({
origin: start,
destination: destination,
travelMode: google.maps.TravelMode[selectedMode]
}, (result, status) => {
if (status === 'OK') directionsRenderer.setDirections(result);
else results.innerHTML = `Could not calculate directions: ${status}`;
});
});
} 

/* ----- Event listeners ----- */
cityFilter?.addEventListener('change', filterLocations);

/* ----- Initialize map and filters ----- */
initMap();
filterLocations();

/* ----- Expose for global use ----- */
window.filterLocations = filterLocations;
window.resetFilters = resetFilters;
});
