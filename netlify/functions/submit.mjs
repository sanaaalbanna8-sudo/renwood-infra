const SHEETS_URL = process.env.SHEETS_WEB_APP_URL || '';

async function forward(body) {
  let response = await fetch(SHEETS_URL, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
  });
  if (response.status >= 300 && response.status < 400) {
    const next = response.headers.get('location');
    if (next) {
      response = await fetch(next, { method: 'GET', redirect: 'follow' });
    }
  }
  const text = await response.text();
  return { status: response.status, text };
}

export default async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ ok: false, message: 'طريقة الإرسال غير مدعومة' }, { status: 405 });
  }
  if (!SHEETS_URL) {
    return Response.json({ ok: false, message: 'رابط جدول المعلمة غير مضبوط بعد' }, { status: 503 });
  }
  try {
    const body = await request.text();
    JSON.parse(body);
    const result = await forward(body);
    const payload = JSON.parse(result.text);
    return Response.json(payload, { status: payload.ok === false ? 400 : 200 });
  } catch {
    return Response.json({ ok: false, message: 'تعذر حفظ النتائج في جدول المعلمة' }, { status: 502 });
  }
};
