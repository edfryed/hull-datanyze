import _ from 'lodash';
import rest from 'restler';
import moment from 'moment';

function error(code='error', err){
  console.log(`Bad/invalid request - ${code} - Datanyze error, or failed request`, err);
}

module.exports = function ({ message={} }, { ship, hull }) {
  try {

    const { organization, id, secret } = hull.configuration();
    const { user={} } = message;
    const { email="", id: userId, identities={}, datanyze={} } = user;
    const { domain, rank } = datanyze;
    const { username, token, excluded_domains="" } = ship.private_settings;
    const email_domain = email.split('@')[1] || '';
    const skip_search = _.includes(_.map((excluded_domains.split(',')||[]),(d)=>d.trim()), email_domain);

    if (!token) {
      console.log('No Datanyze Token detected');
      return;
    }
    if (!username) {
      console.log('No Datanyze Username detected');
      return;
    }

    if (!skip_search && email_domain && username && token) {
      rest.get('http://api.datanyze.com/domain_info/',{
        query: {
          domain: email_domain,
          email: username,
          token: token 
        }
      })
      .on('success', function(data={}, response){
        return hull.as(userId).traits({
          ...data,
          technologies: (_.values(data.technologies)||[]).join(', ')
        }, { source: 'datanyze' });
      })
      .on('error', error.bind(undefined, 'error'))
      .on('fail', error.bind(undefined, 'failure'))
      .on('abort', error.bind(undefined,'abort'));
    }
  } catch (e){
    error('Error in datanyze ship', e)
  }
}
