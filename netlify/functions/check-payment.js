exports.handler = async (event) => {

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ erreur: "Méthode non autorisée" }) };
  }

  try {
    const { id, env } = event.queryStringParameters || {};
    const estLive = env === "live";
    const cleSecrete = estLive
      ? process.env.FEDAPAY_SECRET_LIVE
      : process.env.FEDAPAY_SECRET_SANDBOX;
    const apiURL = estLive
      ? "https://api.fedapay.com/v1"
      : "https://sandbox-api.fedapay.com/v1";

    const rep = await fetch(apiURL + "/transactions/" + id, {
      headers: { "Authorization": "Bearer " + cleSecrete }
    });

    const data = await rep.json();

    // Chercher le statut dans différents endroits
    const statut = data?.v1?.transaction?.status
      || data?.transaction?.status
      || data?.status
      || "pending";

    return {
      statusCode: 200,
      body: JSON.stringify({ statut })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erreur: err.message })
    };
  }
};
