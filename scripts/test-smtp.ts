import nodemailer from 'nodemailer';
import 'dotenv/config';

async function testSMTP() {
    const host = process.env.SMTP_HOST === 'localhost' ? '127.0.0.1' : (process.env.SMTP_HOST || '127.0.0.1');
    const port = parseInt(process.env.SMTP_PORT || '1025', 10);

    console.log(`📡 Testing SMTP connectivity to ${host}:${port}...`);

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'test',
            pass: process.env.SMTP_PASS || 'test',
        },
    });

    try {
        // Step 1: Verify connection
        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully!');

        // Step 2: Send test email
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Secret Santa Test" <test@secretsanta.com>',
            to: 'test@example.com',
            subject: 'Test Email - Connectivity Check',
            text: 'If you see this, the SMTP connection and MailHog are working! 🚀',
            html: '<h1>Success!</h1><p>The SMTP connection and MailHog are working! 🚀</p>',
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Test email sent: %s', info.messageId);
        console.log('🔗 Check MailHog UI at http://localhost:8025');

    } catch (error) {
        console.error('❌ SMTP Connection failed:', error);
        process.exit(1);
    }
}

testSMTP();
