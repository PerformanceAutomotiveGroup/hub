(function() {
    let ev_Map, ev_InfoWindow, directionsService, directionsRenderer;
    let ev_Markers = [];
    let isPanning = false;

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

    window.closeEVInfoWindow = function() {
        if (ev_InfoWindow) ev_InfoWindow.close();
    };

    window.triggerNearbySearch = async function(lat, lng) {
        if (!ev_Map) return;
        
        // FIX: Force inputs to numbers to resolve "setCenter: not a number"
        const latNum = Number(lat);
        const lngNum = Number(lng);
        
        const { Place } = await google.maps.importLibrary("places");
        ev_Map.setCenter({lat: latNum, lng: lngNum});
        ev_Map.setZoom(15); 
        
        const request = {
            textQuery: "restaurants and coffee shops",
            locationBias: {lat: latNum, lng: lngNum},
            maxResultCount: 10
        };

        try {
            const { places } = await Place.searchByText(request);
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
            renderUI(places || [], AdvancedMarkerElement);
        } catch (e) { console.error("Nearby search failed:", e); }
    };

    window.calculateRoute = function(destLat, destLng) {
        if (!directionsService || !directionsRenderer) return;
        
        const latNum = Number(destLat);
        const lngNum = Number(destLng);

        if (isNaN(latNum) || isNaN(lngNum)) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
                
                // FIX: Formal constructor strips hidden 'KJ' properties causing the crash
                const destination = new google.maps.LatLng(latNum, lngNum);

                directionsService.route({
                    origin: origin,
                    destination: destination,
                    travelMode: google.maps.TravelMode.DRIVING
                }, (result, status) => {
                    if (status === 'OK') {
                        // Reset map binding to force polyline visibility and B marker
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
                    zIndex: 99999, // Force line to top layer
                    strokeOpacity: 0.9
                },
                markerOptions: {
                    zIndex: 100000, // Force Point B to top layer
                    optimized: false
                }
            });

            ev_InfoWindow = new google.maps.InfoWindow();
            
            ev_Map = new Map(document.getElementById("ev-map-canvas"), {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "e9da2b0d1db902e558a4a8df",
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });

            directionsRenderer.setMap(ev_Map);
            directionsRenderer.setPanel(document.getElementById('ev-directions-panel'));

            ev_Map.addListener("idle", async () => {
                if (isPanning) { isPanning = false; return; }
                const rawBounds = ev_Map.getBounds();
                if (!rawBounds) return;

                // FIX: Manually construct clean literal to kill 'cj' error
                const cleanBounds = {
                    north: rawBounds.getNorthEast().lat(),
                    south: rawBounds.getSouthWest().lat(),
                    east: rawBounds.getNorthEast().lng(),
                    west: rawBounds.getSouthWest().lng()
                };

                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress", "rating", "evChargeOptions", "photos", "editorialSummary"],
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
            const marker = new AdvancedMarkerElement({
                map: ev_Map,
                position: place.location,
                title: place.displayName,
                gmpClickable: true 
            });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.style.cssText = "padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer; background:#fff;";

            const ratingVal = place.rating ? place.rating.toFixed(1) : "5.0";
            const addr = place.formattedAddress || "";
            
            let sidebarPlugs = '';
            (place.evChargeOptions?.connectorAggregations || []).forEach(agg => {
                sidebarPlugs += `<div style="display:flex; justify-content:space-between; font-size:13px; margin-top:8px;"><span style="color:#00838f;">⚡ ${formatConnector(agg.type)}</span><span style="background:#f1f3f4; padding:0 8px; border-radius:4px;">0/${agg.count || 1}</span></div>`;
            });

            // FIX: Added () to lat and lng calls
            card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:start;"><div style="width:78%"><h5 style="margin:0; font-size:16px; font-weight:500; color:#202124;">${place.displayName}</h5><div style="font-size:12px; color:#70757a; margin:4px 0;">${ratingVal} ★★★★★</div><p style="margin:4px 0; font-size:13px; color:#70757a;">${addr}</p>${sidebarPlugs}</div><div style="text-align:center; color:#00838f; font-size:11px;" onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})"><div style="width:34px; height:34px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">↗</div>Directions</div></div>`;

            const select = (e) => {
                if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
                isPanning = true; 
                ev_Map.panTo(place.location);

                const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].getURI({maxWidth: 400}) : '';
                const aboutText = place.editorialSummary || "Electric vehicle charging station.";

                // FIX: Added () to all lat/lng calls in InfoWindow
                const infoHtml = `
                    <div style="width:340px; font-family:Roboto, Arial; background:#fff; border-radius:12px; overflow:hidden;">
                        ${photoUrl ? `<div style="width:100%; height:140px; background:url('${photoUrl}') center/cover;"></div>` : ''}
                        <div onclick="window.closeEVInfoWindow()" style="position:absolute; top:12px; right:12px; background:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.3); z-index:100;">×</div>
                        <div style="padding:16px;">
                            <h2 style="margin:0; font-size:20px; color:#202124;">${place.displayName}</h2>
                            <div style="display:flex; justify-content:space-around; padding:16px 0;">
                                <div onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})" style="cursor:pointer; text-align:center;">
                                    <div style="width:42px; height:42px; border-radius:50%; background:#00838f; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto;">↗</div>
                                    <div style="font-size:11px; color:#00838f; margin-top:6px;">Directions</div>
                                </div>
                                <div onclick="window.triggerNearbySearch(${place.location.lat()}, ${place.location.lng()})" style="cursor:pointer; text-align:center;">
                                    <div style="width:42px; height:42px; border-radius:50%; border:1px solid #dadce0; color:#00838f; display:flex; align-items:center; justify-content:center; margin:0 auto;">📍</div>
                                    <div style="font-size:11px; color:#00838f; margin-top:6px;">Nearby</div>
                                </div>
                            </div>
                            <div style="font-size:14px; color:#3c4043;">📍 ${addr}</div>
                        </div>
                    </div>`;

                ev_InfoWindow.setOptions({ content: infoHtml, headerDisabled: true });
                ev_InfoWindow.open({ anchor: marker, map: ev_Map, shouldFocus: false });
            };

            marker.addListener('gmp-click', (e) => select(e));
            card.onclick = (e) => select(e);
            list.appendChild(card);
        });
    }
    start();
})();
