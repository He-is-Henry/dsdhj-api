const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRoles");
const archiveController = require("../controllers/archiveController");
const router = express.Router();

router
  .route("/")
  .post(verifyJWT, verifyRoles("admin"), archiveController.addNewArchive)
  .get(archiveController.getAllArchives);

module.exports = router;
