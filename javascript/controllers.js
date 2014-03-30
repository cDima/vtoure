'use strict';

/* Controllers */

var vtoureApp = angular.module('vtoureApp', []);

var batchModule = angular.module('batchModule', []);

vtoureApp.controller('vtoureCtrl', function ($scope) {
    $scope.artists = [];

    $scope.events = [];

    $scope.progressCount = 0;

    $scope.newArtists = function (incomingArtists) {
        
        //incomingArtists = incomingArtists.slice(0, 50); // test

        this.artists = this.artists.concat(incomingArtists);
        log('incomingArtists:' + this.artists.length);

        populateConcerts();
    }

    // usage: sleep(3000, foobar_continued);
    function sleep(millis, callback) {
        setTimeout(function ()
        { callback(); }
        , millis);
    }

    function populateConcerts() {
        
        var unqueriedArtists = $scope.artists.filter(function (artist) { return !artist.queriedEvents; });
        $scope.progressCount = $scope.artists.length - unqueriedArtists.length;
        log('progressCount:' + $scope.progressCount);

        var nextArtists = unqueriedArtists.slice(0, 5); 

        nextArtists.forEach(function (artist) {
            getConcerts(artist);
        });

        if (unqueriedArtists.length != 0)
            sleep(500, populateConcerts); // query again in a bit
    };

    function getConcerts(artist) {

        artist.queriedEvents = true;
        $scope.progressCount++;
        log('progressCount:' + $scope.progressCount);
        window.Songkick.GetEvents(artist.name, artist.displayName, onNewEvents, onError);
        
        function onNewEvents(response) {
            if (response.resultsPage.results.event !== undefined) {
                var events = response.resultsPage.results.event;

                artist.events = events;

                events.forEach(function(e) {
                    e.foundByArtist = artist; // add artist to event graph
                    $scope.events.push(e); // add to global collection of events
                });

                $scope.$apply(); // update angular for some reason
                resizeVKHeight();
            } else {
                artist.events = [];
            }
        }

        function onError(errr) {
            debugger;
            error(errr);
        }
    }

});