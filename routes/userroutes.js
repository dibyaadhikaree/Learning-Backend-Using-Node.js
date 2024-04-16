const express = require("express");

const userController = require("../controllers/usercontroller");

const authController = require("../controllers/authcontroller");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect);
//All the routes below this requires Protected route after this middleware

router.patch("/updatePassword", authController.updatePassword);

router.get("/me", userController.getMe, userController.getUser);

router.patch("/updateMe", userController.updateMe);

router.delete("/deleteMe", userController.deleteMe);

//Only to be executed by the Admin

router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers).post(userController.postUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
