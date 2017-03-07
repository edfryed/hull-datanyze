import UpdateUser from "./update-user";

module.exports = function Worker({ cache, queue, Hull }) {
  Hull.logger.info("worker.process");
  const updateUser = UpdateUser({ cache, queue });
  queue.process("refetchDomainInfo", function processRefetchDomainInfo(job, done) {
    const message = job.data.payload;
    const hull = Hull(job.data.config);
    hull.logger.info("worker.process", job.id);
    return hull.get(job.data.config.id)
      .then((ship) => {
        return updateUser({ message }, { hull, ship }, true);
      })
      .then(() => done(), err => done(err));
  });
};
