"use client";

import { useState, useCallback, useEffect } from "react";
import type { FoodItem, Category, StorageType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const fmt = (d: Date) => d.toISOString().split("T")[0];
const today = new Date();
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export interface AddItemInput {
  name: string;
  category: Category;
  expiryDate: string;
  storageType: StorageType;
  price?: number;
}

// Supabase row -> FoodItem
function rowToItem(row: Record<string, unknown>): FoodItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Category,
    expiryDate: row.expiry_date as string,
    storageType: row.storage_type as StorageType,
    price: row.price as number | undefined,
    addedDate: (row.created_at as string).split("T")[0],
    consumed: !!row.consumed,
    wasted: !!row.wasted,
  };
}

export function useFridge() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 초기 데이터 로드
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // 비로그인 상태: 빈 목록으로 시작
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("food_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[v0] food_items fetch error:", error.code, error.message);
      }
      if (!error && data) {
        setItems(data.map(rowToItem));
      }
      setLoading(false);
    };

    fetchItems();

    // Realtime 구독
    const channel = supabase
      .channel("food_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_items" }, fetchItems)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addItem = useCallback(async (input: AddItemInput) => {
    const { data: { user } } = await supabase.auth.getUser();

    // 낙관적 업데이트: 먼저 로컬에 추가
    const tempId = crypto.randomUUID();
    const optimisticItem: FoodItem = {
      id: tempId,
      name: input.name,
      category: input.category,
      expiryDate: input.expiryDate,
      storageType: input.storageType,
      price: input.price,
      addedDate: fmt(new Date()),
    };
    setItems((prev) => [optimisticItem, ...prev]);

    // 비로그인: 로컬 메모리에만 저장
    if (!user) return;

    const { data, error } = await supabase
      .from("food_items")
      .insert({
        user_id: user.id,
        name: input.name,
        category: input.category,
        expiry_date: input.expiryDate,
        storage_type: input.storageType,
        price: input.price ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("[v0] food_items insert error:", error.code, error.message);
      // DB 저장 실패해도 화면에는 유지 (낙관적 업데이트 롤백 안 함)
      return;
    }

    if (data) {
      // tempId를 실제 DB id로 교체
      setItems((prev) =>
        prev.map((item) => (item.id === tempId ? rowToItem(data) : item))
      );
    }
  }, []);

  const addItems = useCallback(async (inputs: Omit<FoodItem, "id">[]) => {
    const { data: { user } } = await supabase.auth.getUser();

    // 비로그인: 로컬 메모리에만 저장
    if (!user) {
      const localItems: FoodItem[] = inputs.map((input) => ({
        ...input,
        id: crypto.randomUUID(),
        addedDate: input.addedDate ?? fmt(new Date()),
      }));
      setItems((prev) => [...localItems, ...prev]);
      return;
    }

    const rows = inputs.map((input) => ({
      user_id: user.id,
      name: input.name,
      category: input.category,
      expiry_date: input.expiryDate,
      storage_type: input.storageType,
      price: input.price ?? null,
    }));

    const { data, error } = await supabase
      .from("food_items")
      .insert(rows)
      .select();

    if (!error && data) {
      setItems((prev) => [...data.map(rowToItem), ...prev]);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, wasted: true } : item))
    );
    setTimeout(async () => {
      await supabase.from("food_items").update({ wasted: true }).eq("id", id);
    }, 600);
  }, []);

  const consumeItem = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, consumed: true } : item))
    );
    setTimeout(async () => {
      await supabase.from("food_items").update({ consumed: true }).eq("id", id);
    }, 600);
  }, []);

  const syncTossPay = useCallback(async () => {
    const tossItems: Omit<FoodItem, "id">[] = [
      {
        name: "풀무원 생면식감 칼국수",
        category: "cooked",
        expiryDate: fmt(addDays(today, 7)),
        storageType: "fridge",
        price: 4200,
        addedDate: fmt(today),
      },
      {
        name: "그릭요거트 400g",
        category: "dairy",
        expiryDate: fmt(addDays(today, 14)),
        storageType: "fridge",
        price: 6500,
        addedDate: fmt(today),
      },
    ];
    await addItems(tossItems);
  }, [addItems]);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const consumedItemsThisMonth = items.filter((item) => item.consumed && item.addedDate?.startsWith(thisMonth));
  const consumedThisMonthCount = consumedItemsThisMonth.length;
  const consumedThisMonthAmount = consumedItemsThisMonth.reduce((sum, item) => sum + (item.price ?? 0), 0);

  const wastedItemsThisMonth = items.filter((item) => item.wasted && item.addedDate?.startsWith(thisMonth));
  const wastedThisMonthCount = wastedItemsThisMonth.length;
  const wastedThisMonthAmount = wastedItemsThisMonth.reduce((sum, item) => sum + (item.price ?? 0), 0);

  const thisMonthItems = items.filter((item) => item.addedDate?.startsWith(thisMonth));
  const thisMonthExpensesCount = thisMonthItems.length;
  const thisMonthExpensesAmount = thisMonthItems.reduce((sum, item) => sum + (item.price ?? 0), 0);

  const last3MonthsExpenses = Array.from({ length: 3 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const displayMonth = `${d.getMonth() + 1}월`;
    const monthItems = items.filter((item) => item.addedDate?.startsWith(monthStr));
    return {
      month: displayMonth,
      count: monthItems.length,
      amount: monthItems.reduce((sum, item) => sum + (item.price ?? 0), 0),
    };
  });

  const activeItems = items.filter((item) => !item.consumed && !item.wasted);

  return {
    items: activeItems,
    loading,
    addItem,
    addItems,
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
  };
}
