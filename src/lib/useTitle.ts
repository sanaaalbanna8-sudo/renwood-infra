import { useEffect } from 'react';

export function useTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} · مصمم البنية التحتية` : 'مصمم البنية التحتية: رينواد تورز';
  }, [page]);
}
