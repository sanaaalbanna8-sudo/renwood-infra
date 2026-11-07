import type { SaveData } from './types';

export type DiagramNode = 'offices' | 'info' | 'cafe' | 'shop' | 'cloud' | 'guides' | 'car';

export type Glow = 'off' | 'partial' | 'on';

function picked(data: SaveData, id: string): string[] {
  return data.answers[id] ?? [];
}

function hasPart(data: SaveData, id: string, part: string): boolean {
  return picked(data, id).some((option) => option.includes(part));
}

export function infrastructureBadges(data: SaveData): string[] {
  const badges: string[] = [];
  const add = (label: string) => {
    if (!label || badges.includes(label) || badges.length >= 6) return;
    badges.push(label);
  };
  if (hasPart(data, 'ب1', 'ألياف')) add('ألياف');
  if (hasPart(data, 'ب1', '5G') || hasPart(data, 'ب1', '4G')) add('اتصال خلوي');
  if (hasPart(data, 'ب2', '5G') || hasPart(data, 'ب2', '4G')) add('5G احتياطي');
  if (hasPart(data, 'ب2', 'مزود ثانٍ')) add('خط ثانٍ');
  const split = picked(data, 'ب8')[0] ?? '';
  if (split.includes('ثلاث')) add('3 شبكات');
  else if (split.includes('أربع') || split.includes('فصل مادي')) add('شبكات مفصولة');
  else if (split.includes('شبكتان')) add('شبكتان');
  if (hasPart(data, 'ب7', 'Wi-Fi 7')) add('Wi-Fi 7');
  else if (hasPart(data, 'ب7', 'Wi-Fi 6')) add('Wi-Fi 6');
  if (hasPart(data, 'ك1', 'سحابة عامة')) add('سحابة');
  else if (hasPart(data, 'ك1', 'هجين')) add('تخزين هجين');
  else if (hasPart(data, 'ك1', 'خادم محلي')) add('خادم محلي');
  if (hasPart(data, 'ح1', 'سحابية جاهزة')) add('منصة حجز');
  else if (hasPart(data, 'ح1', 'مخصص')) add('نظام مخصص');
  if (hasPart(data, 'ز3', 'Microsoft')) add('Microsoft 365');
  else if (hasPart(data, 'ز3', 'Google')) add('Google');
  if (hasPart(data, 'ل2', 'متعددة العوامل')) add('تحقق متعدد');
  if (hasPart(data, 'ج3', 'لوحي')) add('أجهزة لوحية');
  if (hasPart(data, 'و1', 'GPS') || hasPart(data, 'و1', 'أساطيل')) add('تتبع السيارة');
  if (hasPart(data, 'د4', 'لاتلامسي') || hasPart(data, 'د5', 'Tap to Pay')) add('دفع لاتلامسي');
  if (hasPart(data, 'م1', 'الذكاء الاصطناعي')) add('ذكاء اصطناعي');
  return badges;
}

function anyOf(data: SaveData, ids: string[]): boolean {
  return ids.some((id) => (data.answers[id]?.length ?? 0) > 0 || Boolean(data.other[id]?.trim()));
}

export function nodeGlow(
  data: SaveData,
  stageComplete: (stage: number) => boolean,
): Record<DiagramNode, Glow> {
  const hardware = stageComplete(1);
  const operations = stageComplete(4);
  const systems = stageComplete(5);
  const carIds = ['و1', 'و2', 'و3', 'و4', 'و5'];
  const carDone = carIds.every((id) => (data.answers[id]?.length ?? 0) > 0);
  return {
    offices: hardware ? 'on' : anyOf(data, ['ج1', 'ج2']) ? 'partial' : 'off',
    info: operations ? 'on' : anyOf(data, ['ج7', 'ح2', 'ح11']) ? 'partial' : 'off',
    cafe: picked(data, 'د1').length ? 'on' : 'off',
    shop: picked(data, 'د2').length ? 'on' : 'off',
    cloud: systems ? 'on' : picked(data, 'ك1').length ? 'partial' : 'off',
    guides: operations ? 'on' : anyOf(data, ['ج3', 'ه1', 'ه3', 'ه5']) ? 'partial' : 'off',
    car: carDone ? 'on' : anyOf(data, carIds) ? 'partial' : 'off',
  };
}
