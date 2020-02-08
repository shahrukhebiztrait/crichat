


'use strict';


const userSchema = require('../models/users');
const config = require('../../config/environment');
const jwt = require('jsonwebtoken');
const compose = require('composable-middleware');
var async = require('async');
var mongoose = require('mongoose'),
  Users = mongoose.model('users'),
  mongo = require('mongodb'),
  ObjectID = mongo.ObjectID;
const adminModule = require('../routes/app-modules/app-admin');
var https = require("https");

/**
 * @api {post} /api/v1/auth/Join 1. User registration
 * @apiVersion 0.1.0
 * @apiName UserRegistration
 * @apiGroup  Authentication
 * @apiSuccess {Boolean} success Response Status.
 * @apiSuccess {String}  message The response message.
 * @apiSuccessExample {json} Success-Response:
 * {
 *  success: true,
 *  message: 'SMS request is initiated! You will be receiving it shortly.'
 *  }
 */
exports.join_user = function (req, res) {
  console.log("join_user");
  req.checkBody('country', 'The country field is required').notEmpty();
  req.checkBody('phone', 'The phone field is required').notEmpty();
  let errors = req.validationErrors();
  if (errors) {
    res.send({
      success: false,
      message: errors[0].msg,
      phone: null
    });

  } else {


    async.parallel({
        settings: function (cb) {
          adminModule.adminQueries.getSettings()
            .then((settings) => {
              cb(null, settings);

            })
            .catch((err) => {

              cb(null);
            });
        }

      },
      function everything(err, results) {
        if (err || !results.settings)
          return res.send({
            success: false,
            message: 'Sorry! Error occurred in registration. '
          });
        var v_code = Math.floor(100000 + Math.random() * 900000);
        var sms_verification = results.settings.sms_verification;
        var app_name = results.settings.app_name;
        var from_number = results.settings.phone_number;
        var authKey = results.settings.sms_authentication_key;
        var account_sid = results.settings.account_sid;
        var is_account_kit = req.body.account_kit;
        if (is_account_kit) {

          if (req.body.client_token == results.settings.client_token) {

            https.get('https://graph.accountkit.com/v1.3/me/?access_token=' + req.body.access_token, (resp) => {


              var responseString = "";
              resp.on('data', (data) => {
                responseString += data;

              });
              resp.on("end", function () {
                if (resp.statusCode != 200) {
                  //var object1 = process.stdout.write(ojbect)
                  var obj = JSON.parse(responseString);



                  return res.send({
                    success: false,
                    message: 'Sorry! Error occurred in registration. '
                  });
                } else {
                  var obj = JSON.parse(responseString);

                  if (obj.id == req.body.account_id && obj.phone.number == req.body.phone) {

                    //return true;


                    var data = {
                      country: req.body.country,
                      phone: req.body.phone
                    };


                    userSchema.findOne(data).lean().exec(function (err, user) {
                      if (err) {
                        return res.send({
                          success: false,
                          message: 'Sorry! Error occurred in registration.',
                          userID: null,
                          token: null,
                          hasProfile: false
                        });

                      } else {
                        var generated_token = generate_token(req.body.phone);
                        if (!user) {
                          let users = new Users({
                            country: req.body.country,
                            phone: req.body.phone,
                            verify_code: v_code,
                            auth_token: generated_token,
                            activated: true
                          });
                          // Attempt to save the new user
                          users.save(function (err, userInserted) {
                            if (err) {
                              return res.send({
                                success: false,
                                message: 'Sorry! Error occurred in registration.',
                                userID: null,
                                token: null,
                                hasProfile: false
                              });

                            } else {

                              //insert default status for user
                              var data = [{
                                  _id: new ObjectID(),
                                  userId: userInserted._id,
                                  body: "Only Emergency calls",
                                  current: false
                                },
                                {
                                  _id: new ObjectID(),
                                  userId: userInserted._id,
                                  body: "Busy",
                                  current: false
                                }, {
                                  _id: new ObjectID(),
                                  userId: userInserted._id,
                                  body: "At work",
                                  current: false
                                }, {
                                  _id: new ObjectID(),
                                  userId: userInserted._id,
                                  body: "In a meeting",
                                  current: false
                                }, {
                                  _id: new ObjectID(),
                                  userId: userInserted._id,
                                  body: "Available",
                                  current: false
                                }, {
                                  _id: new ObjectID(),
                                  userId: userInserted._id,
                                  body: "Playing football",
                                  current: false
                                }, {
                                  _id: new ObjectID(),
                                  userId: userInserted._id,
                                  body: "Hey i am using " + app_name + " enjoy it",
                                  current: true
                                }
                              ];
                              userInserted.status = data;
                              /*  for (var i = 0; i < data.length; i++) {

                                  if (i == data.length - 1) {
                                    userInserted.status.push({
                                      _id: new ObjectID(),
                                      userId: userInserted._id,
                                      body: data[i],
                                      current: true
                                    });
                                  } else {
                                    userInserted.status.push({
                                      _id: new ObjectID(),
                                      userId: userInserted._id,
                                      body: data[i],
                                      current: false
                                    });

                                  }
                                }*/

                              userInserted.save((err) => {
                                if (err) {

                                  return res.send({
                                    success: false,
                                    message: 'Sorry! Error occurred in registration.',
                                    userID: null,
                                    token: null,
                                    hasProfile: false
                                  });

                                }
                              });

                              return res.send({
                                success: true,
                                message: 'Your account has been created successfully.',
                                userID: userInserted._id,
                                token: userInserted.auth_token,
                                hasProfile: false
                              });
                            }
                          });
                        } else {


                          var data = {
                            country: req.body.country,
                            verify_code: v_code,
                            auth_token: generated_token,
                            activated: true
                          }
                          userSchema.findOneAndUpdate({
                            phone: req.body.phone
                          }, data, {
                            new: true
                          }, function (err, user) {
                            if (err) {


                              return res.send({
                                success: false,
                                message: 'Sorry! Error occurred in registration.',
                                userID: null,
                                token: null,
                                hasProfile: false
                              });

                            } else {
                              if (!user) {


                                return res.send({
                                  success: false,
                                  message: 'Sorry! Error occurred in registration.',
                                  userID: null,
                                  token: null,
                                  hasProfile: false
                                });
                              } else {


                                return res.send({
                                  success: true,
                                  message: 'Your account has been created successfully.',
                                  userID: user._id,
                                  token: user.auth_token,
                                  hasProfile: false
                                });
                              }
                            }
                          });


                        }
                      }
                    });
                  } else {
                    //return false;


                    return res.send({
                      success: false,
                      message: 'Sorry! Error occurred in registration. '
                    });
                  }
                }
              });

            }).on('error', (e) => {


              return res.send({
                success: false,
                message: 'Sorry! Error occurred in registration. '
              });
            });
          } else {
            return res.send({
              success: false,
              message: 'Sorry! Error occurred in registration. '
            });
          }

        } else {

          var data = {
            country: req.body.country,
            phone: req.body.phone
          };


          userSchema.findOne(data).lean().exec(function (err, user) {
            if (err) {
              return res.send({
                success: false,
                message: 'Sorry! Error occurred in registration. '
              });
            } else {
              var generated_token = generate_token(req.body.phone);
              if (!user) {
                let users = new Users({
                  country: req.body.country,
                  phone: req.body.phone,
                  verify_code: v_code,
                  auth_token: generated_token,
                  activated: false
                });
                // Attempt to save the new user
                users.save(function (err, userInserted) {
                  if (err) {
                    return res.send({
                      success: false,
                      message: 'Sorry! Error occurred in registration. '
                    });

                  } else {

                    //insert default status for user
                    var data = ["Only Emergency calls", "Busy", "At work", "in a meeting", "Available", "Playing football", "Hey i am using " + app_name + " enjoy it"];
                    for (var i = 0; i < data.length; i++) {

                      if (i == data.length - 1) {
                        userInserted.status.push({
                          _id: new ObjectID(),
                          userId: userInserted._id,
                          body: data[i],
                          current: true
                        });
                      } else {
                        userInserted.status.push({
                          _id: new ObjectID(),
                          userId: userInserted._id,
                          body: data[i],
                          current: false
                        });

                      }
                    }

                    userInserted.save((err) => {
                      if (err) {
                        return res.send({
                          errorUserStatus: true,
                          message: err
                        });
                      }
                    });


                    if (sms_verification == 'on') {
                      sendMessageThroughTwilio(userInserted.phone, userInserted.verify_code, app_name, from_number, authKey, account_sid);
                    }
                    return res.send({
                      success: true,
                      message: 'SMS request is initiated! You will be receiving it shortly.'
                    });
                  }
                });
              } else {
                var data = {
                  country: req.body.country,
                  verify_code: v_code,
                  auth_token: generated_token,
                  activated: false
                }
                userSchema.findOneAndUpdate({
                  phone: req.body.phone
                }, data, {
                  new: true
                }, function (err, user) {
                  if (err) {
                    return res.send({
                      success: false,
                      message: 'Sorry! Error occurred in registration. '
                    });

                  } else {
                    if (!user) {
                      return res.send({
                        success: false,
                        message: 'Sorry! Error occurred in registration. '
                      });
                    } else {

                      if (sms_verification == 'on') {

                        sendMessageThroughTwilio(user.phone, user.verify_code, app_name, from_number, authKey, account_sid);
                      }
                      return res.send({
                        success: true,
                        message: 'SMS request is initiated! You will be receiving it shortly .'
                      });
                    }
                  }
                });


              }
            }
          });
        }
      });


  }
};


