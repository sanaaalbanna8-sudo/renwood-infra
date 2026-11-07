import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { QuestionCard } from '../components/QuestionCard';
import { TermText } from '../components/TermText';
import { StageIntro } from '../components/StageIntro';
import { StageZero } from '../components/StageZero';
import { quantityCounts, quantityItems, quantityLocations } from '../data/quantities';
import { questionsByStage } from '../data/questions';
import { stageById } from '../data/stages';
import { useStore } from '../context/Store';
import { useTitle } from '../lib/useTitle';

export function Wizard() {
  const { stage = '0', index = '0' } = useParams();
  const stageNum = Number(stage);
  const indexNum = Number(index);
  const { data } = useStore();
  const stageInfo = stageById(stageNum);
  useTitle(stageInfo.name);

  if (!Number.isInteger(stageNum) || stageNum < 0 || stageNum > 9) return <Navigate to="/review" replace />;
  if (!data.introsSeen.includes(stageNum)) return <StageIntro stageId={stageNum} />;
  if (stageNum === 0) {
    if (!Number.isInteger(indexNum) || indexNum < 0) return <Navigate to="/wizard/0/0" replace />;
    if (indexNum > 1) return <Navigate to="/wizard/1/0" replace />;
    return <StageZero index={indexNum} />;
  }
  if (stageNum === 9) return <Quantities />;

  const list = questionsByStage(stageNum);
  if (!Number.isInteger(indexNum) || indexNum < 0 || indexNum >= list.length) {
    return <Navigate to={`/wizard/${stageNum}/0`} replace />;
  }
  return <QuestionStep stageNum={stageNum} indexNum={indexNum} total={list.length} questionId={list[indexNum].id} />;
}

function QuestionStep({
  stageNum,
  indexNum,
  total,
  questionId,
}: {
  stageNum: number;
  indexNum: number;
  total: number;
  questionId: string;
}) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const list = questionsByStage(stageNum);
  const question = list[indexNum];
  if (!question) return <Navigate to={`/wizard/${stageNum}/0`} replace />;
  const atStart = stageNum === 0 && indexNum === 0;
  const atEnd = indexNum === total - 1;

  const go = (nextStage: number, nextIndex: number) => navigate(`/wizard/${nextStage}/${nextIndex}`);
  const previous = () => {
    if (indexNum > 0) go(stageNum, indexNum - 1);
    else if (stageNum === 1) go(0, 1);
    else if (stageNum > 1) {
      const prevList = questionsByStage(stageNum - 1);
      go(stageNum - 1, Math.max(0, prevList.length - 1));
    }
  };
  const next = () => {
    if (!atEnd) go(stageNum, indexNum + 1);
    else if (stageNum < 8) go(stageNum + 1, 0);
    else go(9, 0);
  };

  return (
    <div className="narrow">
      <AnimatePresence mode="wait">
        <motion.div
          key={questionId}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          <QuestionCard question={question} index={indexNum} total={total} />
        </motion.div>
      </AnimatePresence>
      <div className="pager">
        <button type="button" className="btn-ghost" onClick={previous} disabled={atStart}>
          السابق
        </button>
        <button type="button" className="btn-primary" onClick={next}>
          التالي
        </button>
      </div>
    </div>
  );
}

function Quantities() {
  const { data, setQuantity } = useStore();
  const navigate = useNavigate();
  const stage = stageById(9);
  const filled = quantityItems.filter((item) => {
    const value = data.quantities[item.label];
    return value && typeof value.count === 'number' && value.count >= 0;
  }).length;

  return (
    <section className="narrow" style={{ ['--stage' as string]: stage.color }}>
      <p className="stage-pill">
        <stage.icon size={16} aria-hidden="true" />
        الكميات والمواقع · {filled} من {quantityItems.length}
      </p>
      <h1>الكميات والمواقع</h1>
      <p className="muted">اختر العدد والمكان من القائمة. تظهر هذه البنود في قائمة العتاد داخل الملخص.</p>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={quantityItems.length} aria-valuenow={filled} aria-label="تقدم الكميات">
        <span style={{ width: `${(filled / quantityItems.length) * 100}%`, background: stage.color }} />
      </div>
      <div className="qty-grid" style={{ marginTop: 14 }}>
        {quantityItems.map((item) => {
          const value = data.quantities[item.label];
          const counts = value?.count != null && !quantityCounts.includes(value.count) ? [value.count, ...quantityCounts] : quantityCounts;
          const locations = value?.location && !quantityLocations.includes(value.location) ? [value.location, ...quantityLocations] : quantityLocations;
          return (
            <div key={item.label} className="glass qty-card">
              <h3>
                <TermText text={item.label} />
              </h3>
              <div className="qty-row">
                <label className="field" style={{ margin: 0, flex: '0 0 140px' }}>
                  <span>العدد</span>
                  <select
                    className="select"
                    value={value?.count == null ? '' : String(value.count)}
                    onChange={(event) => {
                      const raw = event.target.value;
                      setQuantity(item.label, { count: raw === '' ? null : Number(raw) });
                    }}
                  >
                    <option value="">اختر العدد</option>
                    {counts.map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field" style={{ margin: 0, flex: 1 }}>
                  <span>الموقع</span>
                  <select
                    className="select"
                    value={value?.location ?? ''}
                    onChange={(event) => setQuantity(item.label, { location: event.target.value })}
                  >
                    <option value="">اختر الموقع</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pager">
        <button type="button" className="btn-ghost" onClick={() => navigate(`/wizard/8/${Math.max(0, questionsByStage(8).length - 1)}`)}>
          السابق
        </button>
        <button type="button" className="btn-primary" onClick={() => navigate('/review')}>
          إلى المراجعة
        </button>
      </div>
    </section>
  );
}
