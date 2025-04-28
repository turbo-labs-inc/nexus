"use client";

import { useEffect, useState } from "react";

interface ScrollState {
  scrollY: number;
  isScrollingUp: boolean;
  isAtTop: boolean;
  isAtBottom: boolean;
  scrollPercent: number;
}

/**
 * Custom hook for tracking scroll state including scroll position,
 * direction, and if the page is at the top or bottom.
 */
export function useScroll(): ScrollState {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    isScrollingUp: false,
    isAtTop: true,
    isAtBottom: false,
    scrollPercent: 0,
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isScrollingUp = scrollY < lastScrollY;
      const isAtTop = scrollY < 10;

      // Calculate scroll percentage (how much of the page has been scrolled)
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercent = Math.min(
        100,
        Math.round((scrollY / (scrollHeight - clientHeight)) * 100)
      );

      // Check if at bottom
      const isAtBottom =
        Math.ceil(scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 5;

      setScrollState({
        scrollY,
        isScrollingUp,
        isAtTop,
        isAtBottom,
        scrollPercent,
      });

      lastScrollY = scrollY;
    };

    // Set initial values
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrollState;
}

/**
 * Custom hook that tracks when an element enters or exits the viewport
 * @param rootMargin The margin around the root element
 * @param threshold The visibility threshold to trigger the callback
 */
export function useIntersectionObserver(
  rootMargin = "0px",
  threshold = 0.1
): [boolean, (node: Element | null) => void] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          setIsIntersecting(entries[0].isIntersecting);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return [isIntersecting, setRef];
}
