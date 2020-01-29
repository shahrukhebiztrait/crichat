
'use strict';

const config = require('../config.js');
const f = require('util').format;
//Use dotenv to read .env vars into Node
//require('dotenv').config();
// Development specific configuration
// ==================================


// Connection URL
const url = f('mongodb://%s:%s@%s:27017/%s?authMechanism=%s&authSource=%s&w=1', config.db.username, config.db.password, config.db.serverName,config.db.name, config.db.authMechanism, config.db.name);

module.exports = {

  // MongoDB connection options
  mongo: {
    uri: "mongodb://localhost:27017/whatsclone"  
  },
  seedDB: true
};