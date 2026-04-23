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
                    fields: ["displayName", "location", "formattedAddress", "evChargeOptions", "rating"],
                    locationRestriction: {
                        south: bounds.getSouthWest().lat(),
                        west: bounds.getSouthWest().lng(),
                        north: bounds.getNorthEast().lat(),
                        east: bounds.getNorthEast().lng(),
                    }

                    maxResultCount: 50
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

    function renderUI(places, map, infoWindow) {
        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        places.forEach((place) => {
            const marker = new google.maps.Marker({
                map: map,
                position: place.location,
                title: place.displayName
            });
           const card = document.createElement('div');
card.className = 'ev-location-card';
const ratingHtml = place.rating ? `<span class="ev-rating">⭐ ${place.rating}</span>` : '';
const chargerCount = place.evChargeOptions?.connectorCount 
    ? `<span class="ev-plugs">🔌 ${place.evChargeOptions.connectorCount} Plugs</span>` 
    : '<span class="ev-plugs">🔌 Info N/A</span>';

card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:start;">
        <h5 style="margin:0;">${place.displayName}</h5>
        ${ratingHtml}
    </div>
    <p style="margin:5px 0;">${place.formattedAddress}</p>
    <div style="font-size:12px; color:#2c68b5; font-weight:bold;">${chargerCount}</div>
`;
            
            card.onclick = () => {
                map.panTo(place.location);
                infoWindow.setContent(`<strong>${place.displayName}</strong>`);
                infoWindow.open(map, marker);
            };
            list.appendChild(card);
        });
    }


    if (window.google && window.google.maps) {
        console.log("EV Map: Google already exists, triggering manually.");
        initPerformanceEVMap();
    }
