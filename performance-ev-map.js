(function() {
    let ev_Map, ev_InfoWindow;
    let ev_Markers = [];

    // Helper: Clean up technical connector names
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

    // 1. BOOTSTRAP: Ensuring all libraries load before execution
    async function start() {
        if (typeof google === 'undefined' || !google.maps) {
            setTimeout(start, 300);
            return;
        }

        try {
            const [{ Map }, { Place }, { AdvancedMarkerElement }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("places"),
                google.maps.importLibrary("marker")
            ]);

            ev_InfoWindow = new google.maps.InfoWindow();
            
            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "e9da2b0d1db902e558a4a8df", // Verified Map ID
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
                    locationRestriction: bounds,
                    maxResultCount: 20 
                };

                try {
                    const { places } = await Place.searchByText(request);
                    renderUI(places || [], AdvancedMarkerElement);
                } catch (e) { 
                    console.error("Search failed:", e); 
                }
            });
        } catch (err) { console.error("Initialization Error", err); }
    }

    // 2. UI RENDERING
    function renderUI(places, AdvancedMarkerElement) {
        // Clear old markers
        ev_Markers.forEach(m => m.map = null);
        ev_Markers = [];
        
        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        
        places.forEach((place, index) => {
            // Create modern Advanced Marker
            const marker = new AdvancedMarkerElement({
                map: ev_Map,
                position: place.location,
                title: place.displayName,
                gmpClickable: true 
            });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.id = `ev-card-${index}`; 
            card.style.cssText = "padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer; background:#fff; font-family:Roboto, Arial, sans-serif;";

            const ratingVal = place.rating ? place.rating.toFixed(1) : "5.0";
            const addr = place.formattedAddress || "";
            
            let sidebarPlugs = '';
            (place.evChargeOptions?.connectorAggregations || []).forEach(agg => {
                sidebarPlugs += `
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-top:8px;">
                    <span style="color:#00838f;">⚡ ${formatConnector(agg.type)}</span>
                    <span style="background:#f1f3f4; padding:0 8px; border-radius:4px; font-weight:500;">0/${agg.count || 1}</span>
                </div>`;
            });

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="width:78%">
                        <h5 style="margin:0; font-size:16px; font-weight:500; color:#202124;">${place.displayName}</h5>
                        <div style="font-size:12px; color:#70757a; margin:4px 0;">${ratingVal} <span style="color:#fbbc04;">★★★★★</span></div>
                        <p style="margin:4px 0; font-size:13px; color:#70757a;">${addr}</p>
                        ${sidebarPlugs}
                    </div>
                    <div style="text-align:center; color:#00838f; font-size:11px;">
                        <div style="width:34px; height:34px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">↗</div>
                        Directions
                    </div>
                </div>
            `;

            // THE SELECTION LOGIC
            const select = (e) => {
                // Prevents the map from handling the click and closing the InfoWindow
                if (e && e.stopImmediatePropagation) {
                    e.stopImmediatePropagation();
                }

                ev_Map.panTo(place.location);

                const infoHtml = `
                    <div style="width:320px; font-family:Roboto, Arial; background:#fff; border-radius:12px; overflow:hidden;">
                        <div style="padding:16px;">
                            <h2 style="margin:0; font-size:20px; font-weight:400; color:#202124;">${place.displayName}</h2>
                            <div style="display:flex; gap:4px; margin:4px 0; font-size:14px;">
                                <span>${ratingVal}</span><span style="color:#fbbc04;">★★★★★</span><span style="color:#70757a;">(1)</span>
                            </div>
                        </div>
                        <div style="display:flex; border-bottom:1px solid #e0e0e0;">
                            <div style="flex:1; text-align:center; padding:12px; color:#00838f; border-bottom:3px solid #00838f; font-weight:500;">Overview</div>
                            <div style="flex:1; text-align:center; padding:12px; color:#70757a;">Reviews</div>
                        </div>
                        <div style="display:flex; justify-content:space-around; padding:16px; border-bottom:1px solid #f1f3f4;">
                            <div style="text-align:center; cursor:pointer;" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${place.location.lat()},${place.location.lng()}')">
                                <div style="width:40px; height:40px; border-radius:50%; background:#00838f; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto;">↗</div>
                                <div style="font-size:11px; color:#00838f; margin-top:5px;">Directions</div>
                            </div>
                            <div style="text-align:center; color:#70757a;"><div style="width:40px; height:40px; border-radius:50%; border:1px solid #dadce0; display:flex; align-items:center; justify-content:center; margin:0 auto;">🔖</div><div style="font-size:11px; margin-top:5px;">Save</div></div>
                            <div style="text-align:center; color:#70757a;"><div style="width:40px; height:40px; border-radius:50%; border:1px solid #dadce0; display:flex; align-items:center; justify-content:center; margin:0 auto;">📍</div><div style="font-size:11px; margin-top:5px;">Nearby</div></div>
                        </div>
                        <div style="padding:16px; display:flex; align-items:center; gap:12px; font-size:14px; color:#3c4043;">
                            <span style="color:#00838f; font-size:18px;">📍</span><span>${addr}</span>
                        </div>
                    </div>`;

                ev_InfoWindow.setOptions({ content: infoHtml, headerDisabled: true });
                
                // Open using the 2026 anchor method to prevent flickering
                ev_InfoWindow.open({
                    anchor: marker,
                    map: ev_Map,
                    shouldFocus: false 
                });

                // Highlight Sidebar
                document.querySelectorAll('.ev-location-card').forEach(c => c.style.background = '#fff');
                card.style.background = '#f8f9fa';
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };

            // Marker & Card Listeners
            marker.addListener('gmp-click', (e) => select(e));
            card.onclick = (e) => select(e);

            list.appendChild(card);
        });
    }

    start();
})();
