let map;
let service;
let InfoWindow;
let types = [];
let radius = 5500;
let searchCenter;
let baseType = [ 'restaurant' ];
let rectangle;
let textOverlay;
let markers = [];
let overlay;

function initMap() {
	const cebu = new google.maps.LatLng(10.314205199853188, 123.89325016711014);
	searchCenter = cebu;
	// Create the map.
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: cebu,
    });
  
	InfoWindow = new google.maps.InfoWindow();
	
	restaurants.forEach(function (restaurant, index) {
		setMarkers(restaurant);
		types = types.concat(restaurant.category);
	});
	
	createTypeList();
	
	class USGSOverlay extends google.maps.OverlayView {
		bounds_;
		textValue_;
		div_;
		
		constructor(bounds, textVal) {
		  super();
		  this.bounds_ = bounds;
		  this.textValue_ = textVal;
		  this.div_ = null;
		}
		
		onAdd() {
		  this.div_ = document.createElement("div");
		  this.div_.style.borderStyle = "none";
		  this.div_.style.borderWidth = "0px";
		  //this.div_.style.position = "absolute";
		  const p = document.createElement("p");
		  p.style.fontSize = "50px";
		  p.style.color = "red";
		  p.innerHTML = this.textValue_;
		  this.div_.appendChild(p);
		  const panes = this.getPanes();
		  panes.overlayLayer.appendChild(this.div_);
		}
		
		draw() {
		  const overlayProjection = this.getProjection();
		  const sw = overlayProjection.fromLatLngToDivPixel(
			this.bounds_.getSouthWest()
		  );
		  const ne = overlayProjection.fromLatLngToDivPixel(
			this.bounds_.getNorthEast()
		  );

		  if (this.div_) {
			this.div_.style.left = sw.x + "px";
			this.div_.style.top = ne.y + "px";
			this.div_.style.width = ne.x - sw.x + "px";
			this.div_.style.height = sw.y - ne.y + "px";
		  }
		}
		
		onRemove() {
		  if (this.div_) {
			this.div_.parentNode.removeChild(this.div_);
			this.div_ = null;
		  }
		}
	}
  
	//navigator.geolocation.getCurrentPosition((position) => {
	//	const currentLocation = {
	//		lat: position.coords.latitude,
	//		lng: position.coords.longitude,
	//	};
	//
	//	map.panTo(currentLocation);
	//	
	//	const bounds = new google.maps.LatLngBounds(
	//		new google.maps.LatLng(parseFloat(currentLocation.lat)-parseFloat(searchDimension/100), parseFloat(currentLocation.lng)-parseFloat(searchDimension/100)),
	//		new google.maps.LatLng(parseFloat(currentLocation.lat)+parseFloat(searchDimension/100), parseFloat(currentLocation.lng)+parseFloat(searchDimension/100))
	//	);
	//	
	//	//const bounds = new google.maps.LatLngBounds();
	//	const textString = "sample.jpg"
	//	
	//	overlay = new USGSOverlay(bounds, textString);
	//	overlay.setMap(map);
	//});
	
	overlay = new USGSOverlay(new google.maps.LatLngBounds(), '');
}

function setMarkers(marker) {
    var markerMap = marker.geometry.coordinates;
    var visit = marker.visits;
    var category = marker.category;
    var name = marker.name;
    var pos = new google.maps.LatLng(markerMap[1], markerMap[0]);
    var content = marker;

    markerMap = new google.maps.Marker({
        position: pos,
        name: name,
		visit: visit,
		type: category,
        map: map
    });

    markers.push(markerMap);

    var infowindow = new google.maps.InfoWindow();    

    // Marker click listener
    google.maps.event.addListener(markerMap, 'click', (function (marker1, content) {
        return function () {
			const lat = marker1.position.lat();
			const lng = marker1.position.lng();
			const content = `
			<h2>${name}</h2>
			<p><b>Specialty:</b> ${category}</p>
			<p><b>Visits:</b> ${visit}<br/></p>
			<input type="button" value="Directions" onClick="directions(${lat}, ${lng})"/>
			<input type="button" value="Visited" onClick="visited()"/>
			`;
            infowindow.setContent(content);
            infowindow.open(map, markerMap);
            map.panTo(this.getPosition());
        }
    })(markerMap, content));
}

