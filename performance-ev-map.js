(function() {
    let ev_Markers = []; // Track markers to clear them on move

    window.initPerformanceEVMap = async function() {
        console.log("EV Map: Initialization started...");
        try {
            const { Map } = await google.maps.importLibrary("maps");
            const { Place } = await google.maps.importLibrary("places");

            const ev_InfoWindow = new google.maps.InfoWindow();
            const ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });

            // Map search logic
            ev_Map.addListener("idle", async () => {
                const bounds = ev_Map.getBounds();
                if (!bounds) return;
                const request = {
                    textQuery: "EV Charging Station",
                    // Added rating and evChargeOptions here
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions"],
                    locationRestriction: {
                        south: bounds.getSouthWest().lat(),
                        west: bounds.getSouthWest().lng(),
                        north: bounds.getNorthEast().lat(),
                        east: bounds.getNorthEast().lng(),
                    }, // Comma fixed
                    maxResultCount: 20
                };
                try {
                    const { places } = await Place.searchByText(request);
                    if (places) renderUI(places, ev_Map, ev_InfoWindow);
                } catch (e) { console.error("Search failed", e); }
            });
        } catch (err) {
            console.error("Google Maps failed to load libraries:", err);
        }
    };

    // 2. UI rendering
    function renderUI(places, map, infoWindow) {
        // Clear old markers first
        ev_Markers.forEach(m => m.setMap(null));
        ev_Markers = [];

        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        
        places.forEach((place) => {
            const marker = new google.maps.Marker({
                map: map,
                position: place.location,
                title: place.displayName
            });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';

            // Safe check for new fields
            const ratingText = place.rating ? `⭐ ${place.rating}` : '';
            const plugText = place.evChargeOptions?.connectorCount ? `🔌 ${place.evChargeOptions.connectorCount} Plugs` : '🔌 N/A';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <h5>${place.displayName}</h5>
                    <span style="font-size:12px; font-weight:bold; color:#fbc02d;">${ratingText}</span>
                </div>
                <p>${place.formattedAddress}</p>
                <small style="color:#2c68b5; font-weight:bold;">${plugText}</small>
            `;

            card.onclick = () => {
                map.panTo(place.location);
                infoWindow.setContent(`<strong>${place.displayName}</strong><br>${place.formattedAddress}`);
                infoWindow.open(map, marker);
            };
            list.appendChild(card);
        });
    }

    // 3. Backup trigger
    if (window.google && window.google.maps) {
        console.log("EV Map: Google already exists, triggering manually.");
        initPerformanceEVMap();
    }
})();
