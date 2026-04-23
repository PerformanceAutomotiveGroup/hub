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

            // Map search logic
            ev_Map.addListener("idle", async () => {
                const bounds = ev_Map.getBounds();
                if (!bounds) return;
                const request = {
                    textQuery: "EV Charging Station",
                    fields: ["displayName", "location", "formattedAddress"],
                    locationRestriction: {
                        south: bounds.getSouthWest().lat(),
                        west: bounds.getSouthWest().lng(),
                        north: bounds.getNorthEast().lat(),
                        east: bounds.getNorthEast().lng(),
                    }
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
        const list = document.getElementById('ev-results-list');
        list.innerHTML = '';
        places.forEach((place) => {
            const marker = new google.maps.Marker({
                map: map,
                position: place.location,
                title: place.displayName
            });
            const card = document.createElement('div');
            card.className = 'ev-location-card';
            card.innerHTML = `<h5>${place.displayName}</h5><p>${place.formattedAddress}</p>`;
            card.onclick = () => {
                map.panTo(place.location);
                infoWindow.setContent(`<strong>${place.displayName}</strong>`);
                infoWindow.open(map, marker);
            };
            list.appendChild(card);
        });
    }


    if (window.google && window.google.maps) {
        console.log("EV Map: Google already exists, triggering manually.");
        initPerformanceEVMap();
    }
    data-cfasync="false" 
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDnIAUc5IWnvW2CVEySXEJBeQExpCEQ8-Q&v=beta&libraries=places&callback=initPerformanceEVMap">
</script>
