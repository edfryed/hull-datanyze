import _ from "lodash";

import request from "request-promise";

export default function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const { private_settings } = ship;
  const messages = [];
  const reply = (st = "ok", msg = []) => {
    const pl = { status: st, messages: msg };
    res.json(pl);
    return client.put(`${req.hull.ship.id}/status`, pl);
  };
  let status = "ok";
  const { username, token, synchronized_segments } = private_settings;

  const any_enabled = _.size(synchronized_segments) > 0;

  if (!token || !username) {
    status = "warning";
    messages.push("No Credentials stored, connector is inactive. Enter Username and Token in Settings");
  }
  if (!any_enabled) {
    status = "warning";
    messages.push("Enrich enabled, but no segments are listed. No one will be enriched");
  }

  if (status !== "ok") return reply(status, messages);

  return request({
    uri: "http://api.datanyze.com/limits/",
    json: true,
    resolveWithFullResponse: true,
    qs: { token, email: username }
  }).then((response) => {
    const body = response.body;
    if (body && response.statusCode === 200) {
      const { api_monthly, api_monthly_limit } = body;
      if (api_monthly < api_monthly_limit / 10) {
        return reply("warning", [
          `Low API Calls Remaining: ${api_monthly}/${api_monthly_limit}`
        ]);
      }
      return reply("ok", [
        `API Calls Remaining: ${api_monthly}/${api_monthly_limit}`
      ]);
    }
    return reply("error", [
      `Error from Datanyze API: ${response.statusMessage}`
    ]);
  });
}
