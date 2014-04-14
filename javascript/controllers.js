/*
 * vtoure controller module
 */

(function (window, angular) {
    'use strict';

    var vtoureApp = angular.module('vtoureApp', ['ngAnimate', 'angularLocalStorage']);

    vtoureApp.controller('vtoureCtrl', ['$scope', '$q', 'storage', function ($scope, $q, storage) {
        $scope.artists = [];
        $scope.person = {};
        $scope.events = [];

        $scope.locations = [];
        $scope.locations.push({
            lat: window.ip.lat, 
            lon: window.ip.lon,
            name: window.ip.regionName +", " + window.ip.countryCode
        });
        $scope.location = $scope.locations[0];// set primary
        
        //var geocoder = new google.maps.Geocoder();
        $scope.locationName = $scope.location.name;
        //$scope.onChangeLocation($scope.locationName);

        $scope.progressCount = 0;
        $scope.eventsFound = 0;
        $scope.startTime = 0;
        $scope.timeComplete = 0;

        $scope.newArtists = function (incomingArtists) {
        
            // on debug use first 50 artists only:
            //incomingArtists = incomingArtists.slice(0, 50);

            this.artists = this.artists.concat(incomingArtists);
            log('incomingArtists:' + this.artists.length);

            $scope.startTime = new Date().getTime();

            //populateConcerts();
            $scope.onChangeLocation();
        }

        $scope.onChangeLocation = function () {
            window.songkick.getLocation($scope.locationName, function (data) {
                debugger;
                if (data.resultsPage.status == "ok") {
                    var loc = data.resultsPage.results.location[0];
                    var metroId = loc.metroArea.id;
                    
                    if ($scope.location.metroId !== undefined && $scope.location.metroId == metroId) return; // already in same location

                    var location = {
                        lat: loc.metroArea.lat,
                        lon: loc.metroArea.lng,
                        name: loc.metroArea.displayName + ", " + loc.metroArea.country.displayName,
                        metroId: loc.metroArea.id
                    };

                    $scope.locations.push(location);
                    $scope.location = location;

                    // rescan
                    $scope.events = [];
                    $scope.artists.forEach(function (artist) {
                        artist.queriedEvents = false;
                    });
                    populateConcerts(); 
                } else {
                    error('geocode was not successful for the following reason: ' + data.resultsPage.status);
                }
            }, function (status) {
                    log('geocode was not successful for the following reason: ' + status);
                });
            /*
            geocoder.geocode({ 'address': $scope.locationName }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
                    debugger;
                    //map.setCenter(results[0].geometry.location);
                    var location = {
                        lat: results[0].geometry.location.k,
                        lon: results[0].geometry.location.A,
                        name: results[0].formatted_address
                    };
                    $scope.locations.push(location);
                    $scope.location = location;

                } else {
                    log('Geocode was not successful for the following reason: ' + status);
                }
            });*/
        }

        function populateConcerts() {
            var unqueriedArtists = $scope.artists.filter(function (artist) { return !artist.queriedEvents; });
            $scope.progressCount = $scope.artists.length - unqueriedArtists.length;
            log('progressCount:' + $scope.progressCount);

            if (unqueriedArtists.length != 0) {
                //var deferred = $q.defer();
                var nextArtists = unqueriedArtists.slice(0, 5);
                //var stepStart = new Date().getTime();
                nextArtists.forEach(function (artist) {
                    getConcerts(artist);
                });

                setTimeout(function () { populateConcerts(); }, 200); // sleep for a bit
            } else {
                var end = new Date().getTime();
                $scope.timeComplete = end - $scope.startTime;
                trackTiming("Library", "ScanComplete", $scope.timeComplete, "Full scan complete");
                event("Library", "Concerts available", "Concerts available", $scope.eventsFound, true);
                debugger;
                $scope.$apply(); // update angular for some reason
            }
        };

        function getConcerts(artist) {

            var deferred = $q.defer();

            artist.queriedEvents = true;
            $scope.progressCount++;
            $scope.$apply(); // update angular for some reason

            // check local storage first
            // current location ip and then artistname
            debugger;
            var key = $scope.location.metroId + ":" + artist.name;// need location + artist name
            var result = storage.get(key);
            //debugger;
            if (result == null || result == "undefined") {
                window.songkick.getLocationEvents(artist.name, artist.displayName, $scope.location.metroId, onNewEvents, onError);
                //window.songkick.getLocationEvents(artist.name, artist.displayName, $scope.location.lat, $scope.location.lon, onNewEvents, onError);
                //window.songkick.getEvents(artist.name, artist.displayName, onNewEvents, onError);
            } else {
                propagateEvents(result);
                deferred.resolve(result);
            }

            function onNewEvents(response) {
                if (response.resultsPage.results.event !== undefined) {
                    var events = response.resultsPage.results.event;
                    storage.set(key, events);
                    propagateEvents(events);
                } else {
                    artist.events = [];
                }

            }

            function onError(errr) {
                debugger;
                error(errr);
                deferred.reject(errr);
            }

            function propagateEvents(events) {
                artist.events = events;
                $scope.eventsFound += events.length;

                events.forEach(function (e) {
                    e.foundByArtist = artist; // add artist to event graph
                    $scope.events.push(e); // add to global collection of events
                });


                if ($scope.progressCount !== 0) $scope.$apply(); // update angular for some reason

                resizeVKHeight();

                deferred.resolve(events);
            }

            return deferred.promise;
        }
    }]);

})(window, window.angular);