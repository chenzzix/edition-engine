export interface DesignAssets {
  images: File[]
  title: string
  subtitle: string
  body: string
  accentColor: string
  template: 'classic' | 'fullwidth' | 'grid' | 'minimal'
  theme: 'light' | 'dark'
}

export interface GridConfig {
  columns: number
  gutter: number
  margin: number
  width: number
  rowHeight: number
}

export interface LayoutSection {
  id: string
  type: 'image' | 'text' | 'divider'
  x: number
  y: number
  width: number
  height: number
  content?: string
  priority?: 'title' | 'subtitle' | 'body'
  columnSpan?: number
}

export interface RenderOutput {
  desktop: HTMLCanvasElement  // 16:9
  mobile: HTMLCanvasElement   // 9:16
}