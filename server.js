var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var HashMap = require('hashmap').HashMap;

var connectCounter = -1;
var lastQuestion = "";
var currentQuestion = "";
var map = new HashMap();
var replies = [];
var replyCounter = 0;

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
    res.send(404, '<h1>404 - Sorry cannot find that!</h1>');
});
// mapping end ------------------------------------------------------------------------

// define port
http.listen(8001, function(){
    console.log('listening on Port :8001');
});

// define interactions with client ---------------------------------
io.on('connection', function(socket) {
    //send data to client

    // log and count
    console.log("a user connected");
    connectCounter++;
    io.emit("counter_update", connectCounter);

    // messages
    // ping
    setInterval( function(){ socket.emit("ping", true); }, 3000);

    //receive and emit host data
    socket.on('host_message', function (msg) {
        currentQuestion = msg;
        io.emit("host_message", msg);
        // receive replies for new question set to 0
        replyCounter = 0;
        // save question and replies in hashmap when new question sent
        if (lastQuestion != "") {
            map.set(lastQuestion, replies);
            lastQuestion = msg;
            replies = [];
        } else {
            lastQuestion = msg;
        }
    });

    //receive and emit client data
    socket.on('client_message', function (msg) {
        io.emit("client_message", msg);
        replies.push(msg);
    });

    // receive true msg on first reply from client
    socket.on("reply_status", function (msg){
        msg ? replyCounter++ : "";
        //map.get(currentQuestion).length;
        io.emit("replyCounter", replyCounter);
    });

    socket.on('disconnect', function(){
        // log and count
        console.log("a user disconnected");
        connectCounter--;
        io.emit("counter_update", connectCounter);
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

    // save reply-matrix to file
    socket.on('save', function(){
        var data = [];
        var dataString;

        data.push("AUDIENCE RESPONSE SESSION of " + new Date() +"\n\n\n");
        map.forEach(function(value, key) {
            data.push("*** Frage ***\n" + key + " :\n" + value.join("\n") + "\n\n");
        });
        data.push("*** Frage ***\n" + currentQuestion + " :\n" + replies.join("\n") + "\n\n");
        data.push("---------- END ---------- ");

        dataString = data.join("");

        fs.writeFile('repliesOfSession.txt', dataString, function (err) {
            if (err) return console.log(err);
            else { io.emit('save_ok', true); }
        });
    });

});

