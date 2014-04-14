blepimesh
=========

Distributed management and communication for blepisensor nodes


## Setup:
(from the root of the blepimesh directory)
```
npm install
```

That should grab all of the packages Node will need to run.

## Running Server:
```
sudo node app.js
```
You should get a scrolling console output that'll give some up front warnings, then sit.


## Running Client:
```
node client.js <server ip or hostname>
```

As it stands, the client should mock some blepisensor output into its database every 20 seconds.  The server should poll clients for their sensor output every 30 seconds.  You should see that in the server console log (in JSON).  On the client log, you should see the 'last heard' payloads sent by the server's report requests.
