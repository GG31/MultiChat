'use strict';

angular.module('multichat', []);
angular.module('multichat').controller('IndexCtrl', function($scope, $rootScope) {
    $scope.profils = [{
      pseudo: 'bob'
    }, {
      pseudo: 'marie'
    }];
    $scope.toto = "toto";
});
