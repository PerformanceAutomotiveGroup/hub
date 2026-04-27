(function() {
    let ev_Map, ev_InfoWindow;
    let ev_Markers = [];

    function formatConnector(type) {
        if (!type) return "Unknown";
        const types = { 
            'EV_CONNECTOR_TYPE_J1772': 'J1772', 
            'EV_CONNECTOR_TYPE_CCS_COMBO_1': 'CCS', 
            'EV_CONNECTOR_TYPE_CHADEMO': 'CHAdeMO', 
            'EV_CONNECTOR_TYPE_TESLA': 'Tesla' 
        };
        return types[type] || type.replace('EV_CONNECTOR_TYPE_', '').replace(/_/g, ' ');
    }

    async function start() {
        if (typeof google === 'undefined' || !google.maps) {
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

            ev_Map.addListener("idle", async () => {
                const bounds = ev_Map.getBounds();
                if (!bounds) return;

                // FIX: Use maxResultCount instead of pageSize
                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions"],
                    locationRestriction: bounds,
                    maxResultCount: 20 
                };

                try {
                    const { places } = await Place.searchByText(request);
                    // Ensure places is an array before passing it
                    renderUI(places || [], AdvancedMarkerElement);
                } catch (e) { 
                    console.error("Search failed:", e); 
                    document.getElementById('ev-results-list').innerHTML = '<p style="padding:20px;">Search error. Check console.</p>';
                }
            });
        } catch (err) { console.error("Initialization Error", err); }
    }

    function renderUI(places, AdvancedMarkerElement) {
        // Clear everything
        ev_Markers.forEach(m => m.map = null);
        ev_Markers = [];
        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        
        if (places.length === 0) {
            list.innerHTML = '<p style="padding:20px;">No stations found in this area.</p>';
            return;
        }

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
            card.style.cssText = "padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer; background:#fff; font-family:Roboto, Arial, sans-serif;";

            const ratingHtml = place.rating ? `<div style="font-size:12px; color:#70757a; margin:4px 0;">${place.rating.toFixed(1)} <span style="color:#fbbc04;">★★★★★</span></div>` : '';
            
            let plugsHtml = '';
            const connectors = place.evChargeOptions?.connectorAggregations || [];
            connectors.forEach(agg => {
                plugsHtml += `
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-top:8px;">
                    <span style="color:#00838f;">⚡ ${formatConnector(agg.type)}</span>
                    <span style="background:#f1f3f4; padding:0 8px; border-radius:4px; font-weight:500;">0/${agg.count || 1}</span>
                </div>`;
            });

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="width:78%">
                        <h5 style="margin:0; font-size:16px; font-weight:500; color:#202124;">${place.displayName}</h5>
                        ${ratingHtml}
                        <p style="margin:4px 0; font-size:13px; color:#70757a;">${place.formattedAddress}</p>
                        ${plugsHtml}
                    </div>
                    <div style="text-align:center; color:#00838f; font-size:11px;">
                        <div style="width:34px; height:34px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">↗</div>
                        Directions
                    </div>
                </div>
            `;

            const select = () => {
                ev_Map.panTo(place.location);
                ev_InfoWindow.setContent(`<div style="padding:10px;"><strong>${place.displayName}</strong></div>`);
                ev_InfoWindow.open(ev_Map, marker);
                document.querySelectorAll('.ev-location-card').forEach(c => c.style.background = '#fff');
                card.style.background = '#f8f9fa';
            };

            card.onclick = select;
            marker.addListener('click', select);
            list.appendChild(card);
        });
    }

    start();
})();
