import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Hunter: Scan for new listings every 4 hours during business hours
// Runs at 6am, 10am, 2pm, 6pm, 10pm AEST (UTC+10 → subtract 10)
// = 20:00, 00:00, 04:00, 08:00, 12:00 UTC
crons.cron("Hunter 6am AEST deep scan", "0 20 * * *", api.agents.hunter.run, { trigger: "schedule" });
crons.cron("Hunter 10am AEST scan", "0 0 * * *", api.agents.hunter.run, { trigger: "schedule" });
crons.cron("Hunter 2pm AEST scan", "0 4 * * *", api.agents.hunter.run, { trigger: "schedule" });
crons.cron("Hunter 6pm AEST scan", "0 8 * * *", api.agents.hunter.run, { trigger: "schedule" });
crons.cron("Hunter 10pm AEST scan", "0 12 * * *", api.agents.hunter.run, { trigger: "schedule" });

// Briefer: Generate morning brief at 6am AEST daily = 20:00 UTC previous day
crons.cron("Briefer 6am AEST daily", "0 20 * * *", api.agents.briefer.run, { trigger: "schedule" });

// Lister: Audit inventory every Monday at 7am AEST = 21:00 UTC Sunday
crons.cron("Lister Monday 7am AEST", "0 21 * * 0", api.agents.lister.run, { trigger: "schedule" });

export default crons;
