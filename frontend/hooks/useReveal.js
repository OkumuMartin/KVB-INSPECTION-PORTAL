'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveal an element once it scrolls into view.
 *
 * Returns a ref to attach to the element and a boolean telling whether the
 * element is currently visible. Uses IntersectionObserver so the work stays
 * off the main thread, and falls back to "always visible" where the observer
 * is unavailable.
 */
export function useReveal(options = {}) {
  const { threshold = 0.12, rootMargin = '0px 0px -60px 0px' } = options;
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}

export default useReveal;
