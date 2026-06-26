(function() {
// Safety wrapper ensuring code fires exactly when the document elements exist
const initEngine = () => {
const locationsEl = document.getElementById("locations");
const locationFilter = document.getElementById("locationFilter");
const brandFilter = document.getElementById("brandFilter");
const searchInput = document.getElementById("searchInput");

// Safety abort lock if run on a non-reviews hub page URL
if (!locationsEl || !locationFilter || !brandFilter || !searchInput) return;

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

// Diagnostic validation matching your updated cloud object layout properties
if (typeof window.locationsData === 'undefined' || !window.locationsData.dealerships) {
console.error("Directory Data Engine Fault: window.locationsData.dealerships array context is absent.");
if (locationsEl) locationsEl.innerHTML = "<div style='padding:20px; color:red;'>Data model matching fault.</div>";
return;
}

const dealerships = window.locationsData.dealerships;

// 1. CALCULATE GLOBAL SCORES & VALUES
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

  // Function to perform the actual DOM replacement
  const injectGlobalScores = () => {
    const globalAvgRatingEl = document.getElementById("globalAvgRating");
    const globalReviewCountEl = document.getElementById("globalReviewCount");

    if (globalAvgRatingEl) {
      globalAvgRatingEl.textContent = averageRating;
    }
    if (globalReviewCountEl) {
      globalReviewCountEl.textContent = totalReviews.toLocaleString('en-CA');
    }
    
    // Log for verification in browser console
    console.log(`Scoreboard Populated: Avg ${averageRating}, Total Count ${totalReviews}`);
  };

  // Run immediately, and run a secondary safety fallback check 200ms later to handle slow rendering
  injectGlobalScores();
  setTimeout(injectGlobalScores, 200);
}

// Populate Selection Dropdowns
dealerships.forEach(loc => {
const option = document.createElement("option");
option.value = loc.key;
option.textContent = loc.name;
locationFilter.appendChild(option);
});

const brands = new Set();
dealerships.forEach(loc => { if(loc.brand) brands.add(loc.brand); });
Array.from(brands).sort().forEach(brand => {
const option = document.createElement("option");
option.value = brand.toLowerCase();
option.textContent = brand;
brandFilter.appendChild(option);
});

// Helper converting raw database strings into normalized local dates
function formatReviewDate(isoString) {
try {
const dateObj = new Date(isoString);
if (isNaN(dateObj.getTime())) return "Recently";
return dateObj.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
} catch(e) { return "Recently"; }
}

// Render Sidebar Directory Cards
function renderLocations() {
locationsEl.innerHTML = "";
const search = searchInput.value.toLowerCase();
const selectedBrand = brandFilter.value;

dealerships.forEach(loc => {
if (
(locationFilter.value !== "all" && locationFilter.value !== loc.key) ||
(selectedBrand !== "all" && loc.brand.toLowerCase() !== selectedBrand.toLowerCase()) ||
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
<div class="location-meta">★ ${loc.rating} from ${loc.count} reviews</div>
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

// Populate Display Feed Panel
function openPanel(loc) {
// Toggle card background focus styling tracking rules
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

// Dynamic path rendering matching nested cta parameters
if (ctaInventory && loc.ctas && loc.ctas.inventory) ctaInventory.href = loc.ctas.inventory;
if (ctaService && loc.ctas && loc.ctas.service) ctaService.href = loc.ctas.service;

// Handle the internal website tracking redirect link logic
if (loc.ctas && loc.ctas.dealershipHomeUrl && panelGlobalLink && panelGlobalLinkContainer) {
panelGlobalLink.href = loc.ctas.dealershipHomeUrl;
panelGlobalLink.textContent = `Read All ${loc.count} Reviews on Our Website →`;
panelGlobalLinkContainer.style.display = "block";
} else if (panelGlobalLinkContainer) {
panelGlobalLinkContainer.style.display = "none";
}

// Loop and print individual rows matching data key paths
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
★ ${r.rating} | ${loc.brand} | Assisted by: ${r.customer || 'Verified Guest'} | ${formattedDate}
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

// Mount Active Change Listeners
locationFilter.onchange = renderLocations;
searchInput.oninput = renderLocations;
brandFilter.onchange = renderLocations;

// Run layout initializer pass
renderLocations();
};

// Safe runtime execution check regardless of script injection methods
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initEngine);
} else {
initEngine();
}
})();
