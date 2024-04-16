const express = require("express");
const router = express.Router();

const viewsController = require("./../controllers/viewscontroller");
const authController = require("./../controllers/authcontroller");

// CONNECTING TO FRONTEND

router.use(authController.isLoggedIn);

router.get("/", viewsController.getOverview);
router.get("/tour/:slug", viewsController.getTour);
router.get("/login", viewsController.getLoginForm);

module.exports = router;
