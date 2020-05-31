var server = 'localhost';
//var BOSH_SERVICE = 'http://127.0.0.1:7070/http-bind/';
var BOSH_SERVICE = 'ws:/127.0.0.1:7070/ws/';
var ROOM = 'prova@conference.' + server;
var ROOM_SERVICE = 'conference.' + server;
var connection = null;
var cUser = null;
var sItem = null;
var sItemType = null;
messages = [];

function log(msg) {
  //$('#log').append('<div></div>').append(document.createTextNode(msg));
  console.log(msg);
}

function onConnect(status) {

  cUser = $('#jid').get(0).value;
  $('#user').html(cUser);

  if (status == Strophe.Status.CONNECTING) {
    log('Strophe is connecting.');
  } else if (status == Strophe.Status.CONNFAIL) {
    log('Strophe failed to connect.');
    updateConnButton(false);
  } else if (status == Strophe.Status.DISCONNECTING) {
    log('Strophe is disconnecting.');
  } else if (status == Strophe.Status.DISCONNECTED) {
    log('Strophe is disconnected.');
    updateConnButton(false);
  } else if (status == Strophe.Status.CONNECTED) {
    log('Strophe is connected.');
    getRoster();
    updateConnButton(true);
    // set presence
    connection.send($pres());
    // set handlers
    connection.addHandler(onMessage, null, 'message', null, null, null);
    connection.addHandler(onSubscriptionRequest, null, "presence", "subscribe");
    connection.addHandler(onPresence, null, "presence");
    //listRooms();
    connection.muc.init(connection);

  }
}

function getHistory(){
  log('getHistory');

  var query = {"with": sItem, "before": '', "max":'', onMessage: onHistoryMessage};
  console.log(query);

  if(messages){
    var a = messages[sItem];

    if(a != null){
      for (var i = 0; i < a.length; i++){
        var b = a[i];
        var message = b.body;
        var from = b.from;
        var time = b.sentDate;
        printMessages(message, from, time);
      }
      var lmt = b.sentDate;
      lmt.setSeconds(lmt.getSeconds() + 1);
      query.start = lmt.toISOString();
    }
  }
  connection.mam.query(cUser, query);
}

function printMessages(message, from, time){
  log('printMessages');
  if(from == cUser){
    $('#messages').append('<div class="left"><em>'+time+'</em><br><b>'+from+'</b><br> '+ message+'<br><br></div>');
  }else{
    $('#messages').append('<div class="right"><em>'+time+'</em><br><b>'+from+'</b><br> '+ message+'<br><br></div>');
  }
  var objDiv = document.getElementById("messages");
  objDiv.scrollTop = objDiv.scrollHeight;
}

