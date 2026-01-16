// netlify/functions/trumthe-charge.js
const crypto = require("crypto");

exports.handler = async (event) => {
  // Test nhanh trên trình duyệt:
  // https://<site>.netlify.app/.netlify/functions/trumthe-charge?ping=1
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "ok",
    };
  }

  // Chỉ cho POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // ví dụ body bạn gửi lên:
    // { telco, code, serial, amount, request_id }
    const { telco, code, serial, amount, request_id } = body;

    // TODO: lấy key thật của bạn từ ENV trên Netlify
    const partner_key = process.env.TRUMTHE_PARTNER_KEY;
    const partner_id = process.env.TRUMTHE_PARTNER_ID;
    const domain_post = process.env.TRUMTHE_DOMAIN_POST; // ví dụ: https://xxx.trumthe.vn

    const sign = crypto
      .createHash("md5")
      .update(String(partner_key) + String(code) + String(serial))
      .digest("hex");

    const payload = {
      telco,
      code,
      serial,
      amount,
      request_id,
      partner_id,
      sign,
      command: "charging",
    };

    const res = await fetch(`${domain_post}/chargingws/v2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: text,
    };
  } catch (e) {
    return { statusCode: 500, body: "Server error: " + e.message };
  }
};
