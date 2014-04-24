/// google javascript geocoder angular js module

(function (window, angular) {
    'use strict';

    var songkickJS = angular.module('songkickJS', []);
    
    songkickJS.factory('songkick', ['$http', '$q', function ($http, $q) {
        var apikey = 'moHNsXaKT6XHh7pP';

        var publicMethods = {
            getEvents: function(artist) {
                return $http.jsonp("//api.songkick.com/api/3.0/events.json", { location: "clientip", apikey: apikey, artist_name: artist });
            },
            getLocation: function (cityname, onSuccess, onError) {
                var deferred = $q.defer();
                var data = { apikey: apikey };
                debugger;
                if (cityname === undefined) {
                    data.location = "clientip";
                } else {
                    data.query = cityname;
                }
                $http.jsonp('//api.songkick.com/api/3.0/search/locations.json?jsoncallback=JSON_CALLBACK',
                    { params: data }).error(function(error) {
                        deferred.reject(error);
                    }).success(function(data) {
                        if (data.resultsPage.status !== "ok") {
                            deferred.reject(data.resultsPage.status);
                        } else if (data.resultsPage.totalEntries == 0) {
                            deferred.reject("no results");
                        } else {
                            deferred.resolve(data.resultsPage.results.location[0]);
                        }
                    });
                return deferred.promise;
            }
        };

        return publicMethods;
    }]);


})(window, window.angular);