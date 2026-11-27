import { useEffect, useState } from 'preact/hooks';
import { liveQuery } from 'dexie';

// Re-renders whenever the data behind the query changes.
export function useLive(query, deps = [], initial = undefined) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const sub = liveQuery(query).subscribe({
      next: setValue,
      error: (e) => console.error(e),
    });
    return () => sub.unsubscribe();
  }, deps);
  return value;
}
