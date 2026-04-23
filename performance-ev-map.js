(function() {
    let ev_Map, ev_InfoWindow;
    let ev_Markers = [];

    function checkAndInit() {
        if (typeof google !== 'undefined' && google.maps && google.maps.importLibrary) {
            console.log("EV Map: Google Maps API detected. Initializing...");
            initPerformanceEVMap();
        } else {
            setTimeout(checkAndInit, 200); 
        }
    }

    window.initPerformanceEVMap = async function() {
        try {
            const { Map } = await google.maps.importLibrary("maps");
            const { Place } = await google.maps.importLibrary("places");

            ev_InfoWindow = new google.maps.InfoWindow();

            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "PERFORMANCE_EV_MAP", 
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });

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
                    },
                    maxResultCount: 50
                };

                try {
                    const { places } = await Place.searchByText(request);
                    if (places) {
                        renderUI(places, ev_Map, ev_InfoWindow);
                    }
                } catch (e) { 
                    console.error("Search failed", e); 
                }
            });
        } catch (err) {
            console.error("Google Maps failed to load libraries:", err);
        }
    };


    function renderUI(places, map, infoWindow) {
        ev_Markers.forEach(m => m.setMap(null));
        ev_Markers = [];

        const list = document.getElementById('ev-results-list');
        if (!list) return;
        list.innerHTML = '';

        places.forEach((place) => {
            // Create Marker
            const marker = new google.maps.Marker({
                map: map,
                position: place.location,
                title: place.displayName
            });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';

            const ratingHtml = place.rating 
                ? `<span class="ev-rating" style="background:#fff9c4; color:#fbc02d; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold;">⭐ ${place.rating}</span>` 
                : '';
            
            const chargerCount = place.evChargeOptions?.connectorCount 
                ? `<span class="ev-plugs" style="background:#e3f2fd; color:#1976d2; padding:2px 6px; border-radius:4px; font-size:11px; display:inline-block; margin-top:5px;">🔌 ${place.evChargeOptions.connectorCount} Plugs</span>` 
                : '<span class="ev-plugs" style="background:#f5f5f5; color:#999; padding:2px 6px; border-radius:4px; font-size:11px; display:inline-block; margin-top:5px;">🔌 Info N/A</span>';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h5 style="margin:0; font-size:14px; color:#333;">${place.displayName}</h5>
                    ${ratingHtml}
                </div>
                <p style="margin:5px 0; font-size:12px; color:#666;">${place.formattedAddress}</p>
                <div style="font-weight:bold;">${chargerCount}</div>
            `;

            const triggerInfo = () => {
                map.panTo(place.location);
                infoWindow.setContent(`
                    <div style="padding:5px; color:#333;">
                        <strong>${place.displayName}</strong>${place.rating ? ' (' + place.rating + ' ⭐)' : ''}<br>
                        <span style="font-size:11px;">${place.formattedAddress}</span>
                    </div>
                `);
                infoWindow.open(map, marker);
                
                document.querySelectorAll('.ev-location-card').forEach(c => c.style.borderLeft = '4px solid transparent');
                card.style.borderLeft = '4px solid #2c68b5';
            };

            card.onclick = triggerInfo;
            marker.addListener('click', triggerInfo);

            list.appendChild(card);
        });
    }

    checkAndInit();

    if (window.google && window.google.maps) {
        initPerformanceEVMap();
    }
})();
