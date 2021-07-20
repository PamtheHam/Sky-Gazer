var satelliteContainerEl = document.querySelector("#satellite-container");

const currentDate = moment();
var lat = 0;
var lon = 0;
var satelliteName = [];
var norad = [];

function init() {
    getNorad();
    fetchLatLon("Raleigh");
}

// Fetch all norad-IDs
function getNorad() {
    // fetch request gets a list of all the repos for the node.js organization
    var requestUrl = "https://api.spectator.earth/satellite";

    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            console.log(data.features);

            //   loop to cycle through the data to pull out name and Nordad_ID of sattelite.
            for (var i = 0; i < data.features.length; i++) {
                // pushing sat name and norad_id into emtpy array.
                satelliteName.push(data.features[i].properties.name);
                norad.push(data.features[i].properties.norad_id);
            }
            for (var i = 0; i < norad.length; i++) {
                satellitePasses(norad[i], lat, lon);
            }

            renderNoradIDs();
        });
}

// Render to page
function renderNoradIDs() {
    // Add event listener to each norad-ID element
    // Get selected norad-ID
    for (var i = 0; i < norad.length; i++) {
        var satelliteButton = document.createElement("button");
        satelliteButton.setAttribute("class", "norad-id-button");
        satelliteButton.textContent =  satelliteName[i] + " " + norad[i];
        satelliteContainerEl.appendChild(satelliteButton);
    }
}

function satellitePasses(noradid, lat, lon) {
    console.log(noradid);
    var otherUrl = "https://satellites.fly.dev/passes/" + noradid + "?lat=" + lat + "&lon=" + lon + "&limit=100&days=7&visible_only=true"
    console.log(otherUrl);

    fetch(otherUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
        })
}

console.log(satelliteName);
console.log(norad);

// Get user input: city, norad-ID
// Convert user input (city) to lat/lon
function fetchLatLon(cityInput) {
    fetch("https://api.openweathermap.org/geo/1.0/direct?q=" + cityInput + "&limit=1&appid=c8aa884e6f28d929f55e9ba1856815bd")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            lat = data[0].lat;
            lon = data[0].lon;

            fetchWeather(lat, lon);
        })
}

// Fetch satellite data using lat/lon, norad-ID
// Render next X satellites to page as buttons

// Add event listeners to each satellite button
// Fetch weather data using lat/lon and date
function fetchWeather(lat, lon) {
    fetch("https://api.openweathermap.org/data/2.5/onecall?lat=" + lat + "&lon=" + lon + "&exclude=minutely,hourly,alerts&units=imperial&appid=c8aa884e6f28d929f55e9ba1856815bd")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Get weather icon
            console.log(data);
        })
}

// Render weather icon

// Check if all conditions (weather, sun illumination) are favorable for viewing
// If favorable,
// Render "visible"

// If not favorable,
// Render "not visible"

init();