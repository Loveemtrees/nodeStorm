var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var HashMap = require('hashmap').HashMap;

var connectCounter = -1;

var lastQuestion = "";
var currentQuestion = "";
var map = new HashMap();
var replies = [];
var replyCounter = 0;

// Mapping (Route Handlers)
app.get('/', function(req, res){
    res.send("<h1>Hello! Try the <a href='/student'>Student page</a></h1><br>" +
    "<h1>OR Try the <a href='/host'>Host page</a></h1>");
});
app.get('/student', function(req, res){
    res.sendFile(__dirname + '/public/student.html');
});
app.get('/host', function(req, res){
    res.sendFile(__dirname + '/public/host.html');
});
app.get('/style.css', function(req, res){
    res.sendFile(__dirname + '/public/style.css');
});

// define port
http.listen(8001, function(){
    console.log('listening on Port :8001');
});

// define interactions with client
io.on('connection', function(socket) {
    //send data to client

    // log and count
    console.log("a user connected");
    connectCounter++;
    console.log(connectCounter);
    io.emit("counter_update", connectCounter);

    // messages
    // date
    setInterval(function () {
        socket.emit('date', {'date': new Date()});
    }, 1000);

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
            map.forEach(function (value, key) {
                console.log(key + " : " + value);
            });
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
        console.log(connectCounter);
        io.emit("counter_update", connectCounter);
    });

    // after request with question as string, check hashMap and send corresponding replies
    socket.on('get_replies', function(msg){
        console.log(map.get(msg));
        io.emit('requested_replies', map.get(msg));
    });

    // for the active question we reply with the current replies array
    socket.on('get_replies_for_actual', function(){
        io.emit('requested_replies', replies);
    });

    // send current question to client for when he connected after question has been sent
    socket.on('check_for_questions', function(){
        io.emit('current_question', currentQuestion);
    });
});

