'use strict';

var app = angular.module('myApp', []);

app.controller('MainCtrl', function ($scope) {
    $scope.text = 'Hello World!';
});

describe('Unit testing application', function () {
    var $rootScope;

    // Load the myApp module, which contains the directive
    beforeEach(module('myApp'));

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function (_$rootScope_) {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $rootScope = _$rootScope_;
    }));

    it('Root not null', function () {
        expect($rootScope).not.toBeNull();
    });
    it('Has no text', function () {
        expect($rootScope.text).toBe(undefined);
    });
});

describe('Unit testing controller', function () {
    var scope, ctrl;

    beforeEach(function() {
        module('myApp');
    });

    //you need to inject dependencies first
    beforeEach(inject(function ($rootScope, $controller) {
        scope = $rootScope.$new();

        $controller("MainCtrl", {
            $scope: scope
        });
    }));

    it('Should initialize value to Hello World', inject(function ($controller) {
        var pc = $controller('MainCtrl', { $scope: scope });
        expect(scope.text).toEqual('Hello World!');
    }));
});