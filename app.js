var express = require("express"),
	webserver = express(),
	socketServer = require('http').createServer(handler),
	io = require('socket.io').listen(socketServer),
	fs = require('fs'),
	exec = require('child_process').exec,
	config = { 
	    all: require('./config/all.js'),
	    node: require('./config/node.js')
	    };

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/server.db');

//sockets
socketServer.listen(config.all.socketServerPort);
//express / html
webserver.listen(config.all.webServerPort);

webserver.use(express.bodyParser());

//I don't honestly know why I need one of these..  TODO: look that up.
var handler = function(req, res){};

//ROUTING:  set up routes for the paths we want public.
webserver.get("/", function(req, res){
	res.render(__dirname + '/views/index.ejs', {
		layout:false,
		locals: { cacheKey: '?t=' + (new Date()).getTime() }
	});
});
	
webserver.use('/static', express.static(__dirname + '/static'));
webserver.use('/config', express.static(__dirname + '/config'));

io.sockets.on('connection', function (socket) {

    var address = socket.handshake.address;
    console.log(address);
    
    
    //Call for report on regular intervals, only new records.
    var intervalTimer = setInterval(function(){
        console.log('getting lastheard');
        db.get('select max(logDate) as lastHeard from log where ipAddr = ?', address.address, function(err,row){
            console.log(row);
            if (typeof row !== 'undefined'){
                if (row.lastHeard == null){
                    socket.emit('report', { lastHeard: 0 }); 
                }else{
                    socket.emit('report', { lastHeard: row.lastHeard }); 
                }
            }
        });
        
    }, config.all.serverReportInterval);
    
	socket.on('hello', function(data){
	    if (typeof data.myIp !== 'undefined'){
	        address = data.myIp;
	    }
	});
	
	socket.on('report', function(data){
	    if (typeof data.records !== 'undefined'){
	        data.records.forEach(function(d){
                 db.run('INSERT INTO log (tagDate,logDate,temp,ambTemp,tagAddr,ipAddr) VALUES(?, ?, ?, ?, ?, ?)',
                     [
                         d.tagDate,
                         d.logDate,
                         d.temp,
                         d.ambTemp,
                         d.tagAddr,
                         d.ipAddr
                     ]);
            });
        }
	    console.log('blep received: ');
	    console.log(data);
	    if (data.records.length > 0){
	        io.sockets.emit('update', data);
        }
	});
	
	socket.on('topFive', function(data){
        db.all('select * from log order by logDate desc limit 5;', function(err,rows){
            if (err) throw err;
            
            socket.emit('top5Response', { records: rows });
        });
	    
    });
	
	socket.on('disconnect', function(){
	   clearInterval(intervalTimer); 
    });
	
});

