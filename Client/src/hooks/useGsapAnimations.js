import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const uniqueElements = (selectors) => {
  const visited = new Set();
  const elements = [];

  selectors.forEach((selector) => {
    gsap.utils.toArray(selector).forEach((element) => {
      if (!visited.has(element)) {
        visited.add(element);
        elements.push(element);
      }
    });
  });

  return elements;
};

const animateGroup = (elements, fromVars, toVars) => {
  elements.forEach((element, index) => {
    gsap.fromTo(
      element,
      fromVars,
      {
        ...toVars,
        delay: (index % 6) * 0.05,
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      }
    );
  });
};

const useGsapAnimations = () => {
  const location = useLocation();

  useEffect(() => {
    let context;

    const timer = setTimeout(() => {
      context = gsap.context(() => {
        const cards = uniqueElements([
          "[data-animate='card']",
          ".modern-card",
          ".glass-surface",
        ]);
        animateGroup(
          cards,
          { y: 70, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }
        );

      });

      ScrollTrigger.refresh();
    }, 80);

    return () => {
      clearTimeout(timer);
      if (context) context.revert();
    };
  }, [location.pathname]);
};

export default useGsapAnimations;
