let map;
let service;
let InfoWindow;
let apiKey = 'AIzaSyBzTpa_mQx9dUhRJUQ2WUEzxs1nFZizMck';
let types = [];
let radius = 5500;
let searchCenter;
let baseType = [ 'restaurant' ];
let targetTypes = [];
let init = 0;
let markersArray = [];
var markers = [];

function initMap() {
	const cebu = new google.maps.LatLng(10.314205199853188, 123.89325016711014);
	searchCenter = cebu;
	// Create the map.
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: cebu,
	  //center: { lat: 44.5452, lng: -78.5389 },
	  //zoom: 9,
    });
  
	InfoWindow = new google.maps.InfoWindow();
	
	restaurants.forEach(function (restaurant, index) {
		setMarkers(restaurant);
		types = types.concat(restaurant.category);
	});
	
	createTypeList();
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

function searchRadius() {
	let searchRadius = this.document.getElementById("searchRadius").value;
    if(event.key === 'Enter') {
        navigator.geolocation.getCurrentPosition((position) => {
			const currentLocation = {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			};
			  
			// code here
			// create bounds (user must provide bounds position user location + square maybe
			//var bounds = new google.maps.LatLngBounds();
			//count = 0;
			//
			//markers.forEach(function (marker, index) {
			//	if (bounds.contains(marker.getPosition()) === true) {
			//		count++;
			//	}
			//});
			//
			console.log(currentLocation.lng);
			console.log(parseFloat(currentLocation.lng)+1);
			map.panTo(currentLocation);
			const bounds = {			
				north: parseFloat(currentLocation.lng)+1,
				south: parseFloat(currentLocation.lng)-1,
				east: parseFloat(currentLocation.lat)+1,
				west: parseFloat(currentLocation.lat)-1,
				//north: 44.599,
				//south: 44.49,
				//east: -78.443,
				//west: -78.649,
			  };
			  // Define a rectangle and set its editable property to true.
			  const rectangle = new google.maps.Rectangle({
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
			  ["bounds_changed", "dragstart", "drag", "dragend"].forEach((eventName) => {
				rectangle.addListener(eventName, () => {
				  console.log({ bounds: rectangle.getBounds()?.toJSON(), eventName });
				});
			  });
		});      
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