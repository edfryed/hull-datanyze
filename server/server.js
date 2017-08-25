/* @flow */
import express from "express";
import { notifHandler } from "hull/lib/utils";

import updateUser from "./lib/update-user";
import handleAdmin from "./lib/admin";

export default function server(app: express, options: any = {}): express {
  const { connector } = options;

  app.use("/batch", notifHandler({
    handlers: {
      "user:update": (ctx, messages = []) => {
        ctx.client.logger.debug("datanyze.batch.process", { messages: messages.length });
        return updateUser(ctx, messages, { isBatch: true });
      }
    }
  }));

  app.use("/notify", notifHandler({
    handlers: {
      "user:update": updateUser
    }
  }));

  app.get("/admin", connector.clientMiddleware(), handleAdmin);

  return app;
}
