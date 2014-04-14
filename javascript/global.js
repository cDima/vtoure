
// global functions

function resizeVKHeight() {
    var height = $('#vkframe').height();
    var width = 600;//$('#vkframe').width();
    VK.callMethod('resizeWindow', width, height);
}

function log(msg) {
    console.log(msg);
    $("#log").append("<i>" + msg + "</i><br>");
}

function error(err) {
    console.error(err);
    $("#log").append("<i class=\"text-danger\">" + err + "</i><br>");
}

function event(category, action, opt_label, opt_value, opt_noninteraction) {
    log('Event [' + category + "," + action + "," + opt_label + "," + opt_value + "," + opt_noninteraction + "]");
    if (_gaq !== undefined) {
        _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
    }
};

function trackTiming(category, variable, time, opt_label, opt_sample) {
    log('Event [' + category + "," + variable + "," + time + "," + opt_label + "," + opt_sample + "]");
    if (_gaq !== undefined) {
        _gaq.push(['_trackTiming', category, variable, time, opt_label, opt_sample]);
    }
};

function getLocation(data) {
    window.ip = data;
}