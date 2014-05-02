

bpm = (function ($) {
	"use strict";

	var socket;
	
	var url = function (){
		return $.url().param();
	};
	
	var init = function(){
		
		socket = io.connect('http://' + document.location.hostname + ':8081');
		
		
		socket.on('connect', function (data) {
			console.log('connected to socket');
			console.log(data);
		});
		
		
		socket.on('connect_failed', function (data) {
			console.log('socket connect failed');
			console.log(data);
		});
		
		socket.on('error', function (data) {
			console.log('socket error');
			console.log(data);
		});
		
		socket.on('update', function (data) {
		    console.log('update happened');
		    console.log(data);
		    displayUpdate(data);
        });
        
        socket.on('top5Response', function(data){
            displayUpdate(data);
        });

		console.log('fsb.init...');
		
		socket.emit('topFive');
	};
	
	var displayUpdate = function(data){
	    $.each(data.records, function(i,v){
	        $('#recentActivity').prepend('<div>' + v.tagAddr + ' -- ' + v.temp + '</div>');
	        $('#recentActivity div').each(
	            function(i,v){ 
	                if (i >= 5) { 
	                    $(v).remove() 
	                } 
	            });
	    });
	    
    };
	
	// Public
	return { 
		socket: function(){ return socket },
		url: url,
		init: init
	};

} (jQuery));
