

bpm = (function ($) {
	"use strict";

	var socket;
	
	var url = function (){
		return $.url().param();
	};
	
	var init = function(){
		
		socket = io.connect('http://' + document.location.hostname + ':8081');
		
		
		socket.on('connect', function(data){
			console.log('connected to socket');
			
		});
		
		
		socket.on('connect_failed', function (data) {
			console.log('socket connect failed');
			console.log(data);
		});
		
		socket.on('error', function (data) {
			console.log('socket error');
			console.log(data);
		});
		
		
        

		console.log('fsb.init...');
	};
	
	
	
	// Public
	return { 
		socket: function(){ return socket },
		url: url,
		init: init
	};

} (jQuery));
