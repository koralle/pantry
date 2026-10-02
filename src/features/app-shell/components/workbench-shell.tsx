/**
 * @file workbench-shell.tsx
 *
 * Input:    workbench top bar + focused-flow content
 * Output:   WorkbenchShell component
 * Position: 集中フロー（登録・クイック追加・編集）のシェル。ヘッダーだけ差し替え、
 *           レールと下部タブは出さない
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./app-shell.tsx (frame)
 * - ./workbench-bar.tsx (header)
 * - ../styles.ts (workbenchScreen)
 */

import type { ReactElement, ReactNode } from "react";

import { workbenchScreen } from "../styles";
import { AppShell } from "./app-shell";

export interface WorkbenchShellProps {
  readonly header: ReactElement;
  readonly children: ReactNode;
}

export const WorkbenchShell = ({ header, children }: WorkbenchShellProps) => (
  <AppShell
    renderBottomTab={() => null}
    renderHeader={() => header}
    renderSideBar={() => null}
  >
    <div className={workbenchScreen}>{children}</div>
  </AppShell>
);
