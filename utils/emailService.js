const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (recipientEmail, otp) => {
  const mailOptions = {
    from: `"UniDID Security Team" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "UniDID Secure Access: Your One-Time Passcode (OTP)",
    text: `Dear User,

To complete your sign-in process, please use the following One-Time Passcode (OTP):

🔑 OTP: ${otp}

This OTP is valid for 5 minutes. If you did not request this, please ignore this email.

For security reasons, do not share this code with anyone.

Best regards,  
UniDID Security Team
-------------------------------------
This is an automated message. Please do not reply.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
        <div style="text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
          <img src="cid:logo" alt="UniDID Logo" width="150">
        </div>
        <div style="padding: 20px; background: #ffffff; border-radius: 8px; text-align: center;">
          <h2 style="color: #2b4162;">Your One-Time Passcode (OTP)</h2>
          <p style="font-size: 16px; color: #333;">Use the following OTP to complete your login process:</p>
          <div style="font-size: 24px; font-weight: bold; color: #2b4162; background: #f1f1f1; padding: 10px; border-radius: 8px; display: inline-block;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #777; margin-top: 15px;">
            This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.
          </p>
          <p style="font-size: 14px; color: #777; margin-top: 10px;">
            <strong>For security reasons, do not share this code with anyone.</strong>
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Need help? Contact <a href="mailto:unipodworks@gmail.com" style="color: #2b4162; text-decoration: none;">UniDID Support</a>.
          </p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #777; padding-top: 20px;">
          Security Team @ UniDID - a trusted identity management application engineered by UniPodWorks.
        </div>
      </div>
    `,

    attachments: [
      {
        filename: "logo-large-title-blue.png",
        path: "../server/assets/logo-large-title-blue.png",
        cid: "logo",
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (recipientEmail) => {
  const mailOptions = {
    from: `"UniDID Digital Marketing Team" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "Welcome to UniDID – Your Trusted Identity Management Partner",
    html: `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; ">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header with Embedded Logo -->
        <div style="text-align: center; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">
          <img src="cid:logo" alt="UniDID Logo" style="max-width: 150px; margin-bottom: 10px;" />
          <h2 style="color: #333; font-size: 22px;">Welcome to UniDID!</h2>
        </div>
        <!-- Body Content -->
        <p style="color: #555; font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Thank you for signing up with UniDID – your trusted partner in secure identity management. We are excited to have you onboard as we revolutionize the way digital identities are managed and protected.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          With UniDID, you gain access to cutting-edge technology that ensures your digital identity is secure, verifiable, and seamlessly managed. Our platform is designed to provide you with robust security and innovative solutions tailored to your unique needs.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Stay tuned for updates, expert tips, and exclusive offers that will help you maximize the benefits of our services.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Thank you for trusting UniDID.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Best regards,<br/>
          <strong>The Digital Marketing Team</strong>
          <br/>
          <strong>UniDID</strong>
        </p>
        <!-- Footer -->
        <div style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
           Digital Marketing Team @ UniDID - a trusted identity management application engineered by UniPodWorks.
        </div>
      </div>
    </div>
  `,
      attachments: [
        {
          filename: "logo-large-title-blue.png",
          path: "../server/assets/logo-large-title-blue.png",
          cid: "logo",
        },
      ],
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendWelcomeEmail };
