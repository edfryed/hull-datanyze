if (process.env.NEW_RELIC_LICENSE_KEY) {
  console.warn("Starting newrelic agent with key: ", process.env.NEW_RELIC_LICENSE_KEY);
  require("newrelic"); // eslint-disable-line global-require
}

let cache;
const Hull = require("hull");
const CacheManager = require("cache-manager");
const RedisStore = require("cache-manager-redis");
const Server = require("./server");
const Worker = require("./worker");

const kue = require("kue");

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

const { PORT = 8082, KUE_PREFIX = "hull-datanyze", WORKER_MODE = "standalone", NODE_ENV, SECRET, REDIS_URL, LOG_LEVEL } = process.env;

const ttl = 86400 * 30;

if (REDIS_URL) {
  cache = CacheManager.caching({
    store: RedisStore,
    url: REDIS_URL,
    compress: true,
    ttl, max: 10000,
    isCacheableValue: (value) => {
      if (value && value.error === 103) {
        return false;
      }
      return value !== undefined && value !== null;
    }
  });
} else {
  cache = CacheManager.caching({
    store: "memory",
    max: 1000,
    ttl
  });
}

const queue = REDIS_URL && kue.createQueue({
  prefix: KUE_PREFIX,
  redis: REDIS_URL
});

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

Hull.logger.info("datanyze.boot");

Server({
  Hull,
  hostSecret: SECRET,
  devMode: NODE_ENV === "development",
  workerMode: WORKER_MODE,
  port: PORT,
  cache,
  queue
});


Worker({ Hull, cache, queue });
