// Standalone PDF worker: `npm run worker`. Use with DISABLE_WORKER=true on the web servers
// if you want processing on separate machines.
import { startWorker } from "../lib/jobs/worker";

startWorker();
