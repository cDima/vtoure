/*
 * vtoure controller module
 */

(function (window, angular) {
    'use strict';

    var vtoureApp = angular.module('vtoureApp', ['ngAnimate', 'angularLocalStorage']);


    vtoureApp.controller('vtoureCtrl', [
        '$scope', '$q', 'storage', function($scope, $q, storage) {
                $scope.artists = [];
                $scope.person = {};
                $scope.events = [];
                $scope.artistFilter = '';
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


                event("Location", "IpApi", window.ip.query, window.ip.regionName + ", " + window.ip.countryCode + " [" + window.ip.lat, window.ip.lon + "]", true);

                $scope.locationName = window.ip.regionName + ", " + window.ip.countryCode;
                $scope.locationNameValid = true;

                $scope.songkickHits = 0;
                $scope.songkickCurrentRequests = 0;
                $scope.cacheHits = 0;

                $scope.progressCount = 0;
                $scope.eventsFound = 0;
                $scope.startTime = 0;
                $scope.timeComplete = 0;

                $scope.newArtists = function(incomingArtists) {

                    this.artists = this.artists.concat(incomingArtists);
                    log('incomingArtists:' + this.artists.length);

                    $scope.startTime = new Date().getTime();

                    $scope.onChangeLocation();
                }


                $scope.getAllConcertsArea = function() {
                    if ($scope.location.metroId !== undefined) {
                        window.songkick.getAllLocationEvents($scope.location.metroId, function(response) {
                            debugger;
                            $scope.events = $scope.events.concat(response.resultsPage.results.event);
                            $scope.$apply(); // update angular for some reason
                            resizeVKHeight();
                        }, onerror);
                    }
                };

                $scope.changeLocation = function (cityName) {
                    debugger;
                    $scope.locationName = cityName;
                    $scope.onChangeLocation();
                    return false;
                };

                $scope.filterByArtist = function(artistName) {
                    debugger;
                    $scope.artistFilter = artistName;
                    $scope.$apply();
                    resizeVKHeight();
                };

                $scope.artistsInTourCount = function () {
                    var count = 0;
                    angular.forEach($scope.artists, function (artist) {
                        count += (artist.queriedEvents && artist.events.length > 0) ? 1 : 0;
                    });
                    return count;
                }
            

                $scope.onChangeLocation = function () {
                var existingLocation = lookup($scope.locations, 'name', $scope.locationName);
                //if (typeof existingLocation === 'undefined') {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'address': $scope.locationName }, function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
                            searchSongkickByName($scope.locationName, results[0].formatted_address); // with the help of google, off we go
                            log("google geolocation finished, lat,lon:" + results[0].geometry.location.k + "," + results[0].geometry.location.A + ";name=" + results[0].formatted_address);
                            event("Location", "GoogleSearch", results[0].formatted_address, results[0].geometry.location.k + "," + results[0].geometry.location.A, true);

                        } else {
                            $scope.locationNameValid = false;
                        }
                    }
                );
                //}

                function searchSongkickByName(locationName, glName) {
                    window.songkick.getLocation(glName, function (data) {
                        if (data.resultsPage.status == "ok" && data.resultsPage.totalEntries > 0) {
                            $scope.locationNameValid = true;
                            var loc = data.resultsPage.results.location[0];
                            var metroId = loc.metroArea.id;

                            var location = {
                                lat: loc.metroArea.lat,
                                lon: loc.metroArea.lng,
                                name: locationName.capitalize(),
                                glName: glName,
                                skName: loc.metroArea.displayName + ", " + loc.metroArea.country.displayName,
                                metroId: loc.metroArea.id
                            };

                            var existingLocation = lookup($scope.locations, 'metroId', metroId);
                            debugger;
                            if (typeof existingLocation === 'undefined') {
                                $scope.locations.push(location);
                                existingLocation = $scope.locations[$scope.locations.length - 1];
                            } // add to array if new loc
                            $scope.location = existingLocation;

                            event("Location", "SongkickSearch", $scope.location.name, $scope.location.lat + "," + $scope.location.lon, true);

                            // rescan
                            $scope.events = [];
                            $scope.artists.forEach(function(artist) {
                                artist.queriedEvents = false;
                            });
                            populateConcerts();
                        } else {
                            $scope.locationNameValid = false;
                            error('geocode was not successful for the following reason: ' + data.resultsPage.status);
                        }
                    }, function(status) {
                        log('geocode was not successful for the following reason: ' + status);
                        $scope.locationNameValid = false;
                    });
                }
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

                    setTimeout(function() { populateConcerts(); }, 200); // sleep for a bit
                } else {
                    var end = new Date().getTime();
                    $scope.timeComplete = end - $scope.startTime;
                    event("Library", "Concerts available", "Concerts available", $scope.eventsFound, true);
                    trackTiming("Library", "ScanComplete", $scope.timeComplete, "Full scan complete");
                    event("Library", "Hits", "Songkick", $scope.songkickHits, true);
                    event("Library", "Hits", "Cache", $scope.cacheHits, true);
                    $scope.songkickHits = 0;
                    $scope.cacheHits = 0;
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

                var key = $scope.location.metroId + ":" + artist.name;
                var result = storage.get(key);
                //debugger;
                if (result == null || result == "undefined") {
                    $scope.songkickHits++;
                    window.songkick.getLocationEvents(artist.name, artist.displayName, $scope.location.metroId, onNewEvents, onError);
                } else {
                    $scope.cacheHits++;
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

                    events.forEach(function(e) {
                        e.artistDisplayName = artist.displayName; // add artist to event graph
                        $scope.events.push(e); // add to global collection of events
                    });

                    if ($scope.progressCount !== 0) $scope.$apply(); // update angular for some reason

                    resizeVKHeight();

                    deferred.resolve(events);
                }

                return deferred.promise;
            };
        }
    ])
    .directive('backImg', function(){
        return function(scope, element, attrs){
            var url = attrs.backImg;
            element.css({
                'background-image': 'url(' + url +')',
                'background-size' : 'cover'
            });
        };
    });

})(window, window.angular);