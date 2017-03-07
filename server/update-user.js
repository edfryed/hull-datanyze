import Promise from "bluebird";
import _ from "lodash";
import Datanyze from "./datanyze";

module.exports = function userUpdateFactory({ cache, queue }) {
  return function userUpdate({ message = {} }, { ship, hull }, queued = false) {
    try {
      const { user = {} } = message;
      const { id: userId } = user;
      const { target_trait, username, token, excluded_domains = "" } = ship.private_settings;

      hull.logger.debug("datanyze.user.update", _.pick(user, "id", "email"));

      if (!token) return hull.logger.info("datanyze.token.missing");
      if (!username) return hull.logger.error("datanyze.username.missing");

      const domain = user["traits_datanyze/domain"] || user[target_trait];
      if (!domain) return hull.logger.info("datanyze.skip", { reason: "Could not find a domain", target: target_trait, userId });

      const rank = user["traits_datanyze/rank"];
      if (!!rank) return hull.logger.info("datanyze.skip", { reason: "Already fetched", userId });

      const skip_search = _.includes(_.map(excluded_domains.split(","), d => d.trim()), domain);
      if (!!skip_search) return hull.logger.info("datanyze.skip", { reason: `blacklisted domain, ${domain}`, userId });

      const fetched_at = user["traits_datanyze/fetched_at"];
      if (!!fetched_at) return hull.logger.info("datanyze.skip", { reason: `already fetched, ${fetched_at}`, userId });

      hull.logger.info("datanyze.start", domain);

      const datanyze = new Datanyze({ email: username, token, cache, queue });

      return datanyze.getDomainInfo(domain).then(data => {
        if (!data) return hull.logger.error("datanyze.response.error", { reason: "No Data", response });
        if (data.error) {
          hull.logger.error("datanyze.response.error", JSON.stringify(data));

          if (data.error === 103 && queued === false) {
            return datanyze.addDomain(domain)
              .then(() => {
                return queue.create("refetchDomainInfo", {
                    payload: message,
                    config: hull.configuration()
                  })
                  .delay(process.env.ADD_DOMAIN_DELAY || 1800000)
                  .removeOnComplete(true)
                  .save();
              }, (err) => hull.logger.error("datanyze.addDomain.error", err));
          }
        }

        hull.logger.debug("datanyze.response", data);
        const technologies = _.values(data.technologies) || [];
        const payload = { ...data, technologies };
        hull.logger.debug("datanyze.traits.send", { ...payload, userId });

        return hull.as(userId).traits(payload, { source: "datanyze" });
      }, err => hull.logger.error("datanyze.error", err.message));
    } catch (e) {
      hull.logger.error("datanyze.error", e.stack);
    }
    return Promise.resolve();
  };
}
