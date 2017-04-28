/* @flow */
import Promise from "bluebird";
import _ from "lodash";
import Datanyze from "./datanyze";
import * as domainUtils from "./domain-utils";

module.exports = function userUpdateFactory({ cache }: any) {
  return function userUpdate(ctx: any, { messages = [] }: any, { queued = false, attempt = 1, isBatch = false }: any = {}) {
    const { ship, client } = ctx;
    try {
      return Promise.all(messages.map(message => {
        const { user = {}, segments = [] } = message;
        const { synchronized_segments = [] } = ship.private_settings;
        const userSegmentIds = segments.map(s => s.id);

        const { id: userId } = user;
        const { target_trait, username, token, excluded_domains = "" } = ship.private_settings;
        const logIdent = { userId, email: user.email };

        client.logger.info("user.notification.update", logIdent);

        if (!token) {
          client.logger.info("user.notification.skip", {
            ...logIdent,
            reason: "token.missing"
          });
          return Promise.resolve();
        }
        if (!username) {
          client.logger.info("user.notification.skip", {
            ...logIdent,
            reason: "username.missing"
          });
          return Promise.resolve();
        }
        if (!synchronized_segments) {
          client.logger.info("user.notification.skip", {
            ...logIdent,
            reason: "synchronized_segments.empty"
          });
          return Promise.resolve();
        }

        const matchingSegments = _.intersection(userSegmentIds, synchronized_segments).length > 0;
        if (!matchingSegments && !isBatch) {
          client.logger.info("user.notification.skip", {
            ...logIdent,
            reason: "datanyze.user.segments_skip"
          });
          return Promise.resolve();
        }

        const domain = domainUtils.normalize(user[target_trait]);
        if (!domain) {
          client.logger.info("user.notification.skip", {
            reason: "Could not find a domain",
            target: target_trait,
            domain,
            ...logIdent
          });
          return Promise.resolve();
        }

        if (!domainUtils.verify(domain)) {
          client.logger.info("user.notification.skip", {
            reason: "Domain invalid",
            domain,
            ...logIdent
          });
          return Promise.resolve();
        }

        const rank = user["traits_datanyze/rank"];
        if (!!rank && !isBatch && !queued) {
          client.logger.info("user.notification.skip", {
            reason: "Already fetched datanyze/rank", ...logIdent
          });
          return Promise.resolve();
        }

        const skip_search = _.includes(_.map(excluded_domains.split(","), d => d.trim()), domain);
        if (!!skip_search) {
          client.logger.info("user.notification.skip", {
            reason: `blacklisted domain, ${domain}`,
            ...logIdent
          });
          return Promise.resolve();
        }

        const fetched_at = user["traits_datanyze/fetched_at"];
        if (!!fetched_at && !isBatch && !queued) {
          client.logger.info("user.notification.skip", {
            reason: `Already fetched at: ${fetched_at}`,
            ...logIdent
          });
          return Promise.resolve();
        }

        const error = user["traits_datanyze/error"];
        if (error && !isBatch && !queued) {
          client.logger.info("user.notification.skip", {
            reason: "Already fetched datanyze/error", error,
            ...logIdent
          });
          return Promise.resolve();
        }

        client.logger.info("fetch.start", { ...logIdent, domain });

        const datanyze = new Datanyze({ email: username, token, cache, logger: client.logger });

        return datanyze.getDomainInfo(domain).then(data => {
          client.logger.debug("fetch.response", { response: data, ...logIdent });

          if (!data) {
            client.logger.error("fetch.error", { reason: "No Data", ...logIdent });
            return Promise.resolve();
          }
          if (data.error && !data.error.redirect_url) {
            client.logger.error("fetch.error", { error: data.error, ...logIdent });

            if (data.error === 103 && attempt <= 2) {
              client.logger.info("fetch.addDomain.attempt", { attempt, ...logIdent });

              return datanyze.addDomain(domain)
                .then(() => {
                  client.logger.info("fetch.addDomain.queue", logIdent);

                  return ctx.enqueue("refetchDomainInfo", {
                    payload: { message, attempt }
                  }, {
                    delay: process.env.ADD_DOMAIN_DELAY || 1800000
                  });
                }, (err) => client.logger.error("fetch.addDomain.queue.error", { err, ...logIdent }));
            }
            client.logger.info("fetch.addDomain.error", { attempt, domain, error: data.error, ...logIdent });
          }

          const technologies = _.map(data.technologies, t => t.name);
          const payload = { ...data, technologies };
          payload.fetched_at = new Date().toISOString();
          client.logger.debug("datanyze.traits.send", { ...payload, userId });

          return client.as(userId).traits(payload, { source: "datanyze" });
        }, err => client.logger.error("fetch.error", { error: err.stack || err, ...logIdent }));
      }));
    } catch (e) {
      client.logger.error("user.notification.error", { error: e.stack || e });
    }
    return Promise.resolve();
  };
};
