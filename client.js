var io = require('socket.io-client'),
    os=require('os'),
    config = { 
        all: require('./config/all.js'),
        node: require('./config/node.js')
        },
    socket = io.connect(process.argv[2], {
        port: config.all.socketServerPort
        });

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/client.db');


var myIp = getIpOn(config.all.nicName);
var lastHeard;
var intervalTimer;


//pre-flight, remove me:
if (typeof process.argv[3] !== 'undefined' && process.argv[3] == 'fakeit'){
    mockBlepi();
}

socket.on('connect', function () { 
    console.log("socket connected"); 
    
    socket.emit('subscribe', { room: 'piNodes' });
    
//    socket.emit('hello', { ip: myIp });
    
    socket.on('connect_failed', function (data) {
		console.log('socket connect failed');
		console.log(data);
	});
	
	socket.on('error', function (data) {
		console.log('socket error');
		console.log(data);
	});
	
    
    
    socket.on('report', function(data){
        console.log(data);
        if (typeof data.lastHeard !== 'undefined'){
            db.all("select tagDate, logDate, temp, ambTemp, tagAddr, ipAddr from log where logDate > ?", data.lastHeard, function(err, rows){
               if (err) throw err;
               socket.emit('report', { records: rows });
            });
        }
    });
});


function fakeDataPayload(){
    return {
        tagDate: (new Date()).getTime(),
        logDate: (new Date()).getTime(),
        temp: randomIntFromInterval(40,90),
        ambTemp: randomIntFromInterval(40,90),
        tagAddr: 'BE:3F:20:CA:' + ['2F','5B','7C'][randomIntFromInterval(0,2)],
        ipAddr: myIp
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
    }, config.all.clientMockSampleInterval);
    
}


function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}



function getIpOn(dev){
    var output,
	    ifaces=os.networkInterfaces();

    if (typeof ifaces[dev] === 'undefined'){
	    throw 'network interface ' + dev + 'doesn\'t seem to exist';
    }


    ifaces[dev].forEach(function(details){
    	if (details.family=='IPv4') {
    	    output = details.address;
    	}
    });

    if (typeof output === 'undefined'){
    	throw 'couldnt find your ip on ' + dev;
    }else{
    	return output;
    }
}