exports.handler = async (event) => {
  const data =
    event.httpMethod === "GET"
      ? event.queryStringParameters
      : JSON.parse(event.body || "{}");

  console.log("TrumThe callback:", data);

  return {
    statusCode: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
    body: "ok",
  };
};
