var modalEl = document.querySelector(".modal");
var modalCloseButton = document.querySelector(".modal-close");
var previousSatelliteContainerEl = document.querySelector("#previous-satellite");
var satelliteContainerEl = document.querySelector("#satellite-container");
var cityInputEl = document.querySelector("#city-input");
var satellitePassesContainerEl = document.querySelector(".satellite-passes-container");

const currentDate = moment();

var lat = 0;
var lon = 0;
var satelliteName = [];
var norad = [];
var passDate;
var weatherLocalTime;
var satellite;

function init() {
    getNorad();
    renderPreviousSatellite();
}

function renderPreviousSatellite() {
    var storedSatellite = JSON.parse(localStorage.getItem("satellite"));

    var previousSatelliteButton = document.createElement("button");
    previousSatelliteButton.setAttribute("class", "norad-id-button");
    previousSatelliteButton.setAttribute("data-id", storedSatellite.noradid);
    previousSatelliteButton.setAttribute("data-name", storedSatellite.name);
    previousSatelliteButton.textContent = storedSatellite.name + " " + storedSatellite.noradid;
    previousSatelliteContainerEl.appendChild(previousSatelliteButton);

    // Add event listener to satellite button
    previousSatelliteButton.addEventListener("click", handleClick);
}

// Fetch all norad-IDs
function getNorad() {
    // Fetch list of all repos for the node.js organization
    fetch("https://api.spectator.earth/satellite")
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
        satelliteButton.setAttribute("data-id", norad[i])
        satelliteButton.setAttribute("data-name", satelliteName[i]);
        satelliteButton.textContent = satelliteName[i] + " " + norad[i];
        satelliteContainerEl.appendChild(satelliteButton);

        // Add event listeners to each satellite button
        satelliteButton.addEventListener("click", handleClick);
    }
}

function handleClick(event) {
    satellite = {
        noradid: event.target.getAttribute("data-id"),
        name: event.target.getAttribute("data-name"),
    }

    // Save satellite name/norad id to local storage
    localStorage.setItem("satellite", JSON.stringify(satellite));

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
    fetch("https://satellites.fly.dev/passes/" + noradid + "?lat=" + lat + "&lon=" + lon + "&limit=100&days=7&visible_only=true")
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

    // Renders chosen satellite name
    var satelliteNameEl = document.createElement("p");
    satelliteNameEl.textContent = satellite.name;
    satelliteNameEl.innerHTML = (satellite.name).bold().fontsize(6);
    satellitePassesContainerEl.appendChild(satelliteNameEl);

    // Render number of satellite passes within next 7 days for chosen norad id
    var satelliteNumber = document.createElement("p");

    satelliteNumber.textContent = numberPasses + " Satellite passes in the next 7 days";
    satelliteNumber.innerHTML = (numberPasses + " Satellite passes in the next 7 days").bold().fontsize(6);

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
                  var Visible = " Visible"
                    satellitePasses.textContent = dateTimePasses[i] + Visible;
                    satellitePasses.innerHTML = dateTimePasses[i] + Visible.bold().fontsize(4).fontcolor("green");
                }
                // If forecast is anything other than clear, render "not visible"
                else {
                    var notVisible = " Not Visible"
                    satellitePasses.textContent = dateTimePasses[i] + notVisible;
                    satellitePasses.innerHTML = dateTimePasses[i] + notVisible.bold().fontsize(4).fontcolor("red");
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
            // Call satellitePasses()
            cb(satellite.noradid, lat, lon, data);
        })
}

init();