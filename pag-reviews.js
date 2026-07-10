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
${logoUrl ? `<img src="${logoUrl}" alt="${loc.brand || 'Dealership'} logo" style="width:90px; height:auto; max-height:60px; object-fit:contain;" onerror="this.style.display='none';">` : ''}
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

// --- EMPTY SEARCH UI PROTECTION FALLBACK ---
if (locationsEl.children.length === 0) {
locationsEl.innerHTML = `
<div style="padding: 40px 20px; text-align: center; color: #64748b; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; margin: 15px 0;">
<div style="font-size: 28px; margin-bottom: 10px;">🔍</div>
<strong style="color: #0b1220;">No dealerships found</strong><br>
<span style="font-size: 13px; color: #64748b;">Try modifying your keyword search or adjusting your brand filters.</span>
</div>
`;
}
}

// 7. POPULATE ACTIVE FEED DISPLAY PANEL (With Virtual Pagination & Layout Upgrades)
function openPanel(loc) {
document.querySelectorAll('.location-card').forEach(card => card.classList.remove('active'));
const cards = document.querySelectorAll('.location-card');
cards.forEach(card => {
const nameEl = card.querySelector('.location-name');
if (nameEl && nameEl.textContent === loc.name) card.classList.add('active');
});

if (panelPlaceholder) panelPlaceholder.style.display = "none";
if (panelContent) panelContent.style.display = "block";

// Bind Primary Store Typography
if (panelTitle) panelTitle.textContent = loc.name;
if (panelAddress) panelAddress.innerHTML = `📍 ${loc.address}`;

if (ctaInventory && loc.ctas && loc.ctas.inventory) ctaInventory.href = loc.ctas.inventory;
if (ctaService && loc.ctas && loc.ctas.service) ctaService.href = loc.ctas.service;

if (loc.googleMapsUrl && panelGlobalLink && panelGlobalLinkContainer) {
const urlObj = new URL(loc.googleMapsUrl);
const cidValue = urlObj.searchParams.get('cid');
if (cidValue) {
panelGlobalLink.href = `https://local.google.com/place?id=${cidValue}&use=srp`;
} else {
panelGlobalLink.href = loc.googleMapsUrl;
}

panelGlobalLink.textContent = `Read All ${loc.count} Reviews & Find Location →`;
panelGlobalLinkContainer.style.display = "block";
} else if (panelGlobalLinkContainer) {
panelGlobalLinkContainer.style.display = "none";
}

// --- DYNAMIC HEADER 5-STAR RATING MATRIX ENGINE ---
const panelRatingRow = document.getElementById("panelRatingRow");
if (panelRatingRow) {
const ratingNum = Math.round(parseFloat(loc.rating) || 5);
const goldStars = '★'.repeat(ratingNum);
const grayStars = '☆'.repeat(5 - ratingNum);

panelRatingRow.innerHTML = `
<span class="stars-gold">${goldStars}</span><span class="stars-gray">${grayStars}</span>
<span class="panel-rating-num">${loc.rating}</span>
<span class="panel-review-count">(${loc.count} reviews)</span>
`;
}

// --- DYNAMIC BRAND LOGO HEADER INJECTION ---
const logoContainer = document.getElementById("panelBrandLogoContainer");
if (logoContainer) {
const brandNormalized = loc.brand ? loc.brand.toLowerCase() : "";
const logoUrl = brandNormalized ? `https://performanceautomotivegroup.github.io/hub/images/brands/${brandNormalized}.png` : "";

if (logoUrl) {
logoContainer.innerHTML = `<img src="${logoUrl}" alt="${loc.brand} logo" style="width:100px; height:auto; max-height:55px; object-fit:contain;" onerror="this.parentNode.style.display='none';">`;
logoContainer.style.display = "block";
} else {
logoContainer.style.display = "none";
}
}

// Populate Floating Sub-Nav Elements
const subnavTitle = document.getElementById("subnavTitle");
const subnavRating = document.getElementById("subnavRating");
const subnavCtaInv = document.getElementById("subnavCtaInventory");
const subnavCtaSvc = document.getElementById("subnavCtaService");

if (subnavTitle) subnavTitle.textContent = loc.name;
if (subnavRating) subnavRating.textContent = `★ ${loc.rating} from ${loc.count} reviews`;
if (subnavCtaInv && loc.ctas?.inventory) subnavCtaInv.href = loc.ctas.inventory;
if (subnavCtaSvc && loc.ctas?.service) subnavCtaSvc.href = loc.ctas.service;

if (panelReviews) panelReviews.innerHTML = "";

// PAGINATION CONFIGURATION ENGINE LOOP
if (loc.reviews) {
let currentRenderedCount = 0;
const BATCH_SIZE = 10;
const totalReviewsCount = loc.reviews.length;

function renderReviewBatch(startIndex) {
const endIndex = Math.min(startIndex + BATCH_SIZE, totalReviewsCount);

for (let i = startIndex; i < endIndex; i++) {
const r = loc.reviews[i];
const isLongText = r.text && r.text.length > 120;
const shortText = isLongText ? r.text.substring(0, 120) + "..." : (r.text || "");
const formattedDate = formatReviewDate(r.date);

const review = document.createElement("div");
review.className = "review";

// --- BALANCED 5-STAR REPEATER MATRIX FOR REVIEW CARDS ---
const ratingNum = Math.round(r.rating || 5);
const goldStars = '★'.repeat(ratingNum);
const grayStars = '☆'.repeat(5 - ratingNum);

review.innerHTML = `
<div class="review-meta">
<div class="review-meta-top">
<span class="stars-gold">${goldStars}</span><span class="stars-gray">${grayStars}</span>
<span class="review-meta-brand">${loc.brand || 'General'}</span>
</div>
<div class="review-meta-details">
Written by: <strong>${r.customer || 'Verified Guest'}</strong> • ${formattedDate}
</div>
</div>
<div class="review-text">
<span class="preview">${shortText}</span>
${isLongText ? `<span class="full" style="display:none;">${r.text}</span>` : ''}
</div>
${isLongText ? `<span class="toggle">Read more</span>` : ''}
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
}

currentRenderedCount = endIndex;
manageLoadMoreButton();
}

function manageLoadMoreButton() {
let loadMoreBtn = document.getElementById("pagLoadMoreBtn");

if (currentRenderedCount < totalReviewsCount) {
if (!loadMoreBtn) {
loadMoreBtn = document.createElement("button");
loadMoreBtn.id = "pagLoadMoreBtn";
loadMoreBtn.textContent = `Load More Reviews (${totalReviewsCount - currentRenderedCount} remaining)`;

loadMoreBtn.style.display = "block";
loadMoreBtn.style.width = "100%";
loadMoreBtn.style.margin = "20px 0";
loadMoreBtn.style.padding = "12px";
loadMoreBtn.style.background = "#ffffff";
loadMoreBtn.style.color = "#2c68b5";
loadMoreBtn.style.border = "1px solid #cbd5e1";
loadMoreBtn.style.borderRadius = "6px";
loadMoreBtn.style.fontWeight = "600";
loadMoreBtn.style.cursor = "pointer";
loadMoreBtn.style.transition = "background 0.2s";

loadMoreBtn.onmouseenter = () => loadMoreBtn.style.background = "#f8fafc";
loadMoreBtn.onmouseleave = () => loadMoreBtn.style.background = "#ffffff";

loadMoreBtn.onclick = () => {
renderReviewBatch(currentRenderedCount);
};
} else {
loadMoreBtn.textContent = `Load More Reviews (${totalReviewsCount - currentRenderedCount} remaining)`;
}
if (panelReviews) panelReviews.appendChild(loadMoreBtn);
} else if (loadMoreBtn) {
loadMoreBtn.remove();
}
}

renderReviewBatch(0);
}
}

// 8. GLOBAL SCROLL EVENT TRACKER
window.addEventListener('scroll', () => {
const stickySubnav = document.getElementById('pag-sticky-subnav');
const panelContentEl = document.getElementById('panelContent');

if (!stickySubnav || !panelContentEl) return;
const isPanelActive = panelContentEl.style.display === "block";
const triggerPoint = panelContentEl.offsetTop + 450;

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
