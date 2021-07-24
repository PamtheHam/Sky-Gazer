var modalEl = document.querySelector(".modal");
var modalCloseButton = document.querySelector(".modal-close");
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
    // Fetch list of all repos for the node.js organization
    var requestUrl = "https://api.spectator.earth/satellite";

    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            //Loop through data to pull out name and norad id of satellite
            for (var i = 0; i < data.features.length; i++) {
                //Push satellite name/norad id into empty array
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

    // If user inputs city,
    if (cityInputEl.value) {
        fetchLatLon(cityInputEl.value);
    } 
    // Else display modal prompting user to input city
    else {
        modalEl.classList.add("is-active");
        modalCloseButton.addEventListener("click", closeModal)
    }
}

function closeModal() {
    modalEl.classList.remove("is-active");
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

                var localSatellite = data[i].culmination.utc_datetime
                var passDateTime = moment.utc(localSatellite).local().format('MMM-Do-YYYY h:mm A')
                dateTimePasses.push(passDateTime);

            }

            renderSatellitePasses(numberPasses, dateTimePasses, data, weatherData);
        })
}

// Render satellite pass information to page
function renderSatellitePasses(numberPasses, dateTimePasses, data, weatherData) {
    // Empty out satellite passes container
    satellitePassesContainerEl.innerHTML = "";

    // Render number of satellite passes within next 7 days for chosen norad id
    var satelliteNumber = document.createElement("p");
    satelliteNumber.textContent = numberPasses;
    satellitePassesContainerEl.appendChild(satelliteNumber);

    // Loop through number of satellite passes
    for (var i = 0; i < dateTimePasses.length; i++) {
        var satellitePasses = document.createElement("p");
        var weatherIcon = document.createElement("img");

        // Change satellite date/time into local date/time
        var localSatellite = data[i].culmination.utc_datetime;
        passDate = moment.utc(localSatellite).local().format('MMM-Do-YYYY');

        // Loop through forecast data
        for (var j = 0; j < 8; j++) {
            // Change weather date/time to local date/time
            var weatherTime = weatherData.daily[j].dt;
            var unixToUTC = moment.unix(weatherTime);
            weatherLocalTime = moment(unixToUTC).format('MMM-Do-YYYY');

            // If weather and satellite pass date/time match,
            if (weatherLocalTime === passDate) {
                // If forecast is clear, render "visible"
                if (weatherData.daily[j].weather[0].main === "Clear") {
                    satellitePasses.textContent = dateTimePasses[i] + " Visible";
                }
                // If forecast is anything other than clear, render "not visible"
                else {
                    satellitePasses.textContent = dateTimePasses[i] + " Not visible";
                }

                // Render weather forecast icon
                weatherIcon.setAttribute("src", "https://openweathermap.org/img/wn/" + weatherData.daily[j].weather[0].icon + "@2x.png");
            }
        }

        satellitePassesContainerEl.appendChild(satellitePasses);
        satellitePasses.appendChild(weatherIcon);
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

init();