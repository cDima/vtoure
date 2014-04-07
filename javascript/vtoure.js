$(function () {

    if (VK === undefined) console.error("Issue finding VK global object");

    var permissionsGranted = false;
    var artists = [];
    var permissionsAlert = $("#permissionsAlert");
    var personGreeting = $("#personGreeting");
    personGreeting.hide();

    $('#audiopermissions').click(function () { requestPermissions(); return false; });

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
            //debugger;
            var id = data.response[0].id; // 1
            var firstName = data.response[0].first_name; // "Дмитрий"
            var lastName = data.response[0].last_name; // "Садаков"
            var audiosOK = data.response[0].can_see_audio; // 1 // i can see bass lol
            var photo = data.response[0].photo_50; //  "http://cs9482.vk.me/v9482635/202d/dn-hQPBWYuQ.jpg"
            var cityName = data.response[0].city.title; // "New York City"
            var country = data.response[0].country.title; // "США"
            var audios = data.response[0].counters.audios; // 512

            $("#userimg").attr("src", photo);
            $("#personname").text(firstName + " " + lastName);
            //$("#city").text(cityName + ", " + country);
            $("#audionum").text(audios);
            personGreeting.show();

            // analytic tracking
            event("Person", "Entered", firstName + " " + lastName + " (" + id + ")", audios, true);
        });
    }

    function getAudioAuthors() {
        log("in getAudioAuthors");
        VK.api("audio.get", {}, function (data) {

            if (data.error !== undefined) {
                error(data.error.error_msg);
                return;
            }

            var audiocount = data.response.count;
            var tracks = data.response.items;

            event("Person", "AllowedAudioAccess", "Tracks #", audiocount, true);

            artists = [];
            $.each(tracks, function (i, track) {
                var artist = {
                    displayName: track.artist,
                    name: track.artist.trim().toLowerCase().replace("the ", ""),
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
                if (hitsA === hitsB) return SortByName(a.name, b.name);
                else return ((hitsA < hitsB) ? -1 : ((hitsA > hitsB) ? 1 : 0));;
            }

            function SortByName(a, b) {
                return ((a < b) ? -1 : ((a > b) ? 1 : 0));
            }

            // sort by popularity
            artists.sort(hitCountSorter);
            artists.reverse();
            
            // at this point we have all the artists from vk;
            // push to angular's model.
            var scope = angular.element($("#vtoureApp")).scope();
            scope.$apply(function () {
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

        // audio +8
        var neededPermissions = 8;
        permissionsGranted = (perms & neededPermissions) === neededPermissions;
        if (!permissionsGranted) {
            error("needed Permissions are not granted, need " + neededPermissions + " have " + perms);
        }
        return permissionsGranted;
    }

    function requestPermissions() {
        VK.callMethod("showSettingsBox", 8); // call for permissions
        event("Person", "SettingsClicked", null, null, false); // is actually interaction
    }

    function onSettingsChanged(settings) {
        log("in onSettingsChanged");
        verifyPermissions(settings);
        permissionsAlert.toggle(!permissionsGranted);
        getPersonalGreeting();
        getAudioAuthors();
        event("Person", "SettingsChanged", "Settings Changed", settings, true);
    };

    function onApplicationAdded() {
        log("in onApplicationAdded");
    };
})
