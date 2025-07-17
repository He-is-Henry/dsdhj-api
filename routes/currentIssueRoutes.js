const express = require("express");
const router = express.Router();
const currentIssueController = require("../controllers/currentIssueController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRoles");

router
  .route("/")
  .get(verifyJWT, verifyRoles("admin"), currentIssueController.getCurrentIssue)
  .patch(verifyJWT, verifyRoles("admin"), currentIssueController.getNewIssue);

module.exports = router;
