// ============================================================
// NETLIFY FUNCTION — init-payment.js
// Crée une transaction FedaPay côté serveur (clé secrète cachée)
//
// Variables d'environnement à configurer sur Netlify :
//   FEDAPAY_SECRET_SANDBOX = sk_sandbox_i69_dIhflYsGNjGM_PxOwlWe
//   FEDAPAY_SECRET_LIVE     = sk_live_... (après vérification compte)
// ============================================================

exports.handler = async (event) => {

  // Autoriser uniquement les requêtes POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ erreur: "Méthode non autorisée" }) };
  }

  try {
    const { montant, forfait, telephone, env } = JSON.parse(event.body);

    // Choisir la bonne clé et URL selon l'environnement
    const estLive = env === "live";
    const cleSecrete = estLive
      ? process.env.FEDAPAY_SECRET_LIVE
      : process.env.FEDAPAY_SECRET_SANDBOX;
    const apiURL = estLive
      ? "https://api.fedapay.com/v1"
      : "https://sandbox-api.fedapay.com/v1";

    if (!cleSecrete) {
      return {
        statusCode: 500,
        body: JSON.stringify({ erreur: "Clé FedaPay non configurée sur le serveur." })
      };
    }

    // ÉTAPE 1 — Créer la transaction
    const rep1 = await fetch(apiURL + "/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cleSecrete
      },
      body: JSON.stringify({
        description: "Accès WiFi ZoneNet - " + forfait,
        amount: montant,
        currency: { iso: "XOF" },
        customer: {
          phone_number: {
            number: telephone,
            country: "BJ"
          }
        }
      })
    });

    const data1 = await rep1.json();
    if (!rep1.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erreur: data1.message || "Erreur création transaction FedaPay." })
      };
    }

    const transactionId = data1.v1.transaction.id;

    // ÉTAPE 2 — Déclencher la notification Mobile Money sur le téléphone
    const rep2 = await fetch(apiURL + "/transactions/" + transactionId + "/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cleSecrete
      }
    });

    const data2 = await rep2.json();
    if (!rep2.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erreur: data2.message || "Erreur déclenchement paiement." })
      };
    }

    // Retourner l'ID de transaction au client (pas la clé secrète !)
    return {
      statusCode: 200,
      body: JSON.stringify({ transactionId })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erreur: "Erreur serveur : " + err.message })
    };
  }
};
