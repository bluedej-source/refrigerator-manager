"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, Tag, Archive, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import type { Category, StorageType } from "@/lib/types";
import { CATEGORY_LABELS, STORAGE_LABELS } from "@/lib/types";
import type { AddItemInput } from "@/hooks/use-fridge";
import { cn } from "@/lib/utils";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: AddItemInput) => void;
}

const CATEGORIES: Category[] = [
  "dairy",
  "meat",
  "vegetable",
  "fruit",
  "beverage",
  "condiment",
  "snack",
  "cooked",
  "frozen",
  "other",
];

const STORAGE_TYPES: StorageType[] = ["fridge", "freezer", "pantry"];

const STORAGE_LABELS_KO: Record<StorageType, string> = {
  fridge: "냉장",
  freezer: "냉동",
  pantry: "실온",
};

export function AddItemModal({ open, onClose, onAdd }: AddItemModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("dairy");
  const [expiryYear, setExpiryYear] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryDay, setExpiryDay] = useState("");
  const [storageType, setStorageType] = useState<StorageType>("fridge");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const calPopoverRef = useRef<HTMLDivElement>(null);

  const [showCal, setShowCal] = useState(false);
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth()); // 0-indexed

  // 팝오버 외부 클릭 시 닫기
  useEffect(() => {
    if (!showCal) return;
    const handler = (e: MouseEvent) => {
      if (calPopoverRef.current && !calPopoverRef.current.contains(e.target as Node)) {
        setShowCal(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCal]);

  const expiryDate =
    expiryYear && expiryMonth && expiryDay
      ? `${expiryYear}-${expiryMonth.padStart(2, "0")}-${expiryDay.padStart(2, "0")}`
      : "";

  const today = todayDate.toISOString().split("T")[0];

  // Calendar grid: days of the month with leading/trailing blanks
  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const handleCalSelect = (day: number) => {
    setExpiryYear(String(calYear));
    setExpiryMonth(String(calMonth + 1).padStart(2, "0"));
    setExpiryDay(String(day).padStart(2, "0"));
    setError("");
    setShowCal(false);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const DAY_NAMES = ["일","월","화","수","목","금","토"];

  const reset = () => {
    setName("");
    setCategory("dairy");
    setExpiryYear("");
    setExpiryMonth("");
    setExpiryDay("");
    setCalYear(todayDate.getFullYear());
    setCalMonth(todayDate.getMonth());
    setStorageType("fridge");
    setPrice("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("식품 이름을 입력해주세요.");
      return;
    }
    if (!expiryDate) {
      setError("유통기한을 선택해주세요.");
      return;
    }
    onAdd({
      name: name.trim(),
      category,
      expiryDate,
      storageType,
      price: price ? Number(price.replace(/,/g, "")) : undefined,
    });
    handleClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 pt-3 pb-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-foreground">
                  식품 추가
                </h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-border transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-danger-bg text-danger text-sm font-medium px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              {/* Item Name */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  식품 이름
                </label>
                <input
                  type="text"
                  lang="ko"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="예) 서울우유 1L, 삼겹살 500g"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Archive className="w-3.5 h-3.5" />
                  카테고리
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                        category === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-border"
                      )}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  유통기한
                </label>
                {/* Date inputs + calendar icon */}
                <div className="relative flex items-center gap-2" ref={calPopoverRef}>
                  {/* Year */}
                  <input
                    type="number"
                    value={expiryYear}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 4);
                      setExpiryYear(val);
                      setError("");
                      if (val.length === 4) {
                        monthRef.current?.focus();
                        monthRef.current?.select();
                      }
                    }}
                    placeholder="연도"
                    min={new Date().getFullYear()}
                    max={9999}
                    className="w-24 px-3 py-3 rounded-xl border border-border bg-muted text-foreground text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-muted-foreground font-bold">-</span>
                  {/* Month */}
                  <input
                    ref={monthRef}
                    type="number"
                    value={expiryMonth}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 2);
                      setExpiryMonth(val);
                      setError("");
                      if (val.length === 2) {
                        dayRef.current?.focus();
                        dayRef.current?.select();
                      }
                    }}
                    placeholder="월"
                    min={1}
                    max={12}
                    className="w-16 px-3 py-3 rounded-xl border border-border bg-muted text-foreground text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-muted-foreground font-bold">-</span>
                  {/* Day */}
                  <input
                    ref={dayRef}
                    type="number"
                    value={expiryDay}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 2);
                      setExpiryDay(val);
                      setError("");
                    }}
                    placeholder="일"
                    min={1}
                    max={31}
                    className="w-16 px-3 py-3 rounded-xl border border-border bg-muted text-foreground text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />

                  {/* Calendar icon button */}
                  <button
                    type="button"
                    onClick={() => setShowCal((v) => !v)}
                    className={cn(
                      "w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all",
                      showCal
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-muted border-border text-muted-foreground hover:border-primary hover:text-primary"
                    )}
                    aria-label="달력으로 날짜 선택"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>

                  {/* Popover calendar */}
                  <AnimatePresence>
                    {showCal && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-12 left-0 z-50 w-72 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
                      >
                        {/* Cal header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                          <button
                            type="button"
                            onClick={prevMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                            aria-label="이전 달"
                          >
                            <ChevronLeft className="w-4 h-4 text-foreground" />
                          </button>
                          <span className="text-sm font-bold text-foreground">
                            {calYear}년 {MONTH_NAMES[calMonth]}
                          </span>
                          <button
                            type="button"
                            onClick={nextMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                            aria-label="다음 달"
                          >
                            <ChevronRight className="w-4 h-4 text-foreground" />
                          </button>
                        </div>
                        {/* Day names */}
                        <div className="grid grid-cols-7">
                          {DAY_NAMES.map((d, i) => (
                            <div
                              key={d}
                              className={cn(
                                "py-2 text-center text-xs font-semibold",
                                i === 0 ? "text-danger" : i === 6 ? "text-primary" : "text-muted-foreground"
                              )}
                            >
                              {d}
                            </div>
                          ))}
                        </div>
                        {/* Date cells */}
                        <div className="grid grid-cols-7 gap-y-0.5 p-2">
                          {calDays.map((day, idx) => {
                            if (!day) return <div key={`blank-${idx}`} />;
                            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const isPast = dateStr < today;
                            const isSelected =
                              expiryYear === String(calYear) &&
                              expiryMonth === String(calMonth + 1).padStart(2, "0") &&
                              expiryDay === String(day).padStart(2, "0");
                            const isSunday = idx % 7 === 0;
                            const isSaturday = idx % 7 === 6;
                            return (
                              <button
                                key={day}
                                type="button"
                                disabled={isPast}
                                onClick={() => handleCalSelect(day)}
                                className={cn(
                                  "aspect-square w-full flex items-center justify-center rounded-full text-xs font-medium transition-all",
                                  isSelected ? "bg-primary text-primary-foreground font-bold"
                                    : isPast ? "text-muted-foreground/40 cursor-not-allowed"
                                    : isSunday ? "text-danger hover:bg-danger-bg"
                                    : isSaturday ? "text-primary hover:bg-secondary"
                                    : "text-foreground hover:bg-muted"
                                )}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Storage Type */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  보관 방법
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STORAGE_TYPES.map((st) => (
                    <button
                      key={st}
                      onClick={() => setStorageType(st)}
                      className={cn(
                        "py-3 rounded-xl text-sm font-semibold transition-all",
                        storageType === st
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-border"
                      )}
                    >
                      {STORAGE_LABELS_KO[st]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price (Optional) */}
              <div className="mb-8">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Wallet className="w-3.5 h-3.5" />
                  가격 <span className="normal-case font-normal">(선택)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    원
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all"
              >
                <Plus className="w-5 h-5" />
                냉장고에 추가하기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
