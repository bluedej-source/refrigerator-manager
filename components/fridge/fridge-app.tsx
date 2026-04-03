"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListChecks, BarChart2, Loader2 } from "lucide-react";
import { useFridge } from "@/hooks/use-fridge";
import type { FoodItem } from "@/lib/types";
import { DashboardHeader } from "@/components/fridge/dashboard-header";
import { ItemList } from "@/components/fridge/food-item-card";
import { AddItemModal } from "@/components/fridge/add-item-modal";
import { SavingsReport } from "@/components/fridge/savings-report";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { FilterType } from "@/components/fridge/dashboard-header";

type Tab = "list" | "report";

export function FridgeApp() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsGuest(!user);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const {
    items,
    loading,
    addItem,
    addItems,
    updateItem,
    deleteItem,
    consumeItem,
    syncTossPay,
    consumedThisMonthCount,
    consumedThisMonthAmount,
    wastedThisMonthCount,
    wastedThisMonthAmount,
    thisMonthExpensesCount,
    thisMonthExpensesAmount,
    last3MonthsExpenses,
  } = useFridge();

  if (loading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center max-w-md mx-auto shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">냉장고를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card flex flex-col max-w-md mx-auto relative shadow-xl">
      {/* Sticky Header — client-only, no SSR mismatch */}
      <DashboardHeader
        items={items}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeTab={activeTab}
        onTabToggle={() => setActiveTab((prev) => prev === "list" ? "report" : "list")}
        onAlertClick={() => {
          setActiveTab("list");
          setActiveFilter("danger");
        }}
        onLogout={handleLogout}
        isGuest={isGuest}
      />

      {/* Tab Navigation */}
      <div className="flex items-center bg-card border-b border-border px-4 gap-1 sticky top-[145px] z-30">
        <TabButton
          active={activeTab === "list"}
          onClick={() => setActiveTab("list")}
          icon={<ListChecks className="w-4 h-4" />}
          label="식품 목록"
        />
        <TabButton
          active={activeTab === "report"}
          onClick={() => setActiveTab("report")}
          icon={<BarChart2 className="w-4 h-4" />}
          label="절약 리포트"
        />
      </div>

      {/* Content */}
      <main className="flex-1 pb-28 overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
            >
              <ItemList
                items={items}
                filter={activeFilter}
                onDelete={deleteItem}
                onConsume={consumeItem}
                onEdit={(id) => {
                  const found = items.find((i) => i.id === id);
                  if (found) { setEditingItem(found); setModalOpen(true); }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="report"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SavingsReport
                consumedThisMonthCount={consumedThisMonthCount}
                consumedThisMonthAmount={consumedThisMonthAmount}
                wastedThisMonthCount={wastedThisMonthCount}
                wastedThisMonthAmount={wastedThisMonthAmount}
                thisMonthExpensesCount={thisMonthExpensesCount}
                thisMonthExpensesAmount={thisMonthExpensesAmount}
                last3MonthsExpenses={last3MonthsExpenses}
                onSyncTossPay={syncTossPay}
                onAddItems={addItems}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 pointer-events-none">
        <div className="flex justify-end pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setModalOpen(true)}
            className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            aria-label="식품 추가"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent pointer-events-none max-w-md mx-auto" />

      <AddItemModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onAdd={addItem}
        editItem={editingItem ?? undefined}
        onUpdate={updateItem}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
