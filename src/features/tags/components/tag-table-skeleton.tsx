import { css, cx } from 'styled-system/css'

import { skeleton } from '../../../styles/feedback'
import { srOnly } from '../../../styles/sr-only'
import { tagTable, tagTableCell, tagTableHeader } from './tag-table'

const skeletonBase = css({
  display: 'block',
  borderWidth: 'none',
  padding: '0'
})

const skeletonDot = css({
  inlineSize: '3',
  blockSize: '3',
  borderRadius: 'full',
  minBlockSize: '0'
})

const skeletonName = css({
  inlineSize: 'min-10',
  minBlockSize: '4'
})

const skeletonCount = css({
  inlineSize: '8',
  minBlockSize: '4'
})

const skeletonPin = css({
  inlineSize: '10',
  minBlockSize: '4'
})

const skeletonAction = css({
  inlineSize: '10',
  minBlockSize: '4'
})

const nbsp = '\u00a0'

export function TagTableSkeleton() {
  return (
    <div aria-busy='true'>
      <span className={srOnly}>タグを読み込み中</span>
      <table
        className={tagTable}
        aria-hidden='true'>
        <thead>
          <tr>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              色
            </th>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              名前
            </th>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              件数
            </th>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              ピン
            </th>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              <span className={srOnly}>操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {['a', 'b', 'c', 'd', 'e'].map((row) => (
            <tr key={row}>
              <td className={cx(skeleton, skeletonBase, skeletonDot)}>{nbsp}</td>
              <td className={cx(skeleton, skeletonBase, skeletonName)}>{nbsp}</td>
              <td className={cx(skeleton, skeletonBase, skeletonCount)}>{nbsp}</td>
              <td className={cx(skeleton, skeletonBase, skeletonPin)}>{nbsp}</td>
              <td className={cx(skeleton, skeletonBase, skeletonAction)}>{nbsp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
