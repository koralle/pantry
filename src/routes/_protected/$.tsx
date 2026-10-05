import { createFileRoute } from "@tanstack/react-router";

import { AppHeader } from "../../app/header";
import { Layout } from "../../app/layout";
import { SideBar } from "../../app/sidebar";
import { BottomTabs } from "../../features/app-shell/components/bottom-tabs";
import { NotFoundScreen } from "../../features/not-found/not-found-screen";

export const Route = createFileRoute("/_protected/$")({
  component: () => (
    <Layout
      renderBottomTab={() => <BottomTabs />}
      renderHeader={() => <AppHeader />}
      renderSideBar={() => <SideBar />}
    >
      <NotFoundScreen />
    </Layout>
  ),
});
