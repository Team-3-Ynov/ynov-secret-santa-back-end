import nodemailer from 'nodemailer';
import 'dotenv/config';

const isDev = process.env.NODE_ENV !== 'production' || process.env.SMTP_PORT === '1025';

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
    // Si on est en dev sans credentials SMTP configurés, on simule l'envoi
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
    } catch (error: any) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message || error);

        // En développement, on log l'erreur mais on ne fait pas crasher la requête
        if (isDev) {
            if (error.code === 'ECONNREFUSED') {
                console.warn('⚠️ [DEV MODE] Connection refused: MailHog is likely not running. Run `docker compose --profile infra up -d`');
            } else {
                console.warn('⚠️ [DEV MODE] Email non envoyé - See error above');
            }
            console.log(`[MOCK EMAIL] To: ${to}, Subject: Invitation Secret Santa, Link: ${inviteLink}`);
            return; // On continue sans erreur en dev
        }
        throw error;
    }
};

export const sendDrawResultEmail = async (
    to: string,
    giverUsername: string,
    receiverUsername: string,
    eventTitle: string
) => {
    if (!isDev && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
        console.warn('⚠️ SMTP credentials not found. Email not sent.');
        console.log(`[MOCK EMAIL] Draw result - To: ${to}, Receiver: ${receiverUsername}`);
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Secret Santa" <noreply@secretsanta.com>',
        to,
        subject: `🎅 Résultat du tirage Secret Santa : ${eventTitle}`,
        html: `
      <h1>🎁 Le tirage a été effectué !</h1>
      <p>Bonjour <strong>${giverUsername}</strong>,</p>
      <p>Le tirage au sort pour l'évènement Secret Santa <strong>${eventTitle}</strong> vient d'être réalisé.</p>
      <p>Vous avez été désigné(e) pour offrir un cadeau à :</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f0f4ff; border-left: 4px solid #4F46E5; border-radius: 4px;">
        <h2 style="margin: 0; color: #4F46E5;">🎄 ${receiverUsername}</h2>
      </div>
      <p>Gardez ce secret jusqu'au jour J ! 🤫</p>
      <p style="color: #888; font-size: 12px;">Cet email est confidentiel, ne le partagez pas.</p>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email de tirage envoyé: %s', info.messageId);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email de tirage:', error);
        if (isDev) {
            console.warn('⚠️ [DEV MODE] Email non envoyé - MailHog probablement non démarré');
            console.log(`[MOCK EMAIL] Draw result - To: ${to}, Receiver: ${receiverUsername}`);
            return;
        }
        throw error;
    }
};

