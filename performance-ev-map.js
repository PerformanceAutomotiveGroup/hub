(function() {
    let ev_Map, ev_InfoWindow;
    let ev_Markers = [];

    // 1. POLLING: Wait for the API to be ready
    function checkAndInit() {
        if (typeof google !== 'undefined' && google.maps && google.maps.importLibrary) {
            console.log("EV Map: API Detected.");
            initPerformanceEVMap();
        } else {
            setTimeout(checkAndInit, 200);
        }
    }

    window.initPerformanceEVMap = async function() {
        try {
            // Load all libraries upfront to prevent "missing markers"
            const [{ Map }, { Place }, { AdvancedMarkerElement }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("places"),
                google.maps.importLibrary("marker")
            ]);

            ev_InfoWindow = new google.maps.InfoWindow();
            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 },
                zoom: 11,
                mapId: "YOUR_MAP_ID_HERE", // Ensure this is your ID
                mapTypeControl: false,
                streetViewControl: false
            });

            // Trigger search whenever the map is moved
            ev_Map.addListener("idle", async () => {
                const bounds = ev_Map.getBounds();
                if (!bounds) return;

                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions"],
                    locationRestriction: bounds,
                    pageSize: 20 // 2026 Limit: Must be 20 or less
                };

                try {
                    const { places } = await Place.searchByText(request);
                    // IMPORTANT: Pass AdvancedMarkerElement into the UI function
                    renderUI(places || [], ev_Map, ev_InfoWindow, AdvancedMarkerElement);
                } catch (e) {
                    console.error("EV Search Error:", e);
                }
            });

        } catch (err) {
            console.error("Map Load Error:", err);
        }
    };

    function renderUI(places, map, infoWindow, AdvancedMarkerElement) {
        // Clear sidebar and markers
        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        ev_Markers.forEach(m => m.map = null);
        ev_Markers = [];

        if (places.length === 0) {
            list.innerHTML = '<p style="padding:20px;">No stations found in this area.</p>';
            return;
        }

        places.forEach((place) => {
            // Create the Marker
            const marker = new AdvancedMarkerElement({
                map: map,
                position: place.location,
                title: place.displayName,
                gmpClickable: true
            });
            ev_Markers.push(marker);

            // Build the Sidebar Card
            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.style.cssText = "padding:16px; border-bottom:1px solid #eee; cursor:pointer; background:#fff;";

            // UI Elements
            const rating = place.rating ? `<span style="color:#fbbc04;">★ ${place.rating.toFixed(1)}</span>` : '';
            const plugs = (place.evChargeOptions?.connectorAggregations || []).map(agg => 
                `<div style="font-size:12px; color:#666;">⚡ ${agg.count || 1}x ${agg.type.replace('EV_CONNECTOR_TYPE_', '')}</div>`
            ).join('');

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <h5 style="margin:0; font-size:15px;">${place.displayName}</h5>
                        <div style="font-size:12px; margin:4px 0;">${rating}</div>
                        <p style="margin:0; font-size:12px; color:#70757a;">${place.formattedAddress}</p>
                        <div style="margin-top:8px;">${plugs}</div>
                    </div>
                    <div style="color:#00838f; font-size:11px; text-align:center;">
                        <div style="width:30px; height:30px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto;">↗</div>
                        Directions
                    </div>
                </div>
            `;

            // The "Selection" Logic
            const select = () => {
                map.panTo(place.location);
                infoWindow.setContent(`<div style="padding:10px;"><strong>${place.displayName}</strong></div>`);
                infoWindow.open(map, marker);
                // Visual feedback in sidebar
                document.querySelectorAll('.ev-location-card').forEach(c => c.style.background = '#fff');
                card.style.background = '#f8f9fa';
            };

            card.onclick = select;
            marker.addListener('click', select); // Use 'click' for compatibility

            list.appendChild(card);
        });
    }

    checkAndInit();
})();
