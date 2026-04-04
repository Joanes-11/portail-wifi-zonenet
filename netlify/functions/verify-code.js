const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const store = getStore("codes");

  if (event.httpMethod === "POST") {
    const { code, duree, prix } = JSON.parse(event.body);
    await store.set(code, JSON.stringify({ duree, prix, tempsRestant: duree, bloque: false }));
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod === "GET") {
    const { code } = event.queryStringParameters;
    const data = await store.get(code);
    if (!data) return { statusCode: 404, body: JSON.stringify({ erreur: "Code introuvable" }) };
    return { statusCode: 200, body: data };
  }

  return { statusCode: 405, body: JSON.stringify({ erreur: "Méthode non autorisée" }) };
};
