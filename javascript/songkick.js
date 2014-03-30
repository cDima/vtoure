$(function () {
    window.Songkick = {
        apikey: "moHNsXaKT6XHh7pP",
        GetEvents: function(artist, displayName, onSuccess, onError) {
            $.ajax({
                url: "http://api.songkick.com/api/3.0/events.json?",
                data: {location: "clientip", apikey: this.apikey, artist_name: artist},
                dataType: "jsonp",
                jsonp: 'jsoncallback',
                success: onSuccess,
                error: onError
            });
        }
    };
})