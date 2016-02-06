var request = require('request');

// make a request to bing maps
URL = 'https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=redmond%2Cwa&wp.1=Issaquah%2Cwa&avoid=minimizeTolls&key=AsdaxrvLRHyT6eEvSGDY81S2y3_ifh10egwFAMzIOLtxv0ZlwkPE2yG7jMzXzVkp'

//Lets try to make a HTTPS GET request to modulus.io's website.
//All we did here to make HTTPS call is changed the `http` to `https` in URL.
function getRouteParams(url) {
request(url, function (error, response, body) {
    //Check for error
    if(error){
      return console.log('Error:', error);
    }

    //Check for right status code
    if(response.statusCode !== 200){
      return console.log('Invalid Status Code Returned:', response.statusCode);
    }
    //All is good. Print the body
    var data = JSON.parse(body);
    var important = data['resourceSets'][0]['resources'][0]
    var travelDurationTraffic = important['travelDurationTraffic'];
    var travelDistance = important['travelDistance'];
    var waypoints = important['routeLegs'][0]['itineraryItems'].map(function(value) {
      return value['maneuverPoint']['coordinates'];
    });
    var res = {'waypoints': waypoints,
            'travelDurationTraffic': travelDurationTraffic,
            'travelDistance': travelDistance};
    console.log(res);
    // console.log(travelDistance);
    // console.log(travelDurationTraffic);
});
}