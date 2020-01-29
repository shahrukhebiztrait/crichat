

'use strict';
let config = {};  
config.db = {}; 
 
 
config.db.password = "root"; 
config.db.username =  "root"; 
config.db.name = "whatsclone"; 
config.db.serverName =  "localhost"; 
config.db.authMechanism = 'SCRAM-SHA-1';
   
module.exports = config;