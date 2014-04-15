
// global functions

function resizeVKHeight() {
    var height = $('body').height();
    var width = 600;//$('#vkframe').width();
    VK.callMethod('resizeWindow', width, height);
}

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
    if (_gaq !== undefined) {
        _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
    }
};

function trackTiming(category, variable, time, opt_label) {
    log('Event [' + category + "," + variable + "," + time + "," + opt_label + "]");
    if (_gaq !== undefined) {
        _gaq.push(['_trackTiming', category, variable, time, opt_label]);
    }
};

function getLocation(data) {
    window.ip = data;
}