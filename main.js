var request = require('request');
var Promise = require('bluebird');
var fs = require('fs');
var express = require('express');
var app = express();
app.listen(6969)
// make a request to bing maps
//var mapURL = 'https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=tampa%2Cfl&wp.1=portland%2Cor&avoid=minimizeTolls&key=AvgjGasVLJPnwD6rCqCJLmg1Qt8a4kJiIoR6E66lJ2htQfVigyJ27WvVYHhG8YgR'

function getRouteParams(beginning, middle, end) {
  var mapURL;
  if (middle) {
    mapURL = 'https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0='+beginning+'&vwp.1='+middle+'&wp.2='+end+'&avoid=minimizeTolls&optimize=timeWithTraffic&key=AvgjGasVLJPnwD6rCqCJLmg1Qt8a4kJiIoR6E66lJ2htQfVigyJ27WvVYHhG8YgR';
  }
  else {
    mapURL = 'https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0='+beginning+'&wp.1='+end+'&avoid=minimizeTolls&optimize=timeWithTraffic&key=AvgjGasVLJPnwD6rCqCJLmg1Qt8a4kJiIoR6E66lJ2htQfVigyJ27WvVYHhG8YgR';
  }

  return new Promise(function(resolve, reject) {
    // POSSIBLE RUNTIME BOTTLENECK: too many waypoints
    request(mapURL, function (error, response, body) {
      //Check for error
      if(error){
        reject(error);

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
      //console.log(params)
      resolve(params);
    });
  });
}

function getNearbyRestaurants(lat, lng) {
  // var foursquareURL = 'https://api.foursquare.com/v2/venues/explore?ll='+lat+','+lng+'&section=food&limit=5oauth_token=AsSKpIwIftCSooG2C2GqXtK83nmSIj3IHfHN28vLJXYbVJ_p-x8Zs_3lm6ZBvu4k&v=20160206'
  var foursquareURL = 'https://api.foursquare.com/v2/venues/explore?ll='+lat+'%2C'+lng+'&section=food&radius=1500&limit=5&oauth_token=NPN00URCD44DLRMPRXQSZNOKCUQJS0L23UC0UGIYC4BHTKPY&v=20160206'
  //var bingURL = 'https://api.foursquare.com/v2/venues/explore?ll='+lat+'%2C'+lng+'&section=food&radius=2000&limit=5&oauth_token=L2BK0KGD3VN5FXF1QXUQZZEWNMXGFIBTSSACXU5KYEDLNIWL&v=20160205'
  return new Promise(function(resolve, reject) {
    request(foursquareURL, function (error, response, body) {
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
      return value['venue']

    });
    resolve(places);
  });
  });
}

function getAllNearbyRestaurantsAlongRoute(start, end) {
  return new Promise(function(resolve, reject) {
    return getRouteParams(start, '', end).then(function(routeParams) {
      var waypoints = routeParams['waypoints'];
      var list = [];
      for (var waypoint in waypoints) {
        var lat = waypoints[waypoint][0], lng = waypoints[waypoint][1];
        list.push(getNearbyRestaurants(lat, lng));
      };
      return Promise.all(list);
    }).then(function(result) {
      restaurants = {}
      for (var waypoint in result) {
        for (var restaurant in result[waypoint]) {
          var r = result[waypoint][restaurant]
            var name = r['name']
            var dist = r['location']['distance']
            if (name in restaurants) {
              if (dist < restaurants[name]['location']['distance']) {
                restaurants[name] = r;
              }
            }
            else {
              restaurants[name] = r;
            }
        }
      }
      var sortedArr = []
        keysSorted = Object.keys(restaurants).sort(function(a,b){return restaurants[a]['location']['distance'] - restaurants[b]['location']['distance']})
        for (var key in keysSorted) {
          sortedArr.push(restaurants[keysSorted[key]])
        }
      if (sortedArr.length > 20) {
        return resolve(sortedArr.slice(0, sortedArr.length - 1));
      }
      else {
        return resolve(sortedArr.slice(0,19));
      }
    });
  })
};

app.get('/', function(req, res) {
  var start = req.query.start,
  end = req.query.end

// check if there is a start and end
  getAllNearbyRestaurantsAlongRoute(start, end).then(function(restaurants) {
    res.send(restaurants);
  }) 
})