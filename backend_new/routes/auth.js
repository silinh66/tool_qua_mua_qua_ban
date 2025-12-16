// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middlewares/auth");

/**
 * 1. POST /register-otp
 *    - Body: { email, name, password, phone_number, otp }
 */
router.post("/register-otp", authController.registerOtp);

/**
 * 2. POST /send-code-sms
 *    - Body: { phoneNumber }
 */
router.post("/send-code-sms", authController.sendCodeSms);

/**
 * 3. POST /forgot-password
 *    - Body: { email?, phoneNumber? }
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * 4. POST /send-code-email
 *    - Body: { email }
 */
router.post("/send-code-email", authController.sendCodeEmail);

/**
 * 5. POST /change-password-contact
 *    - Body: { contact, password }
 */
router.post("/change-password-contact", authController.changePasswordContact);

/**
 * 6. POST /change-password
 *    - Body: { userID, currentPassword, newPassword }
 */
router.post("/change-password", authController.changePassword);

/**
 * 7. POST /login
 *    - Body: { identifier, password }
 */
router.post("/login", authController.login);

/**
 * 8. POST /logout
 *    - JWT required
 */
router.post("/logout", authenticateToken, authController.logout);

module.exports = router;
