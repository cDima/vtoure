$(function() {
    if (VK === undefined) console.error("Issue finding VK global object");

    var permissionsGranted = false;

    function log(msg) {
        console.log(msg);
        $("#log").append("<i>" + msg + "</i><br>");
    }
    function error(err) {
        console.error(err);
        $("#log").append("<i class=\"text-danger\">" + err + "</i><br>");
    }

    $("#audiopermissions").click = requestPermissions;

    VK.init(function () {
        // API initialization succeeded 
        // Your code here 
        log("VK init successful");

        VK.addCallback("onSettingsChanged", onSettingsChanged);
        VK.addCallback("onApplicationAdded", onApplicationAdded);

        log("calling users.isAppUser");
        VK.api("users.isAppUser", null, isAppUser); // for information only
        log("calling account.getAppPermissions");
        VK.api("account.getAppPermissions", null, getAppPermissions); // ask for permissions
        // if no permissions, ask for them
        requestPermissions();

        //getAudioAuthors();
    }, function () {
        // API initialization failed 
        // Can reload page here 
        error("VK init unsuccessful");
    }, '5.16');

    function getAudioAuthors() {
        log("in getAudioAuthors");
        VK.api("users.get", { fields: "city, country,photo_50,can_see_audio,counters" }, function (data) {
            // Действия с полученными данными 
            log("users.get: " + data);
        });
    };

    function isAppUser(result) {
        log("in isAppUser - the app is installed  " + (result.response === 1));
    }

    function getAppPermissions(result) {
        log("in onGetPermissions - permissions of the app: " + (result.response));
        verifyPermissions(result.response);
    };

    function verifyPermissions(perms) {
        log("notify (+1) Пользователь разрешил отправлять ему уведомления." + (perms & 1));
        log("friends (+2)	Доступ к друзьям." + (perms & 2));
        log("photos (+4)	Доступ к фотографиям." + (perms & 4));
        log("audio (+8)	Доступ к аудиозаписям." + (perms & 8));
        log("video  (+16)	Доступ к видеозаписям." + (perms & 16));
        log("menu +256	Добавление ссылки на приложение в меню слева." + (perms & 256));

        // notify +1, audio +8
        var neededPermissions = 9;
        error("needed Permissions are not granted, need " + neededPermissions + " have " + perms);
        permissionsGranted = (perms !== neededPermissions);
        return permissionsGranted;
    }

    function requestPermissions() {
        VK.callMethod("showSettingsBox", 9); // call for permissions
        return false;
    }

    function onSettingsChanged(settings) {
        log("in onSettingsChanged");
        verifyPermissions(settings);
    };

    function onApplicationAdded() {
        log("in onApplicationAdded");
        getAudioAuthors();
    };
})