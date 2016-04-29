import _ from 'lodash';
import rest from 'restler';
import moment from 'moment';

function error(code='error', err){
  console.log(`Bad/invalid request - ${code} - Datanyze error, or failed request`, err);
}

module.exports = function ({ message={} }, { ship, hull }) {

  if(process.env.DEBUG) {
    console.log('Updating User', message);
  }

  try {

    const { organization, id, secret } = hull.configuration();
    const { user={} } = message;
    const { email="", id: userId, datanyze={}, traits={} } = user;
    let { rank, domain } = datanyze;
    const { username, token, excluded_domains="" } = ship.private_settings;

    domain = datanyze.domain || email.split('@')[1] || traits.domain;
    const skip_search = _.includes(_.map((excluded_domains.split(',')||[]),(d)=>d.trim()), domain);

    if (!token) {
      console.log('No Datanyze Token detected');
      return;
    }
    if (!username) {
      console.log('No Datanyze Username detected');
      return;
    }

    if (1 || !skip_search && domain && !rank && username && token) {
      console.log("Searching for domain", user)
      rest.get('http://api.datanyze.com/domain_info/',{
        query: {
          domain,
          email: username,
          token: token 
        }
      })
      .on('success', function(data={}, response){
        if(process.env.DEBUG) {
          console.log('Received from Datanyze', data);
        }
        if (data && !data.error){
          const payload = _.reduce({
            ...data,
            technologies: (_.values(data.technologies)||[])
          }, (m, v, k)=>{
            m[`datanyze/${k}`] = v;
            return m;
          }, {})
          if(process.env.DEBUG) {
            console.log('Sent', payload);
          }
          return hull.as(userId).post('/firehose/traits', payload);
        }
      })
      .on('error', error.bind(undefined, 'error'))
      .on('fail', error.bind(undefined, 'failure'))
      .on('abort', error.bind(undefined,'abort'));
    }
  } catch (e){
    error('Error in datanyze ship', e)
  }
}
