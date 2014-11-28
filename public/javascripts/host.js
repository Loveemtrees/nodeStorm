var socket = io();
var replies = [];

$(document).ready(function(){

    // STATUS ---------------------------------------------
    socket.on('connect_error', function(err) {
        $("#connected").hide();
        $("#disconnected").show();
        $("#connection").removeClass("connection-ok");
        $("#connection").addClass("connection-broken");
    });
    socket.on('connect', function() {
        $("#disconnected").hide();
        $("#connected").show();
        $("#connection").removeClass("connection-broken");
        $("#connection").addClass("connection-ok");
    });

    // MESSAGE TO CLIENTS------------------------------------>
    $("form").submit(function () {
        socket.emit("host_message", $("#m").val());
        $("#replies > li").remove();
        $("#messages > .list-group-item").removeClass("active");
        $("#messages").prepend($("<li>").addClass("list-group-item active").text($("#m").val()));
        $("#reply_count").text("0");
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
    // receive the requested replies and implement into DOM-tree
    socket.on("requested_replies", function (msg) {
        console.log(msg);
        $("#replies li").remove();
        for (var i = 0; i < msg.length; i++){
            var reply = msg[i];
            $("#replies").prepend($("<li>").fadeIn("slow").addClass("list-group-item").text(reply));
        }
    });
    // Users replied to current question
    socket.on("replyCounter", function (msg) {
        $("#reply_count").text(msg);
    });
    // Users connected
    socket.on("counter_update", function (msg) {
        $("#connected_count").text(msg);
    });
    socket.on("save_ok", function (msg) {
        $('#download').show();
    });
    // --------------------------------------------------------

    // click on a message list element will send a request for related replies to server
    $("#messages").on("click", ".list-group-item", function(){
        if( !$(this).is(":first-of-type") ){
            $("#messages > .list-group-item").removeClass("active");
            $(this).addClass("active");
            // Clean text from number of badge
            var textWithoutNumber = $(this).text().replace(/\d+$/, '');
            socket.emit("get_replies", textWithoutNumber);
        }
    });
    $("#messages").on("click", ".list-group-item:first-child", function(){
        $("#messages > .list-group-item").removeClass("active");
        $(this).addClass("active");
        // Clean text from number of badge
        var textWithoutNumber = $(this).text().replace(/\d+$/, '');
        socket.emit("get_replies_for_actual", textWithoutNumber );
    });
    // Save button - tell node server
    $("#save").on("click",  function(){
        socket.emit("save", true);
    });
    // Download button - hide on click
    $("#download").on("click",  function(){
        $('#download').hide();
    });

});