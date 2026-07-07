'use client';

import { useEffect, useState } from 'react';

interface VisitorInfoData {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  timestamp: number;
}

export function VisitorInfo() {
  const [info, setInfo] = useState<VisitorInfoData | null>(null);

  useEffect(() => {
    fetch('/api/visitor/info')
      .then((res) => res.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  if (!info) return null;

  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <div className="flex items-center gap-1">
        <span className="font-medium">IP:</span>
        <span className="font-mono">{info.ip}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">Speed:</span>
        <span>{info.acceptEncoding}</span>
      </div>
    </div>
  );
}
