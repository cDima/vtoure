/*
 * directive modules
 */

(function (window, angular) {
    'use strict';

    angular.module('backgroundImgDirective', [])
    .directive('backImg', function(){
        return function (scope, element, attrs) {
            attrs.$observe("backImg", function (url, o) {
                if (!url) return;
                element.css({
                    'background-image': 'url(' + url + ')',
                    'background-size': 'cover'
                });

            }, true);
        };
    });

})(window, window.angular);