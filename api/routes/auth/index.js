

'use strict';

const authRoute = require('express').Router();
const authController = require('../../controllers/authController');


authRoute
  .get('/accountKit', authController.account_kit)
  .post('/join', authController.join_user)
  .post('/verifyUser', authController.verify_user)
  .post('/resend', authController.resend_sms)
  .post('/deleteAccount', authController.delete_account)
  .post('/deleteConfirmation', authController.delete_confirmation);



module.exports = authRoute;