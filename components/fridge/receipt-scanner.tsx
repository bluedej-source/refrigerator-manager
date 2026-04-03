"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import type { FoodItem, Category, StorageType } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

interface ParsedItem {
  name: string;
  price: number | null;
  qty: number;
}

interface ParsedReceipt {
  items: ParsedItem[];
  total: number | null;
  storeName: string | null;
  date: string | null;
}

// 이름 키워드로 카테고리 자동 추정
function guessCategory(name: string): Category {
  const n = name.toLowerCase();
  if (/우유|치즈|요거트|버터|크림|두유/.test(n)) return "dairy";
  if (/돼지|닭|소고기|삼겹|갈비|참치|고등어|연어|새우|오징어|멸치/.test(n)) return "meat";
  if (/배추|무|당근|파|양파|마늘|브로콜리|감자|고구마|토마토|오이|상추/.test(n)) return "vegetable";
  if (/사과|배|딸기|포도|바나나|귤|오렌지|수박|참외/.test(n)) return "fruit";
  if (/콜라|사이다|주스|물|음료|커피|녹차|맥주|막걸리/.test(n)) return "beverage";
  if (/간장|된장|고추장|소금|설탕|식용유|식초|케첩|마요네즈/.test(n)) return "condiment";
  if (/과자|초콜릿|사탕|쿠키|라면|떡|빵|아이스크림/.test(n)) return "snack";
  if (/냉동|만두|피자|돈까스/.test(n)) return "frozen";
  if (/김밥|도시락|샐러드|볶음|국|찌개/.test(n)) return "cooked";
  return "other";
}

