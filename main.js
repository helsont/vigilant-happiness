var request = require('request');
var Promise = require('bluebird');
var fs = require('fs')
// make a request to bing maps
var mapURL = 'https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=tampa%2Cfl&wp.1=portland%2Cor&avoid=minimizeTolls&key=AvgjGasVLJPnwD6rCqCJLmg1Qt8a4kJiIoR6E66lJ2htQfVigyJ27WvVYHhG8YgR'

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
// getNearbyRestaurants(45, -115);
function getAllNearbyRestaurants(locationURL) {
  restaurants = {};
  var result;
  fs.readFile('result.json', 'utf8', function(err, data) {
    if (err) throw err;
    result = JSON.parse(data)
    // console.log(result)
    for (var waypoint in result) {
      for (var restaurant in result[waypoint]) {
        var r = result[waypoint][restaurant]
        var name = r[0]
        var dist = r[1]
        var lat = r[2]
        var lng = r[3]
        if (name in restaurants) {
          if (dist < restaurants[name]['distance']) {
            restaurant[name] = {'dist':dist, 'lat':lat, 'lng':lng};
          }
        }
        else {
          restaurants[name] = {'dist':dist, 'lat':lat, 'lng':lng};
        } 
      }
    }
    console.log(restaurants)
  })
//   getRouteParams(mapURL).then(function(routeParams) {
//     var waypoints = routeParams['waypoints'];
//     var list = [];
//     for (var waypoint in waypoints) {
//       var lat = waypoints[waypoint][0], lng = waypoints[waypoint][1];
//       list.push(getNearbyRestaurants(lat, lng));
//     };
//     // console.log(list);
//     return Promise.all(list);
//   }).then(function(result) {
//     console.log(result);
//     // var sheng = result[0]
//     // console.log(result);
//     // for (var r in sheng) {
//       // console.log(sheng[r]);
//       // var venue = result[0][r];
//       // var name = venue[0];
//       // var dist = venue[1];
//       // var lat = venue[2];
//       // var lng = venue[3];
//       // if (name in restaurants) {
//       //   if (dist < restaurants[name]['distance']) {
//       //     restaurant[name] = {'dist':dist, 'lat':lat, 'lng':lng};
//       //   }
//       // }
//       // else {
//       //   restaurants[name] = {'dist':dist, 'lat':lat, 'lng':lng};
//       // } 
//     // }
//     // console.log(restaurants);

//     // console.log(restaurants);
//   }).catch(function(error) {
//     console.log(error);
//   });
//   // getRouteParams(mapURL).then(function(routeParams) {
//   //   var allRestaurants = routeParams['waypoints'].map(function(value, idx) {
//   //     var lat = value[0], lng = value[1];
//   //     return getNearbyRestaurants(lat, lng);
//   //   });
//   //   return Promise.all(allRestaurants);
//   // }).then(function(restaurantDetails) {
//   //   console.log(restaurantDetails);
//   //   return restaurantDetails;
//   //   // console.log(allRestaurants);
//   // }).catch(function(error) {
//   //   console.log(error);
//   // })
}
getAllNearbyRestaurants(mapURL);