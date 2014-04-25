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
            debugger;
            cleanOldEvents();
            
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
                    debugger ;
                    songkick.getAllLocationEvents($scope.location.metroId).then(function (results) {
                        $scope.events = $scope.events.concat(results.event);
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
                    $scope.locationNameValid = false;
                });

                function searchSongkickByName(locationName, glName) {
                    songkick.getLocation(glName).then(function (loc) {
                        if (loc == null) {
                            $scope.locationNameValid = false;
                        } else {
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
                        }
                    }, function (errorResult) {
                        $scope.locationNameValid = false;
                        error('geocode was not successful for the following reason: ' + errorResult);
                    });
                }
            };

            function onNewLocation(location) {
                var existingLocation = lookup($scope.locations, 'metroId', location.metroId);

                if (existingLocation === null) {
                    $scope.locations.push(location);
                    existingLocation = $scope.locations[$scope.locations.length - 1];
                }

                // add to array if new location
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
                    var timeComplete = end - $scope.startTime;
                    trackTiming("Library", "ScanComplete", timeComplete, "Full scan complete");
                    
                    // on finished event search:
                    onFinishedEventSearch();
                }
            };

            function onFinishedEventSearch() {
                event("Library", "Concerts available", "Concerts available", $scope.eventsFound, true);
                event("Library", "Hits", "Songkick", $scope.songkickHits, true);
                event("Library", "Hits", "Cache", $scope.cacheHits, true);
                $scope.songkickHits = 0;
                $scope.cacheHits = 0;


                validateArtistFilter();

                $scope.$apply(); // update angular for some reason

                storage.set("events", $scope.events);

                //if no events where found, return all concerts
                if (!foundLocalConcerts()) {
                    $scope.getAllConcertsArea();
                }
            }

            function validateArtistFilter() {
                // if there is a artist being searched and he is not found or has no concerts, display fail.
                if ($scope.artistFilter !== "") {
                    var artist = lookup($scope.artists, 'name', $scope.artistFilter);
                    if (artist != null)
                        $scope.artistFilterValid = artist.events.length > 0;
                    else
                        $scope.artistFilterValid = false;
                }
            }
            
            function foundLocalConcerts() {
                for (var i = 0, len = $scope.events.length; i < len; i++) {
                    if ($scope.events[i].venue.metroArea.id == $scope.location.metroId)
                        return true;
                }
                return false;
            }

            function cleanOldEvents() {
                $scope.events = $scope.events.filter(eventNotStale);
            }
            
            function eventNotStale(event) {
                return new Date(event.start.date) >= new Date();
            }
            
            function getConcerts(artist) {
            
                artist.queriedEvents = true;
                $scope.progressCount++;

                var key = $scope.location.metroId + ":" + artist.name;
                var cacheHit = storage.get(key);

                if (cacheHit !== null && typeof cacheHit !== "undefined" && cacheHit.length > 0) {
                    // got cacheHit from localStorage; filter out stale results;
                    var event = cacheHit[0];
                    if (!eventNotStale(event)) {
                        debugger;
                        storage.remove(key);
                        cacheHit = null;
                    }
                }

                if (cacheHit == null || cacheHit == "undefined") {
                    $scope.songkickHits++;
                    $scope.songkickCurrentRequests++;
                    debugger;
                    songkick.getLocationEvents(artist.name, artist.displayName, $scope.location.metroId).then(onNewEvents, onGetConcertsError);
                } else {
                    $scope.cacheHits++;
                    propagateEvents(cacheHit);
                }

                function onGetConcertsError(err) {
                    $scope.songkickCurrentRequests--;
                    error(err);
                }

                function onNewEvents(results) {
                    $scope.songkickCurrentRequests--;
                    if (results.event !== undefined) {
                        var events = results.event;
                        storage.set(key, events);
                        propagateEvents(events);
                    } else {
                        storage.set(key, artist.events);
                    }

                }

                function propagateEvents(events) {
                    artist.events = events;
                    $scope.eventsFound += events.length;

                    events.forEach(function (e) {
                        // check existence
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
                }
            };
        }
    ]);

})(window, window.angular);