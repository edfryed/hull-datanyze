import _ from 'lodash';
import rest from 'restler';
import moment from 'moment';

function error(hull, code='error', err){
  ;
}

module.exports = function ({ message={} }, { ship, hull }) {

  hull.logger.debug('datanyze.user.update', message);

  try {

    const { organization, id, secret } = hull.configuration();
    const { user={} } = message;
    const { email="", id: userId } = user;
    const { target_trait, username, token, excluded_domains="" } = ship.private_settings;

    if (!token) return hull.logger.info('datanyze.token.missing');
    if (!username) return hull.logger.error('datanyze.username.missing');

    const domain = user["traits_datanyze/domain"] || user[target_trait];
    if (!domain) return hull.logger.info('datanyze.skip', { reason: "Could not find a domain"});

    const rank = user["traits_datanyze/rank"];
    if (!!rank) return hull.logger.info('datanyze.skip', { reason: "Already fetched"});

    const skip_search = _.includes(_.map(excluded_domains.split(','), d => d.trim()), domain);
    if (!!skip_search) return hull.logger.info('datanyze.skip', { reason: `blacklisted domain, ${domain}`});

    hull.logger.info("datanyze.start", user)

    rest.get('http://api.datanyze.com/domain_info/', { query: { domain, email: username, token: token } })
    .on('success', function(data={}, response){
      hull.logger.debug('datanyze.response', data);

      if (data){
        if (data.error) return hull.logger.error("datanyze.response.error", data.error);

        const technologies = _.values(data.technologies) || [];
        hull.logger.debug('datanyze.traits.send', payload);
        return hull.as(userId).traits({...data, technologies }, { source: "datanyze" });
      }
    })
    .on('error', e => hull.logger.error(`datanyze.error`, err.message))
    .on('fail', e => hull.logger.error(`datanyze.fail`, err.message))
    .on('abort', e => hull.logger.error(`datanyze.abort`, err.message));

  } catch (e){
    hull.logger.error('datanyze.error', e.message);
  }
}
