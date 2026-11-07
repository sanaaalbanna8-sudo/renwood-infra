import { Menu, Moon, RotateCcw, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../context/Store';
import { useTheme } from '../context/Theme';
import { completionRatio } from '../lib/progress';
import { Background } from './Background';
import { ProgressRing } from './ProgressRing';
import { Sidebar } from './Sidebar';

export function Shell() {
  const { data, reset, setLastPath } = useStore();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ratio = completionRatio(data);
  const percent = Math.round(ratio * 100);

  useEffect(() => {
    if (data.name.trim().length < 2) return;
    if (location.pathname === '/' || location.pathname.startsWith('/teacher')) return;
    setLastPath(location.pathname);
  }, [data.name, location.pathname, setLastPath]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <Background />
      <div className="app">
        <button type="button" className="skip" onClick={() => document.getElementById('content')?.focus()}>
          تخطَّ إلى المحتوى
        </button>
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-expanded={open} aria-controls="journey-nav" onClick={() => setOpen((value) => !value)}>
            {open ? <X size={18} /> : <Menu size={18} />}
            <span className="sr-only">{open ? 'إغلاق خريطة الرحلة' : 'فتح خريطة الرحلة'}</span>
          </button>
          <Link to="/" className="brand">
            <strong>مصمم البنية التحتية</strong>
            <span>رينواد تورز</span>
          </Link>
          <span className="grow" />
          <span className="who" title={data.name}>
            <bdi>{data.name}</bdi>
          </span>
          <div className="progress-chip">
            <ProgressRing value={ratio} />
            <span aria-hidden="true">{percent}%</span>
          </div>
          <p className="sr-only" aria-live="polite">
            اكتمل {percent} بالمئة من البنية
          </p>
          <button type="button" className="icon-btn" onClick={toggle} aria-pressed={theme === 'light'} aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {confirming ? (
            <div className="confirm" role="group" aria-label="تأكيد إعادة البدء">
              <span>ستُمسح كل الإجابات.</span>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
              >
                نعم، امسح
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
                إلغاء
              </button>
            </div>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setConfirming(true)} aria-label="إعادة البدء">
              <RotateCcw size={16} />
              <span className="restart-label">إعادة البدء</span>
            </button>
          )}
        </header>
        <div className="workspace">
          <button type="button" className={open ? 'scrim show' : 'scrim'} aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />
          <Sidebar open={open} onNavigate={() => setOpen(false)} />
          <main id="content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