function onHistoryMessage(message){
  log('onHistoryMessage');
	try {
    var id = message.querySelector('result').getAttribute('id');
    var fwd = message.querySelector('forwarded');
    var d = fwd.querySelector('delay').getAttribute('stamp');
    var msg = fwd.querySelector('message');
    var msg_data = {
      id:id,
      with: Strophe.getBareJidFromJid(msg.getAttribute('to')),
      timestamp: (new Date(d)),
      timestamp_orig: d,
      from: Strophe.getBareJidFromJid(msg.getAttribute('from')),
      fromResource: Strophe.getResourceFromJid(msg.getAttribute('from')),
      to: Strophe.getBareJidFromJid(msg.getAttribute('to')),
      type: msg.getAttribute('type'),
      body: msg.getAttribute('body'),
      message: Strophe.getText(msg.getElementsByTagName('body')[0])
    };
    var time = moment(msg_data.timestamp).format('MMMM Do YYYY, hh:mm:ss');
    var cMsg = {from: msg_data.from, to: msg_data.to, body: msg_data.message, sentDate: msg_data.timestamp};
    var index;

    if (msg_data.from == cUser){
      index = msg_data.to;
    }
    else{
      index = msg_data.from;
    }

    if (!messages[index]){
      messages[index] = [];
    }
    messages[index].push(cMsg);
    log(messages);

    if (msg_data.from == sItem || msg_data.from == cUser){

      if(msg_data.type == "chat"){

        if(msg_data.from == cUser){
          $('#messages').append('<div class="left"><em>'+time+'</em><br><b>'+msg_data.from+'</b><br> '+ msg_data.message+'<br><br></div>');
        }else{
          $('#messages').append('<div class="right"><em>'+time+'</em><br><b>'+msg_data.from+'</b><br> '+ msg_data.message+'<br><br></div>');
        }
      }

      if(msg_data.type == "groupchat"){

        if(msg_data.from != sItem){
        }
        if(msg_data.fromResource == cUser){
          $('#messages').append('<div class="left"><em>'+time+'</em><br><b>'+ msg_data.fromResource+'</b><br> '+ msg_data.message+'<br><br></div>');
        }else{
          $('#messages').append('<div class="right"><em>'+time+'</em><br><b>'+msg_data.fromResource+'</b><br> '+ msg_data.message+'<br><br></div>');
        }
      }
    }
    var objDiv = document.getElementById("messages");
    objDiv.scrollTop = objDiv.scrollHeight;
  }
  catch(err){
      if(typeof(err) == 'TypeError'){
          try {
              console.log(err.stack)
          } catch(err2){
              console.log(err,err2);
          }
      }
  }
  return true;
}

function onMessage(msg) {
  log('onMessage');
  var from = Strophe.getBareJidFromJid(msg.getAttribute('from'));
  if (from){
    var to = msg.getAttribute('to');
    var fromResource = Strophe.getResourceFromJid(msg.getAttribute('from'));
    var type = msg.getAttribute('type');
    var elems = msg.getElementsByTagName('body');
    var time = moment().format('MMMM Do YYYY, hh:mm:ss');
    var body = elems[0];

    if ((type == "chat" || type == "groupchat") && elems.length > 0) {

      if (from == sItem){

        if(from == cUser || fromResource == cUser){
          $('#messages').append('<div class="left"><em>'+time+'</em><br><b>'+(type == "chat" ? from : fromResource)+'</b><br> '+ Strophe.getText(body)+'<br><br></div>');
        }
        else{
          $('#messages').append('<div class="right"><em>'+time+'</em><br><b>'+(type == "chat" ? from : fromResource)+'</b><br> '+ Strophe.getText(body)+'<br><br></div>');
        }
        var objDiv = document.getElementById("messages");
        objDiv.scrollTop = objDiv.scrollHeight;
      }

      else{
        $('div[jid="'+ from +'"]').addClass("newmsg");
      }
    }
  }
  return true;
}

function setStatus(s) {
  log('setStatus: ' + s);
  var status = $pres().c('show').t(s);
  connection.send(status);
}

function subscribePresence(jid) {
  log('subscribePresence: ' + jid);
  connection.send($pres({
    to: jid,
    type: "subscribe"
  }));
}

function getPresence(jid) {
  log('getPresence: ' + jid);
  var check = $pres({
    type: 'probe',
    to: jid
  });
  connection.send(check);
}

function getRoster() {
  log('getRoster');
  var iq = $iq({
    type: 'get'
  }).c('query', {
    xmlns: 'jabber:iq:roster'
  });
  connection.sendIQ(iq, rosterCallback);
}

function rosterCallback(iq) {
  log('rosterCallback:');
  $(iq).find('item').each(function() {
    var jid = $(this).attr('jid'); // The jabber_id of your contact
    // You can probably put them in a unordered list and and use their jids as ids.
    log('	>' + jid);
    log('	>' + $(this).attr('name'));
    var contact = {};
    contact.jid = $(this).attr('jid');
    contact.name = $(this).attr('name');
    addContact(contact);
  });
}

