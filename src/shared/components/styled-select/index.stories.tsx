import { Meta, StoryObj } from '@storybook/tanstack-react'
import { styled } from 'styled-system/jsx'

import { StyledSelect } from './'

const sortItems = (
  <>
    <StyledSelect.Item id='newest'>新しい順</StyledSelect.Item>
    <StyledSelect.Item id='updated'>更新順</StyledSelect.Item>
  </>
)

const meta = {
  title: 'Components / StyledSelect',
  component: StyledSelect,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    label: '並び',
    children: sortItems
  }
} satisfies Meta<typeof StyledSelect>

export default meta

type Story = StoryObj<typeof meta>

export const Default = {
  args: {
    defaultSelectedKey: 'newest'
  },
  render: (args) => (
    <styled.div
      minInlineSize='[100svi]'
      minBlockSize='[100svb]'
      display='grid'
      placeContent='center'>
      <StyledSelect {...args} />
    </styled.div>
  )
} as const satisfies Story

export const Placeholder = {
  args: {
    label: 'タグを追加',
    placeholder: '選択…',
    selectedKey: null,
    children: (
      <>
        <StyledSelect.Item id='reading'>reading</StyledSelect.Item>
        <StyledSelect.Item id='work'>work</StyledSelect.Item>
      </>
    )
  },
  render: (args) => (
    <styled.div
      minInlineSize='[100svi]'
      minBlockSize='[100svb]'
      display='grid'
      placeContent='center'>
      <StyledSelect {...args} />
    </styled.div>
  )
} as const satisfies Story

const filterableItems = (
  <>
    <StyledSelect.Item id='reading'>reading</StyledSelect.Item>
    <StyledSelect.Item id='work'>work</StyledSelect.Item>
    <StyledSelect.Item id='design'>design</StyledSelect.Item>
    <StyledSelect.Item id='typescript'>typescript</StyledSelect.Item>
    <StyledSelect.Item id='cloudflare'>cloudflare</StyledSelect.Item>
    <StyledSelect.Item id='recipe'>recipe</StyledSelect.Item>
  </>
)

export const Filterable = {
  render: () => (
    <styled.div
      minInlineSize='[100svi]'
      minBlockSize='[100svb]'
      display='grid'
      placeContent='center'>
      <StyledSelect.Filterable
        label='タグを追加'
        placeholder='選択…'
        searchPlaceholder='タグを検索'
        selectedKey={null}>
        {filterableItems}
      </StyledSelect.Filterable>
    </styled.div>
  )
} as const satisfies Story
