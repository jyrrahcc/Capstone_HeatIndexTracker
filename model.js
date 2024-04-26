var placesList = [];

//OpenWeatherMap API key
const OWMapiKey = 'c1a94de6eb452edf764a17ba18b411f0';

// Centered on the Philippines
var map = L.map('map').setView([12.8797, 121.774], 6);

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Remove default zoom control
map.removeControl(map.zoomControl);

// Limit the map view to cover only the Philippines
map.setMaxBounds([[4.5, 116], [20, 127.5]]);
map.setMinZoom(5.2);

// Nominatim API
function fetchPlaceInfo(latitude, longitude) {
    var url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&bounded=1&viewbox=116,4.5,127.5,20&polygon_geojson=1&feature=city&feature=town`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch city information');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.display_name) {
                const displayName = data.display_name;
                return displayName;
            } else {
                throw new Error('No city and municipality data received from Nominatim API');
            }
        })
        .catch(error => {
            console.error('Error fetching city information:', error.message);
            return null; // Return null or handle the error accordingly
        });
}

// Overpass API
function fetchCitiesAndMunicipalities() {
    var url = 'https://overpass-api.de/api/interpreter?data=[out:json];area["ISO3166-1"="PH"]->.boundaryarea;(node(area.boundaryarea)["place"="city"];node(area.boundaryarea)["place"="town"];);out;';

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch city and municipality data');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.elements && data.elements.length > 0) {
                return data.elements.filter(element => element.tags && element.tags.name).map(place => {
                    const name = place.tags.name;
                    return { name: name, lat: place.lat, lon: place.lon };
                });
            } else {
                throw new Error('No city and municipality data received from Overpass API');
            }
        })
        .catch(error => {
            console.error('Error fetching city and municipality data:', error.message);
            return null; // Return null or handle the error accordingly
        });
}

// Function to fetch weather data from OpenWeatherMap using latitude and longitude
function fetchWeatherData(latitude, longitude) {
    var url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OWMapiKey}&units=metric`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            return response.json();
        })
        .then(data => {
            var temperature = data.main.temp; // Temperature in Celsius
            var humidity = data.main.humidity; // Relative humidity in percent
            var heatIndex = calculateHeatIndex(temperature, humidity);
            console.log(heatIndex, temperature, humidity);
            return { temperature, humidity, heatIndex };
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            return null; // Return null or handle the error accordingly
        });
}

// Function to calculate heat index
function calculateHeatIndex(tempCelsius, humidity) {
    // Convert temperature to Fahrenheit for the formula
    let tempFahrenheit = (tempCelsius * 9/5) + 32;

    // Calculate heat index in Fahrenheit
    let heatIndexF = -42.379 + 2.04901523 * tempFahrenheit + 10.14333127 * humidity - 0.22475541 * tempFahrenheit * humidity - 6.83783e-3 * tempFahrenheit * tempFahrenheit - 5.481717e-2 * humidity * humidity + 1.22874e-3 * tempFahrenheit * tempFahrenheit * humidity + 8.5282e-4 * tempFahrenheit * humidity * humidity - 1.99e-6 * tempFahrenheit * tempFahrenheit * humidity * humidity;

    // If the heat index is less than the actual temperature, return the temperature
    if (heatIndexF < tempFahrenheit) {
        return tempCelsius;
    }

    // Convert heat index back to Celsius
    let heatIndexC = (heatIndexF - 32) * 5/9;

    // Round to one decimal place
    heatIndexC = Math.round(heatIndexC * 10) / 10;
    return heatIndexC;
}

// Function to search for a location
function searchLocation() {
    var firstResult = document.querySelector('.result');
    searchResult(firstResult);
}

// Function to search for a location
function searchResult(result) {
    map.setView([result.dataset.lat, result.dataset.lon], 12);
}

function filterPlacesList(query) {
    const length = query.length;
    const filteredResults = placesList.filter(place => place.name.toLowerCase().startsWith(query.toLowerCase()));
    return filteredResults.slice(0, 5); // Return only the top 5 results
}

function getHeatIndexAdvice(heatIndex) {
    if (heatIndex >= 27 && heatIndex < 32) {
        return "The heat index is elevated. Be sure to drink plenty of water to stay hydrated, and take breaks in shaded or air-conditioned areas.";
    } else if (heatIndex >= 32 && heatIndex < 37) {
        return "The heat index is high. Drink plenty of fluids, wear lightweight and loose-fitting clothing, and avoid prolonged exposure to the sun.";
    } else if (heatIndex >= 37 && heatIndex < 41) {
        return "The heat index is very high. Limit outdoor activities, stay indoors during the hottest part of the day, and use fans or air conditioning to keep cool.";
    } else if (heatIndex >= 41 && heatIndex < 46) {
        return "The heat index is extremely high. Avoid outdoor activities if possible, stay hydrated by drinking water or electrolyte-rich beverages, and seek shade or air-conditioned spaces.";
    } else if (heatIndex >= 46) {
        return "Extreme heat index. Stay indoors in air-conditioned spaces as much as possible, avoid strenuous activities, and check on elderly or vulnerable individuals who may be more susceptible to heat-related illnesses.";
    } else {
        return "The heat index is within comfortable levels. Enjoy your day, but remember to stay hydrated and protect your skin from the sun!";
    }
}


// Function to display search results
function displaySearchResults(results) {
    
    const searchResults = document.getElementById('search-results');
    // Clear previous results
    searchResults.innerHTML = '';
    // Display new results
    results.forEach(result => {
        var listItem = document.createElement('div');
        listItem.classList.add('result');
        listItem.textContent = result.name;
        listItem.setAttribute('data-lat', result.lat);
        listItem.setAttribute('data-lon', result.lon);
        searchResults.appendChild(listItem);
        addListenersResults(listItem);
    });
}

// Function to add event listeners to displayed ToDo cards
function addListenersResults(listItem) {
    listItem.addEventListener('click', function() {
        searchResult(this);
        const searchResults = document.getElementById('search-results');
    // Clear previous results
    searchResults.innerHTML = '';
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    });
}


    fetchCitiesAndMunicipalities()
        .then(places => {
            placesList = places;
            if (places && places.length > 0) {

                places.forEach(place => {
                   // Add a marker for the town
            var marker = L.marker([place.lat, place.lon]).addTo(map);

            // Bind a popup to the marker with loading message
            marker.bindPopup("<div class='popup-content'><strong>" + place.name + "</strong><br>Heat Index: Loading...</div>");

            // Add a click event listener to the marker
            marker.on('click', function (e) {
                // Fetch weather data for the town
                fetchWeatherData(place.lat, place.lon)
                    .then(weatherData => {
                        if (weatherData) {
                            // Update the popup content with weather data
                            marker.setPopupContent("<div class='popup-content'><strong>" + place.name + "</strong><br>Heat Index: " + weatherData.heatIndex + "°C</div>");
                        } else {
                            // If weather data is not available, show an error message
                            marker.setPopupContent("<div class='popup-content'>Weather data unavailable for " + place.name + "</div>");
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching weather data:', error);
                        // If an error occurs, show an error message in the popup
                        marker.setPopupContent("<div class='popup-content'>Error fetching weather data for " + place.name + "</div>");
                    });
            });
                });

                 // Display count
                document.getElementById('place-count').textContent = places.length;
                document.getElementById('loader').classList.toggle('d-none');
            } else {
                console.error('No city and municipality data available');
                document.getElementById('place-count').textContent = 0;
                document.getElementById('loader').classList.toggle('d-none');
            }
        });