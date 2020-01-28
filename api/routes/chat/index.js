

'use strict';

const chatRoute = require('express').Router();
const chatController = require('../../controllers/chatController');

chatRoute
  .get('/all', chatController.get_conversations)
  .get('/getSingleConversation/:otherUserId', chatController.get_single_conversation)
  .get('/getSingleGroupConversation/:groupId', chatController.get_single_group_conversation)
  .post('/sendMessage', chatController.send_message)
  .delete('/deleteMessage/:messageId', chatController.delete_message)
  .delete('/deleteConversation/:conversationId', chatController.delete_conversation);


module.exports = chatRoute;