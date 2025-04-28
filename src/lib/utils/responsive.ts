"use client";

/**
 * Utility functions for responsive design
 */

import { useEffect, useState } from "react";

/**
 * Custom hook to detect the current viewport size based on breakpoints
 * Returns the current breakpoint as a string: "xs", "sm", "md", "lg", "xl", or "2xl"
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<string>("xs");

  useEffect(() => {
    // Function to determine the current breakpoint
    const calculateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) return "xs";
      if (width >= 640 && width < 768) return "sm";
      if (width >= 768 && width < 1024) return "md";
      if (width >= 1024 && width < 1280) return "lg";
      if (width >= 1280 && width < 1536) return "xl";
      return "2xl";
    };

    // Set the initial breakpoint
    setBreakpoint(calculateBreakpoint());

    // Add resize listener
    const handleResize = () => {
      setBreakpoint(calculateBreakpoint());
    };

    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return breakpoint;
}

/**
 * Custom hook to detect if the current viewport is mobile-sized
 * Returns true if the viewport width is less than 768px
 */
export function useMobileDetect() {
  const breakpoint = useBreakpoint();
  return breakpoint === "xs" || breakpoint === "sm";
}

/**
 * Custom hook to detect if the current viewport is tablet-sized
 * Returns true if the viewport width is between 768px and 1024px
 */
export function useTabletDetect() {
  const breakpoint = useBreakpoint();
  return breakpoint === "md";
}

/**
 * Custom hook to detect if the current viewport is desktop-sized
 * Returns true if the viewport width is 1024px or larger
 */
export function useDesktopDetect() {
  const breakpoint = useBreakpoint();
  return breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl";
}

/**
 * Hook for responsive values based on current breakpoint
 * @param values Object with breakpoint keys and values
 * @param defaultValue Default value to use if no matching breakpoint is found
 */
export function useResponsiveValue<T>(values: { [key: string]: T }, defaultValue: T): T {
  const breakpoint = useBreakpoint();
  return values[breakpoint] || defaultValue;
}