import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// ─── Deep links ──────────────────────────────────────────────────────────
// A shared link looks like /jokes?joke=42. This resolves that parameter
// against the loaded items, scrolls the one that was linked to into view and
// flashes its border, so the visitor lands on the exact post rather than a wall
// of cards wondering which one they were sent.
//
// Order matters here, and getting it wrong fails silently. Clearing the
// parameter updates the URL, which re-renders the gallery and makes React
// replace the card's DOM node. If that happens before the element is looked up,
// the lookup finds nothing: the parameter disappears and nothing is ever
// highlighted. So the card is located, scrolled to and marked first, and the
// address is tidied immediately afterwards.
export default function useDeepLink(contentType, items, loading) {
  const [searchParams, setSearchParams] = useSearchParams();
  const handled = useRef(null);

  const wantedId = searchParams.get(contentType);

  useEffect(() => {
    if (!wantedId || loading) return;
    if (handled.current !== null && String(handled.current) === String(wantedId)) return;

    const clearParam = () => setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(contentType);
      return next;
    }, { replace: true });

    const match = items.find((item) => String(item.id) === String(wantedId));

    if (!match) {
      // Items are loaded but the id is not among them (deleted, or a link to a
      // different gallery). Stop retrying and drop the dead parameter.
      if (items.length > 0) {
        handled.current = wantedId;
        clearParam();
      }
      return;
    }

    handled.current = wantedId;

    let raf2 = null;
    const raf1 = requestAnimationFrame(() => {
      const show = () => {
        const el = document.getElementById(`${contentType}-${match.id}`);
        if (!el) return false;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('deep-link-highlight');
        // Comfortably longer than the flash itself (4 x 1s) so the animation is
        // never cut off part-way through a cycle.
        setTimeout(() => el.classList.remove('deep-link-highlight'), 4600);
        return true;
      };
      // If the card is not in the DOM yet, try once more on the next frame
      // rather than losing the cue.
      if (!show()) raf2 = requestAnimationFrame(show);
      clearParam();
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [wantedId, loading, items, contentType, setSearchParams]);
}
