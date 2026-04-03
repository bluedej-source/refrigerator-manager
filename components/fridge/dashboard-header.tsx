"use client";

import { useState, useEffect } from "react";
import { Bell, ChevronLeft, Settings, LogOut } from "lucide-react";
import type { FoodItem } from "@/lib/types";
import { getDaysUntilExpiry } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FilterType = "all" | "danger" | "warning" | "fresh";
export type TabType = "list" | "report";

interface DashboardHeaderProps {
  items: FoodItem[];
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  activeTab: TabType;
  onTabToggle: () => void;
  onAlertClick: () => void;
  onLogout?: () => void;
  isGuest?: boolean;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "안녕하세요";
  return "좋은 저녁이에요";
}

export function DashboardHeader({
  items,
  activeFilter,
  onFilterChange,
  activeTab,
  onTabToggle,
  onAlertClick,
  onLogout,
  isGuest,
}: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("안녕하세요");
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const dangerCount = items.filter(
    (item) => getDaysUntilExpiry(item.expiryDate) <= 2
  ).length;
  const warningCount = items.filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days > 2 && days <= 5;
  }).length;
  const totalCount = items.length;

  const urgentText = () => {
    if (dangerCount > 0) {
      return (
        <>
          오늘 안에{" "}
          <span className="text-danger font-bold">{dangerCount}개</span>를
          드세요
        </>
      );
    }
    if (warningCount > 0) {
      return (
        <>
          <span className="text-warning font-bold">{warningCount}개</span>가
          곧 만료돼요
        </>
      );
    }
    return <span className="text-success font-bold">모두 신선해요!</span>;
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      {/* Top Nav */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        {/* Left: toggle button */}
        <button
          onClick={onTabToggle}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="탭 전환"
          suppressHydrationWarning
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 text-foreground transition-transform duration-300",
              activeTab === "report" && "rotate-180"
            )}
            suppressHydrationWarning
          />
        </button>

        {/* Center: title */}
        <span
          className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          suppressHydrationWarning
        >
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
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label="로그아웃"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Greeting Section */}
      <div className="px-5 pt-3 pb-5">
        <div className="flex items-center gap-2 mb-1" suppressHydrationWarning>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          {isGuest && (
            <p className="text-sm text-warning font-medium">
              로그인시 기록이 저장됩니다.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/chef-character.jpg"
            alt="요리사 캐릭터"
            width={48}
            height={48}
            className="flex-shrink-0 object-contain"
          />
          <h1 className="text-2xl font-extrabold text-foreground leading-tight text-balance">
            {urgentText()}
          </h1>
        </div>

        {/* Stats Row - Filterable Chips */}
        <div className="flex items-center gap-2 mt-4">
          <StatChip
            label="전체"
            count={totalCount}
            color="text-foreground"
            bgColor="bg-muted"
            activeColor="bg-foreground"
            active={activeFilter === "all"}
            onClick={() => onFilterChange("all")}
          />
          <StatChip
            label="위험"
            count={dangerCount}
            color="text-danger"
            bgColor="bg-danger-bg"
            activeColor="bg-danger"
            active={activeFilter === "danger"}
            onClick={() => onFilterChange("danger")}
          />
          <StatChip
            label="주의"
            count={warningCount}
            color="text-warning"
            bgColor="bg-warning-bg"
            activeColor="bg-warning"
            active={activeFilter === "warning"}
            onClick={() => onFilterChange("warning")}
          />
          <StatChip
            label="신선"
            count={items.filter((item) => getDaysUntilExpiry(item.expiryDate) > 5).length}
            color="text-success"
            bgColor="bg-success-bg"
            activeColor="bg-success"
            active={activeFilter === "fresh"}
            onClick={() => onFilterChange("fresh")}
          />
        </div>
      </div>
    </header>
  );
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

function StatChip({
  label,
  count,
  color,
  bgColor,
  activeColor,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  bgColor: string;
  activeColor: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer",
        active ? `${activeColor} shadow-sm` : `${bgColor} hover:opacity-80`
      )}
    >
      <span className={cn("text-xs font-medium", active ? "text-card" : color)}>
        {label}
      </span>
      <span className={cn("text-xs font-bold", active ? "text-card" : color)}>
        {count}
      </span>
    </button>
  );
}
