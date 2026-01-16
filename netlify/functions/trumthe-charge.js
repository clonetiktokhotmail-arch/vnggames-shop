import crypto from "crypto";

function md5(str) {
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

export async function handler(event) {
  // Chỉ cho POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const {
      telco,     // VIETTEL | MOBIFONE | VINAPHONE | ZING ...
      code,      // mã thẻ
      serial,    // seri
      amount,    // mệnh giá
      request_id // mã đơn của bạn tự tạo
    } = JSON.parse(event.body || "{}");

    if (!telco || !code || !serial || !amount || !request_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
    }

    // LẤY TỪ ENV (KHÔNG ĐỂ TRONG FRONTEND)
    const DOMAIN_POST = process.env.TRUMTHE_DOMAIN_POST; // vd: https://trumthe.vn (hoặc domain họ đưa)
    const PARTNER_ID = process.env.TRUMTHE_PARTNER_ID;
    const PARTNER_KEY = process.env.TRUMTHE_PARTNER_KEY;

    if (!DOMAIN_POST || !PARTNER_ID || !PARTNER_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing server env" }) };
    }

    const sign = md5(PARTNER_KEY + code + serial);

    // TrumThe yêu cầu body form-data, nhưng họ cũng ghi content-type application/json ở docs.
    // Cách an toàn: gửi dạng x-www-form-urlencoded (thường API dạng form-data đều nhận)
    const body = new URLSearchParams({
      telco,
      code,
      serial,
      amount: String(amount),
      request_id: String(request_id),
      partner_id: String(PARTNER_ID),
      sign,
      command: "charging",
    });

    const res = await fetch(`${DOMAIN_POST}/chargingws/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    });

    const text = await res.text();
    // có thể là JSON hoặc text → thử parse
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        trumthe_response: data,
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
