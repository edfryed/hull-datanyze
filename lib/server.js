'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _updateUser = require('./update-user');

var _updateUser2 = _interopRequireDefault(_updateUser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function Server() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var port = options.port;
  var Hull = options.Hull;
  var dev = options.devMode;
  var hostSecret = options.hostSecret;
  var BatchHandler = Hull.BatchHandler;
  var NotifHandler = Hull.NotifHandler;
  var Routes = Hull.Routes;
  var Readme = Routes.Readme;
  var Manifest = Routes.Manifest;

  var app = (0, _express2.default)();

  if (dev) app.use(devMode());
  app.use(responseTime());
  app.use(_express2.default.static(_path2.default.resolve(__dirname, "..", "dist")));
  app.use(_express2.default.static(_path2.default.resolve(__dirname, "..", "assets")));

  app.set("views", _path2.default.resolve(__dirname, "..", "views"));

  app.get("/manifest.json", Manifest(__dirname));
  app.get("/", Readme);
  app.get("/readme", Readme);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.post("/batch", BatchHandler({
    hostSecret: hostSecret,
    batchSize: 100,
    groupTraits: false,
    handler: function handler() {
      var notifications = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var _ref = arguments[1];
      var hull = _ref.hull;
      var ship = _ref.ship;

      notifications.map(function (_ref2) {
        var message = _ref2.message;

        message.user = hull.utils.groupTraits(message.user);
        return (0, _updateUser2.default)({ message: message }, { hull: hull, ship: ship });
      });
    }
  }));

  app.post('/notify', NotifHandler({
    groupTraits: false,
    onSubscribe: function onSubscribe() {
      console.warn('Hello new subscriber !');
    },

    handlers: {
      'user:update': _updateUser2.default
    }
  }));

  Hull.logger.info("datanyze.started", { port: port });
  app.listen(port);

  return app;
};