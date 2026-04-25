"use client";

import { useEffect, useState } from "react";

function getResetCountdown() {
  const manilaNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );

  const nextManilaMidnight = new Date(manilaNow);
  nextManilaMidnight.setDate(nextManilaMidnight.getDate() + 1);
  nextManilaMidnight.setHours(0, 0, 0, 0);

  const diffMs = Math.max(0, nextManilaMidnight.getTime() - manilaNow.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function ResetTimer() {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    setCountdown(getResetCountdown());
    const intervalId = setInterval(() => {
      setCountdown(getResetCountdown());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex items-center bg-[#F5E8A0] border-4 border-[#D7B87F] rounded-2xl px-5 h-15 shadow-md">
      <p className="font-delius text-lg font-bold text-[#2E2805] whitespace-nowrap">
        Next Reset: {countdown ?? "—"}
      </p>
    </div>
  );
}
