/* @flow */
import UpdateUser from "./update-user";

module.exports = function Worker({ cache, connector }: any) {
  connector.worker({
    refetchDomainInfo: (ctx, { message, attempt }) => {
      const updateUser = UpdateUser({ cache });
      ctx.client.logger.info("worker.process", this.id);
      return ctx.get(ctx.config.id)
        .then((ship) => {
          return updateUser({ message }, { ctx, ship }, { queued: true, attempt: attempt + 1 });
        });
    }
  });

  connector.startWorker();
};
