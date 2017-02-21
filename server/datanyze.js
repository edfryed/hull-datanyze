import request from "request";
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
    return new Promise((resolve, reject) => {
      return request({
        uri: `${BASE_URL}/${path}`,
        json: true,
        qs: { token, email, ...params }
      }).then((error, response, body) => {
        if (error) {
          reject(error);
        } else if (body && response.statusCode === 200) {
          resolve(body);
        } else {
          const err = new Error(response.statusMessage);
          err.statusCode = response.statusCode;
          reject(err);
        }
      }, reject);
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
    return this.request("domain_info", { domain, tech_details });
  }

  getLimits() {
    return this.exec("limits");
  }
}
