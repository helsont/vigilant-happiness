var request = require('request');
var Promise = require('bluebird');
var fs = require('fs');
var express = require('express');
var app = express();
var port = process.env.PORT || 5000
app.listen(port)

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
        console.log(error)
      }

      //Check for right status code
      if(response.statusCode !== 200){
        reject(response);
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
  // TODO: WE NEED AN API KEY FOR THIS !!!!!!!!!!!!!!!!!!!
  var foursquareURL = 'https://api.foursquare.com/v2/venues/explore?ll='+lat+'%2C'+lng+'&section=food&radius=1500&limit=5&oauth_token=BWMSGIL3SRZ5L1QMFLZCRFJYWSJGW4BNR1NINN2NTHTQ3GCR&v=20160206'
    return new Promise(function(resolve, reject) {
      request(foursquareURL, function (error, response, body) {
        //Check for error
        if(error){
          reject(error);
        }
        //Check for right status code
        if(response.statusCode !== 200){
          reject(response);
        }
        //All is good. Print the body
        var data = JSON.parse(body);
        //console.log(data)
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
      var capacityLimiter = parseInt(waypoints.length / 30)
      var list = [];
      var counter = 0
      //console.log('cap lim is ' + capacityLimiter)
      for (var waypoint in waypoints) {
        var lat = waypoints[waypoint][0], lng = waypoints[waypoint][1];
        if (capacityLimiter > 1) {
          if (counter % capacityLimiter == 0) {
            list.push(getNearbyRestaurants(lat, lng));
          }
        }
        else {
          list.push(getNearbyRestaurants(lat, lng));
        }
        counter += 1
      };
      //console.log(list.length)
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
      var keysSorted = Object.keys(restaurants).sort(function(a,b){return restaurants[a]['location']['distance'] - restaurants[b]['location']['distance']})
        for (var key in keysSorted) {
          sortedArr.push(restaurants[keysSorted[key]])
        }
      if (sortedArr.length < 20) {
        return resolve(sortedArr.slice(0, sortedArr.length - 1));
      }
      else {
        return resolve(sortedArr.slice(0,19));
      }
    });
  })
};

app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return next();
});

app.get('/', function(req, res) {
  var start = req.query.start,
  end = req.query.end

  getAllNearbyRestaurantsAlongRoute(start, end).then(function(restaurants) {
    res.send(restaurants);
  })
})
