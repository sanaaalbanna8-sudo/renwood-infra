import { Link } from 'react-router-dom';
import { quantityItems } from '../data/quantities';
import { questionsByStage } from '../data/questions';
import { stages } from '../data/stages';
import { useStore } from '../context/Store';
import { isAnswered, quantityFilled, questionPath } from '../lib/progress';
import { useTitle } from '../lib/useTitle';

export function Review() {
  useTitle('المراجعة');
  const { data } = useStore();
  const groups = stages
    .map((stage) => {
      if (stage.id === 9) {
        const items = quantityItems
          .filter((item) => !quantityFilled(data, item.label))
          .map((item) => ({ id: item.label, short: item.label, path: '/wizard/9/0' }));
        return { stage, items };
      }
      const items = questionsByStage(stage.id)
        .filter((question) => !isAnswered(question, data))
        .map((question) => ({ id: question.id, short: question.short, path: questionPath(question.id) }));
      return { stage, items };
    })
    .filter((group) => group.items.length);
  const missing = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <section className="narrow">
      <h1>المراجعة</h1>
      <p className="muted">
        {missing === 0
          ? 'أجبت عن البنود كلها. يمكنك عرض الملخص.'
          : `بقي ${missing} بنداً بلا جواب. يمكنك المتابعة، وستظهر في الملخص بوسم «لم تجب».`}
      </p>
      {groups.map((group) => (
        <div key={group.stage.id} className="glass" style={{ padding: 14, marginTop: 12, ['--stage' as string]: group.stage.color }}>
          <h2>{group.stage.name}</h2>
          <ul>
            {group.items.map((item) => (
              <li key={item.id}>
                <Link to={item.path}>
                  <bdi className="qid">{item.id}</bdi> · {item.short}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="pager">
        <Link className="btn-ghost" to="/wizard/9/0">
          السابق
        </Link>
        <Link className="btn-primary" to="/summary" state={{ celebrate: true }}>
          إنهاء وعرض الملخص
        </Link>
      </div>
    </section>
  );
}