function addContact(contact){

  var result = /@conference\./.test(contact.jid);

  if(result){
    $('#rooms').append('<div onClick="selectRoom(\''+contact.jid+'\',\''+contact.name+'\', this);" jid="'+contact.jid+'" class="room"><span class="name">'+contact.name+'</span></div>');
    connection.muc.join(contact.jid, cUser, room_msg_handler, room_pres_handler, roster_cb, null, { maxstanzas: 0});
  }else{
    $('#users').append('<div class="user-row unavailable"><div class="user" jid="'+contact.jid+'" onClick="selectUser(\''+contact.jid+'\',\''+contact.name+'\', this);"><span class="name">'+contact.name+'</span></div></div>');
    getPresence(contact.jid);
  }
}

function selectUser(jid, name, dElem){

  sItemType = 'user';
  sItem = jid;
  sItemName = name;
  $('#messages').html("");
  $('.user').removeClass('selected');
  $('.room').removeClass('selected');
  $(dElem).removeClass('newmsg');
  $(dElem).addClass('selected');
  $('#who').html(sItemName);
  getHistory();
}

function selectRoom(jid, name, dElem){

  sItemType = 'room';
  sItem = jid;
  sItemName = name;
  $('#messages').html("");
  $('.room').removeClass('selected');
  $('.user').removeClass('selected');
  $(dElem).removeClass('newmsg');
  $(dElem).addClass('selected');
  $('#who').html(sItemName);
  getHistory();
}

function sendMessage(){
  log('sendMessage');
  var msg = $('#msg').val();
  $('#msg').val("");
  var time = moment().format('MMMM Do YYYY, hh:mm:ss');

  if (sItemType == 'user'){
    var m = $msg({
      to: sItem,
      from: cUser,
      type: 'chat',
    }).c("body").t(msg);
    connection.send(m);
    $('#messages').append('<div class="left"><em>'+time+'</em><br><b>'+cUser+'</b><br> '+ msg+'<br><br></div>');
  }
  else{
    connection.muc.message(sItem, null, msg);
  }
  var objDiv = document.getElementById("messages");
  objDiv.scrollTop = objDiv.scrollHeight;
}

function onSubscriptionRequest(stanza) {
  if (stanza.getAttribute("type") == "subscribe") {
    var from = $(stanza).attr('from');
    log('onSubscriptionRequest: from=' + from);
    // Send a 'subscribed' notification back to accept the incoming
    // subscription request
    connection.send($pres({
      to: from,
      type: "subscribed"
    }));
  }
  return true;
}

function roster_cb(){
  
}

function onPresence(presence) {
  
  log('onPresence');
  var from = $(presence).attr('from'); // the jabber_id of the contact
  var presence_type = $(presence).attr('type'); // available, unavailable
  var show = $(presence).find("show").text(); // away, dnd, etc.
  from = Strophe.getBareJidFromJid(from);
  log('onPresence:'+from);
  var result = /@conference\./.test(from);

  //if user
  if(!result){
    if(show =='away'){
      var presence = 'away';
    }
    else if(show == 'dnd'){
      var presence = 'dnd';
    }
    else if (presence_type == 'unavailable'){
      var presence = 'unavailable';
    }
    else if (!presence_type){
      var presence = 'available';
    }
    
    setPresence(from, presence);
  }
  return true;
}

function setPresence(from, presence){
  if(from == cUser){
    $('#user').removeClass('unavailable').removeClass('available').removeClass('dnd').removeClass('away');
    $('#user').addClass(presence);
  }else{
    $('div[jid="'+ from +'"]').parent().removeClass('unavailable').removeClass('available').removeClass('dnd').removeClass('away');
    $('div[jid="'+ from +'"]').parent().addClass(presence);
  }
}

function listRooms() {
  connection.muc.listRooms(mydomain, function(msg) {
    log("listRooms - success: ");
    $(msg).find('item').each(function() {
      var jid = $(this).attr('jid'),
        name = $(this).attr('name');
      log('	>room: ' + name + ' (' + jid + ')');
    });
  }, function(err) {
    log("listRooms - error: " + err);
  });
}

