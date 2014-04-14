//$(function () {
//    window.ipapi = {
//        response: {},
//        getLocation: function () {
//            $.ajax({
//                url: "http://ip-api.com/json",
//                dataType: "jsonp"
//            }).fail(onError).done(function(response) {
//                this.response = response;
//                log(this.response);
//            });
//        }
//    };

//    ipapi.getLocation();
    
//})

/* example:
{
    status: "success",
    country: "United States",
    countryCode: "US",
    region: "NY",
    regionName: "New York",
    city: "Brooklyn",
    zip: "11215",
    lat: "40.6617",
    lon: "-73.9855",
    timezone: "America/New_York",
    isp: "Time Warner Cable",
    org: "Time Warner Cable",
    as: "AS12271 Time Warner Cable Internet LLC",
    query: "24.90.59.36"
}*/

/*
 * Angular.js IP API module
 */

//(function (window, angular) {
//    'use strict';

//    angular.module('angularIpApi').
//        factory('ipapi', [ '$log', function($log) {
//                var ip = {}; // global
//                var publicMethods = {
//                    init: function() {
//                        $http({ method: 'GET', url: 'http://ip-api.com/json' }).
//                            success(function(data) {
//                                this.ip = data;
//                                $log(data);
//                            });
//                    }
//                };

//                return publicMethods;
//            }
//        ]);

//})(window, window.angular);
