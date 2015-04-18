/*
 * vtoure controller module
 */

(function (window, angular) {
    'use strict';

    var vtoureApp = angular.module('vtoureApp', ['backgroundImgDirective',
        'ngAnimate',
        'angularLocalStorage',
        'geocodeModule',
        'songkickJS',
        //'vkJS',
        'ui.bootstrap']);

    vtoureApp.controller('vtoureCtrl', [
        '$scope', '$q', 'storage', 'geocoder', 'songkick', '$filter','$timeout',
        //'vk', 
        function ($scope, $q, storage, geocoder, songkick, $filter, $timeout
            //, vk
        ) {

            $scope.eventId = getQueryVariable("request_key");
            $scope.event = null;
            $scope.getGetInvited = function() {
                if ($scope.eventId != false) {
                    songkick.getEvent($scope.eventId).then(function (results) {
                        $scope.event = results.event;
                        resizeVKHeight();
                    }, error);
                }
            };

            $scope.artists = [];
            $scope.artists = storage.get("artists");
            if ($scope.artists == null) $scope.artists = [];
            
            $scope.friends = [];
            $scope.friend = "";
            $scope.person = {};
            $scope.events = [];
            $scope.events = storage.get("events");
            if ($scope.events == null) $scope.events = [];
            
            $scope.artistsInTourCount = 0;
            
            $scope.updateToursCount = function () {
                var count = 0;
                angular.forEach($scope.artists, function (artist) {
                    count += (artist.queriedEvents && artist.events.length > 0) ? 1 : 0;
                });
                $scope.artistsInTourCount = count;
            };

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

                incomingArtists.forEach(function (artist) {
                    if (!lookupContains($scope.artists, 'name', artist.name)) 
                        $scope.artists.push(artist);
                });
                
                log('incomingArtists:' + this.artists.length);

                // start search
                $scope.startTime = new Date().getTime();
                $scope.onChangeLocation();
            };

            $scope.getAllConcertsArea = function() {
                if ($scope.location.metroId !== undefined) {
                    songkick.getAllLocationEvents($scope.location.metroId).then(function (results) {
                        $scope.events = $scope.events.concat(results.event);
                        //$scope.$apply(); // update angular for some reason
                        resizeVKHeight();
                        storage.set("events", $scope.events);
                    }, onerror);
                }
            };
            $scope.setFriends = function (friends) {
                $scope.friends = friends;
                //$scope.friend = $scope.friends[0].first_name + " " + $scope.friends[0].last_name;
            };
            $scope.showRequestBox = function (user, event) {
                //VK.callMethod('showRequestBox', user.id, 'Предлагаю пойти на концерт группы ', event.id);
                var mess = 'Предлагаю пойти на концерт ' + event.displayName +
                    ' (' + $filter('date')(event.start.date, 'MMM d, y') +
                    $filter('date')(event.start.datetime, ', h a') + ') @ ' + event.venue.displayName + ', ' + event.location.city;

                var groups = event.performance.filter(isInteresting).map(function(p) {
                    return p.displayName;
                }).join(', ');
                if (groups != "") {
                    mess += ' c выступлениями ' + groups;
                }
                mess += ".";
                
                VK.callMethod('showRequestBox', user.id, mess, event.id);
            };
            function isInteresting(performance) {
                return performance.interesting == true;
            }

            //$scope.onSendFriendFocus = function () {
            //    if ($scope.friend == '')
            //        $scope.friend = $scope.friends[0].first_name.charAt(0);
            //};
            
            $scope.changeLocation = function(cityName) {
                $scope.locationName = cityName;
                $scope.onChangeLocation();
                return false;
            };

            $scope.filterByArtist = function(artistName) {
                $scope.artistFilter = artistName;
                
                if ($scope.artistFilter === '') {
                    $('#artistSearch').focus();
                }

                resizeVKHeight();
                // search songkick for the group:
                if (lookup($scope.artists, 'displayName', artistName) == null) {
                    $scope.artists.push({ queriedEvents: false, name: artistName, displayName: artistName, events: [] });
                    populateConcerts();
                }
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
                $scope.progressCount = 0;
                populateConcerts();
            }

            function populateConcerts() {

                var unqueriedArtists = $scope.artists.filter(function(artist) { return !artist.queriedEvents; });
                //$scope.progressCount = $scope.artists.length - unqueriedArtists.length;
                log('progressCount:' + $scope.progressCount);

                if (unqueriedArtists.length != 0) {

                    var nextArtists = unqueriedArtists.slice(0, 5);

                    nextArtists.forEach(function(artist) {
                        getConcerts(artist);
                    });

                    if ($scope.songkickCurrentRequests < 5) {
                        //populateConcerts();
                        //setTimeout(function() { populateConcerts(); }, 50); // sleep for a bit
                        $timeout(populateConcerts, 50);
                    } else {
                        //setTimeout(function() { populateConcerts(); }, 200); // sleep for a bit
                        $timeout(populateConcerts, 200);
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
                $scope.updateToursCount();

                validateArtistFilter();

                $scope.$apply(); // update angular for some reason

                storage.set("events", $scope.events);
                storage.set("artists", $scope.artists);

                //if no events where found, return all concerts
                if (!foundLocalConcerts()) {
                    $scope.getAllConcertsArea();
                }
            }

            function validateArtistFilter() {
                // if there is a artist being searched and he is not found or has no concerts, display fail.
                if ($scope.artistFilter !== "") {
                    var artist = lookupContains($scope.artists, 'name', $scope.artistFilter);
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
                $scope.events = $scope.events.filter(isFutureEvent || isStaleCache);
            }

            $scope.clearCache = function() {
                storage.clearAll();
            };

            //
            function isFutureEvent(event) {
                return new Date(event.start.date) >= new Date();
            }
            
            // business rule to update cache
            function isStaleCache(dateStr) {
                if (typeof dateStr === 'undefined' || dateStr == null) return true;
                var date = new Date(dateStr);
                date.setDate(date.getDate() + 7);
                var datePassed = new Date() >= date;
                return datePassed;
            }

            function getConcerts(artist) {
            
                artist.queriedEvents = true;
                log('getConcerts: progressCount = ' + $scope.progressCount + ' >= ' + $scope.artists.length + ' artists.length;');
                //$scope.progressCount++;

                var key = $scope.location.metroId + ":" + artist.name;
                var cacheHit = storage.get(key);

                if (cacheHit !== null && typeof cacheHit !== "undefined" && cacheHit.length > 0) {
                    // got cacheHit from localStorage; filter out stale results;
                    var event = cacheHit[0];
                    if (!isFutureEvent(event) || isStaleCache(event.retrieveDate)) {
                        storage.remove(key);
                        cacheHit = null;
                    }
                }

                if (cacheHit == null || cacheHit == "undefined") {
                    $scope.songkickHits++;
                    $scope.songkickCurrentRequests++;
                    // launch search request
                    songkick.getLocationEvents(artist.name, artist.displayName, $scope.location.metroId).then(onNewEvents, onGetConcertsError);
                } else {
                    $scope.cacheHits++;
                    log('cacheHits++');
                    $scope.progressCount++; 
                    log('progressCount++');
                    //propagateEvents(cacheHit);
                }

                function onGetConcertsError(err) {
                    $scope.songkickCurrentRequests--;
                    $scope.progressCount++; 
                    log('onGetConcertsError: progressCount++ = ' + $scope.progressCount);
                    error(err);
                }

                function onNewEvents(results) {
                    $scope.songkickCurrentRequests--;
                    $scope.progressCount++;
                    log('onNewEvents: progressCount++ = ' + $scope.progressCount);
                    if (results.event !== undefined) {
                        var events = results.event;
                        events.forEach(function (e) {
                            e.retrieveDate = new Date();
                        });

                        storage.set(key, events);
                        propagateEvents(events);
                    } else {
                        storage.set(key, artist.events);
                    }

                }

                function propagateEvents(events) {
                    artist.events = events;
                    $scope.eventsFound += events.length;
                    
                    events.forEach(function(e) {
                        // check existence

                        // update.
                        /*
                        if (e.performance.length > 0) e.artistDisplayName = e.performance[0].displayName; // set first performer
                        if (typeof artist !== 'undefined') e.artistDisplayName = artist.displayName; // add artist to event graph
                        */
                        
                        // crop name
                        e.displayName = cropName(e.displayName);
                        
                        //var foundArtist = lookupContains(e.performance, 'displayName', artist.displayName);
                        //if (foundArtist !== null) e.artistDisplayName = foundArtist.displayName;

                        e.performance.forEach(function (performance) {
                            // find interesting artists
                            var artistInSearch = lookupContains($scope.artists, 'displayName', performance.artist.displayName);
                            if (artistInSearch != null)
                                performance.interesting = true;
                        });

                        var found = false;
                        for (var i = 0, len = $scope.events.length; i < len; i++) {
                            if ($scope.events[i]['id'] === e.id) {
                                $scope.events[i] = e; // update
                                //angular.extend($scope.events[i], e);
                                found = true;
                                break;
                            }
                        }
                        if (!found) $scope.events.push(e); // add to global collection of events
                        $scope.artistsInTourCount++;
                        //$scope.events[" " + e.id] = e;
                    });

                    //if ($scope.progressCount !== 0) $scope.$apply(); // update angular for some reason

                    resizeVKHeight();
                }
            };

            function cropName(name) {
                var n = name.search(' at ');
                if (n > 0) return name.substr(0, n);
                return name;
            }
            
            function initLocation() {
                geocoder.getLocation().error(error).success(function (response) {
                    window.ip = response;
                    //event("Location", "IpApi", window.ip.query, window.ip.regionName + ", " + window.ip.countryCode + " [" + window.ip.lat, window.ip.lon + "]", true);
                    //$scope.locationName = window.ip.regionName + ", " + window.ip.countryCode;
                    
                    event("Location", "IpApi", window.ip.ip, window.ip.region_name + ", " + window.ip.country_code + " [" + window.ip.latitude, window.ip.longitude + "]", true);
                    
                    if (window.ip.region_name == '') {
                        $scope.locationName = 'New York, US'; // default to ny
                    } else {
                        $scope.locationName = window.ip.region_name + ", " + window.ip.country_code;
                    }

                    $scope.locationNameValid = true;
                });
            }

            $scope.getGetInvited();
            initLocation();
        }
    ]);

})(window, window.angular);