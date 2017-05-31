/* @flow */
import Hull from "hull";
import { Cache, Queue } from "hull/lib/infra";
import RedisStore from "cache-manager-redis";
import express from "express";

import server from "./server";
import worker from "./worker";

const { PORT = 8082, KUE_PREFIX = "hull-datanyze", SECRET, REDIS_URL, LOG_LEVEL } = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

let cache;
const ttl = 86400 * 30;

if (REDIS_URL) {
  cache = new Cache({
    store: RedisStore,
    url: REDIS_URL,
    compress: true,
    max: 10000,
    ttl,
    isCacheableValue: (value) => {
      if (value && value.error === 103) {
        return false;
      }
      return value !== undefined && value !== null;
    }
  });
} else {
  cache = new Cache({
    store: "memory",
    max: 1000,
    ttl
  });
}

const queue = new Queue("kue", {
  prefix: KUE_PREFIX,
  redis: REDIS_URL
});


const app = express();
const connector = new Hull.Connector({ port: PORT, hostSecret: SECRET, cache, queue });
connector.setupApp(app);

if (process.env.COMBINED || process.env.WORKER) {
  worker(connector);
  connector.startWorker();
}

if (process.env.COMBINED || process.env.SERVER) {
  server(app, { connector });
  connector.startApp(app);
}
