﻿$(function () {
    window.songkick = {
        apikey: "moHNsXaKT6XHh7pP",

        getEvents: function (artist, displayName, onSuccess, onError) {
            $.ajax({
                url: "http://api.songkick.com/api/3.0/events.json?",
                data: {location: "clientip", apikey: this.apikey, artist_name: artist},
                dataType: "jsonp",
                jsonp: 'jsoncallback'
            }).fail(onError).done(onSuccess);
        },

        getLocation: function (cityname, onSuccess, onError) {

            var data = { apikey: this.apikey };

            if (cityname === undefined) {
               data.location = "clientip";
            } else {
                data.query = cityname;
            }

            $.ajax({
                url: "http://api.songkick.com/api/3.0/search/locations.json",
                data: data,
                dataType: "jsonp",
                jsonp: 'jsoncallback'
            }).fail(onError).done(onSuccess);
        }
    };
})