const nodemailer = require("nodemailer");
const { logger } = require("../middleware/logger");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendMail = async ({
  from = `"DSDHJ" <${process.env.EMAIL_USER}>`,
  to,
  bcc,
  subject,
  text,
  html,
  cc,
}) => {
  
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      bcc,
      cc,
    });
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    logger(
      `Failed to send emails:\tmanuscript submission\t${error}\t${to}\t${html}`,
      "emailErr.log"
    );
    console.error("Error sending mail:", error);
    throw error;
  }
};

module.exports = sendMail;
