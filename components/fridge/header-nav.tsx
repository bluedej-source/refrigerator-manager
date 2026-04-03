"use client";

import { ChevronLeft, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterType, TabType } from "@/components/fridge/dashboard-header";

interface HeaderNavProps {
  activeTab: TabType;
  dangerCount: number;
  onTabToggle: () => void;
  onAlertClick: () => void;
}

function FridgeCharacter() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="6" y="2" width="24" height="32" rx="4" fill="#E8F0FE" stroke="#4A90D9" strokeWidth="1.5" />
      <rect x="6" y="2" width="24" height="11" rx="4" fill="#C5D8F8" stroke="#4A90D9" strokeWidth="1.5" />
      <line x1="6" y1="13" x2="30" y2="13" stroke="#4A90D9" strokeWidth="1.5" />
      <rect x="16" y="6" width="4" height="1.5" rx="0.75" fill="#4A90D9" />
      <rect x="16" y="19" width="4" height="1.5" rx="0.75" fill="#4A90D9" />
      <circle cx="14" cy="22" r="1.5" fill="#4A90D9" />
      <circle cx="22" cy="22" r="1.5" fill="#4A90D9" />
      <path d="M14 26 Q18 29 22 26" stroke="#4A90D9" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="25" r="2" fill="#FFB8B8" opacity="0.5" />
      <circle cx="24" cy="25" r="2" fill="#FFB8B8" opacity="0.5" />
    </svg>
  );
}

export function HeaderNav({ activeTab, dangerCount, onTabToggle, onAlertClick }: HeaderNavProps) {
  return (
    <>
      {/* Left: back/toggle button */}
      <button
        onClick={onTabToggle}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label={activeTab === "list" ? "절약 리포트로 이동" : "식품 목록으로 이동"}
      >
        <ChevronLeft
          className={cn(
            "w-5 h-5 text-foreground transition-transform duration-300",
            activeTab === "report" && "rotate-180"
          )}
        />
      </button>

      {/* Center: title */}
      <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {activeTab === "list" ? "냉장고 안심 매니저" : "절약 리포트"}
        {activeTab === "list" && <FridgeCharacter />}
      </span>

      {/* Right: alert + settings */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAlertClick}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors relative"
          aria-label={dangerCount > 0 ? `위험 식품 ${dangerCount}개 보기` : "알림"}
        >
          <Bell className="w-5 h-5 text-foreground" />
          {dangerCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full animate-pulse" />
          )}
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="설정"
        >
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </>
  );
}
