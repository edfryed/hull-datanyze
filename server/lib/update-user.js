/* @flow */
import Promise from "bluebird";
import _ from "lodash";
import Datanyze from "./datanyze";
import * as domainUtils from "./domain-utils";

module.exports = function userUpdate(ctx: Object, messages:Array<Object> = [], { queued = false, attempt = 1, isBatch = false }: any = {}) {
  const { ship, client, cache, metric } = ctx;
  try {
    return Promise.all(messages.map(message => {
      const { user = {}, segments = [] } = message;
      const { synchronized_segments = [] } = ship.private_settings;
      const userSegmentIds = _.compact(segments).map(s => s.id);

      const { target_trait, username, token, excluded_domains = "" } = ship.private_settings;
      const asUser = client.asUser(_.pick(user, "id", "email", "external_id"));

      asUser.logger.debug("user.notification.update");
      if (!token) {
        asUser.logger.info("outgoing.user.skip", {
          reason: "token.missing"
        });
        return Promise.resolve();
      }
      if (!username) {
        asUser.logger.info("outgoing.user.skip", {
          reason: "username.missing"
        });
        return Promise.resolve();
      }
      if (!synchronized_segments) {
        asUser.logger.info("outgoing.user.skip", {
          reason: "synchronized_segments.empty"
        });
        return Promise.resolve();
      }

      const matchingSegments = _.intersection(userSegmentIds, synchronized_segments).length > 0;
      if (!matchingSegments && !isBatch) {
        asUser.logger.info("outgoing.user.skip", {
          reason: "datanyze.user.segments_skip"
        });
        return Promise.resolve();
      }

      const domain = domainUtils.normalize(user[target_trait]);
      if (!domain) {
        asUser.logger.info("outgoing.user.skip", {
          reason: "Could not find a domain",
          target: target_trait,
          domain
        });
        return Promise.resolve();
      }

      if (!domainUtils.verify(domain)) {
        asUser.logger.info("outgoing.user.skip", {
          reason: "Domain invalid",
          domain,
        });
        return Promise.resolve();
      }

      const rank = user["traits_datanyze/rank"];
      if (!!rank && !isBatch && !queued) {
        asUser.logger.info("outgoing.user.skip", {
          reason: "Already fetched datanyze/rank"
        });
        return Promise.resolve();
      }

      const skip_search = _.includes(_.map(excluded_domains.split(","), d => d.trim()), domain);
      if (!!skip_search) {
        asUser.logger.info("outgoing.user.skip", {
          reason: `blacklisted domain, ${domain}`
        });
        return Promise.resolve();
      }

      const fetched_at = user["traits_datanyze/fetched_at"];
      if (!!fetched_at && !isBatch && !queued) {
        asUser.logger.info("outgoing.user.skip", {
          reason: `Already fetched at: ${fetched_at}`
        });
        return Promise.resolve();
      }

      const error = user["traits_datanyze/error"];
      if (error && !isBatch && !queued) {
        asUser.logger.info("outgoing.user.skip", {
          reason: "Already fetched datanyze/error",
          error,
        });
        return Promise.resolve();
      }

      asUser.logger.info("outgoing.user.start", { domain });

      const datanyze = new Datanyze({ email: username, token, cache, logger: client.logger });

      return datanyze.getDomainInfo(domain).then(data => {
        asUser.logger.debug("outgoing.user.fetch.response", { response: data });

        if (!data) {
          asUser.logger.error("outgoing.user.error", { errors: "No Data" });
          return Promise.resolve();
        }
        if (data.error && !data.error.redirect_url) {
          asUser.logger.error("outgoing.user.error", { errors: data.error });

          if (data.error === 103 && attempt <= 2) {
            asUser.logger.debug("outgoing.user.fetch.addDomain.attempt", { attempt });

            return datanyze.addDomain(domain)
              .then(() => {
                asUser.logger.debug("outgoing.user.fetch.addDomain.queue");

                return ctx.enqueue("refetchDomainInfo", {
                  message,
                  attempt
                }, {
                  delay: process.env.ADD_DOMAIN_DELAY || 1800000
                });
              }, (err) => asUser.logger.debug("fetch.addDomain.queue.error", { errors: err }));
          }
          asUser.logger.debug("outgoing.user.fetch.addDomain.error", { attempt, domain, errors: data.error });
          return Promise.resolve();
        }

        const technologies = _.map(data.technologies, t => t.name);
        const payload = { ...data, technologies };
        payload.fetched_at = new Date().toISOString();
        asUser.logger.info("outgoing.user.success", payload);
        metric.increment("ship.outgoing.users");

        return asUser.traits(payload, { source: "datanyze" });
      }, err => {
        asUser.logger.error("outgoing.user.error", { errors: err });
      });
    }));
  } catch (e) {
    client.logger.debug("outgoing.user.error", { errors: e.stack || e });
  }
  return Promise.resolve();
};
