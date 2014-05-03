

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
			
			socket.emit('subscribe', { room: 'webNodes' });
            
		});
		
		
		socket.on('connect_failed', function (data) {
			console.log('socket connect failed');
			console.log(data);
		});
		
		socket.on('error', function (data) {
			console.log('socket error');
			console.log(data);
		});
		
		socket.on('roomChange', function(data){
		    roomUpdate(data);
	    });
		
		socket.on('update', function (data) {
		    displayUpdate(data);
        });
        
        socket.on('topFiveResponse', function(data){
            displayUpdate(data);
        });

		console.log('fsb.init...');
		
		socket.emit('topFive');
		socket.emit('roomStatusInit');
	};
	
	var roomUpdate = function(data){
	    console.log(data);
	    $('#roomActivity').empty();
	    $.each(data, function(i,v){
	        $('#roomActivity').prepend('<div>' + v.id + '--' + v.ip + ':' + v.port + '</div>');
	    });
	    
    }
	
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
