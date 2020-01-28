
'use strict';
const EventEmitter = require('events');
const _ = require('underscore');
const notificationQueries = require('./lib/event-queries');
class UserAction extends EventEmitter {}
const userAction = new UserAction();

userAction.on("notification", (options) => {

  
  notificationQueries.sendNotification(options);


});
module.exports = userAction;