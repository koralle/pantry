/**
 * @file app-shell.tsx
 *
 * Input:    header / side bar / bottom tab render props + page content
 * Output:   AppShell component
 * Position: Authenticated app chrome layout — renders the slots the caller
 *           provides (top bar, rail, bottom tabs, content)
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ../styles.ts (shell layout recipes)
 */

import type { ReactNode } from "react";

import { shellBody, shellMain, shellRoot, skipLink } from "../styles";

export interface AppShellProps {
  renderHeader: () => ReactNode;
  renderSideBar: () => ReactNode;
  renderBottomTab: () => ReactNode;
  children: ReactNode;
}

export const AppShell = ({
  renderHeader,
  renderSideBar,
  renderBottomTab,
  children,
}: AppShellProps) => (
  <div className={shellRoot}>
    <a className={skipLink} href="#content">
      本文へ
    </a>

    {renderHeader()}

    <div className={shellBody}>
      {renderSideBar()}

      <main
        className={shellMain}
        data-scroll-restoration-id="content"
        id="content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>

    {renderBottomTab()}
  </div>
);
