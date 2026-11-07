import { needs } from '../data/needs';
import { questions } from '../data/questions';
import type { Warning } from './types';
import { isNegative } from './text';

export type RuleInput = {
  answers: Record<string, string[]>;
  other?: Record<string, string>;
  priorities?: Record<string, string>;
};

const GAP = 'إغفال في تغطية الاحتياجات';

function selected(input: RuleInput, id: string): string[] {
  return input.answers[id] ?? [];
}

function otherText(input: RuleInput, id: string): string {
  return input.other?.[id]?.trim() ?? '';
}

function has(input: RuleInput, id: string, option: string): boolean {
  return selected(input, id).includes(option);
}

function blank(input: RuleInput, id: string): boolean {
  return selected(input, id).length === 0 && !otherText(input, id);
}

function exact(input: RuleInput, id: string, option: string): boolean {
  const values = selected(input, id);
  return values.length === 1 && values[0] === option;
}

function tracking(options: string[]): boolean {
  return options.some((option) => option !== 'لا تتبع');
}

export function checkRules(input: RuleInput): Warning[] {
  const warnings: Warning[] = [];
  const add = (ruleId: string, message: string, questionIds: string[], detail?: string) => {
    warnings.push({ ruleId, message, questionIds, detail });
  };

  if (
    exact(input, 'ج3', 'جهاز لوحي بـWi-Fi فقط مع مشاركة إنترنت من هاتف') &&
    !has(input, 'ه1', 'مشاركة إنترنت من الهاتف') &&
    !has(input, 'ه1', 'راوتر محمول (MiFi)')
  ) {
    add('1', 'اخترت جهازاً لوحياً بلا شريحة فكيف يتصل المرشد بالإنترنت؟', ['ه1']);
  }

  if (has(input, 'د5', 'قارئ بطاقات محمول بالبلوتوث') && !has(input, 'ج4', 'قارئ بطاقات محمول')) {
    add('2', 'القارئ المحمول غير مذكور في ملحقات المرشدين', ['ج4']);
  }

  const saas = exact(input, 'ك1', 'سحابة عامة عبر خدمات جاهزة (SaaS)');
  const noBackup = exact(input, 'ب2', 'لا خط احتياطي');
  const noOffline = !has(input, 'ك9', 'وضع غير متصل مع مزامنة لاحقة');
  const noPower = has(input, 'أ3', 'لا حماية');
  if (saas && (noBackup || noOffline || noPower)) {
    add('3', 'اعتمدت السحابة فقط فمن يحميك عند انقطاع الإنترنت أو الكهرباء؟', ['ب2', 'ك9', 'أ3']);
  }

  const tracks = tracking(selected(input, 'ه5')) || tracking(selected(input, 'و1'));
  if (tracks && exact(input, 'ل3', 'صلاحيات متساوية للجميع')) {
    add('4', 'التتبع يحتاج تقييد من يرى المواقع وإعلاناً للمرشدين', ['ل3']);
  }

  const booksOnline = !blank(input, 'ح4');
  const noPay = blank(input, 'د6');
  const noTls = !has(input, 'ب12', 'HTTPS مع TLS للمواقع والأنظمة');
  const noSite = exact(input, 'ز9', 'بلا موقع (منصات ووسائل تواصل فقط)');
  if (booksOnline && (noPay || noTls || noSite)) {
    add('5', 'الحجز عبر الإنترنت يحتاج بوابة دفع وتشفيراً وموقعاً أو صفحة حجز', ['د6', 'ب12', 'ز9']);
  }

  const visitors = selected(input, 'ب9').some((option) => option !== 'لا خدمة للزوار');
  if (visitors && exact(input, 'ب8', 'شبكة واحدة للجميع')) {
    add('6', 'الزوار والموظفون على شبكة واحدة خطر، قسّم الشبكة', ['ب8']);
  }

  const personal =
    exact(input, 'ج3', 'هاتف المرشد الشخصي (BYOD)') ||
    exact(input, 'ن4', 'مسموح للمرشدين فقط') ||
    exact(input, 'ن4', 'مسموح للجميع');
  if (personal && !has(input, 'ه8', 'نظام إدارة الأجهزة المحمولة (MDM)')) {
    add('7', 'أجهزة شخصية بلا إدارة وتشفير', ['ه8']);
  }

  if (exact(input, 'ك6', 'نسخ سحابي تلقائي') && !otherText(input, 'ك6')) {
    add('8', 'أضف نسخة ثانية خارج المزود (قاعدة 3-2-1)', ['ك6']);
  }

  const contactless = has(input, 'د4', 'دفع لاتلامسي (NFC)');
  const hasNfc = has(input, 'ج6', 'قارئ NFC');
  const tap = has(input, 'د5', 'تحصيل بالبطاقة عبر الجهاز اللوحي أو الهاتف نفسه (Tap to Pay)');
  if (contactless && !hasNfc && !tap) {
    add('9', 'الدفع اللاتلامسي يحتاج جهازاً يدعم NFC', ['ج6', 'د5']);
  }

  const custom = exact(input, 'ح1', 'نظام مخصص يُبنى للشركة');
  const noTeam = exact(input, 'ن1', 'ديزي نفسها') || exact(input, 'ن1', 'موظف معلومات مدرّب');
  if (custom && noTeam) {
    add('10', 'نظام مخصص بلا فريق تقني: وضّح كلفة الصيانة', ['ن1', 'ن2']);
  }

  for (const question of questions) {
    if (question.type !== 'single' || question.id === 'م2') continue;
    if (blank(input, question.id)) {
      add('11', GAP, [question.id], `${question.id} · ${question.short}`);
    }
  }

  for (const need of needs) {
    const covered = need.questions.some((id) => !blank(input, id));
    if (!covered) add('11', 'إغفال', need.questions, need.title);
  }

  const techs = selected(input, 'م1').filter((option) => !isNegative(option));
  if (techs.length) {
    const missing = techs.filter((tech) => !input.priorities?.[tech]);
    if (missing.length) {
      add('11', GAP, ['م2'], 'أولوية التقنيات الناشئة');
    }
  }

  return warnings;
}
