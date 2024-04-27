var placesList = [];
var map;
//OpenWeatherMap API key
const OWMapiKey = 'c1a94de6eb452edf764a17ba18b411f0';
//Overpass API
const  overPassAPI = 'https://overpass-api.de/api/interpreter?data=[out:json];area["ISO3166-1"="PH"]->.boundaryarea;(node(area.boundaryarea)["place"="city"];node(area.boundaryarea)["place"="town"];);out;';
//Stadiamaps API key
const stadiaAPI = 'b255a503-56c2-4d0d-b55f-08a2e8ed5a71';