/**
 * @api {post} /api/v1/auth/verifyUser 2. SMS verification
 * @apiVersion 0.1.0
 * @apiName SMSVerification
 * @apiGroup  Authentication
 * @apiSuccess {Boolean} success Response Status.
 * @apiSuccess {String} message  The response message.
 * @apiSuccess {String} userID user Unique Id.
 * @apiSuccess {String} token User session token.
 * @apiSuccess {Boolean} hasProfile User has profile.
 * @apiParam {String} code  the code get by user by sms .
 * @apiSuccessExample {json} Success-Response:
 * {
 *  success: true,
 *  message: 'Your account has been created successfully.',
 *  userID: '59efb0f8e5c51c09193eeaee',
 *  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IisyMTI2MzM5MDk2ODEiLCJpYXQiOjE1MDg4ODA2MzIsImV4cCI6MTUwODg4MjA3Mn0.5aZ8VG4To3Y1DWqosulw1swMTg2SYTNltfGIOY61r_k',
 *  hasProfile: false
 *  }
 */
exports.verify_user = function (req, res) {

  req.checkBody('code', 'The code field is required').notEmpty();
  let errors = req.validationErrors();
  if (errors) {

    res.send({
      success: false,
      message: errors[0].msg,
      userID: null,
      token: null,
      hasProfile: false
    });
  } else {
    let data = {
      activated: true

    }
    userSchema.findOneAndUpdate({
      verify_code: req.body.code,
      activated: false
    }, data, {
      new: true
    }, function (err, user) {
      if (err) {
        return res.send({
          success: false,
          message: 'Failed to activate your account try again or resend sms to get new code.',
          userID: null,
          token: null,
          hasProfile: false
        });


      } else {

        if (!user) {
          return res.send({
            success: false,
            message: 'Failed to activate your account try again or resend sms to get new code.',
            userID: null,
            token: null,
            hasProfile: false
          });

        } else {

          return res.send({
            success: true,
            message: 'Your account has been created successfully.',
            userID: user._id,
            token: user.auth_token,
            hasProfile: false
          });
        }
      }
    });
  }
};




