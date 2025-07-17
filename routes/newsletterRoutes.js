const express = require("express");
const router = express.Router();
const newsletterController = require("../controllers/newsLetterController");

router.post("/", newsletterController.subscribe);

module.exports = router;
