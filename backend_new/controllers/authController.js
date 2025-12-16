// controllers/authController.js
const queryMySQL = require("../utils/queryMySQL");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const randomize = require("randomatic");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Lấy từ environment
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const emailConfig = process.env.EMAIL_CONFIG;
const passwordConfig = process.env.PASSWORD_CONFIG;
const verifyServiceSid = process.env.TWILIO_VERIFY_SID;

/**
 * Kiểm tra định dạng email
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Kiểm tra định dạng phone number
 */
function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phoneNumber);
}

/**
 * 1. POST /register-otp
 */
exports.registerOtp = async (req, res, next) => {
  try {
    const { email, name, password, phone_number, otp } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await queryMySQL(
      "INSERT INTO users (email, name, password, phone_number, createdOn, isOnline) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, hashedPassword, phone_number, new Date(), 0]
    );
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * 2. POST /send-code-sms
 */
exports.sendCodeSms = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    let passcode = randomize("0", 6);
    const formattedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+84${phoneNumber.replace(/^0/, "")}`;

    console.log("Formatted phone number: ", formattedPhoneNumber);

    // Gửi SMS qua Twilio
    const client = twilio(accountSid, authToken);

    client.verify.v2
      .services("VA3b627f49f233289c812d533f3a644140")
      .verifications.create({
        body: `Mã đổi mật khẩu của bạn là: ${passcode}`,
        from: "DAUTUBENVUNG",
        to: formattedPhoneNumber,
        channel: "sms",
      })
      .then((message) => {
        console.log("SMS sent: " + message.sid);
        res
          .status(200)
          .json({ message: "Passcode sent successfully via SMS", passcode });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Failed to send passcode via SMS" });
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to send passcode via SMS" });
  }
};

/**
 * 3. POST /forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, phoneNumber } = req.body;
    let passcode = randomize("0", 6);
    console.log("passcode: ", passcode);

    if (phoneNumber) {
      const formattedPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+84${phoneNumber.replace(/^0/, "")}`;

      console.log("Formatted phone number: ", formattedPhoneNumber);

      const client = twilio(accountSid, authToken);

      client.verify.v2
        .services("VA3b627f49f233289c812d533f3a644140")
        .verifications.create({
          body: `Mã đổi mật khẩu của bạn là: ${passcode}`,
          from: "DAUTUBENVUNG",
          to: formattedPhoneNumber,
          channel: "sms",
        })
        .then((message) => {
          console.log("SMS sent: " + message.sid);
          res
            .status(200)
            .json({ message: "Passcode sent successfully via SMS", passcode });
        })
        .catch((error) => {
          console.log(error);
          res.status(500).json({ message: "Failed to send passcode via SMS" });
        });
    } else if (email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailConfig,
          pass: passwordConfig,
        },
      });
      const mailOptions = {
        from: `Đầu Tư Bền Vững ${emailConfig}`,
        to: email,
        subject: "Yêu cầu đổi mật khẩu",
        text: `Mã đổi mật khẩu của bạn là: ${passcode}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res
            .status(500)
            .json({ message: "Failed to send passcode via email" });
        } else {
          console.log("Email sent: " + info.response);
          res
            .status(200)
            .json({ message: "Passcode sent successfully", passcode });
        }
      });
    } else {
      res.status(400).json({ message: "No contact info provided" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to send passcode" });
  }
};

/**
 * 4. POST /send-code-email
 */
exports.sendCodeEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    let passcode = randomize("0", 6);
    console.log("passwordConfig: ", passwordConfig);
    if (email) {
      // Gửi email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailConfig,
          pass: passwordConfig,
        },
      });
      const mailOptions = {
        from: `Đầu Tư Bền Vững ${emailConfig}`,
        to: email,
        subject: "Không chia sẻ mã này cho bất kỳ ai!",
        text: `Mã của bạn là: ${passcode}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res
            .status(500)
            .json({ message: "Failed to send passcode via email" });
        } else {
          console.log("Email sent: " + info.response);
          res
            .status(200)
            .json({ message: "Passcode sent successfully", passcode });
        }
      });
    } else {
      res.status(400).json({ message: "No contact info provided" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to send passcode via email" });
  }
};

/**
 * 5. POST /change-password-contact
 */
exports.changePasswordContact = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    let response;
    console.log("email: ", email);
    
    console.log('validateEmail(email)', validateEmail(email));
    
    if (validateEmail(email)) {
      response = await queryMySQL(
        "UPDATE users SET password = ? WHERE email = ?",
        [password_hash, email]
      );
    } else if (validatePhoneNumber(email)) {
      response = await queryMySQL(
        "UPDATE users SET password = ? WHERE phone_number = ?",
        [password_hash, email]
      );
    } else {
      return res.status(400).send("Invalid email information");
    }

    if (!response) {
      return res.status(500).send("Failed to update password");
    }
    return res.status(200).json({ message: "Đổi pass thành công!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * 6. POST /change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { userID, currentPassword, newPassword } = req.body;

    if (!userID || !currentPassword || !newPassword) {
      return res.status(400).send({
        error: "UserID, current password, and new password are required.",
      });
    }

    let results = await queryMySQL("SELECT * FROM users WHERE userID = ?", [
      userID,
    ]);

    if (results.length === 0) {
      return res.status(401).send({ error: "User not found" });
    }

    let user = results[0];

    let isCorrectPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCorrectPassword) {
      return res.status(401).send({ error: "Incorrect current password" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    let updateResponse = await queryMySQL(
      "UPDATE users SET password = ? WHERE userID = ?",
      [newPasswordHash, userID]
    );

    if (!updateResponse.affectedRows) {
      return res.status(500).send("Failed to update password");
    }

    // Return success response
    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * 7. POST /login
 */
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    let results = await queryMySQL(
      "SELECT * FROM users WHERE email = ? OR phone_number = ?",
      [identifier, identifier]
    );
    if (results.length === 0) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    let user = results[0];
    let isCorrectPassword = await bcrypt.compare(password, user.password || "");

    if (!isCorrectPassword) {
      return res.status(401).send({ error: "Wrong password" });
    }

    // Update isOnline status
    await queryMySQL("UPDATE users SET isOnline = 1 WHERE userID = ?", [
      user.userID,
    ]);

    // Generate a token
    const token = jwt.sign({ userId: user.userID }, process.env.SECRET, {
      expiresIn: "24h",
    });

    res.send({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred during login" });
  }
};

/**
 * 8. POST /logout
 */
exports.logout = async (req, res, next) => {
  try {
    await queryMySQL("UPDATE users SET isOnline = 0 WHERE userID = ?", [
      req.user.userId,
    ]);

    res.send({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
