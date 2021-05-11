let map, heatmap;
let markersEnabled = true;
let markersToRender = [];
const locationData = parseCSV(data);
const sortedData = locationData.sort(
  (a, b) => parseFloat(b.quantity) - parseFloat(a.quantity)
);

function parseCSV(data) {
  let lines = data.split("\n");
  let headers = lines[0].split(",");

  var result = lines.slice(1).map((line) => {
    var obj = {};
    let currentLine = line.split(",");

    headers.forEach((header, index) => {
      obj[header] = currentLine[index];
    });
    return obj;
  });
  return result;
}

function toggleHeatmap() {
  heatmap.setMap(heatmap.getMap() ? null : map);
}

function togglePins() {
  markersEnabled = markersEnabled ? false : true;
  markersToRender.forEach((marker) => {
    marker.setMap(marker.getMap() ? null : map);
  });
}

// Function to handle quantity slider
function changeMaxRange(value) {
  let maxQuantity = sortedData[0].quantity;
  let minQuantity = sortedData[sortedData.length - 1].quantity;
  heatmap.setData(getWeightedPoints(minQuantity, maxQuantity, value));
  document.getElementById("sliderLabel").innerHTML = value;
}

// Dynamically changes pin colour based on quantity
// Green = less
// Red = more
function getColour(value) {
  var hue = ((1 - value) * 120).toString(10);
  return [`hsl(${hue}, 100%, 50%)`].join("");
}

// Calculate weight based on quantity of each point
function getWeightedPoints(minQuantity, maxQuantity, value) {
  var locations = sortedData.map((element) => {
    if (element.quantity <= value) {
      let percent =
        ((element.quantity - minQuantity) / (maxQuantity - minQuantity)) * 100;
      return {
        location: new google.maps.LatLng(element.latitude, element.longitude),
        weight: percent < 1 ? 1 : percent,
      };
    }
  });
  return locations;
}

function initSlider(minQuantity, maxQuantity) {
  document.getElementById("slider").setAttribute("max", maxQuantity);
  document.getElementById("slider").setAttribute("min", minQuantity);
  document.getElementById("slider").setAttribute("value", maxQuantity);
  document.getElementById("sliderLabel").innerHTML = maxQuantity;
}

function getMarkerIcon(qty, min, max) {
  let percent = (qty - min) / (max - min);
  let svgMarker = {
    path:
      "M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z",
    fillColor: getColour(percent),
    fillOpacity: 1,
    strokeWeight: 0,
    rotation: 0,
    scale: 2,
    anchor: new google.maps.Point(15, 30),
  };
  return svgMarker;
}

function initMap() {
  let maxQuantity = sortedData[0].quantity;
  let minQuantity = sortedData[sortedData.length - 1].quantity;
  const gradient = [
    "rgba(1, 0, 255, 0)",
    "rgba(138, 0, 230, 1)",
    "rgba(221, 0, 172, 1)",
    "rgba(243, 0, 143, 1)",
    "rgba(255, 0, 114, 1)",
    "rgba(255, 0, 88, 1)",
    "rgba(255, 0, 63, 1)",
    "rgba(255, 0, 38, 1)",
    "rgba(255, 0, 0, 1)",
  ];
  const greyMap = [
    {
      featureType: "all",
      elementType: "all",
      stylers: [{ lightness: -10 }],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative",
      elementType: "all",
      stylers: [{ saturation: -100 }],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "landscape",
      elementType: "all",
      stylers: [{ saturation: -100, lightness: -10 }],
    },
    {
      featureType: "road",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "water",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ];
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    center: { lat: 37.775, lng: -122.434 },
    mapTypeControlOptions: {
      mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain", "grey"],
    },
  });
  map.mapTypes.set(
    "grey",
    new google.maps.StyledMapType(greyMap, { name: "Grey Map" })
  );
  map.setMapTypeId("grey");

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: getWeightedPoints(minQuantity, maxQuantity, maxQuantity),
    radius: 15,
    map: map,
    gradient: gradient,
  });

  
  markers = sortedData.map((element) => {
    let infoWindow = new google.maps.InfoWindow();
    infoWindow.setContent(`<strong>Name:</strong> ${element.name}<br /><strong>ID:</strong> ${element.id}<br /><strong>Quantity:</strong> ${parseFloat(element.quantity).toFixed(2)}`
    );
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(element.latitude, element.longitude),
      title: parseFloat(element.quantity).toFixed(0),
      map: null,
    });
    marker.addListener("mouseover", (_) => {
      infoWindow.open(map, marker);
    });
    marker.addListener("mouseout", (_) => {
      infoWindow.close();
    });
    return marker;
  });

  google.maps.event.addListener(map, "bounds_changed", (_) => {
    markersToRender = markers.filter((marker) => {
      marker.setMap(null);
      return map.getBounds().contains(marker.position);
    });
    markersToRender.length =
      markersToRender.length > 100 ? 100 : markersToRender.length;

    if (markersToRender.length >= 1) {
      maxMarker = markersToRender[0].title;
      minMarker = markersToRender[markersToRender.length - 1].title;

      markersToRender.forEach((marker) => {
        marker.setIcon(getMarkerIcon(marker.getTitle(), minMarker, maxMarker));
        marker.setZIndex(parseFloat(marker.getTitle()));
        marker.setMap(markersEnabled ? map : null);
      });
    }
  });
  initSlider(minQuantity, maxQuantity);
}
