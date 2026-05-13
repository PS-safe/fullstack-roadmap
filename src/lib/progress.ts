import { useCallback, useEffect, useState } from 'react';

const KEY = 'fsr.progress.v1';

type ProgressMap = Record<string, boolean>;

function load(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function save(map: ProgressMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function useProgress() {
  const [map, setMap] = useState<ProgressMap>(() => load());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setMap(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const set = useCallback((id: string, value: boolean) => {
    setMap((prev) => {
      const next = { ...prev, [id]: value };
      save(next);
      return next;
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setMap({});
    save({});
  }, []);

  return { map, set, toggle, reset };
}

export function progressForLayer(map: ProgressMap, layerId: number, totalTopics: number) {
  const completed = Array.from({ length: totalTopics }).filter((_, i) =>
    map[`L${layerId}.t${i}`],
  ).length;
  return { completed, total: totalTopics, pct: totalTopics ? completed / totalTopics : 0 };
}
