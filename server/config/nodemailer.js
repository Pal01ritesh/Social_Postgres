import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const testEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('Nodemailer connection verified successfully');
        console.log(`SMTP Host: ${process.env.SMTP_USER}@smtp-relay.brevo.com`);
    } catch (error) {
        console.error('Nodemailer connection failed:', error.message);
        console.error('Check your SMTP credentials in environment variables');
    }
};

export { transporter, testEmailConnection };
export default transporter;