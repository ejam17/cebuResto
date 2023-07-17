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
let infowindow;
let searchLocationMarker;
let barChartObject;
let storeHours = ['9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm'];
let barColors = ["green"];
let barChart = document.getElementById('myChart');
let directionsService;
let directionsRenderer;

function initMap() {
	const cebu = new google.maps.LatLng(10.314205199853188, 123.89325016711014);
	searchCenter = cebu;
	// Create the map.
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: cebu,
    });
  
	infowindow = new google.maps.InfoWindow();
	directionsService = new google.maps.DirectionsService();
	directionsRenderer = new google.maps.DirectionsRenderer();

	// Create the search box and link it to the UI element.
	const input = document.getElementById("pac-input");
	const searchBox = new google.maps.places.SearchBox(input);

	map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
	// Bias the SearchBox results towards current map's viewport.
	map.addListener("bounds_changed", () => {
		searchBox.setBounds(map.getBounds());
	});
	
	searchBox.addListener("places_changed", () => {
		// clear old location
		if (searchLocationMarker) {
			searchLocationMarker.setMap(null);
		}

		const places = searchBox.getPlaces();
		if (places.length == 0) {
		  alert("No results found in search");
		} else if (places.length > 1) {
			alert("Please select only one location from search");
		} else {
			// Create new marker if searched location matches 1 item
			searchLocationMarker = new google.maps.Marker({
			  map,
			  name: places[0].name,
			  position: places[0].geometry.location,
			});
			
			searchLocationMarker.addListener("click", () => {
				infowindow.setContent(`<h2>Searched Location</h2><p><b>${searchLocationMarker.name}</b></p>`);
				infowindow.open(map, searchLocationMarker);
				map.panTo(searchLocationMarker.getPosition());
			});

			new google.maps.event.trigger( searchLocationMarker, 'click' );
		}
	});
	
	google.maps.event.addListener(infowindow, 'closeclick', function() {
	   barChart.style.display = 'none';
	});
	
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
		  this.div_.style.position = "relative";
		  const p = document.createElement("p");
		  p.style.fontSize = "50px";
		  p.style.color = "blue";
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
			//this.div_.style.left = sw.x + "px";
			//this.div_.style.top = ne.y + "px";
			this.div_.style.left = ne.x - ((ne.x - sw.x)/2) + "px";
			this.div_.style.top = sw.y - ((sw.y - ne.y)/2) + "px";
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

	overlay = new USGSOverlay(new google.maps.LatLngBounds(), '');
	
	barChart.style.display = "none";
}

function setMarkers(marker) {
    var markerMap = marker.geometry.coordinates;
    markerMap = new google.maps.Marker({
        position: new google.maps.LatLng(markerMap[1], markerMap[0]),
        name: marker.name,
		visit: marker.visits,
		type: marker.category,
		peakHours: marker.peakHours,
        map: map,
		index: markers.length,
    });

    markers.push(markerMap);

	markerMap.addListener("click", () => {
		const lat = markerMap.position.lat();
		const lng = markerMap.position.lng();
		const divContent = `
		<h2>${markerMap.name}</h2>
		<p><b>Specialty:</b> ${markerMap.type}</p>
		<p><b>Visits:</b> ${markerMap.visit}<br/></p>
		<input type="button" value="Directions" onClick="directions(${lat}, ${lng})"/>
		<input type="button" value="Visited" onClick="visited(${markerMap.index})"/>
		`;
		
		infowindow.setContent(divContent);
	    infowindow.open(map, markerMap);
	    map.panTo(markerMap.getPosition());
		drawPeakHours(markerMap.index);
	});
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
		const currentLocation = {
			lat: map.getCenter().lat(),
			lng: map.getCenter().lng(),
		};

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
				} else if (overlay != undefined && overlay.getMap() != undefined && count == 0) {
					overlay.setMap(null);
				}
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
	
	if (searchLocationMarker && searchLocationMarker.getMap() != null) {
		const startLocation = {
			lat: searchLocationMarker.getPosition().lat(),
			lng: searchLocationMarker.getPosition().lng(),
		};
		  
		const endLocation = {
			lat: lat, 
			lng: lng
		}

		directionsService.route({
			origin: startLocation,
			destination: endLocation,
			travelMode: google.maps.TravelMode.DRIVING
		}, function(response, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				directionsRenderer.setDirections(response);
				directionsRenderer.setMap(map);
			} else if (status === "ZERO_RESULTS") {
				console.clear();
				alert('No Routes Found');
			}
		});
	} else {
		alert("No source address");
	}
}

function visited(marketIndex) {
	markers[marketIndex].visit += 1;
	infowindow.close();
	new google.maps.event.trigger( markers[marketIndex], 'click' );
}

function drawPeakHours(marketIndex) {
	barChart.style.display = 'block';
	if (barChartObject) {
		barChartObject.destroy();
	}

	barChartObject = new Chart(barChart, {
	  type: "bar",
	  data: {
		labels: storeHours,
		datasets: [{
		  label: 'Peak Hours',
		  backgroundColor: barColors,
		  data: markers[marketIndex].peakHours
		}]
	  },
	  options: {
		scales: {
		  x: {
			grid: {
			  color: 'black',
			  display: false
			}
		  },
		  y: {
		  ticks: {
				display: false
			},
			grid: {
			color: 'black',
			  display: false
			}
		  }
		},
		legend: {display: false}
	  }
	});
}