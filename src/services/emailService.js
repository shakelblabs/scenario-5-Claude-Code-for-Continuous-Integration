// services/emailService.js — Sends transactional emails
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendWelcomeEmail(user) {
  // BUG 1: No try/catch — SMTP failure crashes caller
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: user.email,
    subject: 'Welcome!',
    // BUG 2: No HTML escaping — user.name could contain XSS if rendered in email client
    html: `<h1>Welcome, ${user.name}!</h1>`,
  });
}

async function sendPasswordResetEmail(email, resetToken) {
  // BUG 3: Reset token exposed directly in URL without expiry enforcement here
  // BUG 4: No check that `email` param is a valid email address
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Password Reset',
    html: `<a href="https://app.example.com/reset?token=${resetToken}">Reset Password</a>`,
  });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
