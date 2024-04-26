const counter = document.getElementById('place-count');

const searchInput = document.getElementById('search-input');

const searchButton = document.getElementById('search-button');

const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', function(){
    var query = searchInput.value.trim();
    const length = query.length;
    if (length > 0) {
        var filteredResults = filterPlacesList(query);
        displaySearchResults(filteredResults);
    }
    else {
        // Clear previous results
        searchResults.innerHTML = '';
    }
});

// Execute a function when the user presses a key on the keyboard
searchInput.addEventListener("keypress", function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        searchButton.click();
    }
});

searchButton.addEventListener( 'click' ,function() {
    searchLocation();
    searchResults.innerHTML = '';
    searchInput.value = '';
});