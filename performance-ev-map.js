(function() {
    let ev_Map, ev_InfoWindow, directionsService, directionsRenderer;
    let AdvancedMarker; 
    let ev_Markers = [];
    let routeMarkers = []; 
    let activePolyline = null; 
    let isPanning = false;
    let isRouting = false;

    // Safety helper to extract coordinates as primitive numbers
    const getSafeCoord = (val) => typeof val === 'function' ? val() : val;

    window.closeEVInfoWindow = function() {
        if (ev_InfoWindow) ev_InfoWindow.close();
    };

    window.calculateRoute = function(destLat, destLng) {
        if (!directionsService) return;
        
        const latNum = Number(destLat);
        const lngNum = Number(destLng);
        if (isNaN(latNum) || isNaN(lngNum)) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                isRouting = true; 
                const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
                const destination = { lat: latNum, lng: lngNum };

                directionsService.route({
                    origin: origin,
                    destination: destination,
                    travelMode: google.maps.TravelMode.DRIVING
                }, (result, status) => {
                    if (status === 'OK') {
                        // 1. CLEANUP: Detach old artifacts to stop the 'apply' crash on zoom
                        if (activePolyline) activePolyline.setMap(null);
                        routeMarkers.forEach(m => m.map = null);
                        routeMarkers = [];

                        // 2. PATH UNWRAPPING: Force internal Google objects into primitive literals
                        const rawPath = result.routes[0].overview_path;
                        const cleanPath = rawPath.map(p => ({ lat: p.lat(), lng: p.lng() }));

                        activePolyline = new google.maps.Polyline({
                            path: cleanPath,
                            geodesic: true,
                            strokeColor: "#00838f",
                            strokeOpacity: 1.0,
                            strokeWeight: 6,
                            map: ev_Map,
                            zIndex: 100
                        });

                        // 3. UPDATED PIN ELEMENT: Using glyphText (fixes deprecation warning)
                        const leg = result.routes[0].legs[0];
                        const startMarker = new AdvancedMarker({
                            map: ev_Map,
                            position: leg.start_location,
                            content: new google.maps.marker.PinElement({ 
                                glyphText: "A", 
                                background: "#00838f", 
                                borderColor: "#fff", 
                                glyphColor: "#fff" 
                            }).element,
                            zIndex: 200
                        });

                        const endMarker = new AdvancedMarker({
                            map: ev_Map,
                            position: leg.end_location,
                            content: new google.maps.marker.PinElement({ 
                                glyphText: "B", 
                                background: "#d32f2f", 
                                borderColor: "#fff", 
                                glyphColor: "#fff" 
                            }).element,
                            zIndex: 201
                        });

                        routeMarkers.push(startMarker, endMarker);

                        // 4. UPDATE TEXT PANEL
                        directionsRenderer.setDirections(result);
                        const panel = document.getElementById('ev-directions-panel');
                        if (panel) panel.scrollIntoView({ behavior: 'smooth' });

                        google.maps.event.addListenerOnce(ev_Map, "idle", () => {
                            isRouting = false;
                        });
                    } else {
                        isRouting = false;
                    }
                });
            }, () => { isRouting = false; alert("Location services failed."); }, { timeout: 10000 });
        }
    };

    async function start() {
        if (typeof google === 'undefined' || !google.maps) {
            setTimeout(start, 300);
            return;
        }
        try {
            // Initialize InfoWindow early to ensure it exists for renderUI
            ev_InfoWindow = new google.maps.InfoWindow();

            const lib = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("places"),
                google.maps.importLibrary("marker")
            ]);

            const { Map } = lib[0];
            const { Place } = lib[1];
            AdvancedMarker = lib[2].AdvancedMarkerElement;

            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer({
                suppressMarkers: true, 
                map: null // Keep detached from map instance to avoid internal Vector conflicts
            });

            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "e9da2b0d1db902e558a4a8df",
                mapTypeControl: false,
                streetViewControl: false
            });

            directionsRenderer.setPanel(document.getElementById('ev-directions-panel'));

            ev_Map.addListener("idle", async () => {
                if (isPanning || isRouting) return;
                const bounds = ev_Map.getBounds();
                if (!bounds) return;

                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                const cleanBounds = {
                    north: getSafeCoord(ne.lat),
                    south: getSafeCoord(sw.lat),
                    east: getSafeCoord(ne.lng),
                    west: getSafeCoord(sw.lng)
                };

                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions", "photos", "editorialSummary"],
                    locationRestriction: cleanBounds,
                    maxResultCount: 20 
                };

                const { places } = await Place.searchByText(request);
                renderUI(places || []);
            });
        } catch (err) { console.error("Initialization Error", err); }
    }

    function renderUI(places) {
        ev_Markers.forEach(m => m.map = null);
        ev_Markers = [];
        const list = document.getElementById('ev-results-list');
        if (!list) return;
        list.innerHTML = '';
        
        places.forEach((place) => {
            const lat = getSafeCoord(place.location.lat);
            const lng = getSafeCoord(place.location.lng);
            const loc = { lat: lat, lng: lng };

            const marker = new AdvancedMarker({
                map: ev_Map,
                position: loc,
                title: place.displayName,
                gmpClickable: true
            });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.style.cssText = "padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer; background:#fff;";
            
            card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:start;">
                <div style="width:78%"><h5 style="margin:0;">${place.displayName}</h5></div>
                <div style="text-align:center; color:#00838f; font-size:11px;" onclick="event.stopPropagation(); window.calculateRoute(${loc.lat}, ${loc.lng})">
                <div style="width:34px; height:34px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">↗</div>Directions</div></div>`;

            const select = () => {
                isPanning = true; 
                ev_Map.panTo(loc);
                
                const photoUrl = place.photos?.[0]?.getURI({maxWidth: 400}) || '';
                const infoHtml = `
                    <div style="width:300px; padding:10px; font-family:Arial;">
                        ${photoUrl ? `<img src="${photoUrl}" style="width:100%; border-radius:8px; margin-bottom:8px;">` : ''}
                        <h3 style="margin:0 0 8px 0;">${place.displayName}</h3>
                        <p style="font-size:13px; color:#555;">${place.formattedAddress}</p>
                        <button onclick="window.calculateRoute(${loc.lat}, ${loc.lng})" style="background:#00838f; color:#fff; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; width:100%;">Get Directions</button>
                    </div>`;

                if (ev_InfoWindow) {
                    ev_InfoWindow.setOptions({ content: infoHtml });
                    ev_InfoWindow.open({ anchor: marker, map: ev_Map });
                }
            };

            marker.addListener('gmp-click', select);
            card.onclick = select;
            list.appendChild(card);
        });
    }
    start();
})();
