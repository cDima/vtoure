$(function() {
    if (VK === undefined) console.error("Issue finding VK global object");

    var audioAuthors = 0;

    VK.init(function () {
        // API initialization succeeded 
        // Your code here 
        console.log("VK init successful");

        VK.addCallback("onSettingsChanged", onSettingsChanged);
        VK.addCallback("onApplicationAdded", onApplicationAdded);

        console.log("calling account.getAppPermissions");
        VK.api("account.getAppPermissions", null, onGetPermissions);

        console.log("calling users.isAppUser");
        VK.api("users.isAppUser", null, onGetPermissions);
        
        //getVKAuthors();
    }, function () {
        // API initialization failed 
        // Can reload page here 
        console.error("VK init unsuccessful");
    }, '5.16');

    function getVKAuthors() {
        console.log("in getVKAuthors");
        VK.api("users.get", { user_ids: "1,2,3,4" }, function (data) {
            // Действия с полученными данными 
            console.log("users.get: " + data);
        });
    };

    function onGetPermissions(result) {
        console.log("in onGetPermissions");
        console.log("permissions of the app: " + result);
    };

    function onSettingsChanged(settings) {
        console.log("in onSettingsChanged");
        getVKAuthors();
    };

    function onApplicationAdded(settings) {
        console.log("in onApplicationAdded");
        getVKAuthors();
    };
})