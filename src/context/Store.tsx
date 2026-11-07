import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { questionById } from '../data/questions';
import { emptyData, loadSave, writeSave } from '../lib/storage';
import type { SaveData } from '../lib/types';

type QuantityPatch = { count?: number | null; location?: string };

type StoreValue = {
  data: SaveData;
  start: (name: string, group: string) => void;
  markIntro: (stage: number) => void;
  setLastPath: (path: string) => void;
  chooseSingle: (id: string, option: string) => void;
  toggleMulti: (id: string, option: string) => void;
  setText: (id: string, text: string) => void;
  setOther: (id: string, text: string) => void;
  setPriority: (tech: string, priority: string) => void;
  setQuantity: (label: string, patch: QuantityPatch) => void;
  reset: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function touch(data: SaveData): SaveData {
  return { ...data, updatedAt: new Date().toISOString() };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SaveData>(() => loadSave());

  useEffect(() => {
    writeSave(data);
  }, [data]);

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

  const markIntro = useCallback((stage: number) => {
    setData((prev) =>
      prev.introsSeen.includes(stage) ? prev : touch({ ...prev, introsSeen: [...prev.introsSeen, stage] }),
    );
  }, []);

  const setLastPath = useCallback((path: string) => {
    setData((prev) => (prev.lastPath === path ? prev : touch({ ...prev, lastPath: path })));
  }, []);

  const chooseSingle = useCallback((id: string, option: string) => {
    setData((prev) => touch({ ...prev, answers: { ...prev.answers, [id]: [option] } }));
  }, []);

  const toggleMulti = useCallback((id: string, option: string) => {
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
  }, []);

  const setText = useCallback((id: string, text: string) => {
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
  }, []);

  const setOther = useCallback((id: string, text: string) => {
    setData((prev) => {
      const other = { ...prev.other };
      if (text) other[id] = text;
      else delete other[id];
      return touch({ ...prev, other });
    });
  }, []);

  const setPriority = useCallback((tech: string, priority: string) => {
    setData((prev) => {
      const priorities = { ...prev.priorities };
      if (priority) priorities[tech] = priority;
      else delete priorities[tech];
      return touch({ ...prev, priorities });
    });
  }, []);

  const setQuantity = useCallback((label: string, patch: QuantityPatch) => {
    setData((prev) => {
      const current = prev.quantities[label] ?? { count: null, location: '' };
      const next = { ...current, ...patch };
      const quantities = { ...prev.quantities };
      if (next.count == null && !next.location.trim()) delete quantities[label];
      else quantities[label] = next;
      return touch({ ...prev, quantities });
    });
  }, []);

  const reset = useCallback(() => setData(emptyData()), []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      start,
      markIntro,
      setLastPath,
      chooseSingle,
      toggleMulti,
      setText,
      setOther,
      setPriority,
      setQuantity,
      reset,
    }),
    [data, start, markIntro, setLastPath, chooseSingle, toggleMulti, setText, setOther, setPriority, setQuantity, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('store');
  return value;
}
