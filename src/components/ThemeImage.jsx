"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

function deriveDarkSrc(src) {
  if (!src) return src;
  const qIndex = src.indexOf("?");
  const clean = qIndex >= 0 ? src.slice(0, qIndex) : src;
  const extIndex = clean.lastIndexOf(".");
  if (extIndex === -1) return src + "-dark"; // no ext
  const base = clean.slice(0, extIndex);
  const ext = clean.slice(extIndex);
  const dark = `${base}-dark${ext}`;
  // Preserve query string if present
  return qIndex >= 0 ? `${dark}${src.slice(qIndex)}` : dark;
}

const ThemeImage = ({ src, darkSrc, ...props }) => {
  const computedDarkSrc = useMemo(() => darkSrc || deriveDarkSrc(src), [src, darkSrc]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const apply = () => setIsDark(el.getAttribute("data-theme") === "dark");
    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const chosenSrc = isDark ? computedDarkSrc : src;
  return <Image src={chosenSrc} {...props} />;
};

export default ThemeImage;
