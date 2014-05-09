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
    //tempFunc();
    
	
	socket.on('subscribe', function(data){
        socket.join(data.room);
        broadcastNodeChange();
    });
	socket.on('unsubscribe', function(data){
        socket.leave(data.room);
        broadcastNodeChange();
    });
    
    socket.on('roomStatusInit', function(data){
        broadcastNodeChange();
    });
	
	socket.on('report', function(data){
	    if (typeof data.records !== 'undefined'){
	        data.records.forEach(function(d){
                 db.run('INSERT INTO log (tagDate,logDate,temp,ambTemp,tagAddr,ipAddr) VALUES(?, ?, ?, ?, ?, ?)',
                     [
                         d.tagDate,
                         (new Date()).getTime(),
                         d.temp,
                         d.ambTemp,
                         d.tagAddr,
                         socket.handshake.address.address
                     ]);
            });
        }
	    console.log('blep received: ');
	    console.log(data);
	    if (data.records.length > 0){
	        io.sockets.emit('update', data.records.slice(1,5));
        }
	});
	
	socket.on('topFive', function(data){
        db.all('select * from log order by tagDate desc limit 5;', function(err,rows){
            if (err) throw err;
            
            socket.emit('topFiveResponse', { records: rows });
        });
	    
    });
	
	socket.on('disconnect', function(){
	   //broadcastNodeChange();
	   //Wait a bit because leave events aren't instantaneous.
	   setTimeout(broadcastNodeChange, 500);
    });
	
});


var nextNode = 0;
//runs an operation on one client, then waits for the next iteration
var revolver = function(){
    if (nextNode > (io.sockets.clients('piNodes').length -1)){ nextNode = 0 }
    if (io.sockets.clients('piNodes').length == 0) return;
    
    var node = io.sockets.clients('piNodes')[nextNode];
    
    askNodeForReport(node);
    
    nextNode++;
};
var intervalTimer = setInterval(revolver, config.all.serverReportInterval);

var askNodeForReport = function(socket){
    db.get('select max(tagDate) as lastHeard from log where ipAddr = ?', socket.handshake.address.address, function(err,row){
        //console.log(socket.handshake.address.address);
        console.log(row);
        if (typeof row !== 'undefined'){
            if (row.lastHeard == null){
                socket.emit('report', { lastHeard: 0 }); 
            }else{
                socket.emit('report', { lastHeard: row.lastHeard }); 
            }
        }
    });

};

var tempFunc = function(){
    var intervalTimer = setInterval(function(){        
        console.log('getting lastheard');
        db.get('select max(tagDate) as lastHeard from log where ipAddr = ?', address.address, function(err,row){
            console.log(row);
            if (typeof row !== 'undefined'){
                if (row.lastHeard == null){
                    io.sockets.in('piNodes').emit('report', { lastHeard: 0 }); 
                }else{
                    io.sockets.in('piNodes').emit('report', { lastHeard: row.lastHeard }); 
                }
            }
        });
        
    }, config.all.serverReportInterval);
};


var nodesPresent = function(){
    
};

//Tell the web clients that the pi clients have changed.
var broadcastNodeChange = function (){
    io.sockets.in('webNodes').emit('roomChange', 
        io.sockets.clients('piNodes').map(function( a ) {
            return { 
                id: a.id,
                ip: a.handshake.address.address,
                port: a.handshake.address.port
            };
        })
    );
};