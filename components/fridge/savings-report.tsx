"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CreditCard,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ReceiptScanner } from "@/components/fridge/receipt-scanner";
import type { FoodItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SavingsReportProps {
  consumedThisMonthCount: number;
  consumedThisMonthAmount: number;
  wastedThisMonthCount: number;
  wastedThisMonthAmount: number;
  thisMonthExpensesCount: number;
  thisMonthExpensesAmount: number;
  last3MonthsExpenses: { month: string; amount: number; count: number }[];
  onSyncTossPay: () => void;
  onAddItems: (items: Omit<FoodItem, "id">[]) => void;
}

export function SavingsReport({
  consumedThisMonthCount,
  consumedThisMonthAmount,
  wastedThisMonthCount,
  wastedThisMonthAmount,
  thisMonthExpensesCount,
  thisMonthExpensesAmount,
  last3MonthsExpenses,
  onSyncTossPay,
  onAddItems,
}: SavingsReportProps) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1800));
    onSyncTossPay();
    setSyncing(false);
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  };

  const consumeRate =
    consumedThisMonthCount + wastedThisMonthCount > 0
      ? Math.round(
          (consumedThisMonthCount / (consumedThisMonthCount + wastedThisMonthCount)) * 100
        )
      : 100;

  const graphData = [...last3MonthsExpenses].reverse().concat({
    month: "이번 달",
    amount: thisMonthExpensesAmount,
    count: thisMonthExpensesCount,
  });

  const maxAmount = Math.max(...graphData.map((d) => d.amount), 1);

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Receipt Scanner Card */}
      <ReceiptScanner onAddItems={onAddItems} />

      {/* Toss Pay Sync Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-primary rounded-2xl p-5 text-primary-foreground"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold opacity-80">토스페이 연동</p>
              <p className="text-sm font-bold">영수증 자동 가져오기</p>
            </div>
          </div>
          {synced && (
            <div className="flex items-center gap-1 bg-primary-foreground/20 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">완료</span>
            </div>
          )}
        </div>
        <p className="text-xs opacity-75 mb-4 leading-relaxed">
          최근 마트 영수증을 분석해서 식품을 자동으로 추가해드려요.
          유통기한도 자동으로 설정돼요.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full py-3 bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              영수증 분석 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              토스페이로 동기화
            </>
          )}
        </button>
      </motion.div>

      {/* Savings Report Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-success-bg rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">이번 달 절약 금액</p>
              <p className="text-xl font-extrabold text-foreground">
                {consumedThisMonthAmount.toLocaleString()}
                <span className="text-sm font-semibold text-muted-foreground ml-1">
                  원
                </span>
              </p>
            </div>
          </div>
          <button className="flex items-center gap-0.5 text-xs text-primary font-semibold">
            전체 보기
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            icon={<CheckCircle className="w-4 h-4 text-success" />}
            label="소비 완료"
            count={consumedThisMonthCount}
            amount={consumedThisMonthAmount}
            bg="bg-success-bg"
          />
          <StatCard
            icon={<XCircle className="w-4 h-4 text-danger" />}
            label="버린 식품"
            count={wastedThisMonthCount}
            amount={wastedThisMonthAmount}
            bg="bg-danger-bg"
          />
        </div>

        {/* Consumption Rate Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              소비율
            </span>
            <span className="text-xs font-bold text-success">{consumeRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${consumeRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="h-full bg-success rounded-full"
            />
          </div>
        </div>

        {/* This Month Expenses */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between mx-1">
          <span className="text-xs text-muted-foreground font-semibold">이번 달 식비</span>
          <span className="text-sm font-bold text-foreground">
            {thisMonthExpensesCount}개 / {thisMonthExpensesAmount.toLocaleString()}원
          </span>
        </div>

        {/* Last 3 Months Expenses */}
        <div className="mt-4 pt-4 border-t border-border space-y-3 mx-1">
          <span className="text-xs text-muted-foreground font-semibold">최근 3개월 식비 추이</span>
          <div className="space-y-2">
            {last3MonthsExpenses.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">{m.month}</span>
                <span className="font-semibold text-foreground">{m.count}개 / {m.amount.toLocaleString()}원</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Graph */}
        <div className="mt-6 pt-5 border-t border-border mx-1">
          <span className="text-xs text-muted-foreground font-semibold block mb-5">최근 식비 변동 그래프</span>
          <div className="flex items-end justify-between h-28 gap-2">
            {graphData.map((d, idx) => {
              const heightPct = Math.max((d.amount / maxAmount) * 100, 2);
              return (
                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-[10px] text-muted-foreground font-semibold mb-1.5 whitespace-nowrap">
                    {d.amount > 0 ? d.amount.toLocaleString() : "0"}
                  </span>
                  <div className="w-full bg-muted/40 rounded-t-lg h-full relative flex items-end p-0 md:p-[2px] overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                      className={cn(
                        "w-full rounded-t-md",
                        idx === graphData.length - 1 ? "bg-primary" : "bg-primary/30"
                      )}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-foreground mt-2">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  count,
  amount,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  amount: number;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div>
        <span className="text-sm font-extrabold text-foreground">{count}개</span>
        <span className="text-[11px] font-semibold text-muted-foreground ml-1">/ {amount.toLocaleString()}원</span>
      </div>
    </div>
  );
}