function createTypeList() {
	types = [...new Set(types)];
	
	var selectFilter = this.document.getElementById("restoFilter");
	types.forEach(function (type, index) {
		var el = this.document.createElement("option");
		el.textContent = type;
		el.value = type;
		selectFilter.appendChild(el);
	});
}

function filter() {
	let filterValue = this.document.getElementById("restoFilter").value;
	markers.forEach(function (marker, index) {
		if (filterValue != 'All' && !marker.type.find(type => type == filterValue)) {
			marker.setMap(null);
		} else {
			marker.setMap(map);
		}
	});
	
	if (overlay != undefined && overlay.getMap() != undefined) {
		overlay.bounds_ = new google.maps.LatLngBounds(rectangle.getBounds().getNorthEast(), rectangle.getBounds().getSouthWest());
		overlay.textValue_ = countRestaurants();
		overlay.setMap(null);
		overlay.setMap(map);
	}
}

function searchDimension() {
	let searchDimension = 1; // previously user input

	if (rectangle != undefined && rectangle.getMap() != undefined) {
		rectangle.setMap(null);
		overlay.setMap(null);
	} else {
		navigator.geolocation.getCurrentPosition((position) => {
			const currentLocation = {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			};

			map.panTo(currentLocation);
			//const bounds = {			
			//	north: parseFloat(currentLocation.lat)+parseFloat(searchDimension/100),
			//	south: parseFloat(currentLocation.lat)-parseFloat(searchDimension/100),
			//	east: parseFloat(currentLocation.lng)+parseFloat(searchDimension/100),
			//	west: parseFloat(currentLocation.lng)-parseFloat(searchDimension/100),
			//  };
			  
			const bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(parseFloat(currentLocation.lat)-parseFloat(searchDimension/100), parseFloat(currentLocation.lng)-parseFloat(searchDimension/100)),
				new google.maps.LatLng(parseFloat(currentLocation.lat)+parseFloat(searchDimension/100), parseFloat(currentLocation.lng)+parseFloat(searchDimension/100))
			);
			
			// Define a rectangle and set its editable property to true.
			rectangle = new google.maps.Rectangle({
				bounds,
				map,
				editable: true,
				draggable: true,
				strokeColor: "#FF0000",
				strokeOpacity: 0.8,
				strokeWeight: 2,
				fillColor: "#FF0000",
				fillOpacity: 0.35,
			});
			
			overlay.bounds_ = bounds;
			overlay.textValue_ = countRestaurants();
			overlay.setMap(null);
			overlay.setMap(map);
			
			// listen to changes
			["bounds_changed", "dragend"].forEach((eventName) => {
				rectangle.addListener(eventName, () => {
					let count = countRestaurants();
					if (count > 0) {
						overlay.bounds_ = new google.maps.LatLngBounds(rectangle.getBounds().getNorthEast(), rectangle.getBounds().getSouthWest());
						overlay.textValue_ = count;
						overlay.setMap(null);
						overlay.setMap(map);
					}
				});
			});
		});	
	}	
}

function countRestaurants() {
	let count = 0;
	markers.forEach(function (marker, index) {
		if (marker.getMap() != undefined && rectangle.getBounds().contains(marker.getPosition()) === true) {
			count++;
		}
	});
	return count;
}

function directions(lat, lng) {
	navigator.geolocation.getCurrentPosition((position) => {
		const startLocation = {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
		};
		  
		const endLocation = {
			lat: lat, 
			lng: lng
		}
	
		const directionsService = new google.maps.DirectionsService();
		const directionsRenderer = new google.maps.DirectionsRenderer();

		directionsService.route({
			origin: startLocation,
			destination: endLocation,
			travelMode: google.maps.TravelMode.DRIVING
		}, function(response, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				directionsRenderer.setDirections(response);
				directionsRenderer.setMap(map);
			}
		})
	});
}

function visited() {
	alert('visited');
}