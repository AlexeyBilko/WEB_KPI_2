import { createTransport } from 'nodemailer';
import sanitizeHtml from 'sanitize-html';
require('dotenv').config();

const from = `Form - ${process.env.EMAIL_ADRESS}`;
const history = new Map();

function getTransporter() {
  return createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_ADRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

const rateLimit = (ip, limit) => {
  if (!history.has(ip)) {
    history.set(ip, 0);
  }
  if (history.get(ip) > limit) {
    throw new Error();
  }
  history.set(ip, history.get(ip) + 1);
};

module.exports = (req, res) => {
  res.json({
    body: req.body,
    query: req.query,
    cookies: req.cookies,
  });
};

function sendMail(options) {
  try {
    const transport = getTransporter();
    transport.sendMail(options);
    return { success: true };
  } catch (error) {
    throw new Error(error?.message);
  }
}

function formSubmit(formData) {
  let html = '';
  for (const option in formData) {
    html += option + ' : ' + formData[option] + '<br/>';
  }
  return sendMail({
    from,
    to: process.env.EMAIL_TO_USER,
    subject: 'New form submision',
    html: sanitizeHtml(html),
  });
}

module.exports = (req, res) => {
  try {
    rateLimit(req.headers['x-real-ip'], 5);
  } catch (e) {
    return res.status(429).json();
  }
  const result = formSubmit(req.body);
  res.json({ result });
};

