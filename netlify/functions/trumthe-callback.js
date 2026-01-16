module.exports.handler = async (event) => {
  let data = {};

  try {
    if (event.httpMethod === "GET") data = event.queryStringParameters || {};
    else data = JSON.parse(event.body || "{}");
  } catch (e) {
    data = { parseError: e?.message || String(e) };
  }

  console.log("TrumThe callback:", data);

  return {
    statusCode: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
    body: "ok",
  };
};
