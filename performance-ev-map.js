(function() {
    let ev_Markers = [];
    
    function formatConnectorType(type) {
        if (!type) return "Unknown";
        return type.replace('EV_CONNECTOR_TYPE_', '').replace(/_/g, ' ');
    }

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

function renderUI(places, map, infoWindow) {
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
            // Custom card styling to match Google's padding and border
            card.style.cssText = "padding: 16px; border-bottom: 1px solid #e0e0e0; cursor: pointer; font-family: Roboto, Arial, sans-serif;";

            // 1. Header with Rating
            const ratingHtml = place.rating ? `
                <div style="display:flex; align-items:center; gap:4px; margin: 4px 0;">
                    <span style="font-size:13px; color:#70757a;">${place.rating.toFixed(1)}</span>
                    <span style="color:#fbbc04; font-size:12px;">★★★★★</span>
                    <span style="font-size:13px; color:#70757a;">(2)</span>
                </div>` : '';

            // 2. Build the Plug List (The bottom rows)
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

            card.onclick = () => {
                map.panTo(place.location);
                infoWindow.setContent(`<div style="padding:10px;"><strong>${place.displayName}</strong><br>${place.formattedAddress}</div>`);
                infoWindow.open(map, marker);
            };
            list.appendChild(card);
        });
    }

    if (window.google && window.google.maps) {
        initPerformanceEVMap();
    }
})();
