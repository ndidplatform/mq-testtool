

const http = require('http')
var MQRecv = require('../mq/mqrecv.js');
var MQSend = require('../mq/mqsend.js');

var totalSend = 0;
var totalRecv = 0;

console.log('starting app'  );
  const stats = [];
  const ipMQ = process.argv[2];
  const portMQ = process.argv[3];
  const serverIP = process.argv[4];
  const serverPort = process.argv[5];
  const timeoutMQ = 100000; //process.argv[6];
  const totalTimeoutMQ = 300000; ///process.argv[7];
  let cacheMsgSize = 0;
  var str2Send = "";

  console.log ( "self ip " + ipMQ + ":" + portMQ + " host: " + serverIP + ":" + serverPort);

  var str2Send = "";

  var mqNodeSend = new MQSend({ timeout: timeoutMQ, totalTimeout:totalTimeoutMQ });

  var mqNodeRecv = new MQRecv({port: portMQ, maxMsgSize: -1});
  mqNodeRecv.on('message', function(msg){
    //    console.log('received message: ' + msg );

        const param = JSON.parse(msg);

        if (param.type == 'CMD')
        {
          const destIP = param.destIP;
          const destPort = param.destPort;
          const ID = param.ID
          const sendSize = param.sendSize / 100;

          // refresh cache if needed
          if ( cacheMsgSize != sendSize ) {
            str2Send = "";
            for(var i = 0; i < sendSize ; i++) {
                str2Send += "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890";
            }
            cacheMsgSize = sendSize;
          }

          var d = new Date();
          stats[ID] = d.getTime();
          mqNodeSend.send({ip:destIP, port:destPort}, JSON.stringify({type:'TEST', ID:ID, srcIP:ipMQ, srcPort:portMQ, message:str2Send}));

        }
        else if (param.type == 'TEST') {
          const destIP = param.srcIP;
          const destPort = param.srcPort;
          const ID = param.ID;


          mqNodeSend.send({ip:destIP, port:destPort}, JSON.stringify({type:'ACK', ID:ID, senderIP:ipMQ, senderPort:portMQ}));

        }
        else if (param.type == 'ACK') {
          const ID = param.ID;
          const dest = "dest: " + param.senderIP + ":" + param.senderPort;
          const src = "src: " + ipMQ + ":" + portMQ;
          var d = new Date();
          var diff =  d.getTime() - stats[ID];
          console.log('diff = ' + diff);
          //report resultsm
          mqNodeSend.send({ip:serverIP, port:serverPort}, JSON.stringify({type:'results', message:ID + ", " + src + ", " + dest +", "+ diff  }));

        }


})



  mqNodeSend.on('error', function (err) {
        console.log('error received' + err );
  });

  mqNodeSend.on('state', function(msg){
        console.log(msg);
  });

  mqNodeSend.send({ip:serverIP, port:serverPort}, JSON.stringify({type:'register', message:JSON.stringify({ip:ipMQ, port:portMQ})}));
