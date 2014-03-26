//lets us use string.contains cross browser. Cause chrome *still* barfs on this.
if ( !String.prototype.contains ) {
	String.prototype.contains = function() {
	    return String.prototype.indexOf.apply( this, arguments ) !== -1;
	};
}

dev = true;if (!dev) {function lol(){}window.console.log = lol;}//effectively redirects console.log to null.

//globalvars
var position = 0;
var images = [];
var loaded = false;
var lastid;

var app = angular.module('redditgetsdrawn', ['ngRoute']);

app.service('load', function($http, $q){
	this.reddit = function(){
		var deferred = $q.defer();
		$http.get('http://www.reddit.com/r/redditgetsdrawn/.json').
		success(function(data){
			loaded = true;
			data = data.data.children;
			for (var i = 0; i < data.length; i++) {
				if (data[i].data.domain.contains("imgur")) {
					if(data[i].data.url.contains("imgur.com/a/")){
						//auth with imgur, request album, get images, edit url to be a array of images
						console.log("album");
					} else{
						images.push(data[i]);
						lastid = data[i].data.id;
					}
				}
			}
			console.log(images[position]);
			deferred.resolve(images[position]);
		}).
		error(function(data, status, headers, config){
			deferred.reject(status);
			console.log(status);
			console.log(headers);
			console.log(config);
		});
		return deferred.promise;
	}
	this.comments = function(){
		console.log("drawn");
		var deferred = $q.defer();
		$http.get('http://www.reddit.com/r/redditgetsdrawn/' + images[position].data.id + '/.json').
		success(function(data){
			for (var i = 1; i < data.length; i++) {
				var link = data[i].data.children[0].data.body_html;
				console.log(link.contains('imgur.com'));
				link = link.match(/imgur.com[^]*"/gi);
				link = link[0].substr(0, link[0].length-1);
				console.log(link[0].substr(0, link[0].length-1));
			}
			deferred.resolve(link);
		}).
		error(function(data, status, headers, config){
			console.log(status);
			console.log(headers);
			console.log(config);
		});
		return deferred.promise;
	}
})

app.config(function($routeProvider, $locationProvider){
	$routeProvider
	.when('/', {
		controller:'orig',
		templateUrl:'/rgd.html'
	})
	.when('/next/:id',{
		controller:'next',
		templateUrl:'/rgd.html'
	})
	.when('/back/:id',{
		controller:'back',
		templateUrl:'/rgd.html'
	})
	.otherwise({
		redirectTo:'/'
	});
	//html5mode: incompatible with github cause no url re-write.
	/*$locationProvider
  	.html5Mode(true)
  	.hashPrefix('!');*/
});

app.controller('orig', function($scope, $http, load){
	window.yescope = $scope;
	var promise = load.reddit();
	promise.then(function(data){
		$scope.image = data;
		console.log($scope.image + "reddit");
		var promise = load.comments();
		promise.then(function(data){
			$scope.comments = data;
			console.log($scope.comments + "comments");
		});
	}, function(reason) {
    	console.log('Failed: ' + reason);
	}, function(update) {
    	console.log('Got notification: ' + update);
	});
});

app.controller('next', function($scope, $location, load) {
	if (loaded) {
		position++;
		console.log(images[position]);
		$scope.image = images[position];
		var promise = load.comments();
		promise.then(function(data){
			$scope.comments = data;
			console.log($scope.comments + "comments");
		});
	} else{
		$location.path('/');
	}
});

app.controller('back', function($scope, $location, load){
	if (position == 0 && loaded) {
		$location.path($location.path());
		$scope.image = images[position];
		var promise = load.comments();
		promise.then(function(data){
			$scope.comments = data;
			console.log($scope.comments + "comments");
		});
	} else{
		if (loaded) {
			position--;
			console.log(images[position]);
			$scope.image = images[position];
			var promise = load.comments();
			promise.then(function(data){
				$scope.comments = data;
				console.log($scope.comments + "comments");
			});
		} else{
			$location.path('/');
		}
	}
});






