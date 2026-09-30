import type { ReactNode, SVGProps } from "react";

export type AppIconName = "camera" | "image" | "home" | "scan" | "history" | "user" | "chevron" | "arrow" | "check" | "edit" | "info" | "activity" | "utensils" | "close" | "clock" | "trash";

const paths: Record<AppIconName, ReactNode> = {
  camera: <><path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.25"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 3-4 5 6"/></>,
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3M7 12h10"/></>,
  history: <><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  edit: <><path d="m14 5 5 5"/><path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-4L4 16v4Z"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
  utensils: <><path d="M7 3v7m-3-7v4a3 3 0 0 0 6 0V3m-3 7v11M17 3v18m0-18c2 2 3 5 3 8h-3"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  trash: <><path d="M4 7h16m-10-3h4m-8 3 1 13h10l1-13M10 11v5m4-5v5"/></>,
};

export function AppIcon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: AppIconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false" {...props}>{paths[name]}</svg>;
}
