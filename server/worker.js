import updateUser from "./lib/update-user";

export default function worker(connector) {
  connector.worker({
    refetchDomainInfo: (ctx, { message, attempt }) => {
      return updateUser(ctx, [message], { queued: true, attempt: attempt + 1 });
    }
  });

  return connector;
}
