/* @flow */
import express from "express";
import { notifHandler, batchHandler } from "hull/lib/utils";

import updateUser from "./lib/update-user";
import handleAdmin from "./lib/admin";

export default function server(app: express, options: any = {}): express {
  const { connector } = options;

  app.use("/batch", batchHandler(({ client, ship, cache }, messages = []) => {
    client.logger.debug("datanyze.batch.process", { messages: messages.length });
    return updateUser({ client, ship, cache }, messages, { isBatch: true });
  }, {
    batchSize: 100,
    groupTraits: false
  }));

  app.use("/notify", notifHandler({
    userHandlerOptions: {
      groupTraits: false
    },
    handlers: {
      "user:update": updateUser
    }
  }));

  app.get("/admin", connector.clientMiddleware(), handleAdmin);

  return app;
}
