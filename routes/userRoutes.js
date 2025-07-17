const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRoles");
router.get("/", verifyJWT, verifyRoles("admin"), usersController.getAllUsers);
router.post(
  "/invite",
  verifyJWT,
  verifyRoles("admin"),
  usersController.handleInvite
);
router.patch("/complete/:token", usersController.completeInvite);
router.post("/login", usersController.login);
router.post("/signup", usersController.signup);
router.post("/logout", verifyJWT, usersController.logout);
router.get("/me", verifyJWT, usersController.getCurrentUser);
router.post("/send-reset", usersController.sendResetLink);
router.post("/verify-reset", usersController.verifyReset);
router
  .route("/:id")
  .put(verifyJWT, verifyRoles("admin"), usersController.handleNewRole)
  .patch(verifyJWT, verifyRoles("admin"), usersController.handleRemoveRole)
  .delete(verifyJWT, verifyRoles("admin"), usersController.deleteUser);

module.exports = router;
