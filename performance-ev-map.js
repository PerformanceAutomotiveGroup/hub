(function() {
    let ev_Map, ev_InfoWindow, directionsService, directionsRenderer;
    let ev_Markers = [];
    let isPanning = false;

    window.closeEVInfoWindow = function() {
        if (ev_InfoWindow) ev_InfoWindow.close();
    };

    window.calculateRoute = function(destLat, destLng) {
        if (!directionsService || !directionsRenderer) return;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
                directionsService.route({
                    origin: origin, destination: { lat: destLat, lng: destLng },
                    travelMode: google.maps.TravelMode.DRIVING
                }, (result, status) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(result);
                        document.getElementById('ev-directions-panel').scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        }
    };

    window.initPerformanceEVMap = async function() {
        const mapElement = document.getElementById("ev-map-canvas");
        
        if (!mapElement) {
            setTimeout(window.initPerformanceEVMap, 100);
            return;
        }

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
                zoom: 11,
                mapId: "e9da2b0d1db902e558a4a8df",
                mapTypeControl: false,
                streetViewControl: false
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
                    maxResultCount: 20 
                };

                try {
                    const { places } = await Place.searchByText(request);
                    renderUI(places || [], AdvancedMarkerElement);
                } catch (e) { console.error("Search failed:", e); }
            });
        } catch (err) { console.error("Init Error", err); }
    };

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
            card.style.cssText = "padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer; background:#fff; font-family:Roboto, Arial, sans-serif;";
            const ratingVal = place.rating ? place.rating.toFixed(1) : "5.0";

            card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:start;"><div style="width:78%"><h5 style="margin:0; font-size:16px; font-weight:500; color:#202124;">${place.displayName}</h5><div style="font-size:12px; color:#70757a; margin:4px 0;">${ratingVal} <span style="color:#fbbc04;">★★★★★</span></div><p style="margin:4px 0; font-size:13px; color:#70757a;">${place.formattedAddress}</p></div><div style="text-align:center; color:#00838f; font-size:11px;" onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})"><div style="width:34px; height:34px; border-radius:50%; background:#e1f5fe; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:18px;">↗</div>Directions</div></div>`;

            const select = (e) => {
                if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
                isPanning = true; 
                ev_Map.panTo(place.location);

                const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].getURI({maxWidth: 400}) : '';
                const aboutText = place.editorialSummary || "Electric vehicle charging station.";

                const infoHtml = `
                    <div style="width:340px; font-family:Roboto, Arial; background:#fff; border-radius:12px; overflow:hidden; position:relative;">
                        ${photoUrl ? `<div style="width:100%; height:140px; background:url('${photoUrl}') center/cover no-repeat;"></div>` : ''}
                        <div onclick="window.closeEVInfoWindow()" style="position:absolute; top:12px; right:12px; background:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:22px; z-index:100; color:#3c4043;">×</div>
                        <div style="padding:16px;">
                            <h2 style="margin:0; font-size:20px; font-weight:400; color:#202124;">${place.displayName}</h2>
                            <div style="display:flex; justify-content:space-around; padding:16px 8px; border-top:1px solid #f1f3f4; margin-top:10px;">
                                <div style="text-align:center; cursor:pointer;" onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})">
                                    <div style="width:42px; height:42px; border-radius:50%; background:#00838f; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:20px;">↗</div>
                                    <div style="font-size:11px; color:#00838f; font-weight:500; margin-top:6px;">Directions</div>
                                </div>
                            </div>
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
})();
