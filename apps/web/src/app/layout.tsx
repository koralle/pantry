import type { ReactNode } from "react";

import {
  shellRoot,
  skipLink,
  shellBody,
  shellMain,
} from "../features/app-shell/styles";

export interface LayoutProps {
  renderHeader: () => ReactNode;
  renderSideBar: () => ReactNode;
  renderBottomTab: () => ReactNode;
  children: ReactNode;
}

export const Layout = ({
  renderHeader,
  renderSideBar,
  renderBottomTab,
  children,
}: LayoutProps) => (
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
