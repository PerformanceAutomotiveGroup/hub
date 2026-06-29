(function() {
// Safety wrapper ensuring code fires exactly when the document elements exist
const initEngine = () => {

// 1. DIAGNOSTIC DATA VALIDATION (Must run first)
if (typeof window.locationsData === 'undefined' || !window.locationsData.dealerships) {
console.error("Directory Data Engine Fault: window.locationsData.dealerships array context is absent.");
const fallbackLocationsEl = document.getElementById("locations");
if (fallbackLocationsEl) {
fallbackLocationsEl.innerHTML = "<div style='padding:20px; color:red;'>Data model matching fault.</div>";
}
return;
}

const dealerships = window.locationsData.dealerships;

// 2. CALCULATE AND INJECT GLOBAL SCORES (Decoupled from UI filter requirements)
if (dealerships && dealerships.length > 0) {
let totalReviews = 0;
let totalRatingSum = 0;
let validLocationsCount = 0;

dealerships.forEach(loc => {
const countVal = parseInt(loc.count, 10);
const ratingVal = parseFloat(loc.rating);

if (!isNaN(countVal)) {
totalReviews += countVal;
}
if (!isNaN(ratingVal) && ratingVal > 0) {
totalRatingSum += ratingVal;
validLocationsCount++;
}
});

const averageRating = validLocationsCount > 0 ? (totalRatingSum / validLocationsCount).toFixed(1) : "4.7";

const injectGlobalScores = () => {
// Support both old and new layout elements safely simultaneously
const globalAvgRatingEl = document.getElementById("globalAvgRating");
const globalReviewCountEl = document.getElementById("globalReviewCount");
const summaryAvgEl = document.getElementById("summaryAvgRating");
const summaryCountEl = document.getElementById("summaryReviewCount");
const summaryLocsEl = document.getElementById("summaryLocationCount");

if (globalAvgRatingEl) globalAvgRatingEl.textContent = averageRating;
if (globalReviewCountEl) globalReviewCountEl.textContent = totalReviews.toLocaleString('en-CA');

if (summaryAvgEl) summaryAvgEl.textContent = "★ " + averageRating;
if (summaryCountEl) summaryCountEl.textContent = totalReviews.toLocaleString('en-CA');
if (summaryLocsEl) summaryLocsEl.textContent = validLocationsCount;
};

injectGlobalScores();
setTimeout(injectGlobalScores, 200);
}

// 3. CAPTURE SIDEBAR FILTER COMPONENTS & VERIFY TARGETS
const locationsEl = document.getElementById("locations");
const locationFilter = document.getElementById("locationFilter");
const brandFilter = document.getElementById("brandFilter");
const searchInput = document.getElementById("searchInput");

if (!locationsEl || !locationFilter || !brandFilter || !searchInput) {
console.log("Directory layout components not found on this URL. Exiting sidebar mapping execution.");
return;
}

const panelPlaceholder = document.getElementById("panelPlaceholder");
const panelContent = document.getElementById("panelContent");
const panelTitle = document.getElementById("panelTitle");
const panelRating = document.getElementById("panelRating");
const panelAddress = document.getElementById("panelAddress");
const panelReviews = document.getElementById("panelReviews");
const panelGlobalLinkContainer = document.getElementById("panelGlobalLinkContainer");
const panelGlobalLink = document.getElementById("panelGlobalLink");
const ctaInventory = document.getElementById("ctaInventory");
const ctaService = document.getElementById("ctaService");

// 4. POPULATE LOCATION SELECTION DROPDOWN
dealerships.forEach(loc => {
if (!loc.key || !loc.name) return; 
const option = document.createElement("option");
option.value = loc.key;
option.textContent = loc.name;
locationFilter.appendChild(option);
});

// 5. POPULATE BRAND SELECTION DROPDOWN
const brands = new Set();
dealerships.forEach(loc => { 
if (loc.brand && typeof loc.brand === 'string' && loc.brand.trim() !== "") {
brands.add(loc.brand.trim()); 
}
});

Array.from(brands).sort().forEach(brand => {
const option = document.createElement("option");
option.value = brand.toLowerCase();
option.textContent = brand;
brandFilter.appendChild(option);
});

function formatReviewDate(isoString) {
try {
const dateObj = new Date(isoString);
if (isNaN(dateObj.getTime())) return "Recently";
return dateObj.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
} catch(e) { return "Recently"; }
}

// 6. RENDER SIDEBAR DIRECTORY CARDS
function renderLocations() {
locationsEl.innerHTML = "";
const search = searchInput.value.toLowerCase();
const selectedBrand = brandFilter.value;

dealerships.forEach(loc => {
const locBrandStr = loc.brand ? loc.brand.toLowerCase() : "";

if (
(locationFilter.value !== "all" && locationFilter.value !== loc.key) ||
(selectedBrand !== "all" && locBrandStr !== selectedBrand.toLowerCase()) ||
(search && !loc.name.toLowerCase().includes(search))
) return;

const brandNormalized = loc.brand ? loc.brand.toLowerCase() : "";
const logoUrl = brandNormalized ? `https://performanceautomotivegroup.github.io/hub/images/brands/${brandNormalized}.png` : "";

const card = document.createElement("div");
card.className = "location-card";
card.innerHTML = `
<div style="display:flex; align-items:center; gap:10px; cursor:pointer;">
${logoUrl ? `<img src="${logoUrl}" alt="${loc.brand || 'Dealership'} logo" style="width:90px; height:auto; max-height:50px; object-fit:contain;" onerror="this.style.display='none';">` : ''}
<div>
<div class="location-name" style="font-weight:bold;">${loc.name}</div>
<div class="location-meta">★ ${loc.rating || '0.0'} from ${loc.count || 0} reviews</div>
</div>
</div>
`;

card.onclick = () => {
openPanel(loc);
const panelEl = document.getElementById("panel");
if (panelEl) { panelEl.scrollIntoView({ behavior: "smooth", block: "start" }); }
};
locationsEl.appendChild(card);
});
}

// 7. POPULATE ACTIVE FEED DISPLAY PANEL
function openPanel(loc) {
document.querySelectorAll('.location-card').forEach(card => card.classList.remove('active'));
const cards = document.querySelectorAll('.location-card');
cards.forEach(card => {
const nameEl = card.querySelector('.location-name');
if (nameEl && nameEl.textContent === loc.name) card.classList.add('active');
});

if (panelPlaceholder) panelPlaceholder.style.display = "none";
if (panelContent) panelContent.style.display = "block";

if (panelTitle) panelTitle.textContent = loc.name;
if (panelRating) panelRating.textContent = `★ ${loc.rating} from ${loc.count} reviews`;
if (panelAddress) panelAddress.textContent = loc.address;
if (panelReviews) panelReviews.innerHTML = "";

if (ctaInventory && loc.ctas && loc.ctas.inventory) ctaInventory.href = loc.ctas.inventory;
if (ctaService && loc.ctas && loc.ctas.service) ctaService.href = loc.ctas.service;

if (loc.ctas && loc.ctas.dealershipHomeUrl && panelGlobalLink && panelGlobalLinkContainer) {
panelGlobalLink.href = loc.ctas.dealershipHomeUrl;
panelGlobalLink.textContent = `Read All ${loc.count} Reviews on Our Website →`;
panelGlobalLinkContainer.style.display = "block";
} else if (panelGlobalLinkContainer) {
panelGlobalLinkContainer.style.display = "none";
}

// --- FIXED LOCATION: Safely inside openPanel where 'loc' context is active ---
const subnavTitle = document.getElementById("subnavTitle");
const subnavRating = document.getElementById("subnavRating");
const subnavCtaInv = document.getElementById("subnavCtaInventory");
const subnavCtaSvc = document.getElementById("subnavCtaService");

if (subnavTitle) subnavTitle.textContent = loc.name;
if (subnavRating) subnavRating.textContent = `★ ${loc.rating} from ${loc.count} reviews`;
if (subnavCtaInv && loc.ctas?.inventory) subnavCtaInv.href = loc.ctas.inventory;
if (subnavCtaSvc && loc.ctas?.service) subnavCtaSvc.href = loc.ctas.service;
// -----------------------------------------------------------------------------

if (loc.reviews) {
loc.reviews.forEach(r => {
const isLongText = r.text && r.text.length > 120;
const shortText = isLongText ? r.text.substring(0, 120) + "..." : (r.text || "");
const formattedDate = formatReviewDate(r.date);

const review = document.createElement("div");
review.className = "review";
review.style.borderTop = "1px solid #e0e0e0";
review.style.padding = "12px 0";

review.innerHTML = `
<div class="review-meta" style="font-size:0.85em; color:#666; margin-bottom: 6px;">
★ ${r.rating} | ${loc.brand || 'General'} | Assisted by: ${r.customer || 'Verified Guest'} | ${formattedDate}
</div>
<div class="review-text">
<span class="preview">${shortText}</span>
${isLongText ? `<span class="full" style="display:none;">${r.text}</span>` : ''}
</div>
${isLongText ? `<span class="toggle" style="color:#2c68b5; cursor:pointer; font-size:0.9em; display:block; margin-top:4px;">Read more</span>` : ''}
`;

const toggle = review.querySelector(".toggle");
if (toggle) {
const preview = review.querySelector(".preview");
const full = review.querySelector(".full");

toggle.onclick = () => {
if (full.style.display === "none") {
full.style.display = "inline";
preview.style.display = "none";
toggle.textContent = "Show less";
} else {
full.style.display = "none";
preview.style.display = "inline";
toggle.textContent = "Read more";
}
};
}
if (panelReviews) panelReviews.appendChild(review);
});
}
}

// 8. GLOBAL SCROLL ENGINE EVENT TRACKER
window.addEventListener('scroll', () => {
const stickySubnav = document.getElementById('pag-sticky-subnav');
const layoutStartElement = document.querySelector('.layout');

if (!stickySubnav || !layoutStartElement) return;

const triggerPoint = layoutStartElement.offsetTop;
const isPanelActive = document.getElementById('panelContent').style.display === "block";

if (window.scrollY > triggerPoint && isPanelActive) {
stickySubnav.classList.add('is-sticky');
} else {
stickySubnav.classList.remove('is-sticky');
}
});

// Mount Event Listeners
locationFilter.onchange = renderLocations;
searchInput.oninput = renderLocations;
brandFilter.onchange = renderLocations;

// Initial render pass
renderLocations();
};

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initEngine);
} else {
initEngine();
}
})();
