const express = require("express");
const router = express.Router();
const messagescontroller = require("../controllers/messagesController");

router
  .route("/")
  .post(messagescontroller.newMessage)
  .get(messagescontroller.getAllMessages);

module.exports = router;
