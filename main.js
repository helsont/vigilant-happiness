var request = require('request');
var Promise = require('bluebird');
// make a request to bing maps
var mapURL = 'https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=redmond%2Cwa&wp.1=Issaquah%2Cwa&avoid=minimizeTolls&key=AsdaxrvLRHyT6eEvSGDY81S2y3_ifh10egwFAMzIOLtxv0ZlwkPE2yG7jMzXzVkp'

function getRouteParams(url) {
  return new Promise(function(resolve, reject) {
    // POSSIBLE RUNTIME BOTTLENECK: too many waypoints
    request(url, function (error, response, body) {
      //Check for error
      if(error){
        reject(error);
        // return console.log('Error:', error);
      }

      //Check for right status code
      if(response.statusCode !== 200){
        reject(response);
        // return console.log('Invalid Status Code Returned:', response.statusCode);
      }
      //All is good. Print the body
      var data = JSON.parse(body);
      var important = data['resourceSets'][0]['resources'][0]
        var travelDurationTraffic = important['travelDurationTraffic'];
      var travelDistance = important['travelDistance'];
      var waypoints = important['routeLegs'][0]['itineraryItems'].map(function(value) {
        return value['maneuverPoint']['coordinates'];
      });


      params = {'waypoints': waypoints,
        'travelDurationTraffic': travelDurationTraffic,
        'travelDistance': travelDistance};
      resolve(params);
    });
  });
}

function getNearbyRestaurants(lat, lng) {
  var bingURL = 'https://api.foursquare.com/v2/venues/explore?ll='+lat+'%2C'+lng+'&section=food&radius=2000&limit=20&oauth_token=L2BK0KGD3VN5FXF1QXUQZZEWNMXGFIBTSSACXU5KYEDLNIWL&v=20160205'
  return new Promise(function(resolve, reject) {
    request(bingURL, function (error, response, body) {
    //Check for error
    if(error){
      reject(error);
      // return console.log('Error:', error);
    }
    //Check for right status code
    if(response.statusCode !== 200){
      // return console.log('Invalid Status Code Returned:', response.statusCode);
      reject(response);
    }
    //All is good. Print the body
    var data = JSON.parse(body);
    var important = data['response']['groups'][0]['items'];
    var places = important.map(function(value) {
      var venue = value['venue']
      return [venue['name'],
              venue['location']['distance'],
              venue['location']['lat'],
              venue['location']['lng']];
    });
    resolve(places);
  });
  });
}

function getAllNearbyRestaurants(locationURL) {
  restaurants = {};
  getRouteParams(mapURL).then(function(routeParams) {
    var waypoints = routeParams['waypoints'];
    for (var waypoint in waypoints) {
      
    }
  }).catch(function(error) {
    console.log(error);
  });
  // getRouteParams(mapURL).then(function(routeParams) {
  //   var allRestaurants = routeParams['waypoints'].map(function(value, idx) {
  //     var lat = value[0], lng = value[1];
  //     return getNearbyRestaurants(lat, lng);
  //   });
  //   return Promise.all(allRestaurants);
  // }).then(function(restaurantDetails) {
  //   console.log(restaurantDetails);
  //   return restaurantDetails;
  //   // console.log(allRestaurants);
  // }).catch(function(error) {
  //   console.log(error);
  // })
}
getAllNearbyRestaurants(mapURL);