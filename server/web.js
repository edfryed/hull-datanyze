import options from "./index";
import Server from "./server";
import WorkerJobs from "./worker-jobs";

const { connector, app } = options;

connector.setupApp(app);

connector.startApp(Server(options));

if (process.env.WORKER_MODE === "embedded") {
  WorkerJobs(options);
}
