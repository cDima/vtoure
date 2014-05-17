/// songkick angular js module

(function (window, angular) {
    'use strict';

    var songkickJS = angular.module('songkickJS', []);
    
    songkickJS.factory('songkick', ['$http', '$q', function ($http, $q) {
        var apikey = 'moHNsXaKT6XHh7pP';

        // private function
        function jsonpRequest(url, params) {
            var deferred = $q.defer();
            if (typeof params === 'undefined' || params == null) params = {};
            params.apikey = apikey;

            $http.jsonp('//api.songkick.com/api/3.0/' + url + '?jsoncallback=JSON_CALLBACK',
                { params: params }).error(function (error) {
                    deferred.reject(error);
                }).success(function (data) {
                    if (data.resultsPage.status !== "ok") {
                        deferred.reject(data.resultsPage.status);
                    //} else if (data.resultsPage.totalEntries == 0) {
                      //  deferred.reject("no results");
                    } else {
                        deferred.resolve(data.resultsPage.results);
                    }
                });
            return deferred.promise;
        }
        
        var publicMethods = {
            getEvent: function (eventId) {
                // sanatize 
                eventId = eventId.replace(/^\D+/g, '');
                return jsonpRequest('events/' + eventId + '.json', { });
            },
            getEvents: function(artist, displayName) {
                return jsonpRequest('events.json', { location: "clientip", artist_name: artist });
            },
            getLocationEvents: function (artist, displayName, metroId) {
                return jsonpRequest("events.json", {
                    location: "sk:" + metroId,
                    artist_name: artist
                });
            },
            getAllLocationEvents: function (metroId) {
                return jsonpRequest('metro_areas/' + metroId + '/calendar.json');
            },
            getLocation: function(cityname) {
                var data = {};
                if (cityname === undefined) {
                    data.location = "clientip";
                } else {
                    data.query = cityname;
                }
                return jsonpRequest('search/locations.json', data).then(function (result) {
                    if (typeof result.location === "undefined")
                        return $q.reject("no results");
                    else
                        return result.location[0];
                });
            }
        };

        return publicMethods;
    }]);


})(window, window.angular);