/*
 * vtoure controller module
 */

(function (window, angular) {
    'use strict';

    var vtoureApp = angular.module('vtoureApp', ['angularLocalStorage']);

    vtoureApp.controller('vtoureCtrl', ['$scope', '$q', 'storage', function ($scope, $q, storage) {
        $scope.artists = [];

        $scope.events = [];

        $scope.progressCount = 0;
        $scope.eventsFound = 0;
        $scope.startTime = 0;
        $scope.timeComplete = 0;

        $scope.newArtists = function (incomingArtists) {
        
            //incomingArtists = incomingArtists.slice(0, 50); // test

            this.artists = this.artists.concat(incomingArtists);
            log('incomingArtists:' + this.artists.length);

            $scope.startTime = new Date().getTime();

            //asyncPopulateConcerts(incomingArtists);
            populateConcerts(incomingArtists);

        }

        //function asyncPopulateConcerts(incomingArtists) {

        //    function asyncGetConcerts(artists) {
        //        var deferred = $q.defer();

        //        artists.forEach(function (artist) {
        //            getConcerts(artist);
        //        });

        //        setTimeout(function () {
        //            // since this fn executes async in a future turn of the event loop, we need to wrap
        //            // our code into an $apply call so that the model changes are properly observed.
        //            scope.$apply(function () {
        //                deferred.notify('About to greet ' + name + '.');
        //                deferred.notify('About to greet ' + name + '.');

        //                if (okToGreet(name)) {
        //                    deferred.resolve('Hello, ' + name + '!');
        //                } else {
        //                    deferred.reject('Greeting ' + name + ' is not allowed.');
        //                }
        //            });
        //        }, 1000);

        //        return deferred.promise;
        //    }

        //    var promise = asyncGetConcerts(incomingArtists);
        //    promise.then(function(artistsLeft) {
        //        asyncGetConcerts(unqueriedArtists.slice(0, 5));
        //    }, onError);
            

        //    var unqueriedArtists = $scope.artists.filter(function (artist) { return !artist.queriedEvents; });
        //    $scope.progressCount = $scope.artists.length - unqueriedArtists.length;
        //    log('progressCount:' + $scope.progressCount);

        //    if (unqueriedArtists.length != 0) {
        //        var nextArtists = unqueriedArtists.slice(0, 5);

        //        nextArtists.forEach(function (artist) {
        //            getConcerts(artist);
        //        });

        //        //setTimeout(function () { populateConcerts(); }, 200); // sleep for a bit
        //    } else {
        //        var end = new Date().getTime();
        //        $scope.timeComplete = end - $scope.startTime;
        //        trackTiming("Library", "ScanComplete", $scope.timeComplete, "Full scan complete");
        //        event("Library", "Concerts available", "Concerts available", $scope.eventsFound, true);
        //        debugger;
        //        $scope.$apply(); // update angular for some reason
        //    }
        //};

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

            artist.queriedEvents = true;
            $scope.progressCount++;
            //$scope.$apply(); // update angular for some reason

            // check local storage first
            // current location ip and then artistname
            var key = artist.name;// need location + artist name
            var result = storage.get(key);
            //debugger;
            if (result == null || result == "undefined") {
                window.songkick.getEvents(artist.name, artist.displayName, onNewEvents, onError);
            } else {
                propagateEvents(result);
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
            }

            function propagateEvents(events) {
                artist.events = events;
                $scope.eventsFound += events.length;

                events.forEach(function (e) {
                    e.foundByArtist = artist; // add artist to event graph
                    $scope.events.push(e); // add to global collection of events
                });

                $scope.$apply(); // update angular for some reason

                resizeVKHeight();
            }
        }

    }]);

})(window, window.angular);