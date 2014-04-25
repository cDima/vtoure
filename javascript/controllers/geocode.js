﻿/// google javascript geocoder angular js module

(function (window, angular) {
    'use strict';

    var geocode = angular.module('geocodeModule', []);
    
    geocode.factory('geocoder', ['$q', function ($q) {
        
        var geocoder = new google.maps.Geocoder();
        var publicMethods = {
            geocode: function(address, success, errorCallback) {
                var deferred = $q.defer();
                geocoder.geocode({ 'address': address }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
                        //searchSongkickByName($scope.locationName, results[0].formatted_address); // with the help of google, off we go
                        //success(results[0].formatted_address);
                        log("google geolocation finished, lat,lon:" + results[0].geometry.location.k + "," + results[0].geometry.location.A + ";name=" + results[0].formatted_address);
                        event("Location", "GoogleSearch", results[0].formatted_address, results[0].geometry.location.k + "," + results[0].geometry.location.A, true);
                        deferred.resolve(results[0].formatted_address);
                    } else {
                        //errorCallback();
                        //$scope.locationNameValid = false;
                        deferred.reject();
                    }
                });

                return deferred.promise;
            }
        };

        return publicMethods;
    }]);


})(window, window.angular);