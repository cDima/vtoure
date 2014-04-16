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
        
        var geocoder = new google.maps.Geocoder();
        $scope.locationName = $scope.location.name;
        $scope.locationNameValid = true;

        $scope.progressCount = 0;
        $scope.eventsFound = 0;
        $scope.startTime = 0;
        $scope.timeComplete = 0;
        
        $scope.newArtists = function (incomingArtists) {
        
            this.artists = this.artists.concat(incomingArtists);
            log('incomingArtists:' + this.artists.length);

            $scope.startTime = new Date().getTime();

            $scope.onChangeLocation();
        }


        $scope.getAllConcertsArea = function () {
            if ($scope.location.metroId !== undefined) {
                window.songkick.getAllLocationEvents($scope.location.metroId, function(response) {
                    debugger;
                    $scope.events = $scope.events.concat(response.resultsPage.results.event);
                    $scope.$apply(); // update angular for some reason
                    resizeVKHeight();
                }, onerror);
            }
        };


        $scope.onChangeLocation = function () {
            geocoder.geocode({ 'address': $scope.locationName }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
                    debugger;
                    searchSongkickByName(results[0].formatted_address); // with the help of google, off we go
                    log("geolocation finished, lat,lon:" + results[0].geometry.location.k + "," + results[0].geometry.location.A + ";name=" + results[0].formatted_address);
                } else {
                    $scope.locationNameValid = false;
                }
            });

            function searchSongkickByName(locationName) {
                window.songkick.getLocation(locationName, function (data) {
                    debugger;
                    if (data.resultsPage.status == "ok" && data.resultsPage.totalEntries > 0) {
                        $scope.locationNameValid = true;
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
                        $scope.locationNameValid = false;
                        error('geocode was not successful for the following reason: ' + data.resultsPage.status);
                    }
                }, function (status) {
                    log('geocode was not successful for the following reason: ' + status);
                    $scope.locationNameValid = false;
                });
            }
        }

        function populateConcerts() {

            var unqueriedArtists = $scope.artists.filter(function (artist) { return !artist.queriedEvents; });
            $scope.progressCount = $scope.artists.length - unqueriedArtists.length;
            log('progressCount:' + $scope.progressCount);

            if (unqueriedArtists.length != 0) {
                
                var nextArtists = unqueriedArtists.slice(0, 5);
                
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

                 //if no events where found, return all concerts
                if ($scope.events.length == 0) {
                    $scope.getAllConcertsArea();
                }   
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
        };
    }]); // end controller
})(window, window.angular);