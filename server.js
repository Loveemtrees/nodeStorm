var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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
io.on('connection', function(socket){
    //send data to client
    console.log("a user connected");
    setInterval(function(){
        socket.emit('date', {'date': new Date()});
    }, 1000);

    //receive host data
    socket.on('host_message', function(msg){
        io.emit("host_message", msg);
    });

    //receive client data
    socket.on('client_message', function(msg){
        io.emit("client_message", msg);
    });

});
