
'use strict';

const userSchema = require('../models/users');
const chatSchema = require('../models/chats');
const groupsModule = require('../routes/app-modules/app-groups');
const _ = require('underscore');
var users = require('./users.js')();
var usersMessagesHandler = require('./usersMessagesHandler.js')();
var Socket = require('socket.io');
var pingInterval = 25 * 1000;



module.exports = function (server) {
  var io = Socket(server, {
    // below are engine.IO options
    pingInterval: pingInterval,
    pingTimeout: 5000,
  });
  /**
   * this for check if the user connect from the app
   */
  io.use(function (socket, next) {
    if (socket.handshake.query) {
      var token = socket.handshake.query.Authorization;
      isUserAuthenticated({
          authorization: token
        })
        .then((user) => {
          //  console.log(" ======= Token valid authorized =====");
          next();
        })
        .catch((err) => {

          //  console.log(" ===== Is not a valid token =====\n ======= Unauthorized to access ===== : " + err);

          next(err);
        });

    }
  });

  io.on('connection', function (socket) {


    /*****************************************************************************************************************************************
     ********************************************* Users Messages Methods  *****************************************************************
     *****************************************************************************************************************************************/
    //method to send messages to recipient
    socket.on('new_user_message_to_server', function (data) {


      if (data.is_group) {
        _.map(data.ids, function (memberId) {
          //  console.log(memberId.toString());
          var user = users.getUser(memberId);
          //  console.log(" =======  the recipeint =====" + user.socketID);
          if (user != null) {
            //check for unsent messages on database to send them

            groupsModule.groupsQueries.checkMemberGroup({
                userId: memberId
              })
              .then((groups) => {

                var promises = [];
                _.forEach(groups, (group) => {

                  usersMessagesHandler.unSentUserMessages({
                      userId: memberId,
                      is_group: true,
                      groupId: group._id
                    })
                    .then((messages) => {
                      //  console.log(" ======= the unsent group message list size is =====" + messages.length);
                      _.forEach(messages, (message) => {

                        //  console.log(" =======  the recipeint =====" + user.socketID);
                        if (user != null)
                          io.to(user.socketID).emit('new_user_message_from_server', message);
                      });

                    })
                    .catch((err) => {
                      reject(new Error('error ' + err));
                      return callback(new Error('error' + err));
                    });
                });


              })
              .catch((err) => {
                //   console.log(" ===== there is no unsent group messages  ===== : " + err);
              });

          }
        });

      } else {
        var user = users.getUser(data.ownerId);
        //  console.log(" =======  the recipeint =====" + user.socketID);
        if (user != null) {
          //check for unsent users messages on database to send them
          usersMessagesHandler.unSentUserMessages({
              userId: user.userId
            })
            .then((messages) => {
              //  console.log(" ======= the unsent message list size is =====" + messages.length);
              _.forEach(messages, (message) => {
                //  console.log(message);
                //  console.log(" =======  the recipeint =====" + user.socketID);
                //
                if (user != null)
                  io.to(user.socketID).emit('new_user_message_from_server', message);

              });

              //next();
            })
            .catch((err) => {

              //   console.log(" ===== there is no unsent message ===== : " + err);

              //next(err);
            });

        }

      }

    });
    //method to update status message to delivered and notify  recipient
    socket.on('update_status_offline_messages_as_delivered', function (data, callback) {

      usersMessagesHandler.makeMessageAsDelivered({
          messageId: data.messageId,
          userId: data.recipientId
        })
        .then((response) => {
          //    console.log(response);
          if (response.success) {

            var user = users.getUser(data.ownerId);
            if (user != null) {
              io.to(user.socketID).emit('update_status_messages_as_delivered', data);
            }
          }


          callback(response);
        }).catch((err) => {
          //  console.log(err);
          callback(err);
        });

    });

    //method to update status message to seen and notify  recipient
    socket.on('update_status_offline_messages_as_seen', function (data, callback) {

      usersMessagesHandler.makeMessageAsSeen({
          messageId: data.messageId,
          userId: data.recipientId
        })
        .then((response) => {
          //console.log(response);
          if (response.success) {

            var user = users.getUser(data.ownerId);
            if (user != null) {
              io.to(user.socketID).emit('update_status_messages_as_seen', data);
            }
          }


          callback(response);
        }).catch((err) => {
          //  console.log(err);
          callback(err);
        });

    });


    //method to update status message to finished and notify  recipient
    socket.on('update_status_offline_messages_as_finished', function (data, callback) {
      usersMessagesHandler.makeMessageAsFinished({
          messageId: data.messageId,
          userId: data.recipientId,
          is_group: data.is_group
        })
        .then((response) => {

        }).catch((err) => {
          //  console.log(err);
          callback(err);
        });

    });


    //method to update status messages  to finished if the sender remove the message
    socket.on('update_status_offline_messages_exist_as_finished', function (data, callback) {
      usersMessagesHandler.makeMessageExistAsFinished({
          messageId: data.messageId
        })
        .then((response) => {

        }).catch((err) => {
          //  console.log(err);
          //callback(err);
        });

    });

    /*****************************************************************************************************************************************
     ********************************************* Stroies   Methods  *****************************************************************
     *****************************************************************************************************************************************/
    //method to send stories to recipient
    socket.on('new_user_story_to_server', function (data) {



      var user = users.getUser(data.ownerId);
      //  console.log(" =======  the recipeint =====" + user.socketID);
      if (user != null) {
        //check for unsent users messages on database to send them
        usersMessagesHandler.unSentUserStories({
            userId: user.userId
          })
          .then((stories) => {
            //   console.log(" ======= the unsent stories list size is =====" + stories.length);
            _.forEach(stories, (story) => {
              //     console.log(story);
              //  console.log(" =======  the recipeint =====" + user.socketID);
              //
              //  if (user != null)
              //  io.to(user.socketID).emit('new_user_story_from_server', story);

            });

            //next();
          })
          .catch((err) => {

            //     console.log(" ===== there is no unsent stories ===== : " + err);

            //next(err);
          });



      }

    });
    //method to update status story to seen and notify  recipient
    socket.on('update_status_offline_stories_as_expired', function (data, callback) {

      usersMessagesHandler.makeStoryAsExpired({
          storyId: data.storyId,
          userId: data.recipientId
        })
        .then((response) => {
          // console.log(response);

          //  callback(response);
        }).catch((err) => {
          // console.log(err);
          //callback(err);
        });

    });

    //method to update status story to seen and notify  recipient
    socket.on('update_status_offline_stories_as_seen', function (data, callback) {

      usersMessagesHandler.makeStoryAsSeen({
          storyId: data.storyId,
          userId: data.recipientId
        })
        .then((response) => {
          //  console.log(response);
          if (response.success) {

            var user = users.getUser(data.ownerId);
            if (user != null) {
              io.to(user.socketID).emit('update_status_stories_as_seen', data);
            }
          }


          callback(response);
        }).catch((err) => {
          //console.log(err);
          callback(err);
        });

    });


    //method to update status story to finished and notify  recipient
    socket.on('update_status_offline_stories_as_finished', function (data, callback) {
      usersMessagesHandler.makeStoryAsFinished({
          storyId: data.storyId,
          userId: data.recipientId
        })
        .then((response) => {

        }).catch((err) => {
          //  console.log(err);
          callback(err);
        });

    });


    //method to update status story  to finished if the sender remove the story
    socket.on('update_status_offline_stories_exist_as_finished', function (data, callback) {
      usersMessagesHandler.makeStoryExistAsFinished({
          storyId: data.storyId
        })
        .then((response) => {

        }).catch((err) => {
          //  console.log(err);
          //callback(err);
        });

    });



    /*****************************************************************************************************************************************
     ********************************************* Calls   Methods  *****************************************************************
     *****************************************************************************************************************************************/
    //method to send call to recipient
    socket.on('new_user_call_to_server', function (data) {
      //console.log("new_user_call_to_servernew_user_call_to_server");

      // console.log(data);
      var user = users.getUser(data.recipientId);
      //  console.log(" =======  the recipeint =====" + user.socketID);
      if (user != null) {
      
        let callObj;
        if (data.status == 'init_call') {
          callObj = {
            'callId': data.callId,
            'call_from': data.call_from,
            'call_id': data.call_id,
            'callType': data.callType,
            'status': data.status,
            'date': data.date,
            'owner': data.owner,
            'missed': false

          }
        } else {
          callObj = {
            'callId': data.callId,
            'call_from': data.call_from,
            'call_id': data.call_id,
            'callType': data.callType,
            'status': data.status,
            'missed': false
          }
        }

        io.to(user.socketID).emit('new_user_call_from_server', callObj);


      }

    });

    //method to update status call to seen and notify  recipient
    socket.on('update_status_offline_calls_as_seen', function (data, callback) {

      usersMessagesHandler.makeCallAsSeen({
          callId: data.callId,
          userId: data.recipientId
        })
        .then((response) => {
          // console.log(response);
          if (response.success) {

            var user = users.getUser(data.ownerId);
            if (user != null) {
              io.to(user.socketID).emit('update_status_calls_as_seen', data);
            }
          }


          callback(response);
        }).catch((err) => {
          //console.log(err);
          callback(err);
        });

    });


    //method to update status call to finished and notify  recipient
    socket.on('update_status_offline_calls_as_finished', function (data, callback) {
      usersMessagesHandler.makeCallAsFinished({
          callId: data.callId,
          userId: data.recipientId
        })
        .then((response) => {

        }).catch((err) => {
          //  console.log(err);
          callback(err);
        });

    });


    //method to update status call  to finished if the sender remove the story
    socket.on('update_status_offline_calls_exist_as_finished', function (data, callback) {
      usersMessagesHandler.makeCallExistAsFinished({
          callId: data.callId
        })
        .then((response) => {
          console.log(response);
        }).catch((err) => {
            console.log(err);
          //callback(err);
        });

    });


    // convenience function to log server messages on the client
  /*  function log() {
      var array = ['Message from server:'];
      array.push.apply(array, arguments);
      socket.emit('log', array);
    }
*/
    socket.on('call_message', function (message) {
     // log('Client said: ', message);
        console.log('Client said: ', message);
      // for a real app, would be room-only (not broadcast)
      //   console.log('Client message room: ', message.room);
      //socket.broadcast.to(message.room).emit('call_message', message);

      var user = users.getUser(data.recipientId);
      if (user != null) {
        io.to(user.socketID).emit('call_message', message);
      }
      /*if (message.message == 'bye') {
        socket.leaveAll();
      }*/
      // socket.broadcast.emit('message', message);
      // io.sockets.in(room).emit('join', room);
    });

    /*  socket.on('bye', function(room) {
      log('Client leave room: ', room);
    //  console.log('Client said: ', room);
      // for a real app, would be room-only (not broadcast)
      socket.broadcast.emit('bye', room);
      socket.leave(room);
    });
*/
/*
    socket.on('create or join', function (room) {
      log('Received request to create or join room ' + room);
      // console.log('Received request to create or join room ' + room);
      var clientsInRoom = io.sockets.adapter.rooms[room];
      var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

      log('Room ' + room + ' now has ' + numClients + ' client(s)');
      // console.log('Room ' + room + ' now has ' + numClients + ' client(s)');
      if (numClients === 0) {
        socket.join(room);
        log('Client ID ' + socket.id + ' created room ' + room);
        //   console.log('Client ID ' + socket.id + ' created room ' + room);
        socket.emit('created', room, socket.id);

      } else if (numClients === 1) {
        log('Client ID ' + socket.id + ' joined room ' + room);
        //  console.log('Client ID ' + socket.id + ' joined room ' + room);
        io.sockets.in(room).emit('join', room);
        socket.join(room);
        socket.emit('joined', room, socket.id);
        io.sockets.in(room).emit('ready');
      } else { // max two clients
        //   console.log('full');
        socket.emit('full', room);
      }
    });*/
    /*****************************************************************************************************************************************
     ********************************************* Users states  Methods  *****************************************************************
     *****************************************************************************************************************************************/
    /**
     * method to check if recipient is Online
     */
    socket.on('is_online', function (data) {
      socket.broadcast.emit('is_online', {
        senderId: data.senderId,
        connected: data.connected
      });
    });

    /**
     * method to check if user is start typing
     */
    socket.on('typing', function (data) {
      var user = users.getUser(data.recipientId);
      if (user != null) {
        io.to(user.socketID).emit('typing', {
          recipientId: data.recipientId,
          senderId: data.senderId
        });
      }
    });

    /**
     * method to check if user is stop typing
     */
    socket.on('stop_typing', function (data) {
      var user = users.getUser(data.recipientId);
      if (user != null) {
        io.to(user.socketID).emit('stop_typing', {
          recipientId: data.recipientId,
          senderId: data.senderId
        });
      }
    });
    /**
     * method to check if member is start typing
     */
    socket.on('member_typing', function (data) {
      socket.broadcast.emit('member_typing', data);
    });

    /**
     * method to check if member is stop typing
     */
    socket.on('member_stop_typing', function (data) {
      socket.broadcast.emit('member_stop_typing', data);
    });


    /**
     * method to send update of image to all users or groups
     */
    socket.on('update_image_profile', function (data) {
      socket.broadcast.emit('update_image_profile', data);
    });


    /**
     * method to notify all users by the new user joined
     */
    socket.on('new_user_has_joined', function (dataString) {
      socket.broadcast.emit('new_user_has_joined', dataString);
    });
    /*****************************************************************************************************************************************
     ********************************************* Users Connection Methods  *****************************************************************
     *****************************************************************************************************************************************/


    //method to check if user is still connect
    socket.on('socket_check_state', function (data, callback) {

      var user = users.getUser(data.ownerId);

      if (user != null) {
        callback({
          connected: true
        });

      } else {
        callback({
          connected: false
        });
      }

    });
    /**
     * Ping/Pong methods to keep connection alive
     * */

    socket.on('socket_pong', function (data) {
      // console.log("Pong received from client ");
    });
    /**/


    setTimeout(sendHeartbeat, pingInterval);

    function sendHeartbeat() {

      setTimeout(sendHeartbeat, pingInterval);
      //here send
      io.sockets.emit('socket_ping', {
        beat: 1
      });
    }


    /**
     * method to save user as connected
     */
    socket.on('socket_user_connect', function (data) {

      //  console.log(" ====> The user with id => " + data.connectedId + " \n<===== connected ====> " + +data.connected + " \n<=== with socket.id ===> " + data.socketId);

      if (data.connectedId != null && data.connectedId != "") {
        var user = users.getUser(data.connectedId);
        if (user != null) {
          users.updateUser(data.connectedId, data.connected, data.socketId);
        } else {
          users.addUser(data.connectedId, data.connected, data.socketId);
        }

        io.sockets.emit('socket_user_connect', {
          connectedId: data.connectedId,
          connected: true,
          socketId: data.socketId
        });
        var usersArray = users.getUsers();
        //console.log("connect cleint :: the users list size is ===> " + usersArray.length);
        var user = users.getUser(data.connectedId);
        //  console.log("connect cleint ::  ===> " + user.userId);

        if (user != null) {
          //check for unsent messages on database to send them
          usersMessagesHandler.unSentUserMessages({
              userId: user.userId
            })
            .then((messages) => {
              //   console.log(" ======= the unsent message list size is =====" + messages.length);
              _.forEach(messages, (message) => {
                //  console.log(message);
                //  console.log(" =======  the recipeint =====" + user.socketID);
                if (user != null)
                  io.to(user.socketID).emit('new_user_message_from_server', message);
              });
              //check for delivered messages on database to notify user
              usersMessagesHandler.deliveredMessages({
                  userId: user.userId
                })
                .then((messages) => {
                  //  console.log(" ======= the delivered message list size is =====" + messages.length);

                  _.forEach(messages, (message) => {
                    //console.log(" =======  the recipeint =====" + user.socketID);
                    //   console.log(message);
                    var dataObject = {
                      messageId: message._id,
                      ownerId: message.sender._id
                    }
                    if (user != null)
                      io.to(user.socketID).emit('update_status_messages_as_delivered', dataObject);

                  });
                  //check for seen messages on database to notify user
                  usersMessagesHandler.seenMessages({
                      userId: user.userId
                    })
                    .then((messages) => {
                      //    console.log(" ======= the seen message list size is =====" + messages.length);

                      _.forEach(messages, (message) => {
                        //console.log(" =======  the recipeint =====" + user.socketID);
                        //      console.log(message);
                        var dataObject = {
                          messageId: message._id,
                          ownerId: message.sender._id,
                          recipientId: message.recipient._id,
                          is_group: message.is_group
                        }
                        if (user != null)
                          io.to(user.socketID).emit('update_status_messages_as_seen', dataObject);

                      });
                    })
                    .catch((err) => {
                      // console.log(" ===== there is no seen message ===== : " + err);
                    });

                })
                .catch((err) => {
                  //  console.log(" ===== there is no delivered message ===== : " + err);
                });
            })
            .catch((err) => {
              // console.log(" ===== there is no unsent message ===== : " + err);
            });

          //check for groups messages

          //check for unsent messages on database to send them
          //
          //
          groupsModule.groupsQueries.checkMemberGroup({
              userId: user.userId
            })
            .then((groups) => {

              var promises = [];
              _.forEach(groups, (group) => {

                usersMessagesHandler.unSentUserMessages({
                    userId: user.userId,
                    is_group: true,
                    groupId: group._id
                  })
                  .then((messages) => {
                    //      console.log(" ======= the unsent group message list size is =====" + messages.length);
                    _.forEach(messages, (message) => {

                      //  console.log(" =======  the recipeint =====" + user.socketID);
                      if (user != null)
                        io.to(user.socketID).emit('new_user_message_from_server', message);
                    });

                    //check for delivered messages on database to notify user
                    usersMessagesHandler.deliveredMessages({
                        userId: user.userId,
                        is_group: true,
                        groupId: group._id
                      })
                      .then((messages) => {
                        // console.log(" ======= the delivered message list size is =====" + messages.length);

                        _.forEach(messages, (message) => {
                          //console.log(" =======  the recipeint =====" + user.socketID);
                          var dataObject = {
                            messageId: message._id,
                            ownerId: message.sender._id
                          }
                          if (user != null)
                            io.to(user.socketID).emit('update_status_messages_as_delivered', dataObject);

                        });
                        //check for seen messages on database to notify user
                        usersMessagesHandler.seenMessages({
                            userId: user.userId,
                            is_group: true,
                            groupId: group._id
                          })
                          .then((messages) => {
                            //      console.log(" ======= the seen message list size is =====" + messages.length);

                            _.forEach(messages, (message) => {
                              //console.log(" =======  the recipeint =====" + user.socketID);
                              var dataObject = {
                                messageId: message._id,
                                ownerId: message.sender._id,
                                recipientId: "fake",
                                is_group: message.is_group
                              }
                              if (user != null)
                                io.to(user.socketID).emit('update_status_messages_as_seen', dataObject);

                            });
                          })
                          .catch((err) => {
                            //   console.log(" ===== there is no seen message ===== : " + err);
                          });

                      })
                      .catch((err) => {
                        //   console.log(" ===== there is no delivered message ===== : " + err);
                      });

                  })
                  .catch((err) => {
                    reject(new Error('error ' + err));
                    return callback(new Error('error' + err));
                  });
              });


            })
            .catch((err) => {
              //console.log(" ===== there is no unsent group messages  ===== : " + err);
            });

          //check for stories
          //check for unsent stories on database to send them

          usersMessagesHandler.unSentUserStories({
              userId: user.userId
            })
            .then((stories) => {
              //    console.log(" ======= the unsent stories list size is =====" + stories.length);
              _.forEach(stories, (story) => {
                //     console.log(story);
                if (user != null)
                  io.to(user.socketID).emit('new_user_story_from_server', story);

              });

            })
            .catch((err) => {
              // console.log(" ===== there is no unsent stories ===== : " + err);
            });
          //check for my own expired stories on database and send them

          usersMessagesHandler.myExpiredStories({
              userId: user.userId
            })
            .then((stories) => {
              //   console.log(" ======= the my expired stories list size is =====" + stories.length);
              _.forEach(stories, (story) => {
                //  console.log(story);
                if (user != null)
                  io.to(user.socketID).emit('new_expired_story_from_server', story);
              });

            })
            .catch((err) => {
              //  console.log(" ===== there is no my expired stories ===== : " + err);
            });

          //check for expired stories on database to send them

          usersMessagesHandler.expiredStories({
              userId: user.userId
            })
            .then((stories) => {
              //   console.log(" ======= the expired stories list size is =====" + stories.length);
              _.forEach(stories, (story) => {
                //   console.log(story);
                if (user != null)
                  io.to(user.socketID).emit('new_expired_story_from_server', story);


              });

            })
            .catch((err) => {
              //   console.log(" ===== there is no expired stories ===== : " + err);
            });

          //check for seen stories on database to notify user
          usersMessagesHandler.seenStories({
              userId: user.userId
            })
            .then((stories) => {
              //   console.log(" ======= the seen story list size is =====" + stories.length);

              _.forEach(stories, (story) => {
                //console.log(" =======  the recipeint =====" + user.socketID);

                //    console.log(story);
                var dataObject = {
                  storyId: story._id,
                  users: story.seen
                }
                // console.log(dataObject);
                if (user != null)
                  io.to(user.socketID).emit('update_status_stories_as_seen', dataObject);

              });
            })
            .catch((err) => {
              //  console.log(" ===== there is no seen story ===== : " + err);
            });

          //check for calls
          //check for unsent calls on database to send them

          usersMessagesHandler.unSentUserCalls({
              userId: user.userId
            })
            .then((calls) => {
              //   console.log(" ======= the unsent calls list size is =====" + calls.length);
              _.forEach(calls, (call) => {
                //  console.log(call);



                let callObj;

                callObj = {
                  'callId': call.callId,
                  'call_from': call.call_from,
                  'call_id': call.call_id,
                  'callType': call.callType,
                  'status': 'init_call',
                  'date': call.date,
                  'owner': call.owner,
                  'missed': true
                }

                    if (user != null)
                      io.to(user.socketID).emit('new_user_call_from_server', callObj);

              });

            })
            .catch((err) => {
              //   console.log(" ===== there is no unsent calls ===== : " + err);
            });

          //check for seen calls on database to notify user
          usersMessagesHandler.seenCalls({
              userId: user.userId
            })
            .then((calls) => {
              //    console.log(" ======= the seen call list size is =====" + calls.length);

              _.forEach(calls, (call) => {
                //console.log(" =======  the recipeint =====" + user.socketID);
                //   console.log(call);
                var dataObject = {
                  callId: call._id,
                  users: call.seen
                }
                //   console.log(dataObject);
                if (user != null)
                  io.to(user.socketID).emit('update_status_call_as_seen', dataObject);

              });
            })
            .catch((err) => {
              //   console.log(" ===== there is no seen call ===== : " + err);
            });

        }


      }


    });


    /**
     * method if a user is disconnect from sockets
     * and then remove him from array of current users connected
     */
    socket.on('disconnect', function () {
      var usersArray = users.getUsers();
      if (usersArray.length != 0) {
        for (var i = 0; i < usersArray.length; i++) {
          var user = usersArray[i];
          if (user != null) {

            if (user.socketID == socket.id) {
              //  console.log("the user with id => " + user.userId + " <=  is disconnect system ");
              io.sockets.emit('socket_user_connect', {
                connectedId: user.userId,
                connected: false,
                socketId: user.socketID
              });

              users.removeUser(user.userId);
              //  console.log("disconnect system :: the users list size is => " + usersArray.length);
              break;
            }
          } else {
            // console.log("disconnect system :: the user is null  ");

          }


        }
      }
    });
    socket.on('socket_user_disconnect', function (data) {

      if (data.connectedId != null && !data.connectedId != "") {

        // console.log("the user with id => " + data.connectedId + " <= is disconnect  client");


        var user = users.getUserBySocketID(data.socketId);
        if (user != null) {

          io.sockets.emit('socket_user_connect', {
            connectedId: user.userId,
            connected: false,
            socketId: user.socketID
          });

          users.removeUser(user.userId);

        }
      }
    });
    /*****************************************************************************************************************************************
     ********************************************* Groups Messages Methods  *****************************************************************
     *****************************************************************************************************************************************/

  });
};



/**
 * check if user token is valid
 **/
let isUserAuthenticated = (options, callback) => {
  callback = callback || function () {};
  return new Promise((resolve, reject) => {
    userSchema.findOne({
      auth_token: options.authorization
    }).select('_id').exec(
      (err, user) => {
        if (err) {
          reject(new Error('error ' + err));
          return callback(new Error('error' + err));
        }
        if (!user) {
          reject(new Error('user not connected'));
          return callback(new Error('user not connected'));
        }
        resolve(user);
        return callback(null, user);
      });


  });
};