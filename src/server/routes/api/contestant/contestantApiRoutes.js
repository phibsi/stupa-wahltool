'use strict';

const Express = require('express');
const ContestantApiController = require('../../../controller/api/contestant/contestantApiController');
const ImageUploadInterceptor = require('../../../helper/imageUploadInterceptor');

module.exports = class ContestantApiRoutes extends Express.Router {
  constructor() {
    super();
    this.get('/', ContestantApiController.find);
    this.post('/', ImageUploadInterceptor.getSingleInterceptorForName('contestantPhoto'), ContestantApiController.save);
    this.get('/activate', ContestantApiController.activate);
  }
};
