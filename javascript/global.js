//$(function () {
//    window.ipapi = {
//        response: {},
//        getLocation: function () {
//            $.ajax({url: "http://ip-api.com/json/"}).fail(error).done(function(response) {
//                window.ip = response;
//                event("Location", "IpApi", window.ip.query, window.ip.regionName + ", " + window.ip.countryCode + " [" + window.ip.lat, window.ip.lon + "]", true);

//                //var scope = angular.element($("#vtoureApp")).scope();
//                //scope.$apply(function () {
//                //});
//            });
//        }
//    };

//    ipapi.getLocation();

//})

// global functions

function resizeVKHeight() {
    var height = $('body').height();
    var width = 600;
    VK.callMethod('resizeWindow', width, height);
}

setInterval('resizeVKHeight()', 500); //

function log(msg) {
    console.log(msg);
    $("#log").append("<i>" + msg + "</i><br>");
    resizeVKHeight();
}

function error(err) {
    console.error(err);
    $("#log").append("<i class=\"text-danger\">" + err + "</i><br>");
    resizeVKHeight();
}

function event(category, action, opt_label, opt_value, opt_noninteraction) {
    log('Event [' + category + "," + action + "," + opt_label + "," + opt_value + "," + opt_noninteraction + "]");
    _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
};

function trackTiming(category, variable, time, opt_label) {
    log('Event [' + category + "," + variable + "," + time + "," + opt_label + "]");
    
    var hourInMillis = 1000 * 60 * 60;

    if (0 < time && time < hourInMillis) {
        _gaq.push(['_trackTiming', category, variable, time, opt_label, 100]); // 100% sent to google
    }
};

var trackOutboundLink = function (url) {
    _gaq('send', 'event', 'outbound', 'click', url);
}

function getLocation(data) {
    window.ip = data;
}

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function lookup(array, prop, value) {
    for (var i = 0, len = array.length; i < len; i++)
        if (array[i][prop] === value) return array[i];
    return null;
}

function lookupContains(array, prop, key) {
    for (var i = 0, len = array.length; i < len; i++)
        if (array[i][prop].toLowerCase().indexOf(key.toLowerCase()) != -1) return array[i];
    return null;
}

//$routeParams a bit too expensive
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1]; }
    }
    return (false);
}