/**
 * @api {post} /api/v1/auth/resend 3. Resend SMS verification
 * @apiVersion 0.1.0
 * @apiName RsendSMSVerification
 * @apiGroup  Authentication
 * @apiSuccess {Boolean} success Response Status.
 * @apiSuccess {String} message  The response message.
 * @apiParam {String} phone  the user number phone .
 * @apiSuccessExample {json} Success-Response:
 * {
 *  success: true,
 *  message: 'SMS request is Resend! You will be receiving it shortly .'
 *  }
 */
exports.resend_sms = function (req, res) {

  req.checkBody('phone', 'The phone field is required').notEmpty();
  let errors = req.validationErrors();
  if (errors) {
    return res.send({
      success: false,
      message: errors[0].msg
    });
  } else {


    async.parallel({
        settings: function (cb) {
          adminModule.adminQueries.getSettings()
            .then((settings) => {
              cb(null, settings);
            })
            .catch((err) => {
              cb(null);
            });
        }

      },
      function everything(err, results) {
        if (err)
          return res.send({
            success: false,
            message: 'Sorry! Error occurred in registration. '
          });


        var v_code = Math.floor(100000 + Math.random() * 900000);
        var sms_verification = results.settings.sms_verification;
        var app_name = results.settings.app_name;
        var from_number = results.settings.phone_number;
        var authKey = results.settings.sms_authentication_key;
        var account_sid = results.settings.account_sid;
        var phone = req.body.phone;

        var dataBody = {
          phone: req.body.phone
        };

        userSchema.findOne(dataBody).lean().exec(function (err, user) {
          if (err) {
            return res.send({
              success: false,
              message: 'Sorry! Error occurred . '
            });
          }

          if (user) {
            var data = {
              verify_code: v_code
            }
            userSchema.findOneAndUpdate(dataBody, data, {
              new: true
            }, function (err, user) {
              if (err) {
                return res.send({
                  success: false,
                  message: 'Sorry! Error occurred . '
                });

              } else {
                if (!user) {
                  return res.send({
                    success: false,
                    message: 'Sorry! Error occurred . '
                  });
                } else {


                  if (sms_verification == 'on') {
                    sendMessageThroughTwilio(user.phone, user.verify_code, app_name, from_number, authKey, account_sid);
                  }
                  return res.send({
                    success: true,
                    message: 'SMS request is Resend! You will be receiving it shortly .'
                  });
                }
              }
            });
          } else {
            return res.send({
              success: false,
              message: 'Sorry! Error occurred . '
            });
          }
        });
      });
  }
};

