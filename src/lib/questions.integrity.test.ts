import { describe, expect, it } from 'vitest';
import { needs } from '../data/needs';
import { questionById, questions, questionsByStage } from '../data/questions';
import { stages } from '../data/stages';
import { storyParagraphs } from '../data/storyTemplates';
import { summarySections } from '../data/summarySections';

const stageCounts: Record<number, number> = {
  0: 0,
  1: 16,
  2: 20,
  3: 20,
  4: 38,
  5: 9,
  6: 8,
  7: 2,
  8: 10,
};

describe('questions', () => {
  it('keeps every question id unique and in the expected stage sizes', () => {
    expect(questions).toHaveLength(123);
    expect(new Set(questions.map((question) => question.id)).size).toBe(123);
    for (const [stage, count] of Object.entries(stageCounts)) {
      expect(questionsByStage(Number(stage)), `stage ${stage}`).toHaveLength(count);
    }
  });

  it('keeps stage names in the student journey order', () => {
    expect(stages.map((stage) => stage.name)).toEqual([
      'فهم الشركة',
      'العتاد',
      'البرمجيات',
      'الاتصال والشبكات',
      'العمليات وتدفق البيانات',
      'الأنظمة والبيانات',
      'الحماية والصلاحيات',
      'التقنيات الناشئة',
      'التشغيل والنمو',
      'الكميات والمواقع',
    ]);
  });

  it('lists the summary sections with software before hardware', () => {
    expect(summarySections.map((section) => section.title)).toEqual([
      'قائمة البرامج',
      'قائمة العتاد',
      'قائمة الشبكات والاتصال',
      'قائمة العمليات والتدفقات',
      'قائمة الأنظمة والبيانات',
      'قائمة الحماية',
      'قائمة التقنيات الناشئة',
      'قائمة التشغيل والنمو',
    ]);
  });

  it('keeps story variables and need links pointed at real questions', () => {
    const ids = new Set(questions.map((question) => question.id));
    const special = new Set(['اسم الطالب', 'الاحتياجات المغطاة']);
    for (const paragraph of storyParagraphs) {
      for (const sentence of paragraph.sentences) {
        for (const match of sentence.matchAll(/\{([^{}]+)\}/g)) {
          if (special.has(match[1])) continue;
          expect(ids.has(match[1]), match[1]).toBe(true);
        }
      }
    }
    expect(needs).toHaveLength(11);
    expect(needs[0]?.title).toBe('الحجز من القنوات الثلاث');
    expect(needs.at(-1)?.title).toBe('النمو');
    for (const need of needs) {
      expect(need.text.trim().length).toBeGreaterThan(12);
      expect(need.questions.length).toBeGreaterThan(0);
      for (const id of need.questions) expect(ids.has(id), `${need.title} ${id}`).toBe(true);
    }
    expect(questionById('م2')?.options).toHaveLength(4);
  });

  it('keeps the option strings used by the contradiction rules', () => {
    const has = (id: string, option: string) => expect(questionById(id)?.options).toContain(option);
    has('ج3', 'جهاز لوحي بـWi-Fi فقط مع مشاركة إنترنت من هاتف');
    has('ج3', 'هاتف المرشد الشخصي (BYOD)');
    has('ج4', 'قارئ بطاقات محمول');
    has('ج6', 'قارئ NFC');
    has('د4', 'دفع لاتلامسي (NFC)');
    has('د5', 'قارئ بطاقات محمول بالبلوتوث');
    has('د5', 'تحصيل بالبطاقة عبر الجهاز اللوحي أو الهاتف نفسه (Tap to Pay)');
    has('ه1', 'مشاركة إنترنت من الهاتف');
    has('ه1', 'راوتر محمول (MiFi)');
    has('ه5', 'لا تتبع');
    has('و1', 'لا تتبع');
    has('ب2', 'لا خط احتياطي');
    has('ب8', 'شبكة واحدة للجميع');
    has('ب9', 'لا خدمة للزوار');
    has('ب12', 'HTTPS مع TLS للمواقع والأنظمة');
    has('ك1', 'سحابة عامة عبر خدمات جاهزة (SaaS)');
    has('ك6', 'نسخ سحابي تلقائي');
    has('ك9', 'وضع غير متصل مع مزامنة لاحقة');
    has('أ3', 'لا حماية');
    has('ل3', 'صلاحيات متساوية للجميع');
    has('ز9', 'بلا موقع (منصات ووسائل تواصل فقط)');
    has('ح1', 'نظام مخصص يُبنى للشركة');
    has('ن1', 'ديزي نفسها');
    has('ن1', 'موظف معلومات مدرّب');
    has('ن4', 'مسموح للمرشدين فقط');
    has('ن4', 'مسموح للجميع');
    has('ه8', 'نظام إدارة الأجهزة المحمولة (MDM)');
  });
});
