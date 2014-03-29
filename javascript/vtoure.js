$(function() {
    if (VK === undefined) console.error("Issue finding VK global object");

    function log(msg) {
        console.log(msg);
        $("#log").append("<i>" + msg + "</i><br>");
    }
    function error(err) {
        console.error(err);
        $("#log").append("<i class=\"text-danger\">" + err + "</i><br>");
    }

    var audioAuthors = 0;

    VK.init(function () {
        // API initialization succeeded 
        // Your code here 
        log("VK init successful");

        VK.addCallback("onSettingsChanged", onSettingsChanged);
        VK.addCallback("onApplicationAdded", onApplicationAdded);

        log("calling account.getAppPermissions");
        VK.api("account.getAppPermissions", null, onGetPermissions);

        log("calling users.isAppUser");
        VK.api("users.isAppUser", null, onGetPermissions);
        
        //getVKAuthors();
    }, function () {
        // API initialization failed 
        // Can reload page here 
        console.error("VK init unsuccessful");
    }, '5.16');

    function getVKAuthors() {
        log("in getVKAuthors");
        VK.api("users.get", { user_ids: "1,2,3,4" }, function (data) {
            // Действия с полученными данными 
            log("users.get: " + data);
        });
    };

    function onGetPermissions(result) {
        log("in onGetPermissions");
        log("permissions of the app: " + result);
        // result === 1 if installed the app;
    };

    function onSettingsChanged(settings) {
        log("in onSettingsChanged");
        getVKAuthors();
    };

    function onApplicationAdded(settings) {
        log("in onApplicationAdded");
        getVKAuthors();
    };
})