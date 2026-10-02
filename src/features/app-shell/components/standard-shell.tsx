/**
 * @file standard-shell.tsx
 *
 * Input:    page content
 * Output:   StandardShell component
 * Position: 通常画面のシェル（トップバー + レール + 下部タブ）。画面側が明示的に選ぶ
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./app-shell.tsx (frame)
 * - ./app-header/, ./sidebar/, ./bottom-tabs.tsx (slots)
 */

import type { ReactNode } from "react";

import { AppHeader } from "./app-header";
import { AppShell } from "./app-shell";
import { BottomTabs } from "./bottom-tabs";
import { SideBar } from "./sidebar";

export interface StandardShellProps {
  readonly children: ReactNode;
}

export const StandardShell = ({ children }: StandardShellProps) => (
  <AppShell
    renderBottomTab={() => <BottomTabs />}
    renderHeader={() => <AppHeader />}
    renderSideBar={() => <SideBar />}
  >
    {children}
  </AppShell>
);
