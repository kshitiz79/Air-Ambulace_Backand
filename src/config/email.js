const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'flyola.jetserveaviation@gmail.com',
        pass: 'swtyrapwjmwmjioy' // the app password without spaces based on user input
    }
});

const sendMail = async (to, subject, text, html, attachments) => {
    try {
        await transporter.sendMail({
            from: '"Air Ambulance Portal" <flyola.jetserveaviation@gmail.com>',
            to,
            subject,
            text,
            html,
            attachments
        });
        console.log(`Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
        return false;
    }
};

module.exports = { sendMail };
