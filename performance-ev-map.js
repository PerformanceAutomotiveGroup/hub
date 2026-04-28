(function() {
    let ev_Map, ev_InfoWindow, directionsService, directionsRenderer;
    let ev_Markers = [];
    let isPanning = false;

    // Helper: Determine if user is on a mobile device
    const isMobile = window.innerWidth <= 768;

    function formatConnector(type) {
        if (!type) return "Unknown";
        const types = { 'EV_CONNECTOR_TYPE_J1772': 'J1772', 'EV_CONNECTOR_TYPE_CCS_COMBO_1': 'CCS', 'EV_CONNECTOR_TYPE_CHADEMO': 'CHAdeMO', 'EV_CONNECTOR_TYPE_TESLA': 'Tesla' };
        return types[type] || type.replace('EV_CONNECTOR_TYPE_', '').replace(/_/g, ' ');
    }

    window.closeEVInfoWindow = function() {
        if (ev_InfoWindow) ev_InfoWindow.close();
    };

    window.calculateRoute = function(destLat, destLng) {
        if (!directionsService || !directionsRenderer) return;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
                directionsService.route({
                    origin: origin,
                    destination: { lat: destLat, lng: destLng },
                    travelMode: google.maps.TravelMode.DRIVING
                }, (result, status) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(result);
                        // On mobile, scroll to the panel below the map
                        document.getElementById('ev-directions-panel').scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        }
    };

    async function start() {
        const mapElement = document.getElementById("ev-map-canvas");
        if (!mapElement) { setTimeout(start, 300); return; }

        try {
            const [{ Map }, { Place }, { AdvancedMarkerElement }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("places"),
                google.maps.importLibrary("marker")
            ]);

            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer();
            ev_InfoWindow = new google.maps.InfoWindow();
            
            ev_Map = new Map(mapElement, {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: isMobile ? 10 : 11, // Slightly wider zoom for mobile
                mapId: "e9da2b0d1db902e558a4a8df",
                mapTypeControl: false,
                streetViewControl: false,
                gestureHandling: "greedy" // Better for mobile scrolling
            });

            directionsRenderer.setMap(ev_Map);
            directionsRenderer.setPanel(document.getElementById('ev-directions-panel'));

            ev_Map.addListener("idle", async () => {
                if (isPanning) { isPanning = false; return; }
                const bounds = ev_Map.getBounds();
                if (!bounds) return;

                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions", "photos", "editorialSummary"],
                    locationRestriction: bounds,
                    maxResultCount: isMobile ? 10 : 20 // Fewer results on mobile for performance
                };

                try {
                    const { places } = await Place.searchByText(request);
                    renderUI(places || [], AdvancedMarkerElement);
                } catch (e) { console.error("Search failed:", e); }
            });
        } catch (err) { console.error("Initialization Error", err); }
    }

    function renderUI(places, AdvancedMarkerElement) {
        ev_Markers.forEach(m => m.map = null);
        ev_Markers = [];
        const list = document.getElementById('ev-results-list');
        if (!list) return;
        list.innerHTML = '';
        
        places.forEach((place, index) => {
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
            // Compact styles for mobile list
            card.style.cssText = `padding:${isMobile ? '12px' : '16px'}; border-bottom:1px solid #e0e0e0; cursor:pointer; background:#fff; font-family:Roboto, Arial, sans-serif;`;

            const ratingVal = place.rating ? place.rating.toFixed(1) : "5.0";

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="width:75%">
                        <h5 style="margin:0; font-size:${isMobile ? '14px' : '16px'}; font-weight:500;">${place.displayName}</h5>
                        <div style="font-size:12px; color:#70757a; margin:2px 0;">${ratingVal} ★★★★★</div>
                        <p style="margin:2px 0; font-size:12px; color:#70757a;">${place.formattedAddress}</p>
                    </div>
                    <div style="text-align:center; color:#00838f; font-size:10px;" onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})">
                        <div style="width:30px; height:30px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:16px;">↗</div>
                        Dir
                    </div>
                </div>`;

            const select = (e) => {
                if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
                isPanning = true; 
                ev_Map.panTo(place.location);

                const photoUrl = place.photos?.[0]?.getURI({maxWidth: 400}) || '';
                const aboutText = place.editorialSummary || "Electric vehicle charging station.";

                const infoHtml = `
                    <div style="width:${isMobile ? '280px' : '340px'}; font-family:Roboto, Arial; background:#fff; border-radius:12px; overflow:hidden;">
                        ${photoUrl ? `<div style="width:100%; height:120px; background:url('${photoUrl}') center/cover no-repeat;"></div>` : ''}
                        <div onclick="window.closeEVInfoWindow()" style="position:absolute; top:8px; right:8px; background:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.2); font-size:18px;">×</div>
                        <div style="padding:12px;">
                            <h2 style="margin:0; font-size:18px; font-weight:400;">${place.displayName}</h2>
                            <div style="display:flex; justify-content:space-around; padding:10px 0; border-top:1px solid #f1f3f4; margin-top:10px;">
                                <div style="text-align:center; cursor:pointer;" onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})">
                                    <div style="width:38px; height:38px; border-radius:50%; background:#00838f; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">↗</div>
                                    <div style="font-size:10px; color:#00838f; font-weight:500; margin-top:4px;">Directions</div>
                                </div>
                            </div>
                        </div>
                    </div>`;

                ev_InfoWindow.setOptions({ content: infoHtml, headerDisabled: true, maxWidth: isMobile ? 300 : 350 });
                ev_InfoWindow.open({ anchor: marker, map: ev_Map, shouldFocus: false });

                document.querySelectorAll('.ev-location-card').forEach(c => c.style.background = '#fff');
                card.style.background = '#f8f9fa';
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };

            marker.addListener('gmp-click', (e) => select(e));
            card.onclick = (e) => select(e);
            list.appendChild(card);
        });
    }
    start();
})();
