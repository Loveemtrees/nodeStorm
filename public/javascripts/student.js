var socket = io();
var replied = false;

socket.on('date', function(data){
    $('#date').text(data.date);
});

$(document).ready(function(){

    // MESSAGE TO HOST------------------------------------

    // check if there's already a question
    socket.emit('check_for_questions', true);
    socket.on('current_question', function (msg){
        if(msg != "") {
            $("#ready_button").removeAttr("disabled");
            $("#questions_active > p").remove();
            $("#questions_active").prepend($("<p>").addClass("lead").text(msg));
        }
    });

    // send reply
    $("form").submit(function () {
        // Build reply locally
        $("#replies").prepend($("<li>").addClass("list-group-item").text($("#m").val()));
        // ... and send to server
        socket.emit("client_message", $("#m").val());
        !replied ? socket.emit("reply_status", true) : "";
        replied = true;
        $("#m").val("");
        return false;
    });
    // Receive Question from host
    socket.on("host_message", function (msg) {
        ready = true;
        replied = false;
        $("#questions_active > p").remove();
        $("#questions_active").prepend($("<p>").addClass("lead").text(msg));
        $("#replies > li").remove();
        $("#questions").prepend($("<li>").addClass("list-group-item").text(msg));
        $("#ready_button").removeAttr("disabled");
    });

});