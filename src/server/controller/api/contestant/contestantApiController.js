'use strict';

const Contestant = require('../../../db').model('Contestant');
const StudentApiController = require('../student/studentApiController');
const xss = require('xss');
const fs = require('fs');
const ContestantHelper = require('../../../helper/contestantHelper');
const config = require('../../../config');

module.exports = class ContestantApiController {

  static find(request, response, next) {
    Contestant.find({activated: 1}).select('-token -__v').exec((error, products) => {
      if (error) {
        return next(error);
      }
      return response.json(products);
    });
  }

  static save(request, response, next) {
    // TODO: check if strings are empty
    if (request.body.firstName === undefined || request.body.lastName === undefined || request.body.course === undefined || request.body.year === undefined ||
      request.body.description === undefined || request.file === undefined) {
      return response.status(400).json({success: false,
        error: {text: 'Es wurden nicht alle notwendingen Felder ausgefüllt'}});
    }

    StudentApiController.validate(request.body, (validated) => {
      if (validated === true) {
        const contestantJSON = request.body;
        contestantJSON.activated = false;
        contestantJSON.image = request.file.filename;
        // sanitize user inputs
        contestantJSON.firstName = xss(contestantJSON.firstName);
        contestantJSON.lastName = xss(contestantJSON.lastName);
        contestantJSON.course = xss(contestantJSON.course);
        contestantJSON.year = xss(contestantJSON.year);
        contestantJSON.centuria = '';
        contestantJSON.description = xss(contestantJSON.description);
        contestantJSON.token = '';
        ContestantHelper.sendActivationMail(contestantJSON, (result) => {
          if (result === false) {
            return response.status(400).json({success: false,
              error: {text: 'Fehler beim Versand der Bestätigungsmail'}});
          }
          return response.status(200).json({success: true});
        });
      } else if (validated === false && request.file.path !== undefined) {
        fs.unlink(request.file.path, (error) => {
          if (error) {
            console.log(error);
          }
        });
        return response.status(400).json({success: false,
          error: {text: 'Deine Angaben konnten nicht validiert werden. \nVersuche es erneut'}});
      }
      // return next('error');
    });
  }

  static activate(request, response, next) {
    if (request.query.token === undefined) {
      return response.status(400).json({success: false,
        error: {text: 'Missing token parameter'}});
    }
    Contestant.findOne({token: request.query.token}).exec((error, contestant) => {
      if (error || contestant === null) {
        return response.status(400).json({success: false,
          error: {text: 'Error while validating token'}});
      }
      contestant.activated = true;
      contestant.save();
      response.writeHead(301, {Location: `${config.get('webserver:defaultProtocol')}://${config.get('webserver:url')}/list`});
      return response.end();
    });
  }
};
