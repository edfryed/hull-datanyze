/* @flow */
import { notifHandler, batchHandler } from "hull/lib/utils";
import updateUser from "./update-user";
import handleAdmin from "./admin";

module.exports = function Server(options: any = {}) {
  const { app, connector } = options;

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
};
