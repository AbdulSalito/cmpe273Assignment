    jQuery(function($){
      var socket = io.connect();
      var $msgForm = $('#msgForm');
      var $msg = $('#msg');
      var $RecUserID = $('#RecUserID');
      var $SndUserID = $('#SndUserID');
      var $RecUserName = $('#RecUserName');
      var $SndUserName = $('#SndUserName');
      var $chatID = $('#chatID');
      var $chat = $('#chatLog');
      // keep the scroll at the bottom 
      //$chat.scrollTop = $chat.scrollHeight;
      $chat.animate({ scrollTop: $('#chatLog')[0].scrollHeight}, 500);
      
      //if ($chat.scrollHeight > $chat.clientHeight) {
      //   - $chat.clientHeight;
      //}
      socket.emit('openChat', {chat: $chatID.val()});
      /*socket.on('startChat', function(data) {
        
      });*/
      
      $msgForm.submit(function(e){
        e.preventDefault();
        socket.emit('send', { data: {msg: $msg.val(),
         RecUserID: $RecUserID.val(), 
         SndUserID: $SndUserID.val(),
         RecUserName: $RecUserName.val(), 
         SndUserName: $SndUserName.val(),
         chatID: $chatID.val()
       }
       });
        $msg.val('');
        return false;
      });

      socket.on('message', function(data){
        $chat.append('<strong>'+ data.data.SndUserName +': </strong>' + data.data.msg +'<br />');
      });
    });