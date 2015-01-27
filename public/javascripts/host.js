var socket = io();
var replies = [];

$(document).ready(function(){

    // STATUS ---------------------------------------------
    socket.on('connect_error', function (err) { // disconnect
        $("#ip").hide();
        $("#connected").hide();
        $("#disconnected").show();
        $("#connection").removeClass("connection-ok");
        $("#connection").addClass("connection-broken");
    });
    socket.on('connect', function () { // connected
        socket.emit("get_ip", true);
        $("#ip").show();
        $("#disconnected").hide();
        $("#connected").show();
        $("#connection").removeClass("connection-broken");
        $("#connection").addClass("connection-ok");
    });

    // MESSAGE TO CLIENTS------------------------------------>
    $("form").submit(function () {
        socket.emit("host_message", $("#m").val());                         // send out the question
        $("#replies > li").remove();                                        // remove replies from DOM
        $("#messages > .list-group-item").removeClass("active");            // unmark last question as active
        $("#messages").prepend($("<li>").addClass("list-group-item active")
            .text($("#m").val()));                                          // insert new question to the list
        $("#reply_count").text("0");                                        // reset reply count display
        replies = [];                                                       // reset local replies array
        $("#m").val("");                                                    // empty input field
        return false;
    });
    socket.on("client_message", function (msg) {
        if ($("#messages .list-group-item:first-of-type").is(".active")) {           // check if current question is selected
            $("#replies").prepend($("<li>").addClass("list-group-item").text(msg)); // insert replies into DOM
        }
        replies++;                                                                 // increment local replies array
        $("#messages .list-group-item:first-of-type span").remove();                // remove old badge
        $("#messages .list-group-item:first-of-type").append($("<span>")
            .addClass("badge").text(replies));                                      // insert badge with reply count
    });
    // receive the requested replies and implement into DOM-tree
    socket.on("requested_replies", function (msg) {
        $("#replies li").remove();                          // remove replies from DOM
        for (var i = 0; i < msg.length; i++) {               // run through replies
            var reply = msg[i];                             // current reply
            $("#replies").prepend($("<li>").fadeIn("slow")
                .addClass("list-group-item").text(reply));  // let reply appear in DOM
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
    // Save successful
    socket.on("save_ok", function (msg) {
        $('#download').show();
    });
    // Receive IP
    socket.on("server_ip", function (msg) {
        $("#ip").text('Users can connect via this address: ' + msg);
    });

    // --------------------------------------------------------

    // click on a message list element will send a request for related replies to server
    $("#messages").on("click", ".list-group-item", function () {          // click on a question
        if (!$(this).is(":first-of-type")) {                            // if old question
            $("#messages > .list-group-item").removeClass("active");    // unmark current question as active
            $(this).addClass("active");                                 // mark clicked question active
            // clean text from number of badge
            var textWithoutNumber = $(this).text().replace(/\d+$/, ''); // regex to remove numbers
            socket.emit("get_replies", textWithoutNumber);              // send cleaned string to server
        }
    });
    // make clicked item active and send content to server
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