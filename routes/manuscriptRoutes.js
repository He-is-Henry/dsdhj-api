const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const router = express.Router();
const manuscriptsController = require("../controllers/manuscriptsController");
const verifyRoles = require("../middleware/verifyRoles");
const verifyManuscriptAccess = require("../middleware/VerifyManuscriptAccess");

router
  .route("/")
  .post(verifyJWT, verifyRoles("author"), manuscriptsController.addManuscript)
  .get(verifyJWT, verifyRoles("author"), manuscriptsController.getManuscripts);

router.get(
  "/all",
  verifyJWT,
  verifyRoles("admin", "editor"),
  manuscriptsController.getAllManuscripts
);
router
  .route("/:id")
  .get(
    verifyJWT,
    verifyRoles("author"),
    verifyManuscriptAccess,
    manuscriptsController.getManuscript
  )
  .patch(
    verifyJWT,
    verifyRoles("author"),
    verifyManuscriptAccess,
    manuscriptsController.editManuscript
  )
  .delete(
    verifyJWT,
    verifyRoles("author"),
    verifyManuscriptAccess,
    manuscriptsController.deleteManuscript
  );

router.patch(
  "/:id/message",
  verifyJWT,
  verifyRoles("editor", "admin"),
  manuscriptsController.sendManuscriptMessage
);

router.patch(
  "/review/:id",
  verifyJWT,
  verifyRoles("admin", "editor"),
  manuscriptsController.handleManuscriptStatusUpdate
);
router.patch(
  "/publish/:id",
  verifyJWT,
  verifyRoles("admin"),
  manuscriptsController.publishManuscript
);

module.exports = router;
