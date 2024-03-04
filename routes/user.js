const express = require('express');
const { registerController, loginController, testController, googleSignInController } = require('../controllers/usersController');
const verifyJWT = require('../middlewares/authMiddleware');





const router = express.Router();


//routing to controller
router.route("/register").post(registerController)
router.route("/login").post(loginController)
router.route("/google-sign-in").post(googleSignInController)
router.route("/test").post(verifyJWT, testController)

module.exports = router;