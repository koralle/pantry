import { UiLoading } from '../../../shared/components/ui-loading'
import { entranceGrid } from './entrance-boxes-ideal'

export function EntranceLoading() {
  return (
    <div
      className={entranceGrid}
      aria-busy='true'>
      <UiLoading label='箱を読み込み中' />
      <UiLoading label='箱を読み込み中' />
      <UiLoading label='箱を読み込み中' />
      <UiLoading label='箱を読み込み中' />
    </div>
  )
}
