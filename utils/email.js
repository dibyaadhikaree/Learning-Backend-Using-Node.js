const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //create a transoporter

  //   const transporter = nodemailer.createTransport({
  //     service: "Gmail",
  //     auth: {
  //       user: process.env.EMAIL_USERNAME,
  //       pass: process.env.EMAIL_PASSWORD,
  //     },
  //     // Activate in gmail "less secure app" option
  //   });

  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "4d5cab732265ef",
      pass: "6bfcf0c87c3f8a",
    },
  });

  //define the email options

  const mailOptions = {
    from: "Dibya Adhikari <dibyaaadhikari@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html :
  };

  //Actually send the email with nodemailer
  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
