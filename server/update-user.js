import _ from 'lodash';
import rest from 'restler';
import moment from 'moment';

const shipToken = process.env.SHIP_TOKEN || '3095jv02939jfd';

module.exports = function ({ message={} }, { ship, hull }) {
  const { organization, id, secret } = hull.configuration();
  const { user={} } = message;
  const { email="", id: userId, identities={}, datanyze={} } = user;
  const { domain, rank } = datanyze;
  const { username, token, excluded_domains="" } = ship.private_settings;
  const email_domain = email.split('@')[1]|'';
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
    const webhookId = jwt.encode({ organization, id, secret, userId }, shipToken);
    reslter.get('http://api.datanyze.com/domain_info/',{
      query: {
        domain: domain,
        email: username,
        token: token 
      }
    }).on('success', function(data={}, response){
      return hull.as(userId).traits({
        ...data,
        technologies: (_.values(result.technologies)||[]).join(', ')
      }, { source: 'datanyze' });``
    }).on('error', function(err, response){
      console.log('Bad/invalid request, unauthorized, Datanyze error, or failed request', err);
    });
  }
}
