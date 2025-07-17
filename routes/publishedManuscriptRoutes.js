const express = require("express");
const router = express.Router();
const publishedManuscriptsController = require("../controllers/publishedManuscriptsController");
router.get("/", publishedManuscriptsController.getCurrentIssueManuscripts);
router.get("/archive", publishedManuscriptsController.getArchive);

module.exports = router;
