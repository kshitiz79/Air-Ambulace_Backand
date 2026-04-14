/**
 * ambulanceScheduler.js
 * Runs every minute. At 12:00 IST (06:30 UTC), flips all RETURNING ambulances → AVAILABLE.
 * Also checks ambulances whose return_available_at timestamp has passed.
 */

const Ambulance = require('../model/Ambulance');
const { Op } = require('sequelize');

// IST = UTC+5:30 → 12:00 IST = 06:30 UTC
const IST_RETURN_HOUR_UTC   = 6;
const IST_RETURN_MINUTE_UTC = 30;

let schedulerStarted = false;

const runCheck = async () => {
  try {
    const now = new Date();

    // Release ambulances whose scheduled return time has passed
    const released = await Ambulance.update(
      { status: 'AVAILABLE', return_available_at: null },
      {
        where: {
          status: 'RETURNING',
          return_available_at: { [Op.lte]: now },
        }
      }
    );

    if (released[0] > 0) {
      console.log(`[SCHEDULER] ${released[0]} ambulance(s) RETURNING → AVAILABLE at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error('[SCHEDULER] Error:', err.message);
  }
};

const startScheduler = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;
  // Run immediately on start, then every 60 seconds
  runCheck();
  setInterval(runCheck, 60 * 1000);
  console.log('[SCHEDULER] Ambulance return scheduler started (checks every 60s)');
};

module.exports = { startScheduler };
