const counter = document.getElementById('place-count');

const loader = document.getElementById('loader');

const searchButton = document.getElementById('search-button');

const banner = document.getElementById('advice');

var searchInput = document.getElementById('search-input');

var searchResults = document.getElementById('search-results');

var closeButton = document.querySelector('.close');

// Function to initialize map using Leaflet.js library and Stadia Maps
function mapInitialize() {
    // Center Map on the Philippines
    map = L.map('map').setView([12.8797, 121.774], 5);
    // Style URL format in XYZ PNG format
    L.tileLayer(`https://tiles.stadiamaps.com/styles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${stadiaAPI}`, {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    }).addTo(map);
    // Remove default zoom control
    map.removeControl(map.zoomControl);
    // Limit the map view to cover only the Philippines
    map.setMaxBounds([[4.5, 116], [20, 127.5]]);
    map.setMinZoom(5.2);

    return map;
}

// Function to fetch municipalities data using Overpass API
async function fetchMunicipalities() {
    var url = overPassAPI;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch municipality data');
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
                throw new Error('No municipality data received from Overpass API');
            }
        })
        .catch(error => {
            console.error('Error fetching municipality data:', error.message);
            return null;
        });
}

// Function to display municipality markers on the map
function displayMarkers() {
    // Get municipalities data
    fetchMunicipalities()
        .then(places => {
            placesList = places;
            if (places && places.length > 0) {
                places.forEach(place => {
                    // Add a marker for the municipality
                    var marker = L.marker([place.lat, place.lon]).addTo(map);

                    // Bind a popup to the marker with loading message
                    marker.bindPopup("Loading...");
                    
                    // Add a click event listener to the marker
                    markerOnClick(place, marker);
                });
                // Display count
                counter.textContent = places.length;
                loader.classList.toggle('d-none');
            } else {
                console.error('No municipality data available');
                counter.textContent = 0;
                loader.classList.toggle('d-none');
            }
        });
}

// Function to add click listner to a marker
function markerOnClick(place, marker) {
    marker.on('click', function (e) {
        // Fetch weather data for the municipality
        fetchWeatherData(place.lat, place.lon)
            .then(weatherData => {
                if (weatherData) {
                    // Update the popup content with heat index data
                    marker.setPopupContent("<div class='popup-content'><strong>" + place.name + "</strong><br>Air Temperature: " + weatherData.temperature + "°C<br>Relative Humidity: " + weatherData.humidity + "%<br>Heat Index: " + weatherData.heatIndex + "°C</div>");
                    // Update advice banner and show
                    banner.innerHTML = '';
                    banner.innerHTML = getHeatIndexAdvice(weatherData.heatIndex);
                    banner.classList.remove('hidden');
                    closeButtonOnClick();
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
}

// Function to fetch weather data from OpenWeatherMap using latitude and longitude of a municipality
async function fetchWeatherData(latitude, longitude) {
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
            var heatIndex = calculateHeatIndex(temperature, humidity); // Calculated Heat index in Celcius
            return { temperature, humidity, heatIndex };
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            return null;
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

// Function to get advice about heat index
function getHeatIndexAdvice(heatIndex) {
    let title, advice;
    if (heatIndex >= 27 && heatIndex < 32) {
        title = "Heat Index is Elevated";
        advice = "Be sure to drink plenty of water to stay hydrated, and take breaks in shaded or air-conditioned areas.";
    } else if (heatIndex >= 32 && heatIndex < 37) {
        title = "Heat Index is High";
        advice = "Drink plenty of fluids, wear lightweight and loose-fitting clothing, and avoid prolonged exposure to the sun.";
    } else if (heatIndex >= 37 && heatIndex < 41) {
        title = "Heat Index is Very High";
        advice = "Limit outdoor activities, stay indoors during the hottest part of the day, and use fans or air conditioning to keep cool.";
    } else if (heatIndex >= 41 && heatIndex < 46) {
        title = "Heat Index is Extremely High";
        advice = "Avoid outdoor activities if possible, stay hydrated by drinking water or electrolyte-rich beverages, and seek shade or air-conditioned spaces.";
    } else if (heatIndex >= 46) {
        title = "Extreme Heat Index";
        advice = "Stay indoors in air-conditioned spaces as much as possible, avoid strenuous activities, and check on elderly or vulnerable individuals who may be more susceptible to heat-related illnesses.";
    } else {
        title = "Heat Index is within Comfortable Levels";
        advice = "Enjoy your day, but remember to stay hydrated and protect your skin from the sun!";
    }

    // Construct HTML structure
    const html = `
        <section class="d-flex justify-content-between">
            <h2>${title}</h2>
            <span class="material-symbols-sharp close">close</span>
        </section>
        <p class="lead fs-5">${advice}</p>
    `;

    return html;
}

// Function for close button in advice banner click event
function closeButtonOnClick() { 
    closeButton = document.querySelector('.close');
    closeButton.addEventListener("click", () => {
        banner.classList.add('hidden');
    });
}

// Function to filter search results and get only the top 5
function filterPlacesList(query) {
    const length = query.length;
    const filteredResults = placesList.filter(place => place.name.toLowerCase().startsWith(query.toLowerCase()));
    return filteredResults.slice(0, 5); // Return only the top 5 results
}

// Function to search for a location using the search button
function searchLocation() {
    try {
        var firstResult = document.querySelector('.result');
        if (!firstResult) {
            throw new Error('No results found.');
        }
        locateMarker(firstResult);
    } catch (error) {
        alert(error.message);
    }
}

// Function to locate a marker based on the search result
function locateMarker(result) {
    // Center the map on the marker
    map.setView([result.dataset.lat, result.dataset.lon], 13);
    
    // Find the corresponding marker on the map
    map.eachLayer(function (layer) {
        // Check if the layer is a marker
        if (layer instanceof L.Marker) {
            // Get the marker's coordinates
            var markerLatLng = layer.getLatLng();
            
            // Compare coordinates within a tolerance (e.g., 0.000001)
            if (Math.abs(markerLatLng.lat - parseFloat(result.dataset.lat)) < 0.000001 &&
                Math.abs(markerLatLng.lng - parseFloat(result.dataset.lon)) < 0.000001) {
                // Programmatically trigger a click event on the marker
                layer.fireEvent('click', { originalEvent: { preventDefault: function() {}, stopPropagation: function() {} } });
                return; // Exit the loop once the marker is found and clicked
            }
        }
    });
}

// Function to display search results
function displaySearchResults(results) {
    searchResults = document.getElementById('search-results');
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
        locateMarker(this);
        // Clear previous results
        searchInput.value = '';
        searchResults.innerHTML = '';
    });
}