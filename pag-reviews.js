document.addEventListener("DOMContentLoaded", () => {
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

  if (typeof locationsData === 'undefined') {
    console.error("Dealership Directory Error: locationsData array is not defined on the parent page.");
    return;
  }

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

  function renderLocations() {
    locationsEl.innerHTML = "";
    const search = searchInput.value.toLowerCase();
    const selectedBrand = brandFilter.value;

    locationsData.forEach(loc => {
      if (
        (locationFilter.value !== "all" && locationFilter.value !== loc.key) ||
        (selectedBrand !== "all" && loc.brand.toLowerCase() !== selectedBrand.toLowerCase()) ||
        (search && !loc.name.toLowerCase().includes(search))
      ) return;

      const card = document.createElement("div");
      card.className = "location-card";
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; cursor:pointer;">
          <img src="${loc.logo || ''}" alt="${loc.name} logo" style="width:90px; height:auto; object-fit:contain;">
          <div>
            <div class="location-name" style="font-weight:bold;">${loc.name}</div>
            <div class="location-meta">★ ${loc.rating} from ${loc.count} reviews</div>
          </div>
        </div>
      `;

      card.onclick = () => {
        openPanel(loc);
        
        const panelEl = document.getElementById("panel");
        if (panelEl) {
          panelEl.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        }
      };
      
      locationsEl.appendChild(card);
    });
  }

  function openPanel(loc) {
    document.querySelectorAll('.location-card').forEach(card => {
      card.classList.remove('active');
    });
    
    const cards = document.querySelectorAll('.location-card');
    cards.forEach(card => {
      const nameEl = card.querySelector('.location-name');
      if (nameEl && nameEl.textContent === loc.name) {
        card.classList.add('active');
      }
    });

    // Toggle panels
    if (panelPlaceholder) panelPlaceholder.style.display = "none";
    if (panelContent) panelContent.style.display = "block";

    if (panelTitle) panelTitle.textContent = loc.name;
    if (panelRating) panelRating.textContent = `★ ${loc.rating} from ${loc.count} reviews`;
    if (panelAddress) panelAddress.textContent = loc.address;
    if (panelReviews) panelReviews.innerHTML = "";

    // Generate accurate performance.ca permalinks based on data slugs
    const cleanSlug = loc.key.replace(/_/g, '-');
    if (ctaInventory) ctaInventory.href = `https://www.performance.ca/dealerships/${cleanSlug}/new-inventory/`;
    if (ctaService) ctaService.href = `https://www.performance.ca/dealerships/${cleanSlug}/book-service/`;

    // Global Google review link display evaluation
    if (loc.googleMapsUrl && panelGlobalLink && panelGlobalLinkContainer) {
      panelGlobalLink.href = loc.googleMapsUrl;
      panelGlobalLink.textContent = `Read All ${loc.count} Reviews on Google →`;
      panelGlobalLinkContainer.style.display = "block";
    } else if (panelGlobalLinkContainer) {
      panelGlobalLinkContainer.style.display = "none";
    }

    // Render individual reviews loop
    loc.reviews.forEach(r => {
      const isLongText = r.text.length > 120;
      const shortText = isLongText ? r.text.substring(0, 120) + "..." : r.text;

      const review = document.createElement("div");
      review.className = "review";
      review.style.marginBottom = "15px";
      review.innerHTML = `
        <div class="review-meta" style="font-size:0.85em; color:#666;">
          ★ ${r.rating} | ${loc.brand} | Assisted by: ${r.staff} | ${r.date}
        </div>
        <div class="review-text">
          <span class="preview">${shortText}</span>
          <span class="full" style="display:none;">${r.text}</span>
        </div>
        ${isLongText ? `<span class="toggle" style="color:#0056b3; cursor:pointer; font-size:0.9em; display:block; margin-top:4px;">Read more</span>` : ''}
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

  locationFilter.onchange = renderLocations;
  searchInput.oninput = renderLocations;
  brandFilter.onchange = renderLocations;

  // Run initial state load layout
  renderLocations();
});