/**
 * @api {post} /api/v1/auth/deleteAccount 4. delete Account  SMS verification
 * @apiVersion 0.1.0
 * @apiName deleteAccount
 * @apiGroup  Authentication
 * @apiSuccess {Boolean} success Response Status.
 * @apiSuccess {String} message  The response message.
 * @apiParam {String} phone  the user number phone .
 * @apiSuccessExample {json} Success-Response:
 * {
 *  success: true,
 *  message: 'SMS request is send! You will be receiving it shortly .'
 *  }
 */
exports.delete_account = function (req, res) {

  req.checkBody('phone', 'The phone field is required').notEmpty();
  let errors = req.validationErrors();
  if (errors) {
    return res.send({
      success: false,
      message: errors[0].msg
    });
  } else {


    async.parallel({
        settings: function (cb) {
          adminModule.adminQueries.getSettings()
            .then((settings) => {
              cb(null, settings);
            })
            .catch((err) => {
              cb(null);
            });
        }

      },
      function everything(err, results) {
        if (err)
          return res.send({
            success: false,
            message: 'Sorry! Error occurred in registration. '
          });


        var v_code = Math.floor(100000 + Math.random() * 900000);
        var sms_verification = results.settings.sms_verification;
        var app_name = results.settings.app_name;
        var from_number = results.settings.phone_number;
        var authKey = results.settings.sms_authentication_key;
        var account_sid = results.settings.account_sid;
        var phone = req.body.phone;
        var is_account_kit = req.body.account_kit;
        if (is_account_kit) {

          if (req.body.client_token == results.settings.client_token) {


            https.get('https://graph.accountkit.com/v1.3/me/?access_token=' + req.body.access_token, (resp) => {


              var responseString = "";
              resp.on('data', (data) => {
                responseString += data;

              });
              resp.on("end", function () {
                if (resp.statusCode != 200) {
                  //var object1 = process.stdout.write(ojbect)
                  var obj = JSON.parse(responseString);



                  return res.send({
                    success: false,
                    message: 'Failed to deactivate your account try again or resend sms to get new code.',
                    userID: null,
                    token: null,
                    hasProfile: false
                  });
                } else {
                  var obj = JSON.parse(responseString);

                  if (obj.id == req.body.account_id && obj.phone.number == req.body.phone) {

                    //return true;


                    var dataBody = {
                      phone: req.body.phone,
                      country: req.body.country
                    };

                    userSchema.findOne(dataBody).lean().exec(function (err, user) {
                      if (err) {
                        return res.send({
                          success: false,
                          message: 'Failed to deactivate your account try again or resend sms to get new code.',
                          userID: null,
                          token: null,
                          hasProfile: false
                        });
                      }

                      if (user) {
                        var data = {
                          verify_code: v_code
                        }
                        userSchema.findOneAndUpdate(dataBody, data, {
                          new: true
                        }, function (err, user) {
                          if (err) {
                            return res.send({
                              success: false,
                              message: 'Failed to deactivate your account try again or resend sms to get new code.',
                              userID: null,
                              token: null,
                              hasProfile: false
                            });

                          } else {
                            if (!user) {
                              return res.send({
                                success: false,
                                message: 'Failed to deactivate your account try again or resend sms to get new code.',
                                userID: null,
                                token: null,
                                hasProfile: false
                              });
                            } else {


                              return res.send({
                                success: true,
                                message: 'Your account has been deleted successfully.',
                                userID: user._id,
                                token: user.auth_token,
                                hasProfile: false
                              });
                            }
                          }
                        });
                      } else {
                        return res.send({
                          success: false,
                          message: 'Failed to deactivate your account try again or resend sms to get new code.',
                          userID: null,
                          token: null,
                          hasProfile: false
                        });
                      }
                    });

                  } else {
                    //return false;


                    return res.send({
                      success: false,
                      message: 'Failed to deactivate your account try again or resend sms to get new code.',
                      userID: null,
                      token: null,
                      hasProfile: false
                    });
                  }
                }
              });

            }).on('error', (e) => {


              return res.send({
                success: false,
                message: 'Failed to deactivate your account try again or resend sms to get new code.',
                userID: null,
                token: null,
                hasProfile: false
              });
            });
          } else {
            return res.send({
              success: false,
              message: 'Failed to deactivate your account try again or resend sms to get new code.',
              userID: null,
              token: null,
              hasProfile: false
            });
          }

        } else {
          var dataBody = {
            phone: req.body.phone,
            country: req.body.country
          };

          userSchema.findOne(dataBody).lean().exec(function (err, user) {
            if (err) {
              return res.send({
                success: false,
                message: 'Sorry! Error occurred . '
              });
            }

            if (user) {
              var data = {
                verify_code: v_code
              }
              userSchema.findOneAndUpdate(dataBody, data, {
                new: true
              }, function (err, user) {
                if (err) {
                  return res.send({
                    success: false,
                    message: 'Sorry! Error occurred . '
                  });

                } else {
                  if (!user) {
                    return res.send({
                      success: false,
                      message: 'Sorry! Error occurred . '
                    });
                  } else {
                    if (sms_verification == 'on') {
                      sendMessageThroughTwilio(user.phone, user.verify_code, app_name, from_number, authKey, account_sid);
                    }
                    return res.send({
                      success: true,
                      message: 'SMS request is Resend! You will be receiving it shortly .'
                    });
                  }
                }
              });
            } else {
              return res.send({
                success: false,
                message: 'Sorry! Error occurred . '
              });
            }
          });
        }


      });
  }
};

