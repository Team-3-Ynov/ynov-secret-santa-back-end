import 'dotenv/config';
import { sendInvitationEmail } from '../services/emailService';

async function main() {
    const targetEmail = 'test.test@yopmail.com';
    console.log(`🚀 Tentative d'envoi d'email à ${targetEmail}...`);

    try {
        // URL factice pour le test
        const testLink = 'http://localhost:3000/events/test-id/join';

        await sendInvitationEmail(
            targetEmail,
            'Test Manuelle Secret Santa',
            testLink
        );

        console.log('✅ Script terminé sans erreur (Vérifiez si l\'email a été envoyé ou loggé).');
    } catch (error) {
        console.error('❌ Echec lors de l\'envoi:', error);
    }
}

main();
