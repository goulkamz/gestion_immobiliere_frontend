import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Détecte l'entrée dans le viewport pour déclencher une apparition
 * progressive. Retourne toujours `true` si l'utilisateur préfère un
 * mouvement réduit (pas d'animation, contenu visible d'emblée).
 */
export function useInViewAnimation<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion() || inView) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  return [ref, inView];
}
