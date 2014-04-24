// songkick angular js plugin
// 2014 Dmitry Sadakov

$(function () {
    window.songkick = {
        apikey: "moHNsXaKT6XHh7pP",

        getEvents: function(artist, displayName, onSuccess, onError) {
            $.ajax({
                url: "//api.songkick.com/api/3.0/events.json?",
                data: { location: "clientip", apikey: this.apikey, artist_name: artist },
                dataType: "jsonp",
                jsonp: 'jsoncallback'
            }).fail(onError).done(onSuccess);
        },
        getLocationEvents: function (artist, displayName, /*lat, lon*/ metroId, onSuccess, onError) {
            $.ajax({
                url: "//api.songkick.com/api/3.0/events.json?",
                data: {
                    //location: "geo:" + lat + "," + lon, apikey: this.apikey, artist_name: artist },
                    location: "sk:" + metroId, apikey: this.apikey, artist_name: artist
                },
                dataType: "jsonp",
                jsonp: 'jsoncallback'
            }).fail(onError).done(onSuccess);
        },
        getAllLocationEvents: function (metroId, onSuccess, onError) {
            $.ajax({
                url: "//api.songkick.com/api/3.0/metro_areas/" + metroId + "/calendar.json",
                data: { apikey: this.apikey },
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
                url: "//api.songkick.com/api/3.0/search/locations.json",
                data: data,
                dataType: "jsonp",
                jsonp: 'jsoncallback'
            }).fail(onError).done(onSuccess);
        }
    };
})