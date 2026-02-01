/* server/utils/sendEmail.ts */
import nodemailer from 'nodemailer';

const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
  html?: string; // Hỗ trợ gửi HTML email cho đẹp
}) => {
  // 1. Tạo transporter (người vận chuyển)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true cho port 465, false cho các port khác
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Định nghĩa options cho email
  const mailOptions = {
    from: `"iTask Support" <${process.env.EMAIL_USER}>`, // Tên người gửi
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Nội dung HTML
  };

  // 3. Gửi email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
