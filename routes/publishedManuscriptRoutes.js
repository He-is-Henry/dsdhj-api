const express = require("express");
const router = express.Router();
const publishedManuscriptsController = require("../controllers/publishedManuscriptsController");
router.get("/", publishedManuscriptsController.getCurrentIssueManuscripts);
router.get("/all", publishedManuscriptsController.getAllManuscripts);
router.get("/recent", publishedManuscriptsController.getRecentManuscripts);
router.get("/:id", publishedManuscriptsController.getManuscript);
module.exports = router;
