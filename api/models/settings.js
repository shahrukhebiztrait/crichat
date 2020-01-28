 

'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var settingSchema = new Schema({

  name: {
    type: String,
    default: null
  },
  value: {
    type: String,
    default: null
  }

});

module.exports = mongoose.model('settings', settingSchema);