var io = require('socket.io-client'),
    config = { 
        all: require('./config/all.js'),
        node: require('./config/node.js')
        },
    socket = io.connect('localhost', {
        port: config.all.socketServerPort
        });

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/client.db');


var myIp = process.argv[1];
var lastHeard;
var intervalTimer;


//pre-flight, remove me:
mockBlepi();


socket.on('connect', function () { 
    console.log("socket connected"); 
    
    socket.emit('hello', { ip: myIp });
    
    socket.on('hello', function(data){
        lastHeard = data.lastHeard;
        
        console.log('got hello back');
        console.log(data);
    });
    
    socket.on('report', function(data){
        if (typeof data.lastHeard !== 'undefined'){
            db.all("select tagDate, logDate, temp, ambTemp, tagAddr, ipAddr from log where logDate > ?", data.lastHeard, function(err, rows){
               if (err) throw err;
               socket.emit('report', { records: rows });
            });
        }
    });
});

//socket.emit('private message', { user: 'me', msg: 'whazzzup?' });

function fakeDataPayload(){
    return {
        tagDate: (new Date()).getTime(),
        logDate: (new Date()).getTime(),
        temp: randomIntFromInterval(40,90),
        ambTemp: randomIntFromInterval(40,90),
        tagAddr: 'BE:3F:20:CA:23',
        ipAddr: '127.0.0.1'
    };
}


function mockBlepi(){
    intervalTimer = setInterval(function(){
        d = fakeDataPayload();
        db.run('INSERT INTO log (tagDate,logDate,temp,ambTemp,tagAddr,ipAddr) VALUES(?, ?, ?, ?, ?, ?)',
	        [
	            d.tagDate,
	            d.logDate,
	            d.temp,
	            d.ambTemp,
	            d.tagAddr,
	            d.ipAddr
	        ]);
    }, 1000);
    
}


function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}