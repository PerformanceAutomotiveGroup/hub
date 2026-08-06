(function() {
const TARGET_DEALERSHIP = "classic-honda";
const JSON_URL = "https://storage.googleapis.com/pag-marketing-reviews-hub/reviews/reviews.json";

async function loadStoreMetrics() {
try {
const response = await fetch(JSON_URL);
if (!response.ok) throw new Error("JSON fetch failed");

const rawData = await response.json();
const dealershipsList = Array.isArray(rawData) ? rawData : (rawData.dealerships || []);

const store = dealershipsList.find(item => {
const keyMatch = item.key && item.key.toLowerCase() === TARGET_DEALERSHIP.toLowerCase();
const nameMatch = item.name && item.name.toLowerCase().includes("classic honda");
return keyMatch || nameMatch;
});

if (store) {
const decimalEl = document.getElementById("dealerRatingDecimal");
if (decimalEl && store.rating) {
decimalEl.textContent = parseFloat(store.rating).toFixed(1);
}

const linkEl = document.getElementById("dealerGoogleLink");
if (linkEl && store.googleMapsUrl) {
linkEl.href = store.googleMapsUrl;
}

const starsContainer = document.getElementById("dealerStars");
if (starsContainer && store.rating) {
starsContainer.innerHTML = '';
const ratingNum = parseFloat(store.rating);

for (let i = 1; i <= 5; i++) {
const starDiv = document.createElement('div');
starDiv.className = 'single-star full';

if (ratingNum >= i) {
starDiv.innerHTML = '<i class="fas fa-star"></i>';
} else if (ratingNum >= i - 0.5) {
starDiv.innerHTML = '<i class="fas fa-star-half-alt"></i>';
} else {
starDiv.innerHTML = '<i class="far fa-star"></i>';
}
starsContainer.appendChild(starDiv);
}
}
}
} catch (error) {
console.error("Dealership review rating update failed:", error);
}
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", loadStoreMetrics);
} else {
loadStoreMetrics();
}
})();
