import { GridConfig, LayoutSection } from '@/types'

export class SwissLayoutEngine {
  gridConfig: GridConfig
  rowHeight: number = 24 // 基础行高单位

  constructor(width: number, columns: number = 12) {
    this.gridConfig = {
      columns,
      gutter: 24,
      margin: 40,
      width,
      rowHeight: this.rowHeight
    }
  }

  // 计算列宽
  getColumnWidth(): number {
    const { width, columns, gutter, margin } = this.gridConfig
    return (width - 2 * margin - (columns - 1) * gutter) / columns
  }

  // 计算字号（响应式）
  calculateTypography(priority: 'title' | 'subtitle' | 'body', spacing: 'compact' | 'normal' | 'loose') {
    const colWidth = this.getColumnWidth()
    const baseSize = colWidth / 18 // 经验公式

    const sizeRatios = {
      title: 3.5,
      subtitle: 2.2,
      body: 1.0
    }

    const spacingMultiplier = {
      compact: 0.8,
      normal: 1.0,
      loose: 1.2
    }

    const fontSize = baseSize * sizeRatios[priority] * spacingMultiplier[spacing]
    const lineHeight = fontSize * 1.5

    return { fontSize: Math.round(fontSize), lineHeight: Math.round(lineHeight) }
  }

  // 文本换行（关键）
  wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    fontSize: number
  ): string[] {
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`
    
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''

    words.forEach(word => {
      const testLine = line ? `${line} ${word}` : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = testLine
      }
    })

    if (line) lines.push(line)
    return lines
  }

  // 图片适配栅格（保持宽高比）
  fitImageToGrid(
    imageWidth: number,
    imageHeight: number,
    columnSpan: number
  ): { width: number; height: number } {
    const colWidth = this.getColumnWidth()
    const targetWidth = colWidth * columnSpan + this.gridConfig.gutter * (columnSpan - 1)
    const scaledHeight = (imageHeight / imageWidth) * targetWidth

    // 高度对齐到栅格单位
    const alignedHeight = Math.round(scaledHeight / this.rowHeight) * this.rowHeight

    return { width: targetWidth, height: alignedHeight }
  }

  // 绘制分割线（瑞士风标志）
  drawDivider(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
    ctx.strokeStyle = '#cccccc'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + width, y)
    ctx.stroke()
  }

  // 获取位置对齐值
  getAlignedPosition(position: number): number {
    return Math.round(position / this.rowHeight) * this.rowHeight
  }
}