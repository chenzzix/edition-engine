import { LayoutSection } from '@/types'

export const TEMPLATES = {
  classic: {
    name: '经典三分法',
    description: '图左文右，瑞士风标准',
    desktop: (colWidth: number, margin: number): LayoutSection[] => [
      {
        id: 'image',
        type: 'image',
        x: margin,
        y: margin,
        width: colWidth * 6,
        height: colWidth * 6 * 0.75,
        columnSpan: 6
      },
      {
        id: 'title',
        type: 'text',
        x: margin + colWidth * 6.5 + 24,
        y: margin,
        width: colWidth * 5,
        height: 100,
        priority: 'title'
      },
      {
        id: 'subtitle',
        type: 'text',
        x: margin + colWidth * 6.5 + 24,
        y: margin + 140,
        width: colWidth * 5,
        height: 60,
        priority: 'subtitle'
      },
      {
        id: 'divider',
        type: 'divider',
        x: margin + colWidth * 6.5 + 24,
        y: margin + 220,
        width: colWidth * 5,
        height: 1
      },
      {
        id: 'body',
        type: 'text',
        x: margin + colWidth * 6.5 + 24,
        y: margin + 260,
        width: colWidth * 5,
        height: 200,
        priority: 'body'
      }
    ],
    mobile: (colWidth: number, margin: number): LayoutSection[] => [
      {
        id: 'image',
        type: 'image',
        x: margin,
        y: margin,
        width: colWidth * 4,
        height: colWidth * 4 * 1.33,
        columnSpan: 4
      },
      {
        id: 'title',
        type: 'text',
        x: margin,
        y: margin + colWidth * 4 * 1.33 + 32,
        width: colWidth * 4,
        height: 100,
        priority: 'title'
      },
      {
        id: 'divider',
        type: 'divider',
        x: margin,
        y: margin + colWidth * 4 * 1.33 + 160,
        width: colWidth * 4,
        height: 1
      },
      {
        id: 'subtitle',
        type: 'text',
        x: margin,
        y: margin + colWidth * 4 * 1.33 + 200,
        width: colWidth * 4,
        height: 60,
        priority: 'subtitle'
      },
      {
        id: 'body',
        type: 'text',
        x: margin,
        y: margin + colWidth * 4 * 1.33 + 290,
        width: colWidth * 4,
        height: 300,
        priority: 'body'
      }
    ]
  },
  // 更多模板...
}