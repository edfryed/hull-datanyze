'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _restler = require('restler');

var _restler2 = _interopRequireDefault(_restler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function error(hull) {
  var code = arguments.length <= 1 || arguments[1] === undefined ? 'error' : arguments[1];
  var err = arguments[2];

  ;
}

module.exports = function (_ref, _ref2) {
  var _ref$message = _ref.message;
  var message = _ref$message === undefined ? {} : _ref$message;
  var ship = _ref2.ship;
  var hull = _ref2.hull;


  hull.logger.debug('datanyze.user.update', message);

  try {
    var _ret = function () {
      var _hull$configuration = hull.configuration();

      var organization = _hull$configuration.organization;
      var id = _hull$configuration.id;
      var secret = _hull$configuration.secret;
      var _message$user = message.user;
      var user = _message$user === undefined ? {} : _message$user;
      var _user$email = user.email;
      var email = _user$email === undefined ? "" : _user$email;
      var userId = user.id;
      var _ship$private_setting = ship.private_settings;
      var target_trait = _ship$private_setting.target_trait;
      var username = _ship$private_setting.username;
      var token = _ship$private_setting.token;
      var _ship$private_setting2 = _ship$private_setting.excluded_domains;
      var excluded_domains = _ship$private_setting2 === undefined ? "" : _ship$private_setting2;


      if (!token) return {
          v: hull.logger.info('datanyze.token.missing')
        };
      if (!username) return {
          v: hull.logger.error('datanyze.username.missing')
        };

      var domain = user["traits_datanyze/domain"] || user[target_trait];
      if (!domain) return {
          v: hull.logger.info('datanyze.skip', { reason: "Could not find a domain" })
        };

      var rank = user["traits_datanyze/rank"];
      if (!!rank) return {
          v: hull.logger.info('datanyze.skip', { reason: "Already fetched" })
        };

      var skip_search = _lodash2.default.includes(_lodash2.default.map(excluded_domains.split(','), function (d) {
        return d.trim();
      }), domain);
      if (!!skip_search) return {
          v: hull.logger.info('datanyze.skip', { reason: 'blacklisted domain, ' + domain })
        };

      hull.logger.info("datanyze.start", user);

      _restler2.default.get('http://api.datanyze.com/domain_info/', { query: { domain: domain, email: username, token: token } }).on('success', function () {
        var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var response = arguments[1];

        hull.logger.debug('datanyze.response', data);

        if (data) {
          if (data.error) return hull.logger.error("datanyze.response.error", data.error);

          var technologies = _lodash2.default.values(data.technologies) || [];
          hull.logger.debug('datanyze.traits.send', payload);
          return hull.as(userId).traits(_extends({}, data, { technologies: technologies }), { source: "datanyze" });
        }
      }).on('error', function (e) {
        return hull.logger.error('datanyze.error', err.message);
      }).on('fail', function (e) {
        return hull.logger.error('datanyze.fail', err.message);
      }).on('abort', function (e) {
        return hull.logger.error('datanyze.abort', err.message);
      });
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  } catch (e) {
    hull.logger.error('datanyze.error', e.message);
  }
};