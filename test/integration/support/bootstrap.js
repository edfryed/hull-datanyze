import Hull from "hull";
import express from "express";
import { Queue, Cache } from "hull/lib/infra";
import KueAdapter from "hull/lib/infra/queue/adapter/kue";

import server from "../../../server/server";
import worker from "../../../server/worker";

export default function bootstrap() {
  const app = express();
  let queue;
  Hull.logger.transports.console.level = "debug";
  if (process.env.REDIS_URL) {
    const kueAdapter = new KueAdapter({
      prefix: "test",
      redis: process.env.REDIS_URL
    });

    queue = new Queue(kueAdapter);
  }

  const cache = new Cache({
    store: "memory",
    max: 1000,
    isCacheableValue: (value) => {
      if (value && value.error === 103) {
        return false;
      }
      return value !== undefined && value !== null;
    }
  });

  const connector = new Hull.Connector({ queue, cache, hostSecret: "1234", port: 8000, clientConfig: { protocol: "http", firehoseUrl: "firehose" } });
  connector.setupApp(app);
  server(app, { connector });
  worker(connector);

  connector.startWorker();
  return connector.startApp(app);
}
