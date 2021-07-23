var satelliteContainerEl = document.querySelector("#satellite-container");
var cityInputEl = document.querySelector("#city-input");
var satellitePassesContainerEl = document.querySelector(".satellite-passes-container");

const currentDate = moment();
var lat = 0;
var lon = 0;
var satelliteName = [];
var norad = [];
var noradid;
var passDate;
var weatherLocalTime;

function init() {
    getNorad();
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
            //   loop to cycle through the data to pull out name and Nordad_ID of sattelite.
            for (var i = 0; i < data.features.length; i++) {
                // pushing sat name and norad_id into emtpy array.
                satelliteName.push(data.features[i].properties.name);
                norad.push(data.features[i].properties.norad_id);
            }

            renderNoradIDs();
        });
}

// Render norad IDs to page
function renderNoradIDs() {
    for (var i = 0; i < norad.length; i++) {
        var satelliteButton = document.createElement("button");
        satelliteButton.setAttribute("class", "norad-id-button");
        satelliteButton.setAttribute("data-id", norad[i]);
        satelliteButton.textContent = satelliteName[i] + " " + norad[i];
        satelliteContainerEl.appendChild(satelliteButton);

        // Add event listeners to each satellite button
        satelliteButton.addEventListener("click", handleClick);
    }
}

function handleClick(event) {
    noradid = event.target.getAttribute("data-id");

    fetchLatLon(cityInputEl.value);
}

// Fetch satellite pass information of given norad ID: number of passes, time/date of passes
function satellitePasses(noradid, lat, lon, weatherData) {
    var otherUrl = "https://satellites.fly.dev/passes/" + noradid + "?lat=" + lat + "&lon=" + lon + "&limit=100&days=7&visible_only=true";

    fetch(otherUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Number of passes
            var numberPasses = data.length;

            // Date/time of passes
            var dateTimePasses = [];
            for (var i = 0; i < data.length; i++) {

                var localSattelite = data[i].culmination.utc_datetime
                var passDateTime = moment.utc(localSattelite).local().format('MMM-Do-YYYY h:mm A')
                dateTimePasses.push(passDateTime);

            }

            renderSatellitePasses(numberPasses, dateTimePasses, data, weatherData);
        })
}

// Render satellite pass information to page
function renderSatellitePasses(numberPasses, dateTimePasses, data, weatherData) {
    var satelliteNumber = document.createElement("p");
    satelliteNumber.textContent = numberPasses;
    satellitePassesContainerEl.appendChild(satelliteNumber);

    for (var i = 0; i < dateTimePasses.length; i++) {
        var satellitePasses = document.createElement("p");

        var localSattelite = data[i].culmination.utc_datetime;
        passDate = moment.utc(localSattelite).local().format('MMM-Do-YYYY');

        for (var j = 0; j < 8; j++) {
            console.log(weatherData.daily[j]);

            var weatherTime = weatherData.daily[j].dt;
            var unixToUTC = moment.unix(weatherTime);
            weatherLocalTime = moment(unixToUTC).format('MMM-Do-YYYY');
            console.log(weatherLocalTime);
            console.log(passDate);

            if (weatherLocalTime === passDate) {
                if (weatherData.daily[j].weather[0].main === "Clear") {
                    satellitePasses.textContent = dateTimePasses[i] + " Visible";
                } else {
                    satellitePasses.textContent = dateTimePasses[i] + " Not visible";
                }
            }
        }

        satellitePassesContainerEl.appendChild(satellitePasses);
    }
}

// Convert user input (city) to lat/lon
function fetchLatLon(cityInput) {
    fetch("https://api.openweathermap.org/geo/1.0/direct?q=" + cityInput + "&limit=1&appid=c8aa884e6f28d929f55e9ba1856815bd")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            lat = data[0].lat;
            lon = data[0].lon;

            fetchWeather(lat, lon, satellitePasses);
        })
}

// Fetch weather data using lat/lon and date
function fetchWeather(lat, lon, cb) {
    fetch("https://api.openweathermap.org/data/2.5/onecall?lat=" + lat + "&lon=" + lon + "&exclude=minutely,hourly,alerts&units=imperial&appid=c8aa884e6f28d929f55e9ba1856815bd")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Get weather icon
            console.log(data);
            console.log(data.daily[0].dt);

            cb(noradid, lat, lon, data);
        })
}

// Render weather icon

// Check if all conditions (weather, sun illumination) are favorable for viewing
// If favorable,
// Render "visible"

// If not favorable,
// Render "not visible"

// Render how many satellite passes for chosen norad ID

init();