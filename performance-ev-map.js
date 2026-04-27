(function() {
    let ev_Map, ev_InfoWindow;
    let ev_Markers = [];

    // Helper: Formats connector types to match your requested UI
    function formatConnectorType(type) {
        if (!type) return "Unknown";
        const types = {
            'EV_CONNECTOR_TYPE_J1772': 'J1772',
            'EV_CONNECTOR_TYPE_CCS_COMBO_1': 'CCS',
            'EV_CONNECTOR_TYPE_CHADEMO': 'CHAdeMO',
            'EV_CONNECTOR_TYPE_TESLA': 'Tesla'
        };
        return types[type] || type.replace('EV_CONNECTOR_TYPE_', '').replace(/_/g, ' ');
    }

    // 1. POLLING: Ensure Google is ready before we touch it
    function checkAndInit() {
        if (typeof google !== 'undefined' && google.maps && google.maps.importLibrary) {
            console.log("EV Map: Libraries detected. Launching...");
            initPerformanceEVMap();
        } else {
            setTimeout(checkAndInit, 200); 
        }
    }

    // 2. MAIN LOGIC
    window.initPerformanceEVMap = async function() {
        try {
            // Loading all 3 required libraries at once for 2026 stability
            const [{ Map }, { Place }, { AdvancedMarkerElement }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("places"),
                google.maps.importLibrary("marker")
            ]);

            ev_InfoWindow = new google.maps.InfoWindow();
            
            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "e9da2b0d1db902e558a4a8df", 
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });

            // Trigger Search on Idle
            ev_Map.addListener("idle", async () => {
                const bounds = ev_Map.getBounds();
                if (!bounds) return;

                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions"],
                    locationRestriction: bounds,
                    pageSize: 20 // 2026 standard: caps at 20 results per request
                };

                try {
                    const { places } = await Place.searchByText(request);
                    if (places) {
                        renderUI(places, ev_Map, ev_InfoWindow, AdvancedMarkerElement);
                    }
                } catch (e) { 
                    console.error("Search failed:", e); 
                }
            });
        } catch (err) {
            console.error("Critical Init Failure:", err);
        }
    };

    // 3. UI RENDERING (MATCHES GOOGLE STYLE IMAGE)
    function renderUI(places, map, infoWindow, AdvancedMarkerElement) {
        // Clear all markers from map memory
        ev_Markers.forEach(m => m.map = null);
        ev_Markers = [];

        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        
        places.forEach((place) => {
            // Create modern Advanced Marker
            const marker = new AdvancedMarkerElement({
                map: map,
                position: place.location,
                title: place.displayName,
                gmpClickable: true 
            });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.style.cssText = "padding: 16px; border-bottom: 1px solid #e0e0e0; cursor: pointer; font-family: Roboto, Arial, sans-serif; background: #fff;";

            // UI Components
            const ratingHtml = place.rating ? `
                <div style="display:flex; align-items:center; gap:4px; margin: 4px 0;">
                    <span style="font-size:13px; color:#70757a;">${place.rating.toFixed(1)}</span>
                    <span style="color:#fbbc04; font-size:12px;">★★★★★</span>
                </div>` : '';

            let plugListHtml = '';
            const aggs = place.evChargeOptions?.connectorAggregations || [];
            aggs.forEach(agg => {
                const type = formatConnectorType(agg.type);
                const power = agg.maxChargeRateKw ? `${agg.maxChargeRateKw} kW` : '';
                plugListHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                        <div style="display:flex; align-items:center; gap:8px; font-size:14px; color:#3c4043;">
                            <span style="color:#00838f;">⚡</span>
                            <span>${type} · ${power}</span>
                        </div>
                        <div style="background:#f1f3f4; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:500; color:#3c4043;">
                            0/${agg.count || 1}
                        </div>
                    </div>`;
            });

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="max-width: 80%;">
                        <h5 style="margin:0; font-size:16px; font-weight:500; color:#202124;">${place.displayName}</h5>
                        ${ratingHtml}
                        <p style="margin:4px 0; font-size:13px; color:#70757a;">Charging station · ${place.formattedAddress}</p>
                        <p style="margin:0; font-size:13px; color:#188038; font-weight:500;">Open 24 hours</p>
                    </div>
                    <div style="text-align:center; color:#00838f;">
                        <div style="width:34px; height:34px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto;">↗</div>
                        <span style="font-size:10px; font-weight:500; display:block; margin-top:4px;">Directions</span>
                    </div>
                </div>
                ${plugListHtml}
            `;

            const selectMarker = () => {
                map.panTo(place.location);
                infoWindow.setContent(`<div style="padding:10px;"><strong>${place.displayName}</strong></div>`);
                infoWindow.open(map, marker);
                // Simple highlight
                document.querySelectorAll('.ev-location-card').forEach(c => c.style.background = '#fff');
                card.style.background = '#f8f9fa';
            };

            card.onclick = selectMarker;
            marker.addListener('click', selectMarker); // Uses standard click listener for gmpClickable markers

            list.appendChild(card);
        });
    }

    checkAndInit();
})();