/**
 * @api {post} /api/v1/auth/deleteConfirmation 5. Delete account confirmation
 * @apiVersion 0.1.0
 * @apiName deleteConfirmation
 * @apiGroup  Authentication
 * @apiSuccess {Boolean} success Response Status.
 * @apiSuccess {String} message  The response message.
 * @apiSuccess {String} userID user Unique Id.
 * @apiSuccess {String} token User session token.
 * @apiSuccess {Boolean} hasProfile User has profile.
 * @apiParam {String} code  the code get by user by sms .
 * @apiSuccessExample {json} Success-Response:
 * {
 *  success: true,
 *  message: 'Your account has been deleted successfully.'
 *  }
 */
exports.delete_confirmation = function (req, res) {

  req.checkBody('code', 'The code field is required').notEmpty();
  let errors = req.validationErrors();
  if (errors) {

    res.send({
      success: false,
      message: errors[0].msg,
      userID: null,
      token: null,
      hasProfile: false
    });
  } else {
    let data = {
      activated: false

    }
    userSchema.findOneAndUpdate({
      verify_code: req.body.code,
      activated: true
    }, data, {
      new: true
    }, function (err, user) {
      if (err) {
        return res.send({
          success: false,
          message: 'Failed to deactivate your account try again or resend sms to get new code.',
          userID: null,
          token: null,
          hasProfile: false
        });


      } else {

        if (!user) {
          return res.send({
            success: false,
            message: 'Failed to deactivate your account try again or resend sms to get new code.',
            userID: null,
            token: null,
            hasProfile: false
          });

        } else {

          return res.send({
            success: true,
            message: 'Your account has been deleted successfully.',
            userID: user._id,
            token: user.auth_token,
            hasProfile: false
          });
        }
      }
    });
  }
};
/**
 * send verification code by twilio
 */
