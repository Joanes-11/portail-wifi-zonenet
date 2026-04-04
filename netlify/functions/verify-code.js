exports.handler = async (event) => {

  if (event.httpMethod === "POST") {
    const { code, duree, prix } = JSON.parse(event.body);

    const rep = await fetch("https://api.netlify.com/api/v1/blobs", {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + process.env.NETLIFY_AUTH_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code, duree, prix, tempsRestant: duree, bloque: false })
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod === "GET") {
    const { code } = event.queryStringParameters || {};
    const data = JSON.parse(process.env["CODE_" + code] || "null");
    if (!data) return { statusCode: 404, body: JSON.stringify({ erreur: "Code introuvable" }) };
    return { statusCode: 200, body: JSON.stringify(data) };
  }

  return { statusCode: 405, body: JSON.stringify({ erreur: "Méthode non autorisée" }) };
};
