import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { questionById } from '../data/questions';
import { clearSheetView, isSheetView } from '../lib/restoreSheet';
import { flushResults, hasProgressToSave, submitResults } from '../lib/sheetSubmit';
import { emptyData, loadSave, writeSave } from '../lib/storage';
import type { SaveData } from '../lib/types';

type QuantityPatch = { count?: number | null; location?: string };

type StoreValue = {
  data: SaveData;
  start: (name: string, group: string) => void;
  replaceSave: (next: SaveData) => void;
  markIntro: (stage: number) => void;
  setLastPath: (path: string) => void;
  chooseSingle: (id: string, option: string) => void;
  toggleMulti: (id: string, option: string) => void;
  setText: (id: string, text: string) => void;
  setOther: (id: string, text: string) => void;
  setPriority: (tech: string, priority: string) => void;
  setQuantity: (label: string, patch: QuantityPatch) => void;
  toggleStep: (stepId: string) => void;
  skipStage: (stageId: string) => void;
  setGuidePosition: (activity: string, stage: string) => void;
  reset: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function touch(data: SaveData): SaveData {
  return { ...data, updatedAt: new Date().toISOString() };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SaveData>(() => loadSave());
  const dataRef = useRef(data);
  dataRef.current = data;
  const saveGeneration = useRef(0);
  const [queuedSave, setQueuedSave] = useState(0);

  const queueSheetSave = useCallback(() => {
    saveGeneration.current += 1;
    setQueuedSave(saveGeneration.current);
  }, []);

  useEffect(() => {
    writeSave(data);
  }, [data]);

  useEffect(() => {
    if (queuedSave === 0) return;
    const send = () => {
      const current = dataRef.current;
      if (isSheetView() || !hasProgressToSave(current)) return;
      void submitResults(current);
    };
    const timer = window.setTimeout(send, 2000);
    const flush = () => {
      const current = dataRef.current;
      if (isSheetView() || !hasProgressToSave(current)) return;
      flushResults(current);
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [queuedSave]);

  const start = useCallback((name: string, group: string) => {
    setData((prev) =>
      touch({
        ...prev,
        name: name.trim(),
        group: group.trim(),
        createdAt: prev.createdAt || new Date().toISOString(),
      }),
    );
  }, []);

  const replaceSave = useCallback((next: SaveData) => {
    setData(touch(next));
  }, []);

  const markIntro = useCallback((stage: number) => {
    setData((prev) =>
      prev.introsSeen.includes(stage) ? prev : touch({ ...prev, introsSeen: [...prev.introsSeen, stage] }),
    );
  }, []);

  const setLastPath = useCallback((path: string) => {
    setData((prev) => (prev.lastPath === path ? prev : touch({ ...prev, lastPath: path })));
  }, []);

  const chooseSingle = useCallback((id: string, option: string) => {
    clearSheetView();
    queueSheetSave();
    setData((prev) => touch({ ...prev, answers: { ...prev.answers, [id]: [option] } }));
  }, [queueSheetSave]);

  const toggleMulti = useCallback((id: string, option: string) => {
    clearSheetView();
    queueSheetSave();
    setData((prev) => {
      const question = questionById(id);
      const current = new Set(prev.answers[id] ?? []);
      if (current.has(option)) current.delete(option);
      else current.add(option);
      const next = question ? question.options.filter((item) => current.has(item)) : [...current];
      const answers = { ...prev.answers };
      if (next.length) answers[id] = next;
      else delete answers[id];
      let priorities = prev.priorities;
      if (id === 'م1') {
        priorities = {};
        for (const tech of next) {
          if (prev.priorities[tech]) priorities[tech] = prev.priorities[tech];
        }
      }
      return touch({ ...prev, answers, priorities });
    });
  }, [queueSheetSave]);

  const setText = useCallback((id: string, text: string) => {
    clearSheetView();
    queueSheetSave();
    setData((prev) => {
      const answers = { ...prev.answers };
      if (text.trim()) answers[id] = [text];
      else delete answers[id];
      return touch({
        ...prev,
        answers,
        understanding: id === 'ص2' ? text : prev.understanding,
      });
    });
  }, [queueSheetSave]);

  const setOther = useCallback((id: string, text: string) => {
    clearSheetView();
    queueSheetSave();
    setData((prev) => {
      const other = { ...prev.other };
      if (text) other[id] = text;
      else delete other[id];
      return touch({ ...prev, other });
    });
  }, [queueSheetSave]);

  const setPriority = useCallback((tech: string, priority: string) => {
    clearSheetView();
    queueSheetSave();
    setData((prev) => {
      const priorities = { ...prev.priorities };
      if (priority) priorities[tech] = priority;
      else delete priorities[tech];
      return touch({ ...prev, priorities });
    });
  }, [queueSheetSave]);

  const setQuantity = useCallback((label: string, patch: QuantityPatch) => {
    clearSheetView();
    queueSheetSave();
    setData((prev) => {
      const current = prev.quantities[label] ?? { count: null, location: '' };
      const next = { ...current, ...patch };
      const quantities = { ...prev.quantities };
      if (next.count == null && !next.location.trim()) delete quantities[label];
      else quantities[label] = next;
      return touch({ ...prev, quantities });
    });
  }, [queueSheetSave]);

  const toggleStep = useCallback((stepId: string) => {
    setData((prev) => {
      const progress = { ...prev.progress };
      if (progress[stepId]?.done) delete progress[stepId];
      else progress[stepId] = { done: true, at: new Date().toISOString() };
      return touch({ ...prev, progress });
    });
  }, []);

  const skipStage = useCallback((stageId: string) => {
    setData((prev) => touch({ ...prev, skipped: { ...prev.skipped, [stageId]: new Date().toISOString() } }));
  }, []);

  const setGuidePosition = useCallback((activity: string, stage: string) => {
    setData((prev) =>
      prev.position.activity === activity && prev.position.stage === stage ? prev : touch({ ...prev, position: { activity, stage } }),
    );
  }, []);

  const reset = useCallback(() => {
    clearSheetView();
    setData(emptyData());
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      start,
      replaceSave,
      markIntro,
      setLastPath,
      chooseSingle,
      toggleMulti,
      setText,
      setOther,
      setPriority,
      setQuantity,
      toggleStep,
      skipStage,
      setGuidePosition,
      reset,
    }),
    [data, start, replaceSave, markIntro, setLastPath, chooseSingle, toggleMulti, setText, setOther, setPriority, setQuantity, toggleStep, skipStage, setGuidePosition, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('store');
  return value;
}
