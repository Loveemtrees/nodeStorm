var http = require('http');
var url = require('url');
var fs = require('fs');
var server;

server = http.createServer(function(req, res){
    // your normal server code

    //MAPPING
    var path = url.parse(req.url).pathname;
    switch (path){
        case '/':
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<h1>Hello! Try the <a href="/public/student.html">Student page</a></h1><br>' +
                      '<h1>OR Try the <a href="/public/host.html">Host page</a></h1> ');
            res.end();
            break;
        case '/public/student.html':
            fs.readFile(__dirname + path, function(err, data){
                if (err){ 
                    return send404(res);
                }
                res.writeHead(200, {'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'});
                res.write(data, 'utf8');
                res.end();
            });
        case '/public/host.html':
            fs.readFile(__dirname + path, function(err, data){
                if (err){
                    return send404(res);
                }
                res.writeHead(200, {'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'});
                res.write(data, 'utf8');
                res.end();
            });
        case '/public/style.css':
            fs.readFile(__dirname + path, function(err, data){
                if (err) return send404(res);
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(data, 'utf-8');
                res.end();
            });
        break;
        default: send404(res);
    }
});

send404 = function(res){
    res.writeHead(404);
    res.write('404');
    res.end();
};

server.listen(8001);

// use socket.io
var io = require('socket.io').listen(server);

//turn off debug
io.set('log level', 1);

// define interactions with client
io.sockets.on('connection', function(socket){
    //send data to client
    setInterval(function(){
        socket.emit('date', {'date': new Date()});
    }, 1000);

    //receive client data - NOT USED
    socket.on('client_data', function(data){
        process.stdout.write(data.letter);
    });

    //receive host data
    socket.on('host_message', function(msg){
        io.emit("host_message", msg);
    });

    //receive client data
    socket.on('client_message', function(msg){
        io.emit("client_message", msg);
    });
});
