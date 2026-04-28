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

    window.triggerNearbySearch = function(lat, lng) {
        if (!ev_Map) return;
        ev_Map.setCenter({lat: lat, lng: lng});
        ev_Map.setZoom(15); 
        
        const request = {
            textQuery: "restaurants and coffee shops",
            locationBias: {lat: lat, lng: lng},
            maxResultCount: 10
        };
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
                        const panel = document.getElementById('ev-directions-panel');
                        if (panel) panel.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }, () => alert("Please enable location services for turn-by-turn directions."));
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
                polylineOptions: { strokeColor: "#00838f", strokeWeight: 6 }
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

            const ratingVal = place.rating ? place.rating.toFixed(1) : "5.0";
            const addr = place.formattedAddress || "";
            
            let sidebarPlugs = '';
            (place.evChargeOptions?.connectorAggregations || []).forEach(agg => {
                sidebarPlugs += `
                    <div class="ev-plug-row">
                        <span class="ev-plug-type">⚡ ${formatConnector(agg.type)}</span>
                        <span class="ev-plug-count">0/${agg.count || 1}</span>
                    </div>`;
            });

            card.innerHTML = `
                <div class="ev-card-flex-container">
                    <div class="ev-card-info">
                        <h5 class="ev-card-title">${place.displayName}</h5>
                        <div class="ev-card-rating">${ratingVal} <span class="ev-star">★★★★★</span></div>
                        <p class="ev-card-addr">${addr}</p>
                        ${sidebarPlugs}
                    </div>
                    <div class="ev-card-actions" onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})">
                        <div class="ev-action-icon">↗</div>
                        Directions
                    </div>
                </div>`;

            const select = (e) => {
                if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
                isPanning = true; 
                ev_Map.panTo(place.location);

                const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].getURI({maxWidth: 400}) : '';
                const aboutText = place.editorialSummary || "Electric vehicle charging station providing reliable power services.";

                const infoHtml = `
                    <div class="ev-info-window">
                        ${photoUrl ? `<div class="ev-info-photo" style="background-image: url('${photoUrl}')"></div>` : ''}
                        <div onclick="window.closeEVInfoWindow()" class="ev-info-close">×</div>
                        <div class="ev-info-header">
                            <h2>${place.displayName}</h2>
                            <div class="ev-info-rating">
                                <span>${ratingVal}</span><span class="ev-star">★★★★★</span><span>(8)</span>
                            </div>
                        </div>
                        <div class="ev-info-tabs">
                            <div id="tab-overview" class="ev-tab active" onclick="showTab('overview')">Overview</div>
                            <div id="tab-about" class="ev-tab" onclick="showTab('about')">About</div>
                        </div>
                        <div id="info-content-overview" class="ev-tab-content">
                            <div class="ev-action-bar">
                                <div class="ev-bar-item" onclick="window.calculateRoute(${place.location.lat()}, ${place.location.lng()})">
                                    <div class="ev-bar-icon primary">↗</div>
                                    <span>Directions</span>
                                </div>
                                <div class="ev-bar-item" onclick="window.triggerNearbySearch(${place.location.lat()}, ${place.location.lng()})">
                                    <div class="ev-bar-icon">📍</div>
                                    <span>Nearby</span>
                                </div>
                                <div class="ev-bar-item" onclick="if(navigator.share){navigator.share({title:'${place.displayName}', url:window.location.href})}">
                                    <div class="ev-bar-icon">🔗</div>
                                    <span>Share</span>
                                </div>
                            </div>
                            <div class="ev-info-details">
                                <div class="ev-detail-row">
                                    <span class="ev-icon">📍</span>
                                    <span class="ev-text">${addr}</span>
                                </div>
                                <div class="ev-detail-row">
                                    <span class="ev-icon">🕒</span>
                                    <span class="ev-text success">Open 24 hours ▾</span>
                                </div>
                            </div>
                        </div>
                        <div id="info-content-about" class="ev-tab-content" style="display:none;">
                            <div class="ev-about-title">About this location</div>
                            <p>${aboutText}</p>
                        </div>
                    </div>`;

                ev_InfoWindow.setOptions({ content: infoHtml, headerDisabled: true });
                ev_InfoWindow.open({ anchor: marker, map: ev_Map, shouldFocus: false });

                document.querySelectorAll('.ev-location-card').forEach(c => c.classList.remove('active-card'));
                card.classList.add('active-card');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };

            marker.addListener('gmp-click', (e) => select(e));
            card.onclick = (e) => select(e);
            list.appendChild(card);
        });
    }

    // Helper for tabs
    window.showTab = function(type) {
        const overview = document.getElementById('info-content-overview');
        const about = document.getElementById('info-content-about');
        const tabO = document.getElementById('tab-overview');
        const tabA = document.getElementById('tab-about');
        
        if (type === 'overview') {
            overview.style.display = 'block';
            about.style.display = 'none';
            tabO.classList.add('active');
            tabA.classList.remove('active');
        } else {
            overview.style.display = 'none';
            about.style.display = 'block';
            tabA.classList.add('active');
            tabO.classList.remove('active');
        }
    }

    start();
})();
