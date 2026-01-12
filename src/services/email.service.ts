import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST === 'localhost' ? '127.0.0.1' : (process.env.SMTP_HOST || 'smtp.gmail.com'),
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendInvitationEmail = async (to: string, eventTitle: string, inviteLink: string) => {
    // Si on est en dev avec MailHog (port 1025), on accepte l'absence de credentials
    const isDev = process.env.SMTP_PORT === '1025';

    if (!isDev && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
        console.warn('⚠️ SMTP credentials not found. Email not sent.');
        console.log(`[MOCK EMAIL] To: ${to}, Subject: Invitation Secret Santa, Link: ${inviteLink}`);
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Secret Santa" <noreply@secretsanta.com>',
        to,
        subject: `Invitation à l'évènement Secret Santa : ${eventTitle}`,
        html: `
      <h1>Vous êtes invité !</h1>
      <p>Bonjour,</p>
      <p>Vous avez été invité à participer à l'évènement Secret Santa <strong>${eventTitle}</strong>.</p>
      <p>Pour confirmer votre participation, veuillez cliquer sur le lien ci-dessous :</p>
      <a href="${inviteLink}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Rejoindre l'évènement</a>
      <p>Si le bouton ne fonctionne pas, copiez ce lien : ${inviteLink}</p>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email envoyé: %s', info.messageId);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
        throw error;
    }
};
