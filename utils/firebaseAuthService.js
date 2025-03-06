const admin = require("../config/firebase");
const { sendOtpEmail } = require("./emailService");

const sendOTPWithFirebase = async (email, otp) => {
  const link = `Your OTP: ${otp}`;
  await sendOtpEmail(email, otp);
  await admin.auth().generateEmailVerificationLink(email);
  console.log(`OTP sent to ${email}: ${otp}`);
};

/**Needs Frontend page */
const sendPasswordResetEmail = async (email) => {
  const resetLink = await admin.auth().generatePasswordResetLink(email);
  console.log(`Password reset link sent to ${email}: ${resetLink}`);
};

module.exports = { sendOTPWithFirebase, sendPasswordResetEmail };
