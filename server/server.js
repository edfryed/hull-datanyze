import express from "express";
import path from "path";
import updateUser from "./update-user";

module.exports = function Server(options = {}) {
  const { port, Hull, hostSecret } = options;
  const { BatchHandler, NotifHandler, Routes } = Hull;
  const { Readme, Manifest } = Routes;
  const app = express();

  app.use(express.static(path.resolve(__dirname, "..", "dist")));
  app.use(express.static(path.resolve(__dirname, "..", "assets")));

  app.set("views", path.resolve(__dirname, "..", "views"));

  app.get("/manifest.json", Manifest(__dirname));
  app.get("/", Readme);
  app.get("/readme", Readme);

  app.post("/batch", BatchHandler({
    hostSecret,
    batchSize: 100,
    groupTraits: false,
    handler: (notifications = [], { hull, ship }) => {
      notifications.map(({ message }) => {
        message.user = hull.utils.groupTraits(message.user);
        return updateUser({ message }, { hull, ship });
      });
    }
  }));

  app.post("/notify", NotifHandler({
    groupTraits: false,
    onSubscribe() {
      console.warn("Hello new subscriber !");
    },
    handlers: {
      "user:update": updateUser
    }
  }));

  Hull.logger.info("datanyze.started", { port });
  app.listen(port);

  return app;
}
