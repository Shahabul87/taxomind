"use client";

import { useEffect, useState } from "react";

interface ClientOnlyHtmlProps {
  html: string;
  className?: string;
}

export function ClientOnlyHtml({ html, className }: ClientOnlyHtmlProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on server or before mount
  if (!mounted) {
    return <div className={className} />;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html || "" }}
    />
  );
}