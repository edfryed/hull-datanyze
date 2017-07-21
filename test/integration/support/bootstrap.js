import { Connector } from "hull";
import express from "express";
import { Queue } from "hull/lib/infra";
import KueAdapter from "hull/lib/infra/queue/adapter/kue";

import server from "../../../server/server";
import worker from "../../../server/worker";

export default function bootstrap() {
  const app = express();
  let queue;

  if (process.env.REDIS_URL) {
    const kueAdapter = new KueAdapter({
      prefix: "test",
      redis: process.env.REDIS_URL
    });

    const queue = new Queue(kueAdapter);
  }
  const connector = new Connector({ queue, hostSecret: "1234", port: 8000, clientConfig: { protocol: "http", firehoseUrl: "firehose" } });
  connector.setupApp(app);
  server(app, { connector });
  worker(connector);

  connector.startWorker();
  return connector.startApp(app);
}
