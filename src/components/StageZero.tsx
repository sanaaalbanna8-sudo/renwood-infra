import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { needs } from '../data/needs';
import { stageById } from '../data/stages';
import { useTitle } from '../lib/useTitle';

const companyFacts: { title: string; body: string }[] = [
  {
    title: 'القطاع',
    body: 'السياحة والإرشاد السياحي: جولات إرشادية مشياً على الأقدام.',
  },
  {
    title: 'ماذا تقدم',
    body: 'الجولات، وقسم معلومات سياحية بمنطقة انتظار، وحجز الجولات من المقر والمرشد والإنترنت، وحجز الفنادق والمطاعم نيابة عن العملاء، ومقهى ومتجر هدايا.',
  },
  {
    title: 'لمن تقدم',
    body: 'السياح والزوار، وشركاؤها من الفنادق والمطاعم.',
  },
  {
    title: 'من هي',
    body: 'شركة في مدينة أوروبية كبرى. مالكتها ومديرتها ديزي رينواد، وفيها 10 موظفين: ديزي، و4 موظفي معلومات، و5 مرشدين، وسيارة طوارئ واحدة.',
  },
  {
    title: 'المقر الجديد',
    body: 'مكاتب، وقسم معلومات بمنطقة انتظار، ومقهى، ومتجر، بلا أي بنية تحتية لتكنولوجيا المعلومات.',
  },
];

const roles: { title: string; points: string[] }[] = [
  {
    title: 'مهام ديزي',
    points: [
      'الميزانية والرواتب',
      'التأكد من عمل الموظفين ومتابعتهم',
      'جداول العمل',
      'التواصل مع العملاء',
      'العمل في القسم والمقهى عند الحاجة',
      'الإعلان والعلاقات العامة',
    ],
  },
  {
    title: 'مهام موظفي المعلومات',
    points: [
      'خدمة العملاء ومساعدتهم في الحجز والتعديل',
      'معالجة المدفوعات',
      'تزويد العملاء بمعلومات المعالم السياحية',
      'الرد على الاستفسارات',
      'حجز الفنادق والمطاعم نيابة عنهم',
      'إدارة السجلات الرقمية',
    ],
  },
  {
    title: 'مهام المرشدين',
    points: ['تقديم الجولات', 'مقابلة المسجلين', 'قبول الحجوزات الإضافية وتحصيل مدفوعاتها'],
  },
  {
    title: 'متطلبات تقنية المعلومات',
    points: [
      'وصول جميع الموظفين إلى الأنظمة اللازمة',
      'تخزين بيانات الموظفين والعملاء',
      'إنشاء جدول الجولات اليومي',
      'توزيع الجداول والقوائم على الموظفين المعنيين',
      'حجز العملاء من ثلاث قنوات: في المقر، وبمساعدة المرشد عند نقطة التجمع، وعبر الإنترنت',
      'تواصل طوال اليوم بين القسم والمرشدين: التسجيل والحضور، وسير الجولة، وتتبع المواقع، وطلبات المعلومات',
      'تواصل فعال مع جميع أصحاب المصلحة',
      'تمكين العملاء من الحجز والتعديل عبر الإنترنت',
    ],
  },
];

export function StageZero({ index }: { index: number }) {
  const navigate = useNavigate();
  const stage = stageById(0);
  const Icon = stage.icon;
  const titles = ['من هي الشركة؟', 'الاحتياجات التي ستخدمها بنيتك'];
  useTitle(titles[index] ?? stage.name);

  const previous = () => {
    if (index > 0) navigate('/wizard/0/0');
  };
  const next = () => navigate(index === 0 ? '/wizard/0/1' : '/wizard/1/0');

  return (
    <div className="narrow">
      {index === 0 && (
        <article className="glass" style={{ ['--stage' as string]: stage.color, padding: 18 }}>
          <p className="stage-pill">
            <Icon size={16} />
            فهم الشركة · 1 من 2
          </p>
          <h1>من هي الشركة؟</h1>
          {companyFacts.map((fact) => (
            <div key={fact.title} className="read-block">
              <h2>{fact.title}</h2>
              <p>{fact.body}</p>
            </div>
          ))}
        </article>
      )}

      {index === 1 && <NeedsPage stageColor={stage.color} onBack={previous} onUnderstood={() => navigate('/wizard/1/0')} />}

      {index !== 1 && (
        <div className="pager">
          <button type="button" className="btn-ghost" onClick={previous} disabled={index === 0}>
            السابق
          </button>
          <button type="button" className="btn-primary" onClick={next}>
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

function NeedsPage({
  stageColor,
  onBack,
  onUnderstood,
}: {
  stageColor: string;
  onBack: () => void;
  onUnderstood: () => void;
}) {
  const stage = stageById(0);
  const Icon = stage.icon;
  const scroller = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLParagraphElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = scroller.current;
    const target = end.current;
    if (!root || !target) return;
    if (root.scrollHeight <= root.clientHeight + 12) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setReady(true);
      },
      { root, threshold: 0.7 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <article className="glass" style={{ ['--stage' as string]: stageColor, ['--mark' as string]: stage.mark, padding: 18 }}>
        <p className="stage-pill">
          <Icon size={16} />
          فهم الشركة · 2 من 2
        </p>
        <h1>الاحتياجات التي ستخدمها بنيتك</h1>
        <p className="muted" id="needs-read-hint">
          هذه احتياجات الشركة، مرتّبة من الأكثر أهمية إلى الأقل، وبنيتك تخدمها كلها. اقرأ حتى آخر الصفحة، ثم اضغط «التالي».
        </p>
        <div className="read-scroll" ref={scroller} tabIndex={0} aria-label="الاحتياجات والمهام">
          <ol className="need-grid">
            {needs.map((need, rank) => (
              <li key={need.id} className="need-card">
                <span className="need-rank" aria-hidden="true">
                  {rank + 1}
                </span>
                <span>
                  <strong>{need.title}</strong>
                  <span className="need-text">{need.text}</span>
                </span>
              </li>
            ))}
          </ol>
          {roles.map((role) => (
            <div key={role.title} className="read-block">
              <h2>{role.title}</h2>
              <ul>
                {role.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
          <p ref={end}>وصلت إلى نهاية هذه الصفحة.</p>
        </div>
      </article>
      <div className="pager">
        <button type="button" className="btn-ghost" onClick={onBack}>
          السابق
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onUnderstood}
          disabled={!ready}
          aria-describedby="needs-read-hint"
        >
          التالي
        </button>
      </div>
    </>
  );
}
