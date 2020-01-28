
'use strict';
const config = require('../config.js');
const f = require('util').format;
const url = f('mongodb://%s:%s@%s:27017/%s?authMechanism=%s&authSource=%s&w=1', config.db.username, config.db.password, config.db.serverName,config.db.name, config.db.authMechanism, config.db.name);

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip: process.env.OPENSHIFT_NODEJS_IP ||
    process.env.IP ||
    undefined,

  // Server port
  port: process.env.OPENSHIFT_NODEJS_PORT ||
    process.env.PORT ||
    8080,

  // MongoDB connection options
  mongo: {
    uri: url 
  }
};