/**
 * @file nav-rail-route.tsx
 *
 * Input:    active view, tag filter names from the list search
 * Output:   NavRailRoute component
 * Position: Route-facing rail — resolves shelf tags and view counts inside
 *           its own Suspense/ErrorBoundary so the rest of the shell (and the
 *           routed page) never waits on rail data. Fallback renders the same
 *           items without counts/tags.
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./nav-rail.tsx (presentational rail it feeds)
 */

import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { orpc } from "../../../rpc/query";
import { tagNamesMatch } from "../../tags/domain/tag-values";
import type { ShellTag, ShellView } from "../lib/shell-nav";
import { NavRail } from "./nav-rail";

export interface NavRailRouteProps {
  view: ShellView;
  /** Normalized tag names from the active list filter — marks the rail tag. */
  filterTags?: readonly string[] | undefined;
}

const NavRailData = ({ view, filterTags }: NavRailRouteProps) => {
  const { data: shelf } = useSuspenseQuery(
    orpc.tags.shelf.queryOptions({ staleTime: 5000 })
  );
  const { data: counts } = useSuspenseQuery(
    orpc.bookmarks.counts.queryOptions({ staleTime: 5000 })
  );

  const tags: ShellTag[] = shelf.map((tag) => ({
    color: tag.color,
    count: tag.bookmarkCount,
    id: String(tag.id),
    name: tag.name,
  }));

  const primary = filterTags?.[0];
  const activeTagId =
    filterTags !== undefined && filterTags.length === 1 && primary !== undefined
      ? tags.find((tag) => tagNamesMatch(tag.name, primary))?.id
      : undefined;

  return (
    <NavRail
      activeTagId={activeTagId}
      counts={counts}
      tags={tags}
      view={view}
    />
  );
};

export const NavRailRoute = (props: NavRailRouteProps) => (
  <ErrorBoundary fallback={<NavRail view={props.view} />}>
    <Suspense fallback={<NavRail view={props.view} />}>
      <NavRailData {...props} />
    </Suspense>
  </ErrorBoundary>
);
