// ============================================================
// NETLIFY FUNCTION — check-payment.js
// Vérifie le statut d'une transaction FedaPay côté serveur
// ============================================================

exports.handler = async (event) => {

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ erreur: "Méthode non autorisée" }) };
  }

  try {
    const { id, env } = event.queryStringParameters || {};

    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ erreur: "ID de transaction manquant." }) };
    }

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

    // Interroger FedaPay pour le statut de la transaction
    const rep = await fetch(apiURL + "/transactions/" + id, {
      headers: { "Authorization": "Bearer " + cleSecrete }
    });

    const data = await rep.json();
    if (!rep.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erreur: data.message || "Erreur récupération statut." })
      };
    }

    const statut = data.v1.transaction.status;

    // Retourner uniquement le statut (pas les données sensibles)
    return {
      statusCode: 200,
      body: JSON.stringify({ statut })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erreur: "Erreur serveur : " + err.message })
    };
  }
};