// 카테고리별 기본 유통기한(일수)
function defaultExpiryDays(category: Category): number {
  const map: Record<Category, number> = {
    dairy: 7,
    meat: 3,
    vegetable: 5,
    fruit: 7,
    beverage: 30,
    condiment: 90,
    snack: 30,
    cooked: 3,
    frozen: 90,
    other: 7,
  };
  return map[category];
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

interface ReceiptScannerProps {
  onAddItems: (items: Omit<FoodItem, "id">[]) => void;
}

type ScanState = "idle" | "uploading" | "analyzing" | "result" | "error";

export function ReceiptScanner({ onAddItems }: ReceiptScannerProps) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");
  const [added, setAdded] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("이미지 파일만 업로드할 수 있어요.");
      setScanState("error");
      return;
    }

    // preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setScanState("uploading");
    await new Promise((r) => setTimeout(r, 400));
    setScanState("analyzing");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "분석에 실패했어요.");
      }

      const data: ParsedReceipt = await res.json();

      if (!data.items || data.items.length === 0) {
        setErrorMsg("식품 항목을 찾을 수 없어요. 영수증이 선명하게 촬영됐는지 확인해 주세요.");
        setScanState("error");
        return;
      }

      setParsed(data);
      setSelected(new Set(data.items.map((_, i) => i)));
      setScanState("result");
    } catch (err: any) {
      setErrorMsg(err.message || "영수증 분석 중 오류가 발생했어요. 다시 시도해 주세요.");
      setScanState("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAddToFridge = () => {
    if (!parsed) return;
    const toAdd: Omit<FoodItem, "id">[] = [];
    parsed.items.forEach((item, idx) => {
      if (!selected.has(idx)) return;
      const category = guessCategory(item.name);
      const expiryDays = defaultExpiryDays(category);
      for (let q = 0; q < item.qty; q++) {
        toAdd.push({
          name: item.name,
          category,
          expiryDate: addDays(expiryDays),
          storageType: category === "frozen" ? "freezer" : "fridge",
          price: item.price ?? undefined,
          addedDate: new Date().toISOString().split("T")[0],
        });
      }
    });
    onAddItems(toAdd);
    setAdded(true);
    setTimeout(() => {
      setScanState("idle");
      setParsed(null);
      setPreviewUrl(null);
      setSelected(new Set());
      setAdded(false);
    }, 1800);
  };

  const reset = () => {
    setScanState("idle");
    setParsed(null);
    setPreviewUrl(null);
    setSelected(new Set());
    setErrorMsg("");
    setAdded(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
      className="bg-primary rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
            <Receipt className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-foreground/75">영수증 스캔</p>
            <p className="text-sm font-bold text-primary-foreground">사진으로 식품 추가</p>
          </div>
        </div>
        {scanState !== "idle" && (
          <button
            onClick={reset}
            className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
            aria-label="초기화"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="px-5 pb-5">
        <AnimatePresence mode="wait">
          {/* Idle - Upload Zone */}
          {scanState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-xs text-primary-foreground/75 mb-3 leading-relaxed">
                마트 영수증을 찍어서 올리면 AI가 식품 목록을 자동으로 인식해 냉장고에 추가해 드려요.
              </p>
              {/* 두 버튼: 카메라 촬영 / 갤러리 선택 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 카메라 촬영 */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-dashed border-primary/40 bg-card hover:border-primary hover:bg-secondary/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary">카메라 촬영</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">지금 바로 찍기</p>
                  </div>
                </button>

                {/* 갤러리 첨부 */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-dashed border-primary/40 bg-card hover:border-primary hover:bg-secondary/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary">이미지 첨부</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">갤러리에서 선택</p>
                  </div>
                </button>
              </div>

              <p className="flex items-center justify-center gap-1 mt-2 text-[10px] text-primary-foreground/60">
                <Upload className="w-3 h-3" />
                JPG, PNG, HEIC 지원
              </p>

              {/* 카메라 전용 input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              {/* 갤러리 전용 input (capture 없음) */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </motion.div>
          )}

          {/* Uploading / Analyzing */}
          {(scanState === "uploading" || scanState === "analyzing") && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              {previewUrl && (
                <div className="w-24 h-32 rounded-xl overflow-hidden border border-primary-foreground/30 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="영수증 미리보기" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
                <p className="text-sm font-semibold text-primary-foreground">
                  {scanState === "uploading" ? "이미지 업로드 중..." : "AI가 영수증을 분석하는 중..."}
                </p>
                <p className="text-xs text-primary-foreground/65">잠깐만 기다려 주세요</p>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {scanState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-sm font-semibold text-primary-foreground text-center">{errorMsg}</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary-foreground/15 rounded-xl text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/25 transition-colors"
              >
                다시 시도
              </button>
            </motion.div>
          )}

          {/* Result */}
          {scanState === "result" && parsed && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Receipt meta */}
              {(parsed.storeName || parsed.date) && (
                <div className="flex items-center justify-between text-xs text-primary-foreground/75 bg-primary-foreground/10 rounded-xl px-3 py-2">
                  <span className="font-medium">{parsed.storeName ?? "마트"}</span>
                  {parsed.date && <span>{parsed.date}</span>}
                </div>
              )}

              {/* Item list */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {parsed.items.map((item, idx) => {
                  const isSelected = selected.has(idx);
                  const cat = guessCategory(item.name);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-primary-foreground/40 bg-primary-foreground/15"
                          : "border-primary-foreground/15 bg-primary-foreground/5 opacity-60"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "border-primary-foreground bg-primary-foreground"
                          : "border-primary-foreground/40"
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary-foreground truncate">{item.name}</p>
                        <p className="text-xs text-primary-foreground/65">
                          {CATEGORY_LABELS[cat]} · 수량 {item.qty}
                        </p>
                      </div>
                      {item.price != null && (
                        <span className="text-xs font-bold text-primary-foreground flex-shrink-0">
                          {(item.price * item.qty).toLocaleString()}원
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Summary & CTA */}
              <div className="pt-2 border-t border-primary-foreground/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-primary-foreground/65">
                    {selected.size}개 선택됨
                  </p>
                  {parsed.total != null && (
                    <p className="text-xs text-primary-foreground/65">
                      합계 <span className="font-bold text-primary-foreground">{parsed.total.toLocaleString()}원</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={handleAddToFridge}
                  disabled={selected.size === 0 || added}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground"
                >
                  {added ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      냉장고에 추가됐어요!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      선택한 {selected.size}개 냉장고에 추가
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
