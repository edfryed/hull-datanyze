import { notifHandler } from "hull/lib/utils";

import { statusHandler, adminHandler, notifyHandler, smartNotifyHandler } from "./handlers";
import updateUser from "./lib/update-user";

export default function server(app, options = {}): express {
  const { connector } = options;

  app.use(
    "/batch",
    notifHandler({
      handlers: {
        "user:update": (ctx, messages = []) => {
          ctx.client.logger.debug("datanyze.batch.process", {
            messages: messages.length
          });
          return updateUser(ctx, messages, { isBatch: true });
        }
      }
    })
  );

  app.use("/notify", notifyHandler);
  app.use("/smart-notifier", smartNotifyHandler);
  app.get("/admin", connector.clientMiddleware(), adminHandler);
  app.all("/status", connector.clientMiddleware(), statusHandler);

  return app;
}
