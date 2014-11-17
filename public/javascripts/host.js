var socket = io();
var replies = [];

socket.on('date', function(data){
    $('#date').text(data.date);
});

$(document).ready(function(){

    // MESSAGE TO CLIENTS------------------------------------>
    $("form").submit(function () {
        socket.emit("host_message", $("#m").val());
        $("#replies > li").remove();
        $("#messages > .list-group-item").removeClass("active");
        $("#messages").prepend($("<li>").addClass("list-group-item active").text($("#m").val()));
        $("#replyCounter").text("Noch niemand hat geantwortet");
        replies = [];
        $("#m").val("");
        return false;
    });
    socket.on("client_message", function (msg) {
        if($("#messages .list-group-item:first-of-type").is(".active")) {
            $("#replies").prepend($("<li>").addClass("list-group-item").text(msg));
        }
        replies ++;
        $("#messages .list-group-item:first-of-type span").remove();
        $("#messages .list-group-item:first-of-type").append($("<span>").addClass("badge").text(replies));
    });
    socket.on("counter_update", function (msg) {
        $("#connected_count").text(msg);
    });
    // receive the requested replies and implement into DOM-tree
    socket.on("requested_replies", function (msg) {
        console.log(msg);
        $("#replies li").remove();
        for (var i = 0; i < msg.length; i++){
            var reply = msg[i];
            $("#replies").prepend($("<li>").fadeIn("slow").addClass("list-group-item").text(reply));
        }
    });
    socket.on("replyCounter", function (msg) {
        $("#replyCounter").text(msg+ " Personen haben geantwortet");
    });
    // --------------------------------------------------------

    // click on a message list element will send a request for related replies to server
    $("#messages").on("click", ".list-group-item", function(){
        if( !$(this).is(":first-of-type") ){
            $("#messages > .list-group-item").removeClass("active");
            $(this).addClass("active");
            var textWithoutNumber = $(this).text().replace(/[0-9]/g, '');
            socket.emit("get_replies", textWithoutNumber);
        }
    });
    $("#messages").on("click", ".list-group-item:first-child", function(){
        $("#messages > .list-group-item").removeClass("active");
        $(this).addClass("active");
        // Clean text from number of badge
        var textWithoutNumber = $(this).text().replace(/[0-9]/g, '');
        socket.emit("get_replies_for_actual", textWithoutNumber );
    });


});