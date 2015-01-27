var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var HashMap = require('hashmap').HashMap;
var ip = require('ip');

var connectCounter = -1;
var lastQuestion = "";
var currentQuestion = "";
var map = new HashMap();
var replies = [];
var replyCounter = 0;
var port = 8001;


// Mapping (Route Handlers) ----------------------------------------------------------
app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/student.html');
});
app.get('/host', function(req, res){
    res.sendFile(__dirname + '/views/host.html');
});
app.get('/download', function(req, res){
    var file = __dirname + '/repliesOfSession.txt';
    res.download(file);
});
// serve static files
app.use(express.static('public'));
// 404
app.use(function(req, res, next){
    res.status(404).send('<h1>404 - Sorry cannot find that!</h1>');
});
// mapping end ------------------------------------------------------------------------

// define port
http.listen(port, function () {
    console.log('listening on Port ' + port);
    console.log(ip.address() + ':' + port);
});

// define interactions with client ---------------------------------
io.on('connection', function(socket) {

    // log, count and emit connects
    console.log("a user connected");
    connectCounter++;
    io.emit("counter_update", connectCounter); // send updated connect counter


    //receive and emit host data
    socket.on('host_message', function (msg) {
        currentQuestion = msg;              // set current question
        io.emit("host_message", msg);       // send out question
        replyCounter = 0;                   // reset replyCounter
        if (lastQuestion != "") {           // if not first ever question
            map.set(lastQuestion, replies); // save last question and replies in hashmap
            lastQuestion = msg;             // save question
            replies = [];                   // empty replies
        } else {                            // on first question
            lastQuestion = msg;             // save question
        }
    });

    //receive and emit client data
    socket.on('client_message', function (msg) {
        io.emit("client_message", msg); // send out replies
        replies.push(msg);              // save replies in array
    });

    // receive true msg on first reply from client
    socket.on("reply_status", function (msg){
        msg ? replyCounter++ : "";  // increment counter if first reply
        io.emit("replyCounter", replyCounter);
    });

    // log, count and emit disconnects
    socket.on('disconnect', function(){
        console.log("a user disconnected");
        connectCounter--;
        io.emit("counter_update", connectCounter); // send updated connect counter
    });

    // after request with question as string, check hashMap and send corresponding replies
    socket.on('get_replies', function(msg){
        socket.emit('requested_replies', map.get(msg));
    });

    // for the active question we reply with the current replies array
    socket.on('get_replies_for_actual', function(){
        socket.emit('requested_replies', replies);
    });

    // send current question to client for when he connected after question has been sent
    socket.on('check_for_questions', function(){
        socket.emit('current_question', currentQuestion);
    });

    // send server ip to host
    socket.on('get_ip', function () {
        var address = ip.address() + ':' + port;
        socket.emit('server_ip', address);
    });

    // save reply-matrix to file
    socket.on('save', function(){
        var data = [];
        var dataString;

        data.push("AUDIENCE RESPONSE SESSION of " + new Date() + "\n\n\n");                     // heading
        map.forEach(function (value, key) {                                                     // run through hashmap
            data.push("*** Frage ***\n" + key + " :\n" + value.join("\n") + "\n\n");           // save each question and replies
        });
        data.push("*** Frage ***\n" + currentQuestion + " :\n" + replies.join("\n") + "\n\n"); // save current question and replies
        data.push("---------- END ---------- ");

        dataString = data.join("");                                                            // no commas

        fs.writeFile('repliesOfSession.txt', dataString, function (err) {                      // write result to file
            if (err) return console.log(err);                                                  // log errors
            else {
                io.emit('save_ok', true);
            }                                                 // send success msg
        });
    });

});