function sendMessageThroughTwilio(to_number, code, app_name, from_number, authKey, account_sid) {
  var otp_prefix = ':';

  //Your message to send, Add URL encoding here.
  console.log("code " + code);

  var message = "Hello,Welcome to " + app_name + ". Your Verification code is " + otp_prefix + " " + code;

  //require the Twilio module and create a REST client
  var client = require('twilio')(account_sid, authKey);
 console.log("to_number", to_number);
 
  client.messages.create({
    to: "+91" + to_number,
    from: from_number,
    body: message,
  }, function (err, message) {
           console.log(`err ${err} , message ${message}`);
           
  });

}



/**
 * generate a jwt token signed by the app secret and return it
 */
function generate_token(phone) {
  return jwt.sign({
    phone: phone
  }, config.jwt_secret.session, {
    //  expiresIn: config.jwt_secret.token_expiration //token doesn't expire forever
    expiresIn: config.jwt_secret.token_expiration //token doesn't expire forever
  });

}



/**
 * @api {get} /api/v1/auth/accountKit 6.Check account account_kit
 * @apiVersion 0.1.0
 * @apiName checkAccountKit
 * @apiGroup  Authentication
 * @apiSuccess {Boolean} success Response Status.
 * @apiSuccess {String} message  The response message.
 * @apiParam {String} enabled  if account kit enabled by admin .
 * @apiSuccessExample {json} Success-Response:
 * {
 *  success: true,
 *  message: 'The value has been exist .',
 *  enabled: true
 *  }
 */
exports.account_kit = function (req, res) {

  adminModule.adminQueries.getSetting({
      name: "sms_fb_verification"
    }).then((setting) => {
      if (setting.value == 'on') {

        return res.send({
          success: true,
          message: "The value has been exist .",
          enabled: true
        });
      } else {
        return res.send({
          success: true,
          message: "The value has been exist .",
          enabled: false
        });
      }
    })
    .catch((err) => {
      return res.send({
        success: false,
        message: "Error : " + err.message
      });

    });
};

exports.get_settings = function (req, res) {

  adminModule.adminQueries.getSettings()
    .then((settings) => {
      return res.send(settings);
    })
    .catch((err) => {
      return res.send({
        success: false,
        message: "Error : " + err.message
      });
    });
};

/**
 *
 *get expiresIn time by days
 */
function expiresIn(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}


/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isUserAuthenticated() {
  return compose()
    // Attach user to request
    .use(function (req, res, next) {
      /*  var authorization;
        // allow access_token to be passed through query parameter as well
        if (req.query && req.query.hasOwnProperty('access_token')) {
          req.headers.authorization = 'Bearer ' + req.query.access_token;
        }*/

      userSchema.findOne({
        auth_token: req.headers.authorization
      }).select('_id').exec(
        (err, user) => {
          if (err) return next(err);
          if (!user) {
            return res.send({
              success: false,
              message: 'Unauthorized'
            });
          } else {

            req.user = user;
            next();
          }
        });
    });
}

// middleware function to check for logged-in  admin
function sessionChecker() {

  return compose()
    // Attach user to request
    .use(function (req, res, next) {
      if (req.session.user && req.cookies.user_sid) {
        next();
      } else {
        return res.send({
          success: false,
          message: 'Unauthorized'
        });
      }
    });
};

exports.sessionChecker = sessionChecker;
exports.isUserAuthenticated = isUserAuthenticated;