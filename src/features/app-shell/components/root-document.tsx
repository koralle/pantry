import { HeadContent, Scripts } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { ReactNode } from "react";

const RootDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const { RootDevtools: Devtools } = await import("./root-devtools");
      return { default: Devtools };
    })
  : () => null;

export const RootDocument = ({
  children,
}: {
  readonly children: ReactNode;
}) => (
  <html lang="ja">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Pantry</title>
      {import.meta.env.DEV ? (
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      ) : null}
      <HeadContent />
    </head>
    <body>
      {children}
      {import.meta.env.DEV ? (
        <Suspense fallback={null}>
          <RootDevtools />
        </Suspense>
      ) : null}
      <Scripts />
    </body>
  </html>
);
