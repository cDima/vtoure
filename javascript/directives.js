/*
 * directive modules
 */

(function (window, angular) {
    'use strict';

    angular.module('backgroundImgDirective', [])
    .directive('backImg', function(){
        return function(scope, element, attrs){
            var url = attrs.backImg;
            element.css({
                'background-image': 'url(' + url +')',
                'background-size' : 'cover'
            });
        };
    });

})(window, window.angular);