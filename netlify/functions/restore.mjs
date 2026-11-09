const SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbxAugVplZ9QGx2btrzthdwjjL7vqtERDw2MH4WpPVRIF0PIg4I20Lxqy9EjZ_K2I5QI/exec';

export default async (request) => {
  if (request.method !== 'GET') {
    return Response.json({ ok: false, message: 'طريقة الطلب غير مدعومة' }, { status: 405 });
  }
  const incoming = new URL(request.url);
  const name = incoming.searchParams.get('name')?.trim() ?? '';
  const group = incoming.searchParams.get('group')?.trim() ?? '';
  if (name.length < 2) return Response.json({ ok: false, message: 'الاسم ناقص' }, { status: 400 });
  const target = new URL(SHEETS_URL);
  target.searchParams.set('action', 'restore');
  target.searchParams.set('name', name);
  target.searchParams.set('group', group);
  try {
    const response = await fetch(target, { redirect: 'follow' });
    const payload = await response.json();
    return Response.json(payload, { status: payload.ok === false ? 404 : 200 });
  } catch {
    return Response.json({ ok: false, message: 'تعذر قراءة جدول الأمس' }, { status: 502 });
  }
};
