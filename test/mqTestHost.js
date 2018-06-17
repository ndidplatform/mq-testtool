"use strict";

const http = require('http');
const url = require('url');

var MQRecv = require('../mq/mqrecv.js');
var MQSend = require('../mq/mqsend.js');
var nodeAddrs = [];
var totalSend = 0;
var totalRecv = 0;
let startWhenAtLeastXNodes = 0;
let msgSize = [];
let statistics = [];
let sequence = 0;
let output = "";

console.log('starting app');
// mqtesthost mode port

const portMQ = process.argv[2];
console.log(' MessageQ listening to port ' + portMQ);
var mqNodeSend = new MQSend({});
var mqNodeRecv = new MQRecv({ port: portMQ });

// work on call back
mqNodeSend.on('error', function(msg) {
        console.log("error ")
});

mqNodeSend.on('state', function (msg) {
  console.log(msg);
});

// call back on node received
mqNodeRecv.on('message', function (msg) {
  console.log('received message ' + msg);

  const jsonMessage = JSON.parse(msg);
  const item = {type:jsonMessage.type, message:jsonMessage.message};

  if ( item.type == 'register' ){
      console.log('register');
      for(let i = 0; i < nodeAddrs.length; i++ )
          if(nodeAddrs[i]==item.message){
              console.log('duplicated nodes');
              return;
          }

      nodeAddrs.push(item.message)
  }
  else if ( item.type == 'results') {
      let results = item.message.split(',');
      output += '<tr>';
      for (let i = 0; i < results.length; i++)
         output += "<td>" + results[i] + "</td>";
      output += '</tr>'
  }

});

mqNodeRecv.on('result', function (msg) {
  const jsonMessage = JSON.parse(jsonMessageStr);
  const item = {msg:jsonMessage.msg};
  console.log(msg);

});

  function _send(param) {
      ++sequence;
      let strToSend = JSON.stringify({ID:sequence, type:'CMD', destIP:param.node2.ip, destPort:param.node2.port, sendSize:param.size2Send});

      console.log('sending to ' + JSON.stringify(param));

      mqNodeSend.send({ ip: param.node1.ip, port: param.node1.port }, strToSend);
  }

  function _randomNNodes (numNode) {
      let results = [];
      let totalNodes =  nodeAddrs.length;
      let items =  nodeAddrs.slice();
      if ( totalNodes < numNode  ) {
        console.log('not enough nodes to test')
        return null;
      }
      do {
            results[results.length] = JSON.parse(items.splice(
                                Math.floor(Math.random() * items.length)
                              , 1)[0]);
      } while (results.length < numNode);

      return results;
  }


  function _triggerSend (sendConfig, retryCount=0 ) {
    if (retryCount > sendConfig.numberOfTries){
      console.log("done!!!")
      return;
    }

  console.log("sending to " + JSON.stringify(sendConfig));

    // random num all nodes
    var sendNodes = _randomNNodes ( sendConfig.numNodeAtATime );
    if ( sendNodes == null ){
      console.log("Not enough node to send " + JSON.stringify(sendNodes) );
      return;
    }
    console.log("randomNodes: " + JSON.stringify(sendNodes) );
    // keep on retrying
    for (var i = 0; i< sendConfig.numNodeAtATime; i++) {
        // random 2 nodes
        var results = _randomNNodes (2);
        console.log("randomNodes: " + JSON.stringify(results) );

        let nodeToCall = results[0];
        if (nodeToCall.ip == sendNodes[i].ip && nodeToCall.port == sendNodes[i].port)
            nodeToCall = results[1];

        _send({node1:sendNodes[i], node2:nodeToCall, size2Send:sendConfig.size2Send});
      }

    const timeOut = sendConfig.timeOut;
    let timerId = setTimeout(_triggerSend.bind(this), timeOut, sendConfig, ++retryCount );


  }

  function _start(config) {
      const interval = config.interval;
      const size = config.size;
      const numNodeAtATime = config.numNodeAtOneTime;
      const numberOfTries = config.numberOfTries;

      _triggerSend({timeOut:interval, numberOfTries:numberOfTries, numNodeAtATime:numNodeAtATime, size2Send:size });

  }
// start sending https://localhost:6666?mode="xxxx"mb = "yyyy"
  var server = http.createServer(function (req, res) {
    const urlObj = url.parse(req.url,true);
    if (urlObj.pathname =='/send'){
         const items = urlObj.query;
         console.log (items);

        const pkgSize = items.size || 10000;
        const interval = items.interval || 5000;
        const numNodeAtOneTime = items.numnode || 3;
        const numberOfTries =  items.count || 3;

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end('<p> sending every ' + interval + ' ms, size = ' + pkgSize + ', for ' + numberOfTries + ' times, ' + numNodeAtOneTime + ' at a times');
        _start({interval:interval, size:pkgSize, numNodeAtOneTime:numNodeAtOneTime, numberOfTries:numberOfTries        })

    }
  /*  else if ( url =='/addnode') {

      res.writeHead(200, { "Content-Type": "text/html" });

      nodeAddrs.push(JSON.stringify({ip:'127.0.0.1', port:4445}));
      nodeAddrs.push(JSON.stringify({ip:'127.0.0.1', port:4446}));
      res.end('<p> Node Added </p>');
    }*/
    else if ( urlObj.pathname =='/check') {
      res.writeHead(200, { "Content-Type": "text/html" });
      let totalNodes =  nodeAddrs.length;
      res.write ('<html> \
<head> \
<style> \
table { \
    font-family: arial, sans-serif; \
    border-collapse: collapse; \
    width: 100%;\
}\
\
td, th {\
    border: 1px solid #dddddd;\
    text-align: left;\
    padding: 8px;\
}\
\
tr:nth-child(even) {\
    background-color: #dddddd;\
}\
</style>\
</head>\
<body>');

      for (let i = 0; i< totalNodes; i++) {
        res.write('<p>' + nodeAddrs[i] + ' </p>');
      }

      res.write ('<p> total nodes:' + totalNodes + ' </p>');

      res.write ('<table>' + output + '</table>');
      res.end('</body></html>');
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end('<p> please specify method </p>');
    }
  });

  console.log('HTTP listening to port 8080');
  server.listen(8080);
