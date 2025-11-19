import * as nodemailer from "nodemailer";
import "dotenv/config";
const transport = nodemailer.createTransport({
  host: "smtp.gmail.com", 
  port: 587,              
  secure: false,          
  auth: {
    user: process.env.GOOGLE_APP_EMAIL!,
    pass: process.env.GOOGLE_APP_PASSWORD!,
  },
});

export const sendVerificationCode = async (email: string, code: string) => {
  const mailOptions = {
    from: process.env.GOOGLE_APP_EMAIL!,
    to: email,
    subject: "Verify Your Email Address",
    text: `Welcome to Vitapulse! Please verify your email by clicking the following link: ${process.env.APP_DOMAIN_NAME!}/${code}`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #4CAF50;">Welcome to Vitapulse!</h2>
            <p>Thank you for signing up. Please verify your email address to get started:</p>
            <p>
                <a href="${process.env.APP_DOMAIN_NAME!}/verification/${code}"
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Verify Email
                </a>
            </p>
            <p>If the button doesn't work, you can also click or copy the link below into your browser:</p>
            <p><a href="${process.env.APP_DOMAIN_NAME!}/verification/${code}">${Bun.env.APP_DOMAIN_NAME!}/verification/${code}</a></p>
            <hr style="margin-top: 30px;">
            <p style="font-size: 12px; color: #888;">If you didn't sign up for Vitapulse, please ignore this email.</p>
        </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

export const sendAlertEmail = async (email: string, alertMessage: string) => {
  const mailOptions = {
    from: process.env.GOOGLE_APP_EMAIL!,
    to: email,
    subject: "⚠️ Important Alert from Vitapulse",
    text: `Hello,

We wanted to let you know:

${alertMessage}

If you did not initiate this or believe it's an error, please contact our support team immediately.

– The Vitapulse Team`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #D32F2F;">⚠️ Important Alert from Vitapulse</h2>
            <p>${alertMessage}</p>
            <p style="margin-top: 20px;">
                If you did not initiate this action or believe this is an error, please 
                <a href="mailto:support@vitapulse.com" style="color: #D32F2F; text-decoration: underline;">
                    contact our support team
                </a> immediately.
            </p>
            <hr style="margin-top: 30px;">
            <p style="font-size: 12px; color: #888;">This alert was sent to you based on your account activity at Vitapulse.</p>
        </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    console.log("Alert email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending alert email:", error);
    return false;
  }
};

export const sendResetPassword = async (email: string, token: string) => {
  const mailOptions = {
    from: process.env.GOOGLE_APP_EMAIL!,
    to: email,
    subject: "Password Reset",
    html: `<p>You requested a password reset.</p>
               <p>Click <a href="${Bun.env.APP_DOMAIN_NAME!}/reset-password/${token}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
  };

  try {
    await transport.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};
