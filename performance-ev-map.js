(function() {
    let ev_Map, ev_InfoWindow;
    let ev_Markers = [];

    // Helper: Map connector types
    function formatConnector(type) {
        if (!type) return "Unknown";
        const types = { 'EV_CONNECTOR_TYPE_J1772': 'J1772', 'EV_CONNECTOR_TYPE_CCS_COMBO_1': 'CCS', 'EV_CONNECTOR_TYPE_CHADEMO': 'CHAdeMO', 'EV_CONNECTOR_TYPE_TESLA': 'Tesla' };
        return types[type] || type.replace('EV_CONNECTOR_TYPE_', '').replace(/_/g, ' ');
    }

    // 1. BOOTSTRAP: This is the most reliable way to start in 2026
    async function start() {
        if (typeof google === 'undefined' || !google.maps) {
            console.log("EV Map: Waiting for API...");
            setTimeout(start, 300);
            return;
        }

        try {
            const { Map } = await google.maps.importLibrary("maps");
            const { Place } = await google.maps.importLibrary("places");
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

            ev_InfoWindow = new google.maps.InfoWindow();
            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "e9da2b0d1db902e558a4a8df", 
                mapTypeControl: false,
                streetViewControl: false
            });

            // 2. SEARCH LOGIC
            ev_Map.addListener("idle", async () => {
                const bounds = ev_Map.getBounds();
                if (!bounds) return;

                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions"],
                    locationRestriction: bounds,
                    pageSize: 20 
                };

                try {
                    const { places } = await Place.searchByText(request);
                    if (places && places.length > 0) {
                        renderUI(places, AdvancedMarkerElement);
                    } else {
                        document.getElementById('ev-results-list').innerHTML = '<p style="padding:20px;">No stations found here.</p>';
                    }
                } catch (e) { console.error("Search failed", e); }
            });
        } catch (err) { console.error("Initialization Error", err); }
    }

    // 3. UI RENDERING
    function renderUI(places, AdvancedMarkerElement) {
        ev_Markers.forEach(m => m.map = null);
        ev_Markers = [];
        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        
        places.forEach((place) => {
            const marker = new AdvancedMarkerElement({
                map: ev_Map,
                position: place.location,
                title: place.displayName,
                gmpClickable: true 
            });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.style.cssText = "padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer; background:#fff; font-family:sans-serif;";

            // UI Elements
            const ratingHtml = place.rating ? `<div style="font-size:12px; color:#70757a; margin-top:4px;">${place.rating.toFixed(1)} <span style="color:#fbbc04;">★★★★★</span></div>` : '';
            let plugsHtml = '';
            (place.evChargeOptions?.connectorAggregations || []).forEach(agg => {
                plugsHtml += `<div style="display:flex; justify-content:space-between; font-size:13px; margin-top:6px;">
                    <span style="color:#00838f;">⚡ ${formatConnector(agg.type)}</span>
                    <span style="background:#f1f3f4; padding:0 6px; border-radius:4px;">0/${agg.count || 1}</span>
                </div>`;
            });

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <div style="width:75%">
                        <h5 style="margin:0; font-size:15px; color:#202124;">${place.displayName}</h5>
                        ${ratingHtml}
                        <p style="margin:4px 0; font-size:12px; color:#70757a;">${place.formattedAddress}</p>
                        ${plugsHtml}
                    </div>
                    <div style="text-align:center; color:#00838f; font-size:10px;">
                        <div style="width:30px; height:30px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:16px;">↗</div>
                        Directions
                    </div>
                </div>
            `;

            const select = () => {
                ev_Map.panTo(place.location);
                ev_InfoWindow.setContent(`<div style="padding:10px;"><strong>${place.displayName}</strong></div>`);
                ev_InfoWindow.open(ev_Map, marker);
            };

            card.onclick = select;
            marker.addListener('click', select);
            list.appendChild(card);
        });
    }

    // Start the process
    start();
})();
