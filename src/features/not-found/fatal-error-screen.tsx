import { RotateCw, ServerCrash } from "lucide-react";
import { cx } from "styled-system/css";

import { StyledButton } from "../../shared/components/styled-button";
import {
  fatalScreen,
  stateActions,
  stateCenter,
  stateIcon,
  stateIconDanger,
  stateSub,
  stateTitle,
} from "./not-found-screen/styles";

/** シェル無しの致命的エラー。アプリ自体が起動できない場合の全画面表示。 */
export const FatalErrorScreen = ({
  onReload,
}: {
  readonly onReload?: () => void;
}) => (
  <div className={fatalScreen}>
    <div className={stateCenter}>
      <span className={cx(stateIcon, stateIconDanger)}>
        <ServerCrash size={26} aria-hidden />
      </span>
      <p className={stateTitle}>問題が発生しました</p>
      <p className={stateSub}>
        予期しないエラーが発生しました。再読み込みしても直らない場合は、しばらく待ってからお試しください。
      </p>
      <div className={stateActions}>
        <StyledButton
          onPress={() => {
            if (onReload !== undefined) {
              onReload();
              return;
            }
            window.location.reload();
          }}
          size="sm"
          visual="accent"
        >
          <RotateCw size={14} aria-hidden /> 再読み込み
        </StyledButton>
      </div>
    </div>
  </div>
);
