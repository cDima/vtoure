$(function () {

    if (VK === undefined) console.error("Issue finding VK global object");

    window.permissionsGranted = false;
    var artists = [];
    var person = null;
    var permissionsAlert = $("#permissionsAlert");
    var neededPermissions = 10;
    
    $('#audiopermissions').click(function () { requestPermissions(); return false; });

    function inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    //VK.init({ apiId: 4274997 });
    //VK.init({ apiId: 4335308 });
    
    //VK.Widgets.Auth("vk_auth", { width: "200px", authUrl: '/dev/Auth' });
    
    VK.init(function () {
        
        log("VK init successful");
        VK.addCallback("onSettingsChanged", onSettingsChanged);
        VK.addCallback("onApplicationAdded", onApplicationAdded);
        VK.api("account.getAppPermissions", null, getAppPermissions); 

    }, function () {
        // API initialization failed 
        error("VK init unsuccessful");
    }, '5.16');
    

    function getPersonalGreeting() {
        VK.api("users.get", { fields: "city, country,photo_50,can_see_audio,counters" }, function (data) {
            // Действия с полученными данными 
            person = data.response[0];
            var id = person.id; // 1
            var firstName = person.first_name; // "Дмитрий"
            var lastName = person.last_name; // "Садаков"
            //var audiosOK = person.can_see_audio; // 1 // i can see bass lol
            //var photo = person.photo_50; //  "http://cs9482.vk.me/v9482635/202d/dn-hQPBWYuQ.jpg"
            //var cityName = person.city.title; // "New York City"
            //var country = person.country.title; // "США"
            var audios = person.counters.audios; // 512

            // analytic tracking
            event("Person", "Entered", firstName + " " + lastName + " (" + id + ")", audios, true);
            //callback(person);

            var scope = angular.element($("#vtoureApp")).scope();
            scope.$apply(function () {
                scope.person = person; // show user greeting
            });
        });
    }

    function getFriends() {
        log("in getFriends");
        debugger;
        VK.api("friends.get", { fields: 'nickname, city, country, timezone, photo_50' }, function (data) {
            var scope = angular.element($("#vtoureApp")).scope();
            scope.$apply(function() {
                scope.setFriends(data.response.items); // scan all artists.
            });
        });
    }

    function getAudioAuthors() {
        log("in getAudioAuthors");
        VK.api("audio.get", {}, function (data) {

            if (data.error !== undefined) {
                error(data.error.error_msg);
            } else {

                var audiocount = data.response.count;
                var tracks = data.response.items;

                event("Person", "AllowedAudioAccess", "Tracks #", audiocount, true);

                artists = [];
                $.each(tracks, function(i, track) {

                    var easierName = track.artist.trim().toLowerCase().replace("the ", "");

                    var artist = {
                        displayName: track.artist,
                        name: easierName,
                        hitcount: 1,
                        events: [],
                        queriedEvents: false
                    };

                    var foundArtist = $.grep(artists, function(element) {
                        return element.name === artist.name;
                    });
                    if (foundArtist.length === 0) {
                        artists.push(artist);
                    } else {
                        foundArtist[0].hitcount++;
                    }
                });

                function hitCountSorter(a, b) {
                    var hitsA = a.hitcount;
                    var hitsB = b.hitcount;
                    if (hitsA === hitsB) return sortByName(a.name, b.name);
                    else return ((hitsA < hitsB) ? -1 : ((hitsA > hitsB) ? 1 : 0));;
                }

                function sortByName(a, b) {
                    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                }

                // sort by popularity
                artists.sort(hitCountSorter);
                artists.reverse();

                // at this point we have all the artists from vk;
                // push to angular's model.
            }

            var scope = angular.element($("#vtoureApp")).scope();
            
            scope.$apply(function() {
                scope.newArtists(artists); // scan all artists.
            });
            
        });
    };
    
    function getAppPermissions(result) {
        log("in onGetPermissions - permissions of the app: " + (result.response));
        onSettingsChanged(result.response);
    };

    function verifyPermissions(perms) {
        log("notify (+1) Пользователь разрешил отправлять ему уведомления." + (perms & 1));
        log("friends (+2)	Доступ к друзьям." + (perms & 2));
        log("photos (+4)	Доступ к фотографиям." + (perms & 4));
        log("audio (+8)	Доступ к аудиозаписям." + (perms & 8));
        log("video  (+16)	Доступ к видеозаписям." + (perms & 16));
        log("menu +256	Добавление ссылки на приложение в меню слева." + (perms & 256));

        //debugger;
        //if ((perms & 256) === 256) { // left menu 
        //    VK.callMethod("account.setNameInMenu", "втеме"); // set name
        //}

        // audio +8
        window.permissionsGranted = (perms & neededPermissions) === neededPermissions;
        if (!window.permissionsGranted) {
            error("needed Permissions are not granted, need " + neededPermissions + " have " + perms);

            var $scope = angular.element($("#vtoureApp")).scope();
            
            $scope.onChangeLocation();
            //scope.$apply(function () {
            //    scope.getAllConcertsArea(); // scan all the things.
            //});
        }
        return window.permissionsGranted;
    }

    function requestPermissions() {
        VK.callMethod("showSettingsBox", neededPermissions); // call for permissions
        event("Person", "SettingsClicked", null, null, false); // is actually interaction
    }

    function onSettingsChanged(settings) {
        log("in onSettingsChanged");
        verifyPermissions(settings);
        permissionsAlert.toggle(!window.permissionsGranted);
        getPersonalGreeting();
        getAudioAuthors();
        getFriends();
        event("Person", "SettingsChanged", "Settings Changed", settings, true);
    };

    function onApplicationAdded() {
        log("in onApplicationAdded");
    };
})
