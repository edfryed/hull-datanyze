import _ from "lodash";
import rest from "restler";

module.exports = function userUpdate({ message = {} }, { ship, hull }) {
  hull.logger.debug("datanyze.user.update", JSON.stringify(message.user));

  try {
    const { user = {} } = message;
    const { id: userId } = user;
    const { target_trait, username, token, excluded_domains = "" } = ship.private_settings;

    if (!token) return hull.logger.info("datanyze.token.missing");
    if (!username) return hull.logger.error("datanyze.username.missing");

    const domain = user["traits_datanyze/domain"] || user[target_trait];
    if (!domain) return hull.logger.info("datanyze.skip", { reason: "Could not find a domain", target: target_trait });

    const rank = user["traits_datanyze/rank"];
    if (!!rank) return hull.logger.info("datanyze.skip", { reason: "Already fetched" });

    const skip_search = _.includes(_.map(excluded_domains.split(","), d => d.trim()), domain);
    if (!!skip_search) return hull.logger.info("datanyze.skip", { reason: `blacklisted domain, ${domain}` });

    hull.logger.info("datanyze.start", user);

    const query = { query: { domain, email: username, token } };
    rest.get("http://api.datanyze.com/limits/", query)
    .on("success", function onLimitSucces(limits = {}) {
      // { "api_hourly": 55, "api_hourly_limit": 1000, "api_daily": 2289, "api_daily_limit": 5000, "api_monthly": 77756, "api_monthly_limit": 2500 }
      if (limits && limits.api_daily && limits.api_monthly_limit && limits.api_daily >= limits.api_monthly_limit / 30) {
        return hull.logger.warn("datanyze.rate.limit", limits);
      }

      rest.get("http://api.datanyze.com/domain_info/", query)
      .on("success", function onSuccess(data = {}, response = {}) {
        if (!data) return hull.logger.error("datanyze.response.error", { reason: "No Data", response });
        if (data.error) return hull.logger.error("datanyze.response.error", JSON.stringify(data));

        hull.logger.debug("datanyze.response", data);
        const technologies = _.values(data.technologies) || [];
        const payload = { ...data, technologies };
        hull.logger.debug("datanyze.traits.send", payload);
        return hull.as(userId).traits(payload, { source: "datanyze" });
      })
      .on("error", e => hull.logger.error("datanyze.error", e.message))
      .on("fail", e => hull.logger.error("datanyze.fail", e.message))
      .on("abort", e => hull.logger.error("datanyze.abort", e.message));

      return true;
    });
  } catch (e) {
    hull.logger.error("datanyze.error", e.message);
  }
  return true;
};
