import { describe, expect, it } from 'vitest';
import { checkRules, type RuleInput } from './rules';

function rule(input: RuleInput, id: string) {
  return checkRules(input).filter((warning) => warning.ruleId === id);
}

describe('contradiction rules', () => {
  it('rule 1 warns only when a Wi-Fi tablet has no phone link', () => {
    const tablet = { ج3: ['جهاز لوحي بـWi-Fi فقط مع مشاركة إنترنت من هاتف'] };
    expect(rule({ answers: tablet }, '1')).toHaveLength(1);
    expect(rule({ answers: { ...tablet, ه1: ['مشاركة إنترنت من الهاتف'] } }, '1')).toHaveLength(0);
    expect(rule({ answers: { ...tablet, ه1: ['راوتر محمول (MiFi)'] } }, '1')).toHaveLength(0);
    expect(rule({ answers: { ج3: ['هاتف ذكي'] } }, '1')).toHaveLength(0);
  });

  it('rule 2 warns when field card readers are missing from guide accessories', () => {
    expect(rule({ answers: { د5: ['قارئ بطاقات محمول بالبلوتوث'] } }, '2')).toHaveLength(1);
    expect(rule({ answers: { د5: ['قارئ بطاقات محمول بالبلوتوث'], ج4: ['قارئ بطاقات محمول'] } }, '2')).toHaveLength(0);
  });

  it('rule 3 warns when cloud-only storage has no outage protection', () => {
    const saas = ['سحابة عامة عبر خدمات جاهزة (SaaS)'];
    const safe = {
      ك1: saas,
      ب2: ['4G أو 5G (راوتر خلوي بشريحة)'],
      ك9: ['وضع غير متصل مع مزامنة لاحقة'],
      أ3: ['UPS مركزي لأجهزة الشبكة والخادم'],
    };
    expect(rule({ answers: safe }, '3')).toHaveLength(0);
    expect(rule({ answers: { ...safe, ب2: ['لا خط احتياطي'] } }, '3')).toHaveLength(1);
    expect(rule({ answers: { ك1: ['خادم محلي في المقر'], ب2: ['لا خط احتياطي'] } }, '3')).toHaveLength(0);
  });

  it('rule 4 warns when tracking is visible to every account', () => {
    const open = { ل3: ['صلاحيات متساوية للجميع'] };
    expect(rule({ answers: { ...open, ه5: ['تطبيق GPS على جهاز المرشد'] } }, '4')).toHaveLength(1);
    expect(rule({ answers: { ...open, ه5: ['لا تتبع'], و1: ['لا تتبع'] } }, '4')).toHaveLength(0);
    expect(rule({ answers: { ه5: ['تطبيق GPS على جهاز المرشد'], ل3: ['بحسب الدور (ديزي، معلومات، مرشد)'] } }, '4')).toHaveLength(0);
  });

  it('rule 5 warns when online booking has no payment, encryption, or site', () => {
    expect(rule({ answers: { ح4: ['موقع الشركة'] } }, '5')).toHaveLength(1);
    expect(
      rule(
        {
          answers: {
            ح4: ['موقع الشركة'],
            د6: ['بوابة دفع مدمجة في نظام الحجز'],
            ب12: ['HTTPS مع TLS للمواقع والأنظمة'],
            ز9: ['WordPress مع إضافة حجز'],
          },
        },
        '5',
      ),
    ).toHaveLength(0);
    expect(
      rule(
        {
          answers: {
            ح4: ['موقع الشركة'],
            د6: ['بوابة دفع مدمجة في نظام الحجز'],
            ب12: ['HTTPS مع TLS للمواقع والأنظمة'],
            ز9: ['بلا موقع (منصات ووسائل تواصل فقط)'],
          },
        },
        '5',
      ),
    ).toHaveLength(1);
  });

  it('rule 6 warns when visitors share the staff network', () => {
    expect(rule({ answers: { ب9: ['بلا كلمة مرور'], ب8: ['شبكة واحدة للجميع'] } }, '6')).toHaveLength(1);
    expect(rule({ answers: { ب9: ['لا خدمة للزوار'], ب8: ['شبكة واحدة للجميع'] } }, '6')).toHaveLength(0);
    expect(rule({ answers: { ب9: ['بلا كلمة مرور'], ب8: ['شبكتان: موظفون وضيوف'] } }, '6')).toHaveLength(0);
  });

  it('rule 7 warns about personal devices without mobile management', () => {
    expect(rule({ answers: { ج3: ['هاتف المرشد الشخصي (BYOD)'] } }, '7')).toHaveLength(1);
    expect(rule({ answers: { ن4: ['مسموح للجميع'] } }, '7')).toHaveLength(1);
    expect(
      rule({ answers: { ج3: ['هاتف المرشد الشخصي (BYOD)'], ه8: ['نظام إدارة الأجهزة المحمولة (MDM)'] } }, '7'),
    ).toHaveLength(0);
    expect(rule({ answers: { ج3: ['هاتف ذكي'], ن4: ['ممنوع'] } }, '7')).toHaveLength(0);
  });

  it('rule 8 warns only when cloud backup is the sole copy', () => {
    expect(rule({ answers: { ك6: ['نسخ سحابي تلقائي'] } }, '8')).toHaveLength(1);
    expect(rule({ answers: { ك6: ['نسخ سحابي تلقائي', 'قاعدة 3-2-1 (ثلاث نسخ على وسطين ونسخة خارج المقر)'] } }, '8')).toHaveLength(0);
    expect(rule({ answers: { ك6: ['نسخ سحابي تلقائي'] }, other: { ك6: 'قرص عند ديزي' } }, '8')).toHaveLength(0);
  });

  it('rule 9 warns when contactless payment has no NFC device', () => {
    expect(rule({ answers: { د4: ['دفع لاتلامسي (NFC)'] } }, '9')).toHaveLength(1);
    expect(rule({ answers: { د4: ['دفع لاتلامسي (NFC)'], ج6: ['قارئ NFC'] } }, '9')).toHaveLength(0);
    expect(
      rule(
        { answers: { د4: ['دفع لاتلامسي (NFC)'], د5: ['تحصيل بالبطاقة عبر الجهاز اللوحي أو الهاتف نفسه (Tap to Pay)'] } },
        '9',
      ),
    ).toHaveLength(0);
    expect(rule({ answers: { د4: ['نقد'] } }, '9')).toHaveLength(0);
  });

  it('rule 10 warns when a custom system has no technical owner', () => {
    expect(rule({ answers: { ح1: ['نظام مخصص يُبنى للشركة'], ن1: ['ديزي نفسها'] } }, '10')).toHaveLength(1);
    expect(rule({ answers: { ح1: ['نظام مخصص يُبنى للشركة'], ن1: ['مزود خدمات مُدارة (MSP)'] } }, '10')).toHaveLength(0);
    expect(rule({ answers: { ح1: ['جداول بيانات مشتركة'], ن1: ['ديزي نفسها'] } }, '10')).toHaveLength(0);
  });

  it('rule 11 flags an unanswered single and an uncovered need, then clears them', () => {
    const empty = checkRules({ answers: {} });
    expect(empty.some((warning) => warning.ruleId === '11' && warning.questionIds[0] === 'ز1')).toBe(true);

    const answered = checkRules({ answers: { ز1: ['Windows 11 Pro'] } });
    expect(answered.some((warning) => warning.detail === 'ز1 · نظام تشغيل المكاتب')).toBe(false);

    const uncovered = checkRules({ answers: {} });
    expect(uncovered.some((warning) => warning.message === 'إغفال' && warning.detail === 'حجز الفنادق والمطاعم')).toBe(true);
    expect(uncovered.some((warning) => warning.message === 'إغفال' && warning.detail === 'النمو')).toBe(true);

    const covered = checkRules({
      answers: { ح9: ['بوابة شركاء'], ن8: ['سحابة قابلة للتوسع'] },
    });
    expect(covered.some((warning) => warning.detail === 'حجز الفنادق والمطاعم')).toBe(false);
    expect(covered.some((warning) => warning.detail === 'النمو')).toBe(false);
    expect(covered.some((warning) => warning.message === 'إغفال' && warning.detail === 'المقهى والمتجر')).toBe(true);

    const byOther = checkRules({ answers: {}, other: { د4: 'دفع من التطبيق' } });
    expect(byOther.some((warning) => warning.detail === 'تحصيل المدفوعات')).toBe(false);
  });
});
