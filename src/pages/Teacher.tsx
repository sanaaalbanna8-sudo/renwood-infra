import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questions } from '../data/questions';
import { Background } from '../components/Background';
import { useTheme } from '../context/Theme';
import { downloadText } from '../lib/download';
import { completionRatio } from '../lib/progress';
import { isSimilar, similarityPairs } from '../lib/similarity';
import { parseStudentFile } from '../lib/storage';
import { joinArabic } from '../lib/text';
import type { SaveData } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import { Moon, Sun } from 'lucide-react';

const DEFAULT_COLUMNS = ['ب1', 'ب2', 'ك1', 'ج3', 'ه5', 'ح1'];
const SESSION_KEY = 'renwood-teacher-session';

export function Teacher() {
  useTitle('متابعة الطلاب');
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [students, setStudents] = useState<SaveData[]>([]);
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [focus, setFocus] = useState('ب1');
  const [note, setNote] = useState('');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) setStudents(parsed as SaveData[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(students));
  }, [students]);

  const pairs = useMemo(() => similarityPairs(students), [students]);
  const choiceQuestions = questions.filter((question) => question.options.length > 0 && question.id !== 'م2');
  const focused = questions.find((question) => question.id === focus);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const next: SaveData[] = [];
    let failed = 0;
    for (const file of list) {
      const parsed = parseStudentFile(await file.text());
      if (parsed) next.push(parsed);
      else failed += 1;
    }
    setStudents((current) => {
      const map = new Map(current.map((student) => [`${student.name}::${student.createdAt}`, student]));
      for (const student of next) map.set(`${student.name}::${student.createdAt}`, student);
      return [...map.values()];
    });
    setNote(failed ? `تمت إضافة ${next.length} ملف، وتعذّر قراءة ${failed}.` : `تمت إضافة ${next.length} ملف.`);
  }

  function exportCsv() {
    const headers = ['اسم الطالب', 'الشعبة', 'نسبة الإنجاز', ...columns];
    const lines = [headers.join(',')];
    for (const student of students) {
      const cells = [
        student.name,
        student.group,
        String(Math.round(completionRatio(student) * 100)),
        ...columns.map((id) => joinArabic(student.answers[id] ?? [])),
      ];
      lines.push(cells.map(csvCell).join(','));
    }
    downloadText('students.csv', `\uFEFF${lines.join('\n')}`, 'text/csv;charset=utf-8');
  }

  return (
    <>
      <Background />
      <div className="page">
        <header className="page-bar">
          <strong>متابعة الطلاب</strong>
          <span className="grow" />
          <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <div className="wide" style={{ padding: 16 }}>
          <section className="glass" style={{ padding: 16 }}>
            <h1>صفحة المعلم</h1>
            <p>تعمل هذه الصفحة كلها في المتصفح، ولا تغادر بياناتها الجهاز.</p>
            <p className="muted">ارفع ملفات JSON التي صدّرها الطلاب. يمكنك رفع عدة ملفات دفعة واحدة.</p>
            <label className="field">
              <span>ملفات الطلاب</span>
              <input
                type="file"
                accept="application/json,.json"
                multiple
                onChange={(event) => {
                  void onFiles(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            {note && <p aria-live="polite">{note}</p>}
            <div className="actions">
              <button type="button" className="btn-primary" onClick={exportCsv} disabled={students.length === 0}>
                تصدير CSV
              </button>
              <button type="button" className="btn-ghost" onClick={() => setStudents([])} disabled={students.length === 0}>
                مسح القائمة
              </button>
            </div>
          </section>

          <section className="glass" style={{ padding: 16, marginTop: 16 }}>
            <h2>مقارنة الاختيارات</h2>
            <details>
              <summary>اختر أعمدة الأسئلة</summary>
              <div className="chips" style={{ marginTop: 8 }}>
                {choiceQuestions.map((question) => (
                  <label key={question.id} className="chip" style={{ gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={columns.includes(question.id)}
                      onChange={() =>
                        setColumns((current) =>
                          current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id],
                        )
                      }
                    />
                    <bdi className="qid">{question.id}</bdi>
                  </label>
                ))}
              </div>
            </details>
            <div className="scroll-x" style={{ marginTop: 12 }}>
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>اسم الطالب</th>
                    <th>الشعبة</th>
                    <th>نسبة الإنجاز</th>
                    {columns.map((id) => (
                      <th key={id}>
                        <bdi>{id}</bdi>
                      </th>
                    ))}
                    <th>الملخص</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={`${student.name}-${student.createdAt}`}>
                      <td>
                        <bdi>{student.name}</bdi>
                      </td>
                      <td>{student.group || '—'}</td>
                      <td>{Math.round(completionRatio(student) * 100)}%</td>
                      {columns.map((id) => (
                        <td key={id}>
                          <bdi>{joinArabic(student.answers[id] ?? []) || '—'}</bdi>
                        </td>
                      ))}
                      <td>
                        <button type="button" className="btn-ghost" onClick={() => navigate('/summary', { state: { snapshot: student } })}>
                          فتح
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && <p>لم يُرفع أي ملف بعد.</p>}
            </div>
          </section>

          <section className="glass" style={{ padding: 16, marginTop: 16 }}>
            <h2>كشف التشابه</h2>
            <p className="muted">يُحسب تشابه جاكارد على أزواج «معرّف::خيار». النص الحر لا يدخل الحساب. الأزواج فوق 85% مميزة.</p>
            {pairs.length === 0 && <p>ارفع ملفين على الأقل.</p>}
            {pairs.map((pair) => (
              <p key={`${pair.left}-${pair.right}`} className={isSimilar(pair.score) ? 'pair-hot' : undefined} style={{ padding: 8, borderRadius: 10 }}>
                <bdi>{pair.left}</bdi> و <bdi>{pair.right}</bdi>: {Math.round(pair.score * 100)}%
              </p>
            ))}
          </section>

          <section className="glass" style={{ padding: 16, marginTop: 16 }}>
            <h2>توزيع سؤال</h2>
            <label className="field">
              <span>السؤال</span>
              <select className="select" value={focus} onChange={(event) => setFocus(event.target.value)}>
                {choiceQuestions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.id} · {question.short}
                  </option>
                ))}
              </select>
            </label>
            <div className="dist">
              {focused?.options.map((option) => {
                const count = students.filter((student) => student.answers[focus]?.includes(option)).length;
                const width = students.length ? (count / students.length) * 100 : 0;
                return (
                  <div key={option} className="dist-row">
                    <span>
                      <bdi>{option}</bdi>
                    </span>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${width}%`, background: '#6366F1' }} />
                    </span>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
