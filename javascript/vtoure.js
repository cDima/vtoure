$(function () {

    //getConcerts();
    //return;

    if (VK === undefined) console.error("Issue finding VK global object");

    var permissionsGranted = false;
    var artists = [];
    var permissionsAlert = $("#permissionsAlert");
    var personGreeting = $("#personGreeting");
    personGreeting.hide();

    $("#audiopermissions").onclick = requestPermissions;

    VK.init(function () {
        // API initialization succeeded 
        // Your code here 
        log("VK init successful");

        VK.addCallback("onSettingsChanged", onSettingsChanged);
        VK.addCallback("onApplicationAdded", onApplicationAdded);

        //log("calling users.isAppUser");
        //VK.api("users.isAppUser", null, isAppUser); // for information only
        log("calling account.getAppPermissions");
        VK.api("account.getAppPermissions", null, getAppPermissions); 

    }, function () {
        // API initialization failed 
        // Can reload page here 
        error("VK init unsuccessful");
    }, '5.16');

    function log(msg) {
        console.log(msg);
        $("#log").append("<i>" + msg + "</i><br>");
    }

    function error(err) {
        console.error(err);
        $("#log").append("<i class=\"text-danger\">" + err + "</i><br>");
    }

    function getPersonalGreeting() {
        VK.api("users.get", { fields: "city, country,photo_50,can_see_audio,counters" }, function (data) {
            // Действия с полученными данными 
            var firstName = data.response[0].first_name; // "Дмитрий"
            var lastName = data.response[0].last_name; // "Садаков"
            var audiosOK = data.response[0].can_see_audio; // 1 // i can see bass
            var photo = data.response[0].photo_50; //  "http://cs9482.vk.me/v9482635/202d/dn-hQPBWYuQ.jpg"
            var cityName = data.response[0].city.title; // "New York City"
            var country = data.response[0].country.title; // "США"
            var audios = data.response[0].counters.audios; // 512

            $("#userimg").attr("src", photo);
            $("#personname").text(firstName + " " + lastName);
            $("#city").text(cityName + ", " + country);
            $("#audionum").text(audios);
            personGreeting.show();
        });
    }

    function getAudioAuthors() {
        log("in getAudioAuthors");
        VK.api("audio.get", {}, function (data) {
            debugger;
            // Действия с полученными данными 
            var audiocount = data.response.count;
            var tracks = data.response.items; // without first element

            artists = [];
            $.each(tracks, function (i, track) {
                var artist = {
                    displayName: track.artist,
                    name: track.artist.trim().toLowerCase().replace("the ", ""),
                    hitcount: 1
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

            $("#artists").append("Всего уникальных авторов: " + artists.length + ".");

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
            
            // popular artists
            $("#artists").append("Популярные авторы: " + artists.slice(0, 5).map(function(s) { return s.name + " (" + s.hitcount + ") "; }).join(" "));

            //ask songkick for popular bands
            getConcerts(artists);
        });
    };

    function getConcerts() {
        var apikey = "moHNsXaKT6XHh7pP";
        var artist = "glitch+mob";
        $.ajax({
            url: "http://api.songkick.com/api/3.0/events.json?location=clientip&apikey=" + apikey + "&artist_name=" + artist,
            dataType: "jsonp",
            jsonp: 'jsoncallback',
            success: function (response) {
                debugger;
                $.each(response.resultsPage.results.event, function (i, entry) {

                    /*
                    entry.id
                    entry.displayName //    "The Governors Ball Music Festival 2014"
                    entry.start.date //    "2014-06-06" 
                    entry.start.datetime //    "2014-06-06T17:00:00-0500"
                    entry.type //    "Festival"
                    entry.uri //  "http://www.songkick.com/festivals/181131/id/18709809-the-governors-ball-music-festival-2014?utm_source=25504&utm_medium=partner"
                    entry.location.city //   "New York, NY, US"
                    entry.venue.displayName //    "Randall's Island"
                    entry.venue.uri //    "Randall's Island"
                    entry.venue.metroArea.displayName // "New York"
                    entry.performance[0] //   Object {billing: "headline", artist: Object, billingIndex: 1, displayName: "Foster the People", id: 38157844}
                    entry.performance[0].displayName //  "Foster the People"
                    entry.performance[0].artist.uri // "http://www.songkick.com/artists/3120231-foster-the-people?utm_source=25504&utm_medium=partner"
                    */
                    
                    $("#events").append('<li> ' + artist +
                    ' выступает ' + entry.start.date +
                    ' <a href="' + entry.uri + '">' +
                    entry.displayName + '</a> @ <a href="' + entry.venue.uri + '">' + entry.venue.displayName + '</a>(' +
                    entry.location.city + ')' +
                    '<img src="https://ssl.sk-static.com/images/media/profile_images/venues/' +
                    entry.venue.id + '/col1" >' +
                    '</li>');
                });
            },
            error: function (error) {
                debugger;
                error(error);
            }
        });

    }

    function isAppUser(result) {
        log("in isAppUser - the app is installed  " + (result.response === 1));
    }

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
        return false;
    }

    function onSettingsChanged(settings) {
        log("in onSettingsChanged");
        verifyPermissions(settings);
        permissionsAlert.toggle(!permissionsGranted);
        getPersonalGreeting();
        getAudioAuthors();
    };

    function onApplicationAdded() {
        log("in onApplicationAdded");
    };
})