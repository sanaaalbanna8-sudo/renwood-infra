import { Moon, Sun } from 'lucide-react';
import { flushSync } from 'react-dom';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Background } from '../components/Background';
import { HeroArt } from '../components/HeroArt';
import { useStore } from '../context/Store';
import { useTheme } from '../context/Theme';
import { ar } from '../i18n/ar';
import { clearSheetView, fetchStoredRow, markSheetView, restoreSheetRow } from '../lib/restoreSheet';
import { emptyData } from '../lib/storage';
import { useTitle } from '../lib/useTitle';

function continuePath(path: string): string {
  if (path.startsWith('/wizard/') || path === '/review' || path === '/summary') return path;
  return '/wizard/0/0';
}

export function Welcome() {
  useTitle();
  const { data, start, replaceSave, reset } = useStore();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState(data.name);
  const [group, setGroup] = useState(data.group);
  const [ready, setReady] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [restoreNote, setRestoreNote] = useState('');
  const [restoring, setRestoring] = useState(false);
  const saved = data.name.trim().length >= 2;

  useEffect(() => {
    const key = 'renwood-resumed';
    const already = sessionStorage.getItem(key);
    sessionStorage.setItem(key, '1');
    if (!already && data.name.trim().length >= 2 && data.lastPath) {
      navigate(data.lastPath, { replace: true });
      return;
    }
    setReady(true);
  }, [data.lastPath, data.name, navigate]);

  if (!ready) return <Background />;

  return (
    <>
      <Background />
      <div className="page">
        <header className="page-bar">
          <strong>مصمم البنية التحتية: رينواد تورز</strong>
          <span className="grow" />
          <Link to="/guide" className="nav-link">
            دليل الحل
          </Link>
          <button type="button" className="icon-btn" onClick={toggle} aria-pressed={theme === 'light'} aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <div className="wide welcome-grid" style={{ padding: 16 }}>
          <div>
            <p className="faint">وحدة أنظمة تكنولوجيا المعلومات · لكل طالب</p>
            <h1 className="hero-title">ابنِ بنية رينواد تورز خطوة بخطوة</h1>
            <p className="muted">أسئلة اختيار تقودك من فهم الشركة إلى العتاد والشبكات والحماية، ثم ملخص يساعدك على كتابة التقرير.</p>
            <HeroArt />
            <ol className="steps">
              <li><span className="step-no">1</span><span>تعرّف على الشركة ومهام فريقها.</span></li>
              <li><span className="step-no">2</span><span>اختر العتاد والبرامج والشبكات والتشغيل.</span></li>
              <li><span className="step-no">3</span><span>راجع التناقض وخذ ملخص التقرير.</span></li>
            </ol>
          </div>
          <form
            className="glass"
            style={{ padding: 18 }}
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = name.trim();
              const section = group.trim();
              if (trimmed.length < 2 || restoring) return;
              const alreadyHere =
                data.name.trim() === trimmed && (Object.keys(data.answers).length > 0 || Object.keys(data.quantities).length > 0);
              if (alreadyHere) {
                clearSheetView();
                flushSync(() => start(trimmed, section));
                navigate(continuePath(data.lastPath));
                return;
              }
              setRestoring(true);
              setRestoreNote(ar.restoreWorking);
              void fetchStoredRow(trimmed, section)
                .then((row) => {
                  if (row.ok && row.headers && row.values) {
                    const restored = restoreSheetRow(row.headers, row.values);
                    if (!restored) {
                      setRestoreNote(ar.restoreMissing);
                      return;
                    }
                    markSheetView();
                    flushSync(() => replaceSave(restored));
                    navigate('/summary');
                    return;
                  }
                  if (row.needGroup || (row.message && !row.message.startsWith('لا يوجد سجل'))) {
                    setRestoreNote(row.message || ar.restoreMissing);
                    return;
                  }
                  clearSheetView();
                  const fresh = emptyData();
                  fresh.name = trimmed;
                  fresh.group = section;
                  fresh.createdAt = new Date().toISOString();
                  flushSync(() => replaceSave(fresh));
                  navigate('/wizard/0/0');
                })
                .catch(() => setRestoreNote(ar.restoreMissing))
                .finally(() => setRestoring(false));
            }}
          >
            {saved && (
              <p>
                أهلاً <bdi>{data.name}</bdi>. إجاباتك محفوظة في هذا المتصفح.
              </p>
            )}
            <label className="field">
              <span>اسم الطالب</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="name" />
              <small className="faint">حرفان على الأقل. يظهر في الملخص واسم الملف.</small>
            </label>
            <label className="field">
              <span>الشعبة (اختياري)</span>
              <input value={group} onChange={(event) => setGroup(event.target.value)} autoComplete="off" />
            </label>
            <button className="btn-primary" type="submit" disabled={name.trim().length < 2 || restoring} style={{ width: '100%' }}>
              {restoring ? ar.restoreWorking : saved ? 'حفظ ومتابعة' : 'ابدأ'}
            </button>
            <p className="faint">{ar.restoreHint}</p>
            {restoreNote ? <p className="muted">{restoreNote}</p> : null}
            {saved && (
              <button type="button" className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate(continuePath(data.lastPath))}>
                متابعة من حيث توقفت
              </button>
            )}
            <p className="faint">تُحفظ إجاباتك تلقائياً في هذا المتصفح فقط.</p>
            {saved &&
              (confirming ? (
                <div className="confirm">
                  <span>بدء جديد يمسح الإجابات الحالية.</span>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      reset();
                      setName('');
                      setGroup('');
                      setConfirming(false);
                    }}
                  >
                    نعم، ابدأ من جديد
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
                    إلغاء
                  </button>
                </div>
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setConfirming(true)}>
                  بدء من جديد
                </button>
              ))}
          </form>
        </div>
      </div>
    </>
  );
}
