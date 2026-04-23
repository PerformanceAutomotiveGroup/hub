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

            // 1. Build the Plug List
            let plugListHtml = '';
            const aggs = place.evChargeOptions?.connectorAggregations;
            
            if (aggs && aggs.length > 0) {
                plugListHtml = '<div style="margin-top:8px; border-top:1px solid #eee; padding-top:5px;">';
                aggs.forEach(agg => {
                    const type = formatConnectorType(agg.type);
                    const count = agg.count || 0;
                    const power = agg.maxChargeRateKw ? ` (${agg.maxChargeRateKw}kW)` : '';
                    plugListHtml += `<div style="font-size:11px; color:#444;">• ${count}x ${type}${power}</div>`;
                });
                plugListHtml += '</div>';
            } else {
                plugListHtml = '<div style="font-size:11px; color:#999; margin-top:5px;">No plug details available</div>';
            }

            const ratingText = place.rating ? `⭐ ${place.rating}` : '';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h5 style="margin:0; font-size:14px;">${place.displayName}</h5>
                    <span style="font-size:12px; font-weight:bold; color:#fbc02d;">${ratingText}</span>
                </div>
                <p style="margin:4px 0; font-size:12px; color:#666;">${place.formattedAddress}</p>
                ${plugListHtml}
            `;

            card.onclick = () => {
                map.panTo(place.location);
                infoWindow.setContent(`
                    <div style="padding:5px;">
                        <strong>${place.displayName}</strong><br>
                        <span style="font-size:11px;">${place.formattedAddress}</span>
                        ${plugListHtml}
                    </div>
                `);
                infoWindow.open(map, marker);
            };
            list.appendChild(card);
        });
    }

    if (window.google && window.google.maps) {
        initPerformanceEVMap();
    }
})();
