import dynamic from "next/dynamic";

export { type FilterType, type TabType } from "./dashboard-header";

export const DashboardHeaderClient = dynamic(
  () =>
    import("@/components/fridge/dashboard-header").then(
      (m) => m.DashboardHeader
    ),
  {
    ssr: false,
    loading: () => (
      <header className="bg-card border-b border-border sticky top-0 z-40 h-[145px]" />
    ),
  }
);
