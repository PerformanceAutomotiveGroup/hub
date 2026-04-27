(function() {
    let ev_Map, ev_InfoWindow;
    let ev_Markers = [];
    
    // Helper to format connector types to human-readable names
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

    window.initPerformanceEVMap = async function() {
        console.log("EV Map: Initialization started...");
        try {
            const { Map } = await google.maps.importLibrary("maps");
            const { Place } = await google.maps.importLibrary("places");
            // Import the marker library specifically for Advanced Markers
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

            ev_InfoWindow = new google.maps.InfoWindow();
            
            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "YOUR_MAP_ID_HERE", // <--- INSERT YOUR MAP ID HERE
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });

            ev_Map.addListener("idle", async () => {
                const bounds = ev_Map.getBounds();
                if (!bounds) return;
                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions"],
                    locationRestriction: {
                        south: bounds.getSouthWest().lat(),
                        west: bounds.getSouthWest().lng(),
                        north: bounds.getNorthEast().lat(),
                        east: bounds.getNorthEast().lng(),
                    },
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

    async function renderUI(places, map, infoWindow) {
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        // Clear existing markers (Advanced Markers use .map = null)
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

            // 1. Header with Rating
            const ratingHtml = place.rating ? `
                <div style="display:flex; align-items:center; gap:4px; margin: 4px 0;">
                    <span style="font-size:13px; color:#70757a;">${place.rating.toFixed(1)}</span>
                    <span style="color:#fbbc04; font-size:12px;">★★★★★</span>
                    <span style="font-size:13px; color:#70757a;">(2)</span>
                </div>` : '';

            // 2. Build the Plug List
            let plugListHtml = '';
            const aggs = place.evChargeOptions?.connectorAggregations;
            
            if (aggs && aggs.length > 0) {
                aggs.forEach(agg => {
                    const type = formatConnectorType(agg.type);
                    const power = agg.maxChargeRateKw ? `${agg.maxChargeRateKw} kW` : '';
                    const count = agg.count || 1;
                    
                    plugListHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                            <div style="display:flex; align-items:center; gap:8px; font-size:14px; color:#3c4043;">
                                <span style="color:#00838f;">⚡</span>
                                <span>${type} · ${power}</span>
                            </div>
                            <div style="background:#f1f3f4; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:500; color:#3c4043;">
                                0/${count}
                            </div>
                        </div>`;
                });
            }

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <h5 style="margin:0; font-size:16px; font-weight:500; color:#202124;">${place.displayName}</h5>
                        ${ratingHtml}
                        <p style="margin:4px 0; font-size:13px; color:#70757a;">Electric vehicle charging station · ${place.formattedAddress}</p>
                        <p style="margin:0; font-size:13px; color:#188038; font-weight:500;">Open 24 hours <span style="color:#70757a; font-weight:normal;">· +1 877-297-8050</span></p>
                    </div>
                    <div style="text-align:center; color:#00838f;">
                        <div style="width:36px; height:36px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto;">
                           <span style="font-size:18px;">↗</span>
                        </div>
                        <span style="font-size:11px; font-weight:500; display:block; margin-top:4px;">Directions</span>
                    </div>
                </div>
                ${plugListHtml}
            `;

            // Function to trigger selection
            const selectLocation = () => {
                map.panTo(place.location);
                infoWindow.setContent(`<div style="padding:10px;"><strong>${place.displayName}</strong><br>${place.formattedAddress}</div>`);
                infoWindow.open(map, marker);
            };

            card.onclick = selectLocation;
            marker.addListener('gmp-click', selectLocation); // Advanced Markers use gmp-click

            list.appendChild(card);
        });
    }

    if (window.google && window.google.maps) {
        initPerformanceEVMap();
    }
})();
