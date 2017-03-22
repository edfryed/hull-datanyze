import Promise from "bluebird";
import _ from "lodash";
import Datanyze from "./datanyze";
import * as domainUtils from "./domain-utils";

module.exports = function userUpdateFactory({ cache, queue }) {
  return function userUpdate({ message = {} }, { ship, hull }, { queued = false, attempt = 1, isBatch = false } = {}) {
    try {
      const { user = {}, segments = [] } = message;
      const { synchronized_segments = [] } = ship.private_settings;
      const userSegmentIds = segments.map(s => s.id);

      const { id: userId } = user;
      const { target_trait, username, token, excluded_domains = "" } = ship.private_settings;
      const logIdent = { userId, email: user.email };

      hull.logger.info("user.notification.update", logIdent);

      if (!token) {
        return hull.logger.info("user.notification.skip", {
          ...logIdent,
          reason: "token.missing"
        });
      }
      if (!username) {
        return hull.logger.info("user.notification.skip", {
          ...logIdent,
          reason: "username.missing"
        });
      }
      if (!synchronized_segments) {
        return hull.logger.info("user.notification.skip", {
          ...logIdent,
          reason: "synchronized_segments.empty"
        });
      }

      const matchingSegments = _.intersection(userSegmentIds, synchronized_segments).length > 0;
      if (!matchingSegments && !isBatch) {
        return hull.logger.info("user.notification.skip", {
          ...logIdent,
          reason: "datanyze.user.segments_skip"
        });
      }

      const domain = domainUtils.normalize(user[target_trait]);
      if (!domain) {
        return hull.logger.info("user.notification.skip", {
          reason: "Could not find a domain",
          target: target_trait,
          domain,
          ...logIdent
        });
      }

      if (!domainUtils.verify(domain)) {
        return hull.logger.info("user.notification.skip", {
          reason: "Domain invalid",
          domain,
          ...logIdent
        });
      }

      const rank = user["traits_datanyze/rank"];
      if (!!rank && !isBatch && !queued) {
        return hull.logger.info("user.notification.skip", {
          reason: "Already fetched datanyze/rank", ...logIdent
        });
      }

      const skip_search = _.includes(_.map(excluded_domains.split(","), d => d.trim()), domain);
      if (!!skip_search) {
        return hull.logger.info("user.notification.skip", {
          reason: `blacklisted domain, ${domain}`,
          ...logIdent
        });
      }

      const fetched_at = user["traits_datanyze/fetched_at"];
      if (!!fetched_at && !isBatch && !queued) {
        return hull.logger.info("user.notification.skip", {
          reason: `Already fetched at: ${fetched_at}`,
          ...logIdent
        });
      }

      const error = user["traits_datanyze/error"];
      if (error && !isBatch && !queued) {
        return hull.logger.info("user.notification.skip", {
          reason: "Already fetched datanyze/error", error,
          ...logIdent
        });
      }

      hull.logger.info("fetch.start", { ...logIdent, domain });

      const datanyze = new Datanyze({ email: username, token, cache, queue, logger: hull.logger });

      return datanyze.getDomainInfo(domain).then(data => {
        hull.logger.debug("fetch.response", { response: data, ...logIdent });

        if (!data) return hull.logger.error("fetch.error", { reason: "No Data", ...logIdent });
        if (data.error && !data.error.redirect_url) {
          hull.logger.error("fetch.error", { error: data.error, ...logIdent });

          if (data.error === 103 && attempt <= 2) {
            hull.logger.info("fetch.addDomain.attempt", { attempt, ...logIdent });

            return datanyze.addDomain(domain)
              .then(() => {
                hull.logger.info("fetch.addDomain.queue", logIdent);

                return queue.create("refetchDomainInfo", {
                  payload: message,
                  attempt,
                  config: hull.configuration()
                })
                .delay(process.env.ADD_DOMAIN_DELAY || 1800000)
                .removeOnComplete(true)
                .save();
              }, (err) => hull.logger.error("fetch.addDomain.queue.error", { err, ...logIdent }));
          }
          hull.logger.info("fetch.addDomain.error", { attempt, domain, error: data.error, ...logIdent });
        }

        const technologies = _.map(data.technologies, t => t.name);
        const payload = { ...data, technologies };
        payload.fetched_at = new Date().toISOString();
        hull.logger.debug("datanyze.traits.send", { ...payload, userId });

        return hull.as(userId).traits(payload, { source: "datanyze" });
      }, err => hull.logger.error("fetch.error", { error: err.stack || err, ...logIdent }));
    } catch (e) {
      hull.logger.error("user.notification.error", { error: e.stack || e });
    }
    return Promise.resolve();
  };
};
