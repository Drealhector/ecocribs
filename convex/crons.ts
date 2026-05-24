import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'fire due reminders',
  { minutes: 5 },
  internal.notifications.reminders.fireDue,
);

// TODO(production): nightly integrity sample-check at 03:00 Lagos (02:00 UTC)
// crons.cron('integrity sample', '0 2 * * *', internal.documents.integrity.sampleVerify);

// TODO(production): daily retention sweep at 04:00 UTC
// crons.cron('retention purge', '0 4 * * *', internal.documents.lifecycle.purgeDue);

export default crons;
