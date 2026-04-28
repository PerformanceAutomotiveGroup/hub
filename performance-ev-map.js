(function() {
    let ev_Map, ev_InfoWindow, directionsService, directionsRenderer;
    let ev_Markers = [];
    let isPanning = false;

    function formatConnector(type) {
        if (!type) return "Unknown";
        const types = { 'EV_CONNECTOR_TYPE_J1772': 'J1772', 'EV_CONNECTOR_TYPE_CCS_COMBO_1': 'CCS', 'EV_CONNECTOR_TYPE_CHADEMO': 'CHAdeMO', 'EV_CONNECTOR_TYPE_TESLA': 'Tesla' };
        return types[type] || type.replace('EV_CONNECTOR_TYPE_', '').replace(/_/g, ' ');
    }

    window.closeEVInfoWindow = () => ev_InfoWindow && ev_InfoWindow.close();
    
    window.toggleSidebar = () => {
        const sidebar = document.getElementById('ev-sidebar');
        const icon = document.getElementById('toggle-icon');
        const btn = document.getElementById('sidebar-toggle');
        const isCollapsed = sidebar.style.transform === 'translateX(100%)';
        sidebar.style.transform = isCollapsed ? 'translateX(0)' : 'translateX(100%)';
        btn.style.right = isCollapsed ? '310px' : '10px';
        icon.innerText = isCollapsed ? '❯' : '❮';
    };

    window.calculateRoute = function(lat, lng) {
        if (!directionsService || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            directionsService.route({
                origin: origin,
                destination: { lat, lng },
                travelMode: google.maps.TravelMode.DRIVING
            }, (res, status) => {
                if (status === 'OK') {
                    directionsRenderer.setDirections(res);
                    document.getElementById('ev-directions-panel').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    };

    window.initPerformanceEVMap = async function() {
        const mapEl = document.getElementById("ev-map-canvas");
        if (!mapEl) { setTimeout(window.initPerformanceEVMap, 100); return; }

        try {
            const [{ Map }, { Place }, { AdvancedMarkerElement }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("places"),
                google.maps.importLibrary("marker")
            ]);

            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer();
            ev_InfoWindow = new google.maps.InfoWindow();
            
            ev_Map = new Map(mapEl, {
                center: { lat: 43.159, lng: -79.246 }, 
                zoom: 11,
                mapId: "e9da2b0d1db902e558a4a8df", // Cloud ID
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

                const { places } = await Place.searchByText(request);
                renderUI(places || [], AdvancedMarkerElement);
            });
        } catch (err) { console.error("Map Load Error:", err); }
    };

    function renderUI(places, AdvancedMarkerElement) {
        ev_Markers.forEach(m => m.map = null);
        ev_Markers = [];
        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        
        places.forEach((place, index) => {
            const marker = new AdvancedMarkerElement({ map: ev_Map, position: place.location, gmpClickable: true });
            ev_Markers.push(marker);

            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.style.cssText = "padding:16px; border-bottom:1px solid #e0e0e0; cursor:pointer; font-family:Arial;";
            
            card.innerHTML = `<h5 style="margin:0;">${place.displayName}</h5><p style="font-size:12px; color:#666;">${place.formattedAddress}</p>`;
            
            const select = () => {
                isPanning = true;
                ev_Map.panTo(place.location);
                const photo = place.photos?.[0]?.getURI({maxWidth: 400}) || '';
                
                const infoHtml = `
                    <div style="width:320px; border-radius:12px; overflow:hidden;">
                        ${photo ? `<img src="${photo}" style="width:100%; height:120px; object-fit:cover;">` : ''}
                        <div style="padding:15px; position:relative;">
                            <div onclick="window.closeEVInfoWindow()" style="position:absolute; top:-10px; right:10px; background:#fff; width:25px; height:25px; border-radius:50%; text-align:center; line-height:25px; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.2);">×</div>
                            <h3 style="margin:0 0 10px 0; font-size:18px;">${place.displayName}</h3>
                            <button onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})" style="width:100%; padding:10px; background:#00838f; color:#fff; border:none; border-radius:4px; cursor:pointer;">Get Directions</button>
                        </div>
                    </div>`;

                ev_InfoWindow.setOptions({ content: infoHtml, headerDisabled: true });
                ev_InfoWindow.open({ anchor: marker, map: ev_Map });
            };

            marker.addListener('gmp-click', select);
            card.onclick = select;
            list.appendChild(card);
        });
    }
})();
