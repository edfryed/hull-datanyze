/* @flow */
import { Connector } from "hull";
import UpdateUser from "./lib/update-user";

export default function worker(connector: Connector, { cache }: Object): Connector {
  connector.worker({
    refetchDomainInfo: (ctx, { message, attempt }) => {
      const updateUser = UpdateUser({ cache });
      return ctx.get(ctx.config.id)
        .then((ship) => {
          return updateUser({ message }, { ctx, ship }, { queued: true, attempt: attempt + 1 });
        });
    }
  });

  return connector;
}
