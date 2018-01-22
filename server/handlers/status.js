import _ from 'lodash';

import request from 'request-promise';
export default function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const { private_settings } = ship;
  const messages = [];
  const reply = (status = 'ok', messages) => {
    res.json({ status, messages });
    return client.put(`${req.hull.ship.id}/status`, { status, messages });
  }
  let status = 'ok';
  const {
    username,
    token,
    synchronized_segments,
    target_trait,
    handle_accounts
  } = private_settings;

  const any_enabled = _.size(synchronized_segments) > 0;

  if (!token || !username) {
    status = 'warning';
    messages.push(
      'No Credentials stored, connector is inactive. Enter Username and Token in Settings'
    );
  }
  if (any_enabled) {
    status = 'warning';
    messages.push(
      'Enrich enabled, but no segments are listed. No one will be enriched'
    );
  }

  if (status !== 'ok') return reply(status, messages);

  request({
    uri: `http://api.datanyze.com/limit`,
    json: true,
    resolveWithFullResponse: true,
    qs: { token, email: username }
  }).then(response => {
    const body = response.body;
    if (body && response.statusCode === 200) {
      const { limits = {} } = body;
      const { api_monthly, api_monthly_limit } = limit;
      return reply("ok", [`API Calls Remaining: ${api_monthly_limit}/${api_monthly}`]);
    }
    return reply("error", [`Error from Datanyze API: ${response.statusMessage}`]);
  });

}
