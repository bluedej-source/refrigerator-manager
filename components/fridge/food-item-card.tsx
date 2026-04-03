"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  CheckCircle2,
  Milk,
  Beef,
  Carrot,
  Apple,
  Coffee,
  ChefHat,
  Cookie,
  Utensils,
  Snowflake,
  Package,
  Thermometer,
  Wind,
  Home,
} from "lucide-react";
import type { FoodItem, Category, StorageType } from "@/lib/types";
import {
  getDaysUntilExpiry,
  getExpiryStatus,
  getFreshnessPercent,
  CATEGORY_LABELS,
  STORAGE_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  dairy: Milk,
  meat: Beef,
  vegetable: Carrot,
  fruit: Apple,
  beverage: Coffee,
  condiment: ChefHat,
  snack: Cookie,
  cooked: Utensils,
  frozen: Snowflake,
  other: Package,
};

const STORAGE_ICONS: Record<StorageType, React.ElementType> = {
  fridge: Thermometer,
  freezer: Snowflake,
  pantry: Home,
};

interface FoodItemCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
}

export function FoodItemCard({ item, onDelete, onConsume }: FoodItemCardProps) {
  const days = getDaysUntilExpiry(item.expiryDate);
  const status = getExpiryStatus(item.expiryDate);
  const freshness = getFreshnessPercent(item.addedDate, item.expiryDate);
  const CategoryIcon = CATEGORY_ICONS[item.category];
  const StorageIcon = STORAGE_ICONS[item.storageType];

  const statusConfig = {
    danger: {
      iconBg: "bg-danger-bg",
      iconColor: "text-danger",
      barColor: "bg-danger",
      badgeBg: "bg-danger-bg",
      badgeText: "text-danger",
      dayText:
        days < 0
          ? "만료됨"
          : days === 0
          ? "오늘 마감"
          : `D-${days}`,
    },
    warning: {
      iconBg: "bg-warning-bg",
      iconColor: "text-warning",
      barColor: "bg-warning",
      badgeBg: "bg-warning-bg",
      badgeText: "text-warning",
      dayText: `D-${days}`,
    },
    fresh: {
      iconBg: "bg-success-bg",
      iconColor: "text-success",
      barColor: "bg-success",
      badgeBg: "bg-success-bg",
      badgeText: "text-success",
      dayText: days > 30 ? `D-${days}` : `D-${days}`,
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: item.consumed ? 0 : 1, y: 0, scale: item.consumed ? 0.95 : 1 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-card rounded-2xl p-4 border border-border shadow-sm"
    >
      <div className="flex items-center gap-3">
        {/* Category Icon */}
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
            config.iconBg
          )}
        >
          <CategoryIcon className={cn("w-5 h-5", config.iconColor)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-bold text-foreground truncate">
              {item.name}
            </span>
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0",
                config.badgeBg,
                config.badgeText
              )}
            >
              {config.dayText}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[item.category]}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <div className="flex items-center gap-0.5">
              <StorageIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {STORAGE_LABELS[item.storageType]}
              </span>
            </div>
            {item.price && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {item.price.toLocaleString()}원
                </span>
              </>
            )}
          </div>

          {/* Freshness Bar */}
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${freshness}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className={cn("h-full rounded-full", config.barColor)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <button
          onClick={() => onConsume(item.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          다 먹었어요
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-danger-bg hover:text-danger transition-colors"
          aria-label="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface FilterTab {
  key: "all" | "danger" | "warning" | "fresh";
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: "all", label: "전체" },
  { key: "danger", label: "위험" },
  { key: "warning", label: "주의" },
  { key: "fresh", label: "신선" },
];

type FilterType = "all" | "danger" | "warning" | "fresh";

interface ItemListProps {
  items: FoodItem[];
  filter?: FilterType;
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
}

export function ItemList({ items, filter = "all", onDelete, onConsume }: ItemListProps) {
  const dangerItems = items.filter((i) => getExpiryStatus(i.expiryDate) === "danger");
  const warningItems = items.filter((i) => getExpiryStatus(i.expiryDate) === "warning");
  const freshItems = items.filter((i) => getExpiryStatus(i.expiryDate) === "fresh");

  const showDanger = filter === "all" || filter === "danger";
  const showWarning = filter === "all" || filter === "warning";
  const showFresh = filter === "all" || filter === "fresh";

  const visibleCount =
    (showDanger ? dangerItems.length : 0) +
    (showWarning ? warningItems.length : 0) +
    (showFresh ? freshItems.length : 0);

  return (
    <div className="space-y-6 px-4 py-4">
      {/* Danger Section */}
      {showDanger && dangerItems.length > 0 && (
        <ItemSection
          title="곧 만료돼요"
          subtitle="2일 이내"
          titleColor="text-danger"
          items={dangerItems}
          onDelete={onDelete}
          onConsume={onConsume}
        />
      )}

      {/* Warning Section */}
      {showWarning && warningItems.length > 0 && (
        <ItemSection
          title="주의하세요"
          subtitle="3~5일 이내"
          titleColor="text-warning"
          items={warningItems}
          onDelete={onDelete}
          onConsume={onConsume}
        />
      )}

      {/* Fresh Section */}
      {showFresh && freshItems.length > 0 && (
        <ItemSection
          title="신선해요"
          subtitle="6일 이상"
          titleColor="text-success"
          items={freshItems}
          onDelete={onDelete}
          onConsume={onConsume}
        />
      )}

      {visibleCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          {items.length === 0 ? (
            <>
              <p className="text-base font-bold text-foreground mb-1">
                냉장고가 비어있어요
              </p>
              <p className="text-sm text-muted-foreground">
                아래 + 버튼을 눌러 식품을 추가해보세요
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-foreground mb-1">
                해당하는 식품이 없어요
              </p>
              <p className="text-sm text-muted-foreground">
                다른 필터를 선택해보세요
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ItemSection({
  title,
  subtitle,
  titleColor,
  items,
  onDelete,
  onConsume,
}: {
  title: string;
  subtitle: string;
  titleColor: string;
  items: FoodItem[];
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className={cn("text-base font-bold", titleColor)}>{title}</h2>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {items.map((item) => (
            <FoodItemCard
              key={item.id}
              item={item}
              onDelete={onDelete}
              onConsume={onConsume}
            />
          ))}
        </div>
      </AnimatePresence>
    </section>
  );
}
