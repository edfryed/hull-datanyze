/* @flow */
import { notifHandler, batchHandler } from "hull/lib/utils";
import UpdateUser from "./update-user";
import handleAdmin from "./admin";

module.exports = function Server(options: any = {}) {
  const { app, connector } = options;

  const updateUser = UpdateUser(options);

  app.use("/batch", batchHandler(({ client, ship }, users = []) => {
    client.logger.debug("datanyze.batch.process", { users: users.length });
    users.map(({ user }) => updateUser({ user }, { client, ship }, { isBatch: true }));
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
