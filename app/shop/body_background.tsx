"use client"
import { useEffect } from "react";

export default function BodyBackground({ style }: { style: string }) {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = style;
    return () => { document.body.style.background = prev; };
  }, [style]);

  return null;
}