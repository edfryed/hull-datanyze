import _ from "lodash";
import request from "request-promise";
import Promise from "bluebird";
import { createHash } from "crypto";

const BASE_URL = "http://api.datanyze.com";

class RateLimitError extends Error {
  constructor(limits) {
    super("RateLimitError");
    this.limits = limits;
  }
}


function getCacheKey(path, params) {
  return createHash("sha1")
            .update(JSON.stringify({ path, params }))
            .digest("hex");
}

export default class DatanyzeClient {
  constructor({ email, token, cache, queue }) {
    this.email = email;
    this.token = token;
    this.cache = cache;
    this.queue = queue;
  }

  exec(path, params = {}) {
    const { token, email } = this;
    return request({
      uri: `${BASE_URL}/${path}/`,
      json: true,
      resolveWithFullResponse: true,
      qs: { token, email, ...params }
    }).then((response) => {
      const body = response.body;
      if (body && response.statusCode === 200) {
        return body;
      }
      const err = new Error(response.statusMessage);
      err.statusCode = response.statusCode;
      return Promise.reject(err);
    });
  }

  request(path, params) {
    if (this.cache && this.cache.wrap) {
      const cacheKey = getCacheKey(path, params);
      return this.cache.wrap(cacheKey, () => {
        return this.getLimits().then((limits = {}) => {
          const { api_hourly, api_daily, api_monthly_limit } = limits;
          if (api_hourly >= api_monthly_limit / (30 * 24) || api_daily >= api_monthly_limit / 30) {
            throw new RateLimitError(limits);
          }
          return this.exec(path, params);
        });
      });
    }

    return this.exec(path, params);
  }

  getDomainInfo(domain, tech_details = true) {
    return this.request("domain_info", { domain, tech_details })
      .then(data => {
        const technologies = _.values(data.technologies) || [];
        return { ...data, technologies };
      });
  }

  addDomain(domain) {
    return this.request("add_domain", { domain });
  }

  getLimits() {
    return this.exec("limits");
  }
}
