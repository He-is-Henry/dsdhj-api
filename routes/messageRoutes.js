const express = require("express");
const router = express.Router();
const messagescontroller = require("../controllers/messagesController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRoles");

router
  .route("/")
  .post(messagescontroller.newMessage)
  .get(messagescontroller.getAllMessages);

router
  .route("/:messageId")
  .post(
    verifyJWT,
    verifyRoles("editor", "admin"),
    messagescontroller.replyMessage
  )
  .delete(
    verifyJWT,
    verifyRoles("editor", "admin"),
    messagescontroller.deleteMessage
  );
module.exports = router;
