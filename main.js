var request = require('request');

// make a request to bing maps
URL = 'https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=redmond%2Cwa&wp.1=Issaquah%2Cwa&avoid=minimizeTolls&key=AsdaxrvLRHyT6eEvSGDY81S2y3_ifh10egwFAMzIOLtxv0ZlwkPE2yG7jMzXzVkp'

//Lets try to make a HTTPS GET request to modulus.io's website.
//All we did here to make HTTPS call is changed the `http` to `https` in URL.
request(URL, function (error, response, body) {
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
    var important = data['resourceSets'][0]['resources'][0]['routeLegs'][0];
    var startPoint = important['actualStart']['coordinates'];
    var startPoint = important['actualEnd']['coordinates'];
    var points = important['itineraryItems'].map(function(value) {
      return value['maneuverPoint'];
    });
    console.log(points);
    //console.log(data['authenticationResultCode']);
    //if (data.hasOwnProperty('authenticationResultCode')) {
    //  console.log("word");
    //}
    //for (var key in data) {
    //     console.log("key: "+key+", value: "+data[key]);
    //}

});