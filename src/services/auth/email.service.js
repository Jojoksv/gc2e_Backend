import dotenv from 'dotenv';
import Brevo from 'sib-api-v3-sdk';
dotenv.config();
import debug from 'debug';

const defaultClient = Brevo.ApiClient.instance;

const log = debug('app:init');
log("Début de l'initialisation de l'API Key...");

if (defaultClient.authentications && defaultClient.authentications['api-key']) {
  log("API Key trouvée : ", defaultClient.authentications['api-key']);
  defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY2;
  log("API Key assignée avec succès.");
} else {
  log("Erreur: Impossible d'initialiser l'API Key.");
}


// Création de l'instance API
const apiInstance = new Brevo.TransactionalEmailsApi();

export default async function sendEmail(name, email, access_token) {
    const backendUrl = `${process.env.BACKEND_URL}/auth`;

    const emailContent = `
      <html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation d'inscription</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      text-align: center;
      padding: 40px 20px;
      background-color: #f9f9f9;
      color: #333;
    }
    .container {
      background: #ffffff;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.08);
      max-width: 500px;
      margin: auto;
    }
    h2 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    p {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
    }
    .btn-container {
      margin-top: 25px;
    }
    .btn {
      display: inline-block;
      padding: 12px 20px;
      font-size: 16px;
      color: #fff;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin: 10px;
      transition: all 0.3s ease;
    }
    .btn-yes {
      background-color: #3a7d44;
    }
    .btn-yes:hover {
      background-color: #2e6034;
    }
    .btn-no {
      background-color: #8c979d;
    }
    .btn-no:hover {
      background-color: #757d83;
    }
    .footer {
      margin-top: 20px;
      font-size: 14px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Bienvenue parmi nous, ${name} !</h2>
    <p>
      Nous sommes ravis de vous compter parmi nous. Votre inscription a bien été enregistrée.
    </p>
    <p>
      Afin de finaliser votre inscription, nous vous invitons à confirmer votre participation en cliquant sur l'un des boutons ci-dessous :
    </p>

    <div class="btn-container">
      <a href="${backendUrl}/confirm-subscription?token=${access_token}&confirmed=true" class="btn btn-yes">Oui, je confirme</a>
      <a href="${backendUrl}/confirm-subscription?token=${access_token}&confirmed=false" class="btn btn-no">Non, annuler</a>
    </div>

    <p class="footer">
      Si vous avez des questions, n’hésitez pas à nous contacter.<br>
      Merci et à bientôt !
    </p>
  </div>
</body>
</html>
    `;
  
    const sendEmailToME = async (name, email, subject, content) => {
      try {
        const response = await apiInstance.sendTransacEmail({
          sender: { name: process.env.USER_NAME, email: process.env.USER_EMAIL },
          to: [{ email, name }],
          htmlContent: content,
          subject: subject,
          params: { sender: process.env.USER_NAME },
        });
        return true;
      } catch (error) {
        console.error("Erreur envoi email :", error);
        return false;
      }
    };
  
    const subject = "Confirmation d'inscription";
    const result = await sendEmailToME(name, email, subject, emailContent);
  
    return result;
}
