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
var single = false;
var lastid;
var url = 'http://api.reddit.com/r/redditgetsdrawn/';
//var url = 'http://www.reddit.com/r/photoshopbattles/';

//attempt to load reddit post+comments when comeing from a /next/back url
//autoload more posts when we get close to the end (just fire off a load.moreposts 
//[pushes more posts to the bottom of the array] and continue rolling through the array)

var app = angular.module('redditgetsdrawn', ['ngRoute']);

app.service('load', function($http, $q, $route, $routeParams){
	this.reddit = function(after){
		var deferred = $q.defer();
		var load;
		if (after) {
			load = url + '?count=25&after=t3_'+ after;
		} else{
			load = url;
		}
		$http.get(load).
		success(function(data){
			loaded = true;
			single = false;
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
		var result = [];
		$http.get(url + images[position].data.id).
		success(function(data){
			for (var i = 1; i < data.length; i++) {//this can probably go away
				console.log(data);
				comments = data[1].data.children;
				if (data[1].data.children.length > 0){
					result.push(comments);
				} else{
					var nilc = ['No Comments :('];
					result.push(nilc);
				}

				if (data[i].data.children.length > 0){
					var link = data[i].data.children[0].data.body_html;
					console.log(link.contains('imgur.com') + "contains imgur.com");
					if(link.contains('imgur.com')){
						link = link.match(/imgur.com[^]*"/gi);
						link = link[0].substr(0, link[0].length-1);
						console.log(link[0].substr(0, link[0].length-1));
						result.push(link);
					}
				}

			}
			deferred.resolve(result);
		}).
		error(function(data, status, headers, config){
			console.log(status);
			console.log(headers);
			console.log(config);
		});
		return deferred.promise;
	}

	this.singlereddit = function(){
		var deferred = $q.defer();
		var id = $routeParams.id;
		$http.get(url + id + '/.json').
		success(function(data){
			single = true;
			console.log(data);
			var entry = data[0].data.children[0];
			images.push(entry);
			deferred.resolve(entry);
		}).
		error(function(data, status, headers, config){
			deferred.reject(status);
			console.log(status);
			console.log(headers);
			console.log(config);
		});
		return deferred.promise;
	}
});

app.config(function($routeProvider, $locationProvider){
	$routeProvider
	.when('/', {
		controller:'orig',
		templateUrl:'rgd.html'
	})
	.when('/next/:id',{
		controller:'next',
		templateUrl:'rgd.html'
	})
	.when('/back/:id',{
		controller:'back',
		templateUrl:'rgd.html'
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
	images = [];
	var promise = load.reddit();
	promise.then(function(data){
		$scope.image = data;
		$scope.next = images[position + 1].data.id;
		$scope.back = images[position].data.id;
		console.log($scope.image + "reddit");
		var promise = load.comments();
		promise.then(function(data){
			$scope.link = data[1];
			$scope.comments = data[0];
			console.log(data);
			console.log("^comments")
		});
	}, function(reason) {
    	console.log('Failed: ' + reason);
	}, function(update) {
    	console.log('Got notification: ' + update);
	});
});

app.controller('body', function($scope, $location){
	$scope.keyPress = function(keyCode){
		console.log(keyCode);
		switch(keyCode){
			case 39:
				if (single) {
					$location.path('/next/');
					break;
				}
				$location.path('/next/'+images[position + 1].data.id);
				break;
			case 37:
				if (single) {
					$location.path('/back/');
					break;
				}
				if (position == 0) {
					break;
				}
				$location.path('/back/'+images[position - 1].data.id);
				break;
		} 
	}
})

app.controller('next', function($scope, $location, load) {
	if (position == images.length - 5) {
		var after = images[images.length - 1];
		load.reddit(after.data.id);
	}

	if (position == images.length - 1) {
		$location.path($location.path());
	}
	if (loaded) {
		//window.stop();
		position++;
		console.log(images[position]);
		$scope.image = images[position];
		$scope.next = images[position + 1].data.id;
		$scope.back = images[position - 1].data.id;
		var promise = load.comments();
		promise.then(function(data){
			$scope.link = data[1];
			$scope.comments = data[0];
			console.log(data);
			console.log("^comments");
		});
	} else if (single) {
		single = false;
		$location.path('/');
	} else{
		var promise = load.singlereddit();
		promise.then(function(data){
			$scope.image = data;
			console.log($scope.image + "reddit");
			var promise = load.comments();
			promise.then(function(data){
				$scope.link = data[1];
				$scope.comments = data[0];
				console.log(data);
				console.log("^comments")
			});
		}, function(reason) {
	    	console.log('Failed: ' + reason);
		}, function(update) {
	    	console.log('Got notification: ' + update);
		});
	}
});

app.controller('back', function($scope, $location, load){
	if (position == 1 && loaded) {
		position = 0;
		$location.path($location.path());
		$scope.image = images[position];
		$scope.next = images[position + 1].data.id;
		$scope.back = images[position].data.id;
		var promise = load.comments();
		promise.then(function(data){
			$scope.link = data[1];
			$scope.comments = data[0];
			console.log(data);
			console.log("^comments");
		});
	} else{
		if (loaded) {
			position--;
			console.log(images[position]);
			$scope.image = images[position];
			$scope.next = images[position + 1].data.id;
			$scope.back = images[position - 1].data.id;
			var promise = load.comments();
			promise.then(function(data){
				$scope.link = data[1];
				$scope.comments = data[0];
				console.log(data);
				console.log("^comments")
			});
		} else if (single) {
			single = false;
			$location.path('/');
		} else {
			var promise = load.singlereddit();
			promise.then(function(data){
				$scope.image = data;
				console.log($scope.image + "reddit");
				var promise = load.comments();
				promise.then(function(data){
					$scope.link = data[1];
					$scope.comments = data[0];
					console.log(data);
					console.log("^comments")
				});
			}, function(reason) {
		    	console.log('Failed: ' + reason);
			}, function(update) {
		    	console.log('Got notification: ' + update);
			});
			//$location.path('/');
		}
	}
});

app.directive('comments', function($compile){
	var linker = function(scope, element, attrs){
		if (scope.comment.data){
			console.log(scope.comment.data.body);
			var md = marked(scope.comment.data.body);
			console.log(md + ":marked down");
			console.log("contains imgur.com? " + md.contains('imgur.com'));
			var template;
			if (md.contains('imgur.com')) {
				link = md.match(/imgur.com[^]*"/gi);
				link = link[0].substr(0, link[0].length-1);
				template = '<div class="comment"><p><h4>{{comment.data.author}}</h4><img class="image" src="http://'+link+'.png">'+md+'</p></div>';
			} else{
				template = '<div class="comment"><p><h4>{{comment.data.author}}</h4>'+md+'</p></div>';
			}
			element.html(template);
			$compile(element.contents())(scope);
		}
	}
	return{
		restrict: "E",
		replace: true,
		link: linker,
		scope:{
			comment:'='
		}
	};
});

function imagestaticker () {//omg wow such sticky scroll thingy
	var elm = document.getElementById('orig');//get element
	clientTop = 0;//lol
	scrollTop = window.pageYOffset;//also lol
	fixed = false;//cause its not position:fixed unless it is
	if (scrollTop - clientTop > 147 && !fixed) {//Yoffset - 0 element position? apprently
		elm.classList.add('fixed');//fix that shit
		fixed = true;//lets just remeber what we did... just in case
	} else if (scrollTop - clientTop < 147){//more lol
			elm.classList.remove('fixed');//and lets un-fix that elm
			fixed = false//and lets remeber that we un-fixed it
	}
}

window.onscroll = imagestaticker;//the magic

















