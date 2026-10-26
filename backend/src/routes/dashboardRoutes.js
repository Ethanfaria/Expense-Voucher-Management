const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const {
  employeeDashboard,
  directorDashboard,
  accountsDashboard,
} = require("../controllers/dashboardController");

const router = express.Router();
router.use(authenticate);

router.get("/employee", requireRole("EMPLOYEE"), employeeDashboard);
router.get("/director", requireRole("DIRECTOR"), directorDashboard);
router.get("/accounts", requireRole("ACCOUNTS"), accountsDashboard);

module.exports = router;