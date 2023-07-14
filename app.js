let map;
let service;
let InfoWindow;
let types = [];
let radius = 5500;
let searchCenter;
let baseType = [ 'restaurant' ];
let rectangle;
let textOverlay;
var markers = [];

function initMap() {
	const cebu = new google.maps.LatLng(10.314205199853188, 123.89325016711014);
	searchCenter = cebu;
	// Create the map.
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: cebu,
    });
  
	TxtOverlay.prototype = new google.maps.OverlayView();
	InfoWindow = new google.maps.InfoWindow();
	
	restaurants.forEach(function (restaurant, index) {
		setMarkers(restaurant);
		types = types.concat(restaurant.category);
	});
	
	createTypeList();
}

function TxtOverlay(pos, txt, cls, map) {
  // Now initialize all properties.
  this.pos = pos;
  this.txt_ = txt;
  this.cls_ = cls;
  this.map_ = map;

  // We define a property to hold the image's
  // div. We'll actually create this div
  // upon receipt of the add() method so we'll
  // leave it null for now.
  this.div_ = null;

  // Explicitly call setMap() on this overlay
  this.setMap(map);
}

TxtOverlay.prototype.onAdd = function() {
  // Create the DIV and set some basic attributes.
  var div = document.createElement('DIV');
  div.className = this.cls_;
  div.innerHTML = this.txt_;

  this.div_ = div;
  var overlayProjection = this.getProjection();
  var position = overlayProjection.fromLatLngToDivPixel(this.pos);
  div.style.left = position.x + 'px';
  div.style.top = position.y + 'px';
  div.style.position = 'absolute';

  var panes = this.getPanes();
  panes.floatPane.appendChild(div);
}
TxtOverlay.prototype.draw = function() {
	var overlayProjection = this.getProjection();
	var position = overlayProjection.fromLatLngToDivPixel(this.pos);
	var div = this.div_;
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';
	div.style.position = 'absolute';
  }

TxtOverlay.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);
  this.div_ = null;
}
TxtOverlay.prototype.hide = function() {
  if (this.div_) {
	this.div_.style.visibility = "hidden";
  }
}

TxtOverlay.prototype.show = function() {
  if (this.div_) {
	this.div_.style.visibility = "visible";
  }
}

TxtOverlay.prototype.toggle = function() {
  if (this.div_) {
	if (this.div_.style.visibility == "hidden") {
	  this.show();
	} else {
	  this.hide();
	}
  }
}

TxtOverlay.prototype.toggleDOM = function() {
  if (this.getMap()) {
	this.setMap(null);
  } else {
	this.setMap(this.map_);
  }
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
}

function searchDimension() {
	if(event.key === 'Enter') {
		let searchDimension = this.document.getElementById("searchDimension").value;
		if (searchDimension != '') {
			navigator.geolocation.getCurrentPosition((position) => {
				const currentLocation = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};

				map.panTo(currentLocation);
				const bounds = {			
					north: parseFloat(currentLocation.lat)+parseFloat(searchDimension/100),
					south: parseFloat(currentLocation.lat)-parseFloat(searchDimension/100),
					east: parseFloat(currentLocation.lng)+parseFloat(searchDimension/100),
					west: parseFloat(currentLocation.lng)-parseFloat(searchDimension/100),
				  };
				// Define a rectangle and set its editable property to true.
				rectangle = new google.maps.Rectangle({
					bounds: bounds,
					map,
					editable: true,
					draggable: true,
					strokeColor: "#FF0000",
					strokeOpacity: 0.8,
					strokeWeight: 2,
					fillColor: "#FF0000",
					fillOpacity: 0.35,
				});
				
				// listen to changes
				["bounds_changed", "dragend"].forEach((eventName) => {
					rectangle.addListener(eventName, () => {
						let count = 0;
						//var bounds = new google.maps.LatLngBounds();
						markers.forEach(function (marker, index) {
							if (marker.getMap() != undefined && rectangle.getBounds().contains(marker.getPosition()) === true) {
								count++;
							}
						});
						customTxt = `<div>Restaurants in area: ${count}</div>`;
						textOverlay = new TxtOverlay(rectangle.getBounds(), customTxt, "customBox", map);
						this.document.getElementById("restoCount").innerHTML = "Restaurants in area: "+count;
					});
				});
			});
		} else {
			rectangle.setMap(null);
			textOverlay.setMap(null);
		}         
    }
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
