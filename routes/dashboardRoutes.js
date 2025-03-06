const express = require("express");
const router = express.Router();
const {
  getOverallStats,
  getUserRegistrationStats,
  getFunctionLogs,
  logFunctionActivity,
} = require("../controllers/statsController");

router.get("/overallstats", getOverallStats);
router.get("/registration-stats", getUserRegistrationStats);
router.get("/logs", getFunctionLogs);
router.post("/logs/add", logFunctionActivity);

module.exports = router;
