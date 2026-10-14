import { isCommonAssetRequest } from "msw";
import { setupWorker } from "msw/browser";
import { HttpNetworkFrame } from "msw/experimental";

/**
 * msw の `isCommonAssetRequest` が拾わない Storybook 固有のリクエスト
 * （仮想モジュール、React Refresh、docs の mdx など）を警告から除く。
 */
const storybookInternalRequest =
  /\/virtual:|@react-refresh|\.mdx$|sb-common-assets|sb-vite|__webpack_hmr/;

export const worker = setupWorker();

/**
 * 未処理の HTTP リクエストは警告として残す（`/api/rpc/*` を除外しないのは、
 * 未知の procedure を mock の不発と取り違えないため）。アプリは HTTP しか
 * 使わないので、WebSocket などの非 HTTP フレームは対象外にする。
 * `quiet` は起動メッセージとハンドラのログだけを抑え、この警告は消さない。
 */
export const startWorker = async (): Promise<void> => {
  await worker.start({
    onUnhandledFrame({ defaults, frame }) {
      if (!(frame instanceof HttpNetworkFrame)) {
        return;
      }

      const { request } = frame.data;

      if (
        isCommonAssetRequest(request) ||
        storybookInternalRequest.test(request.url)
      ) {
        return;
      }

      defaults.warn();
    },
    quiet: true,
  });
};
