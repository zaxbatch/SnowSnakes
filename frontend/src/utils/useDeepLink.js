import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// ─── Deep links ──────────────────────────────────────────────────────────
// A shared link looks like /jokes?joke=42. This resolves that parameter
// against the loaded items, scrolls the one that was linked to into view and
// flashes a highlight on it, so the visitor lands on the exact post rather
// than a wall of cards wondering which one they were sent.
//
// The parameter is removed from the address afterwards: the highlight is a
// one-time arrival cue, and leaving it would re-trigger on every re-render and
// keep a stale id in the URL if the visitor then searches or re-sorts.
export default function useDeepLink(contentType, items, loading) {
  const [searchParams, setSearchParams] = useSearchParams();
  const handled = useRef(null);

  const wantedId = searchParams.get(contentType);
  const isHandled = handled.current !== null && String(handled.current) === String(wantedId);

  useEffect(() => {
    if (!wantedId || loading || isHandled) return;

    const match = items.find((item) => String(item.id) === String(wantedId));
    if (!match) {
      // Items are loaded but the id is not among them (deleted, or a link to a
      // different gallery). Stop retrying and drop the dead parameter.
      if (items.length > 0) {
        handled.current = wantedId;
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete(contentType);
          return next;
        }, { replace: true });
      }
      return;
    }

    handled.current = wantedId;

    // Wait for a paint so the card exists and has its final position.
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`${contentType}-${match.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('deep-link-highlight');
        setTimeout(() => el.classList.remove('deep-link-highlight'), 3200);
      }
    });

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(contentType);
      return next;
    }, { replace: true });

    return () => cancelAnimationFrame(raf);
  }, [wantedId, loading, items, contentType, setSearchParams, isHandled]);
}