function enterRoom(room) {
  log("enterRoom: " + room);
  connection.muc.init(connection);
  connection.muc.join(room, $('#jid').get(0).value, room_msg_handler, room_pres_handler);
  //connection.muc.setStatus(room, $('#jid').get(0).value, 'subscribed', 'chat');
}

function room_msg_handler(a, b, c) {
  log('MUC: room_msg_handler');
  return true;
}

function room_pres_handler(a, b, c) {
  log('MUC: room_pres_handler');
  return true;
}

function exitRoom(room) {
  log("exitRoom: " + room);
  //TBD
}

function register() {
	var registerCallback = function (status) {
		if (status === Strophe.Status.REGISTER) {
			log("registerCallback: REGISTER");
			connection.register.fields.username = $('#reg_name').get(0).value;
			connection.register.fields.password = $('#reg_pass').get(0).value;
			console.log(connection.register.fields);
			connection.register.submit();
		} else if (status === Strophe.Status.REGISTERED) {
			log("registerCallback: REGISTERED");
			$('#jid').get(0).value = $('#reg_name').get(0).value + "@" + server;
			$('#pass').get(0).value = $('#reg_pass').get(0).value;
			connection.authenticate();
		} else if (status === Strophe.Status.CONNECTED) {
			log("registerCallback: CONNECTED");
			// set presence
      connection.send($pres());
      updateConnButton(true);
		} else if (status === Strophe.Status.CONFLICT) {
			log("registerCallback: Contact already existed!");
		} else if (status === Strophe.Status.NOTACCEPTABLE) {
			log("registerCallback: Registration form not properly filled out.")
		} else if (status === Strophe.Status.REGIFAIL) {
			log("registerCallback: The Server does not support In-Band Registration")
		} else {
			// every other status a connection.connect would receive
		}
	};
	
	if (!connection) {
		var url = BOSH_SERVICE;
		connection = new Strophe.Connection(url);
		connection.rawInput = rawInput;
		connection.rawOutput = rawOutput;
	}
	connection.register.connect(server, registerCallback);
}

function rawInput(data) {
  console.log('RECV: ' + data);
}

function rawOutput(data) {
  console.log('SENT: ' + data);
}

function updateConnButton(connected) {
    var button = $('#connect').get(0);
    if (connected) {
      button.value = 'disconnect';
    } else {
      button.value = 'connect';
    }
}

$(document).ready(function() {
  $('#jid').get(0).value = 'user1@'+server;
  $('#pass').get(0).value = 'user1'
  $('#connect').bind('click', function(){
  	if (!connection) {
  		var url = BOSH_SERVICE;
  		connection = new Strophe.Connection(url);
  		connection.rawInput = rawInput;
      connection.rawOutput = rawOutput;
  	}
    var button = $('#connect').get(0);
    if (button.value == 'connect'){
      connection.connect($('#jid').get(0).value, $('#pass').get(0).value, onConnect);
      $('#login').css('display','none');
      $('#main').css('display','block');
    }
  });
  
	$("#btnRegister").bind('click', function () {
		register();
	});

  $('#btnGetPres').bind('click', function() {
    var jid = $('#to').val();
    getPresence(jid);
  });

  $('#btnSubPres').bind('click', function() {
    var jid = $('#to').val();
    subscribePresence(jid);
  });

  $('#btnAway').bind('click', function() {
    setStatus('away');
  });

  $('#room').val(ROOM);

  $('#btnEnter').bind('click', function() {
    enterRoom($('#room').val());
  });

  $('#btnExit').bind('click', function() {
    exitRoom($('#room').val());
  });

  $('#msg').keypress(function(e){
    if(e.keyCode === 13 && !e.shiftKey){
      sendMessage();
      return false;
    } 
  }); 
});