const locationsEl = document.getElementById("locations");
const panelPlaceholder = document.getElementById("panelPlaceholder");
const panelContent = document.getElementById("panelContent");
const panelTitle = document.getElementById("panelTitle");
const panelRating = document.getElementById("panelRating");
const panelAddress = document.getElementById("panelAddress");
const panelReviews = document.getElementById("panelReviews");
const panelGlobalLinkContainer = document.getElementById("panelGlobalLinkContainer");
const panelGlobalLink = document.getElementById("panelGlobalLink");
const locationFilter = document.getElementById("locationFilter");
const brandFilter = document.getElementById("brandFilter");
const searchInput = document.getElementById("searchInput");
const ctaInventory = document.getElementById("ctaInventory");
const ctaService = document.getElementById("ctaService");

// Populate locations filter selection

locationsData.forEach(loc => {
  const option = document.createElement("option");
  option.value = loc.key;
  option.textContent = loc.name;
  locationFilter.appendChild(option);
});

const brands = new Set();
locationsData.forEach(loc => { if(loc.brand) brands.add(loc.brand); });
Array.from(brands).sort().forEach(brand => {
  const option = document.createElement("option");
  option.value = brand.toLowerCase();
  option.textContent = brand;
  brandFilter.appendChild(option);
});

// Render Locations List
function renderLocations() {
  locationsEl.innerHTML = "";
  const search = searchInput.value.toLowerCase();
  const selectedBrand = brandFilter.value;
  locationsData.forEach(loc => {

    if (
      (locationFilter.value !== "all" && locationFilter.value !== loc.key) ||
(selectedBrand !== "all" && loc.brand.toLowerCase() !== selectedBrand.toLowerCase()) |
      (search && !loc.name.toLowerCase().includes(search))
    ) return;

    const card = document.createElement("div");
    card.className = "location-card";
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${loc.logo || ''}" alt="${loc.name} logo" style="width:90px; height:auto; object-fit:contain;">
        <div>
          <div class="location-name">${loc.name}</div>
          <div class="location-meta">★ ${loc.rating} from ${loc.count} reviews</div>
        </div>
      </div>
    `;

    card.onclick = () => {
      openPanel(loc);
 
      document.getElementById("panel").scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    };   

    locationsEl.appendChild(card);
  });
}

// Open active panel view
function openPanel(loc) {
  document.querySelectorAll('.location-card').forEach(card => {
    card.classList.remove('active');
  });

  const cards = document.querySelectorAll('.location-card');
  cards.forEach(card => {
    if (card.querySelector('.location-name').textContent === loc.name) {
      card.classList.add('active');
    }
  });

  panelPlaceholder.classList.add("hidden");
  panelContent.classList.remove("hidden");

  panelTitle.textContent = loc.name;
  panelRating.textContent = `★ ${loc.rating} from ${loc.count} reviews`;
  panelAddress.textContent = loc.address;
  panelReviews.innerHTML = "";

  const cleanSlug = loc.key.replace(/_/g, '-');
  ctaInventory.href = `https://www.performance.ca/dealerships/${cleanSlug}/new-inventory/`;
  ctaService.href = `https://www.performance.ca/dealerships/${cleanSlug}/book-service/`;

  // Set up the updated global Google review anchor element link
  if (loc.googleMapsUrl) {
    panelGlobalLink.href = loc.googleMapsUrl;
    panelGlobalLink.textContent = `Read All ${loc.count} Reviews on Google →`;
    panelGlobalLinkContainer.classList.remove("hidden");
  } else {
    panelGlobalLinkContainer.classList.add("hidden");
  }

  loc.reviews.forEach(r => {
    const shortText = r.text.length > 120 ? r.text.substring(0, 120) + "..." : r.text;

    const review = document.createElement("div");
    review.className = "review";
    review.innerHTML = `
    <div class="review-meta">
        ★ ${r.rating} | ${loc.brand} | ${r.staff} | ${r.date}
      </div>
      <div class="review-text">
        <span class="preview">${shortText}</span>
        <span class="full hidden">${r.text}</span>
      </div>
      ${r.text.length > 120 ? `<span class="toggle">Read more</span>` : ''} `;


    const toggle = review.querySelector(".toggle");
    if (toggle) {
      const preview = review.querySelector(".preview");
      const full = review.querySelector(".full");

      toggle.onclick = () => {
      preview.classList.toggle("hidden");
        full.classList.toggle("hidden");
        toggle.textContent = toggle.textContent === "Read more" ? "Show less" : "Read more";
      };
    }

    panelReviews.appendChild(review);
  });
}

locationFilter.onchange = renderLocations;
searchInput.oninput = renderLocations;
brandFilter.onchange = renderLocations;

renderLocations();
