import Promise from "bluebird";
import _ from "lodash";
import Datanyze from "./datanyze";

module.exports = function userUpdateFactory({ cache, queue }) {
  return function userUpdate({ message = {} }, { ship, hull }, { queued = false, isBatch = false } = {}) {
    try {
      const { user = {}, segments = [] } = message;
      const { synchronized_segments = [] } = ship.private_settings;
      const userSegmentIds = segments.map(s => s.id);

      const { id: userId } = user;
      const { target_trait, username, token, excluded_domains = "" } = ship.private_settings;

      hull.logger.debug("datanyze.user.update", _.pick(user, "id", "email"));

      if (!token) return hull.logger.info("datanyze.token.missing");
      if (!username) return hull.logger.error("datanyze.username.missing");
      if (!synchronized_segments) return hull.logger.error("datanyze.synchronized_segments.empty");

      const matchingSegments = _.intersection(userSegmentIds, synchronized_segments).length > 0;
      if (!matchingSegments) return hull.logger.info("datanyze.user.segments_skip");

      const domain = user["traits_datanyze/domain"] || user[target_trait];
      if (!domain) return hull.logger.info("datanyze.skip", { reason: "Could not find a domain", target: target_trait, userId });

      const rank = user["traits_datanyze/rank"];
      if (!!rank && !isBatch && !queued) return hull.logger.info("datanyze.skip", { reason: "Already fetched", userId });

      const skip_search = _.includes(_.map(excluded_domains.split(","), d => d.trim()), domain);
      if (!!skip_search) return hull.logger.info("datanyze.skip", { reason: `blacklisted domain, ${domain}`, userId });

      const fetched_at = user["traits_datanyze/fetched_at"];
      if (!!fetched_at && !isBatch && !queued) return hull.logger.info("datanyze.skip", { reason: `already fetched, ${fetched_at}`, userId });

      const error = user["traits_datanyze/error"];
      if (error && !isBatch && !queued) return hull.logger.info("datanyze.skip", { reason: "error", error, userId });

      hull.logger.info("datanyze.start", domain);

      const datanyze = new Datanyze({ email: username, token, cache, queue });

      return datanyze.getDomainInfo(domain).then(data => {
        if (!data) return hull.logger.error("datanyze.response.error", { reason: "No Data" });
        if (data.error && !data.error.redirect_url) {
          hull.logger.error("datanyze.response.error", JSON.stringify(data));

          if (data.error === 103 && queued === false) {
            return datanyze.addDomain(domain)
              .then(() => {
                hull.logger.info("userUpdate.queue.enrich", message);
                return queue.create("refetchDomainInfo", {
                  payload: message,
                  config: hull.configuration()
                })
                .delay(process.env.ADD_DOMAIN_DELAY || 1800000)
                .removeOnComplete(true)
                .save();
              }, (err) => hull.logger.error("datanyze.addDomain.error", err));
          }
          data = { ...data.error };
        }

        hull.logger.debug("datanyze.response", data);
        const technologies = _.map(data.technologies, t => t.name);
        const payload = { ...data, technologies };
        hull.logger.debug("datanyze.traits.send", { ...payload, userId });

        return hull.as(userId).traits(payload, { source: "datanyze" });
      }, err => hull.logger.error("datanyze.error", err.message));
    } catch (e) {
      hull.logger.error("datanyze.error", e.stack);
    }
    return Promise.resolve();
  };
};
