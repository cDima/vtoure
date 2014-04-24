/*
 * vtoure controller module
 */

(function (window, angular) {
    'use strict';

    var vtoureApp = angular.module('vtoureApp', ['backgroundImgDirective', 'ngAnimate', 'angularLocalStorage', 'geocodeModule', 'songkickJS']);

    vtoureApp.controller('vtoureCtrl', [
        '$scope', '$q', 'storage', 'geocoder', 'songkick', function ($scope, $q, storage, geocoder, songkick) {

            $scope.artists = [];
            $scope.person = {};
            $scope.events = storage.get("events");
            if ($scope.events == null) $scope.events = [];
            $scope.artistFilter = '';
            $scope.artistFilterValid = true;

            // add default locations
            $scope.locations = [
                {
                    glName: "New York, NY, USA",
                    lat: 40.714269,
                    lon: -74.005973,
                    metroId: 7644,
                    name: "Нью Йорк",
                    skName: "New York, US"
                }, {
                    glName: "London, UK",
                    lat: 51.5078,
                    lon: -0.128,
                    metroId: 24426,
                    name: "Лондон",
                    skName: "London, UK"
                }, {
                    glName: "Moscow, Russia",
                    lat: 55.7522,
                    lon: 37.6156,
                    metroId: 32051,
                    name: "Москва",
                    skName: "Moscow, Russian Federation"
                }
            ];
            $scope.location = $scope.locations[0]; // set primary location

            $scope.songkickHits = 0;
            $scope.songkickCurrentRequests = 0;
            $scope.cacheHits = 0;

            $scope.progressCount = 0;
            $scope.eventsFound = 0;
            $scope.startTime = 0;
            $scope.timeComplete = 0;

            $scope.newArtists = function(incomingArtists) {

                $scope.locationName = window.ip.regionName + ", " + window.ip.countryCode;
                $scope.locationNameValid = true;

                this.artists = this.artists.concat(incomingArtists);
                log('incomingArtists:' + this.artists.length);

                $scope.startTime = new Date().getTime();

                $scope.onChangeLocation();
            };


            $scope.getAllConcertsArea = function() {
                if ($scope.location.metroId !== undefined) {
                    window.songkick.getAllLocationEvents($scope.location.metroId, function(response) {
                        $scope.events = $scope.events.concat(response.resultsPage.results.event);
                        $scope.$apply(); // update angular for some reason
                        resizeVKHeight();
                        storage.set("events", $scope.events);
                    }, onerror);
                }
            };

            $scope.changeLocation = function(cityName) {
                $scope.locationName = cityName;
                $scope.onChangeLocation();
                return false;
            };

            $scope.filterByArtist = function(artistName) {
                $scope.artistFilter = artistName;
                $scope.$apply();
                resizeVKHeight();
                // search songkick for the group:
                $scope.artists.push({ queriedEvents: false, name: artistName, displayName: artistName, events: [] });
                populateConcerts();
                //getConcerts(artistName);
            };

            $scope.artistsInTourCount = function() {
                var count = 0;
                angular.forEach($scope.artists, function(artist) {
                    count += (artist.queriedEvents && artist.events.length > 0) ? 1 : 0;
                });
                return count;
            };

            $scope.onChangeLocation = function() {

                geocoder.geocode($scope.locationName).then(function(geoResult) {
                    searchSongkickByName($scope.locationName, geoResult); // with the help of google, off we go
                }, function() {
                    debugger;
                    $scope.locationNameValid = false;
                });

                function searchSongkickByName(locationName, glName) {
                    songkick.getLocation(glName).then(function (loc) {
                        $scope.locationNameValid = true;
                        
                        var location = {
                            lat: loc.metroArea.lat,
                            lon: loc.metroArea.lng,
                            name: locationName.capitalize(),
                            glName: glName,
                            skName: loc.metroArea.displayName + ", " + loc.metroArea.country.displayName,
                            metroId: loc.metroArea.id
                        };

                        // onNewLocation:
                        onNewLocation(location);
                        
                        rescan();
                    }, function(error) {
                        $scope.locationNameValid = false;
                        error('geocode was not successful for the following reason: ' + data.resultsPage.status);
                    });
                }
            };

            function onNewLocation(location) {
                var existingLocation = lookup($scope.locations, 'metroId', location.metroId);

                if (existingLocation === null) {
                    $scope.locations.push(location);
                    existingLocation = $scope.locations[$scope.locations.length - 1];
                } // add to array if new location
                $scope.location = existingLocation;
                event("Location", "SongkickSearch", $scope.location.name, $scope.location.lat + "," + $scope.location.lon, true);

            }

            function rescan() {
                $scope.artists.forEach(function (artist) {
                    artist.queriedEvents = false;
                });
                populateConcerts();
            }

            function populateConcerts() {

                var unqueriedArtists = $scope.artists.filter(function(artist) { return !artist.queriedEvents; });
                $scope.progressCount = $scope.artists.length - unqueriedArtists.length;
                log('progressCount:' + $scope.progressCount);

                if (unqueriedArtists.length != 0) {

                    var nextArtists = unqueriedArtists.slice(0, 5);

                    nextArtists.forEach(function(artist) {
                        getConcerts(artist);
                    });

                    if ($scope.songkickCurrentRequests < 5) {
                        //populateConcerts();
                        setTimeout(function() { populateConcerts(); }, 50); // sleep for a bit
                    } else {
                        setTimeout(function() { populateConcerts(); }, 200); // sleep for a bit
                    }
                } else {
                    var end = new Date().getTime();
                    $scope.timeComplete = end - $scope.startTime;
                    event("Library", "Concerts available", "Concerts available", $scope.eventsFound, true);
                    trackTiming("Library", "ScanComplete", $scope.timeComplete, "Full scan complete");
                    event("Library", "Hits", "Songkick", $scope.songkickHits, true);
                    event("Library", "Hits", "Cache", $scope.cacheHits, true);
                    $scope.songkickHits = 0;
                    $scope.cacheHits = 0;

                    // if there is a artist being searched and he is not found or has no concerts, display fail.
                    if ($scope.artistFilter !== "") {
                        var artist = lookup($scope.artists, 'name', $scope.artistFilter);
                        if (artist != null)
                            $scope.artistFilterValid = artist.events.length > 0;
                        else
                            $scope.artistFilterValid = false;
                    }

                    $scope.$apply(); // update angular for some reason
                    storage.set("events", $scope.events);

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
                //$scope.$apply(); // update angular for some reason

                var key = $scope.location.metroId + ":" + artist.name;
                var result = storage.get(key);

                if (result == null || result == "undefined") {
                    $scope.songkickHits++;
                    $scope.songkickCurrentRequests++;
                    window.songkick.getLocationEvents(artist.name, artist.displayName, $scope.location.metroId, onNewEvents, onGetConcertsError);
                } else {
                    $scope.cacheHits++;
                    // got result from localStorage; filter out stale results;
                    //if ()
                    propagateEvents(result);
                    deferred.resolve(result);
                }

                function onGetConcertsError(err) {
                    $scope.songkickCurrentRequests--;
                    onError(err);
                }

                function onNewEvents(response) {
                    $scope.songkickCurrentRequests--;
                    if (response.resultsPage.results.event !== undefined) {
                        var events = response.resultsPage.results.event;
                        storage.set(key, events);
                        propagateEvents(events);
                    } else {
                        //artist.events = [];
                        storage.set(key, artist.events);
                    }

                }

                function onError(errr) {
                    error(errr);
                    deferred.reject(errr);
                }

                function propagateEvents(events) {
                    artist.events = events;
                    $scope.eventsFound += events.length;

                    events.forEach(function (e) {
                        // check existence
                        debugger;
                        if (lookup($scope.events, 'id', e.id) === null) {
                            if (e.performance.length > 0) e.artistDisplayName = e.performance[0].displayName;
                            if (typeof artist !== 'undefined') e.artistDisplayName = artist.displayName; // add artist to event graph

                            var foundArtist = lookupContains(e.performance, 'displayName', artist.displayName);
                            if (foundArtist !== null) e.artistDisplayName = foundArtist.displayName;

                            $scope.events.push(e); // add to global collection of events
                        }
                    });

                    if ($scope.progressCount !== 0) $scope.$apply(); // update angular for some reason

                    resizeVKHeight();

                    deferred.resolve(events);
                }

                return deferred.promise;
            };
        }
    ]);

})(window, window.angular);