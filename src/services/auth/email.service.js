import * as brevo from '@getbrevo/brevo';

const client = new brevo.TransactionalEmailsApi();
client.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY2
);

export default async function sendEmail(name, email, access_token) {
    const backendUrl = `${process.env.BACKEND_URL}/auth/confirm-subscription`;

    const emailContent = `
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation d'inscription</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
              max-width: 500px;
              margin: auto;
            }
            h2 {
              color: #333;
            }
            p {
              font-size: 16px;
              color: #555;
            }
            .btn-container {
              margin-top: 20px;
            }
            .btn {
              display: inline-block;
              padding: 8px 16px;
              font-size: 14px;
              color: #fff;
              border-radius: 4px;
              text-decoration: none;
              cursor: pointer;
              border: none;
              margin: 5px;
            }
            .btn-yes {
              background-color: #4CAF50;
            }
            .btn-no {
              background-color: #d9534f;
            }
            .message {
              display: none;
              margin-top: 20px;
              font-size: 14px;
              color: #333;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Confirmation d'inscription</h2>
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Votre inscription est enregistrée.</p>
            <p>Veuillez confirmer votre participation :</p>
  
            <div class="btn-container">
              <button class="btn btn-yes" onclick="sendResponse(true)">Oui, je confirme</button>
              <button class="btn btn-no" onclick="sendResponse(false)">Non, annuler</button>
            </div>
  
            <p id="confirmation-message" class="message"></p>
          </div>
  
          <script>
            function sendResponse(isConfirmed) {
              fetch('${backendUrl}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: '${access_token}',
                  confirmed: isConfirmed
                })
              })
              .then(response => response.json())
              .then(data => {
                document.getElementById("confirmation-message").innerText = 
                  isConfirmed ? "Votre inscription est confirmée. Merci !" : "Votre inscription a été annulée.";
                document.getElementById("confirmation-message").style.display = "block";
              })
              .catch(error => {
                document.getElementById("confirmation-message").innerText = 
                  "Une erreur s'est produite. Veuillez réessayer.";
                document.getElementById("confirmation-message").style.display = "block";
              });
            }
          </script>
        </body>
      </html>
    `;
  
    const sendEmailToME = async (name, email, subject, content) => {
      try {
        const response = await client.sendTransacEmail({
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
