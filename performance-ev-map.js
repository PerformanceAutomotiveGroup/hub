(function() {
    let ev_Map, ev_InfoWindow, directionsService, directionsRenderer;
    let ev_Markers = [];
    let isPanning = false;

    // Helper to extract clean numeric coordinates from any Google object
    const getCoords = (loc) => {
        if (!loc) return null;
        const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
        const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
        return { lat: Number(lat), lng: Number(lng) };
    };

    window.calculateRoute = function(destLat, destLng) {
        if (!directionsService || !directionsRenderer) return;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
                
                // RE-CAST: Strips all hidden 'KJ' properties by creating a fresh LatLngLiteral
                const destination = { lat: Number(destLat), lng: Number(destLng) };

                directionsService.route({
                    origin: origin,
                    destination: destination,
                    travelMode: google.maps.TravelMode.DRIVING
                }, (result, status) => {
                    if (status === 'OK') {
                        // FORCE RE-BIND: Vector maps require a fresh map attachment to show polylines
                        directionsRenderer.setMap(null);
                        directionsRenderer.setMap(ev_Map);
                        directionsRenderer.setDirections(result);
                        
                        const panel = document.getElementById('ev-directions-panel');
                        if (panel) panel.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }, () => alert("Please enable location services."));
        }
    };

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

            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer({
                suppressMarkers: false,
                preserveViewport: false,
                polylineOptions: {
                    strokeColor: "#00838f",
                    strokeWeight: 6,
                    zIndex: 99999, // Force polyline above Vector layers
                    strokeOpacity: 0.9
                },
                markerOptions: {
                    zIndex: 100000, // Force 'A' and 'B' markers above AdvancedMarkers
                    optimized: false
                }
            });

            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "e9da2b0d1db902e558a4a8df",
                mapTypeControl: false,
                streetViewControl: false
            });

            directionsRenderer.setMap(ev_Map);
            directionsRenderer.setPanel(document.getElementById('ev-directions-panel'));

            ev_Map.addListener("idle", async () => {
                if (isPanning) { isPanning = false; return; }
                const rawBounds = ev_Map.getBounds();
                if (!rawBounds) return;

                // FIX: Manually construct clean literal to kill 'cj' error in searchByText
                const cleanBounds = {
                    north: rawBounds.getNorthEast().lat(),
                    south: rawBounds.getSouthWest().lat(),
                    east: rawBounds.getNorthEast().lng(),
                    west: rawBounds.getSouthWest().lng()
                };

                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions", "photos"],
                    locationRestriction: cleanBounds,
                    maxResultCount: 20 
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
            const loc = getCoords(place.location);
            const marker = new AdvancedMarkerElement({
                map: ev_Map,
                position: loc,
                title: place.displayName,
                gmpClickable: true 
            });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.innerHTML = `
                <div style="padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer;">
                    <h5 style="margin:0;">${place.displayName}</h5>
                    <div onclick="window.calculateRoute(${loc.lat}, ${loc.lng})">↗ Directions</div>
                </div>`;
            
            card.onclick = () => {
                isPanning = true;
                ev_Map.panTo(loc);
            };
            list.appendChild(card);
        });
    }
    start();
})();
