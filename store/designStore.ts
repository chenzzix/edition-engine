import { create } from 'zustand'

interface DesignState {
  // 基础文本信息
  title: string
  titleSize: number
  subtitle: string
  info: string
  services: string
  
  // 页眉网格信息
  projectNum: string   // 左侧编号，如 001
  tag: string          // 你要求的顶部 (#xx) 文字
  studioName: string   // 右侧署名，如 PORTFOLIO®
  
  // 布局与样式
  images: string[]     // 存储 Base64 格式图片，解决导出失败问题
  layout: 'split' | 'stack'
  imageScale: number
  bgColor: string
  
  // Actions 
  setTitle: (val: string) => void
  setTitleSize: (val: number) => void
  setSubtitle: (val: string) => void
  setInfo: (val: string) => void
  setServices: (val: string) => void
  setProjectNum: (val: string) => void
  setTag: (val: string) => void
  setStudioName: (val: string) => void
  setImages: (imgs: string[]) => void
  setLayout: (layout: 'split' | 'stack') => void
  setImageScale: (scale: number) => void
  setBgColor: (color: string) => void
}

export const useDesignStore = create<DesignState>((set) => ({
  // 初始默认值
  title: 'STILL CURVE',
  titleSize: 120,
  subtitle: 'IDENTITY DESIGN',
  info: 'A portrait shaped by restraint and precision. Exploring the boundaries between organic forms and brutalist structures.',
  services: 'BRAND SYSTEMS\nIDENTITY DESIGN\nART DIRECTION',
  
  projectNum: '001',
  tag: '(#01)', 
  studioName: 'PORTFOLIO®',
  
  images: [],
  layout: 'split',
  imageScale: 1,
  bgColor: '#ffffff',

  // 状态更新逻辑
  setTitle: (val) => set({ title: val }),
  setTitleSize: (val) => set({ titleSize: val }),
  setSubtitle: (val) => set({ subtitle: val }),
  setInfo: (val) => set({ info: val }),
  setServices: (val) => set({ services: val }),
  setProjectNum: (val) => set({ projectNum: val }),
  setTag: (val) => set({ tag: val }),
  setStudioName: (val) => set({ studioName: val }),
  setImages: (imgs) => set({ images: imgs }),
  setLayout: (layout) => set({ layout }),
  setImageScale: (scale) => set({ imageScale: scale }),
  setBgColor: (color) => set({ bgColor: color }),
}))