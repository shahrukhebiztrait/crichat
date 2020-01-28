

'use strict';

const filesRoute = require('express').Router();
const filesController = require('../../controllers/filesController');

filesRoute
  .get('/:location/:filename', filesController.get_file)
  .get('/:location/:sub_location/:filename', filesController.get_file_sub_location)
  .post('/:location/', filesController.upload.single('file'), filesController.create) //for general files
  .post('/:location/:sub_location', filesController.upload.single('file'), filesController.create_sub_location); //for user avatars


module.exports = filesRoute;