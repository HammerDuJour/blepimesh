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
mockBlepi();


socket.on('connect', function () { 
    console.log("socket connected"); 
    
    socket.emit('hello', { ip: myIp });
    
    
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
        tagAddr: 'BE:3F:20:CA:23',
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
    }, 30000);
    
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