import "dotenv/config";
import { createApp } from "./app";
import { logger } from "./lib/logger";
import { scheduleReminderJob } from "./services/reminder.job";
import { scheduleRecallJob } from "./services/recall.job";

const port = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(port, () => {
  logger.info(`Dentixa API listening on port ${port}`);
  scheduleReminderJob();
  scheduleRecallJob();
});
