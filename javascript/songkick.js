// songkick angular js plugin
// 2014 Dmitry Sadakov
(function (window, angular) {
    'use strict';

    angular.module('songkickJS', []).factory('songkick', ['$scope', '$http'], function ($scope, $http) {
        var apikey = 'moHNsXaKT6XHh7pP';
        var publicMethods = {
            getEvents: function(artist) {
                return $http.jsonp("http://api.songkick.com/api/3.0/events.json", { location: "clientip", apikey: apikey, artist_name: artist });
            }
        };
        return publicMethods;
    });

})(window, window.angular);

$(function () {
    window.songkick = {
        apikey: "moHNsXaKT6XHh7pP",

        getEvents: function(artist, displayName, onSuccess, onError) {
            $.ajax({
                url: "http://api.songkick.com/api/3.0/events.json?",
                data: { location: "clientip", apikey: this.apikey, artist_name: artist }
            }).fail(onError).done(onSuccess);
        },
        getLocationEvents: function (artist, displayName, /*lat, lon*/ metroId, onSuccess, onError) {
            debugger;
            $.ajax({
                url: "http://api.songkick.com/api/3.0/events.json?",
                data: {
                    //location: "geo:" + lat + "," + lon, apikey: this.apikey, artist_name: artist },
                    location: "sk:" + metroId, apikey: this.apikey, artist_name: artist
                }
            }).fail(onError).done(onSuccess);
        },
        getAllLocationEvents: function (metroId, onSuccess, onError) {
            debugger;
            $.ajax({
                url: "http://api.songkick.com/api/3.0/metro_areas/" + metroId + "/calendar.json",
                data: { apikey: this.apikey }
            }).fail(onError).done(onSuccess);
        },
        getLocation: function (cityname, onSuccess, onError) {
            debugger;
            var data = { apikey: this.apikey };

            if (cityname === undefined) {
               data.location = "clientip";
            } else {
                data.query = cityname;
            }

            $.ajax({
                url: "http://api.songkick.com/api/3.0/search/locations.json",
                data: data
            }).fail(onError).done(onSuccess);
        }
    };
})