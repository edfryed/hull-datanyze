import Hull from "hull";
import { Cache, Queue } from "hull/lib/infra";
import RedisStore from "cache-manager-redis";
import express from "express";
import Server from "./server";
import Worker from "./worker";

const { PORT = 8082, KUE_PREFIX = "hull-datanyze", WORKER_MODE = "standalone", NODE_ENV, SECRET, REDIS_URL, LOG_LEVEL } = process.env;

if (process.env.NEW_RELIC_LICENSE_KEY) {
  console.warn("Starting newrelic agent with key: ", process.env.NEW_RELIC_LICENSE_KEY);
  require("newrelic"); // eslint-disable-line global-require
}

if (process.env.LOGSTASH_HOST && process.env.LOGSTASH_PORT) {
  const Logstash = require("winston-logstash").Logstash; // eslint-disable-line global-require
  Hull.logger.add(Logstash, {
    node_name: name,
    port: process.env.LOGSTASH_PORT || 1515,
    host: process.env.LOGSTASH_HOST
  });
  Hull.logger.info("logger.start", { transport: "logstash" });
} else {
  Hull.logger.info("logger.start", { transport: "console" });
}

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
  redis: {
    host: REDIS_URL || "127.0.0.1"
  }
});


const app = express();
const connector = new Hull.Connector({ port: PORT, hostSecret: SECRET });

connector.setupApp(app);

const options = {
  connector,
  app,
  devMode: NODE_ENV === "development", // todo what to do with them ?
  workerMode: WORKER_MODE,
  cache
};

connector.startApp(Server(options));

Worker({ connector, cache, queue });
