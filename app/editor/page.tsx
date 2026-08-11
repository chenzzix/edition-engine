'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { toPng } from 'html-to-image'

const ADVANCED_LINE_HEIGHT = 1.95
const ADVANCED_PADDING_X = 72
const ADVANCED_PADDING_TOP = 72
const ADVANCED_PADDING_BOTTOM = 84
const HEADER_FOOTER_RESERVE = 118
const BODY_SAFETY_SPACE = 40
const IMG_GRID_LINES = 12

const STRICT_SANS_SERIF = 'system-ui, -apple-system, "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif'

const FONT_SIZE_MAP: Record<string, number> = {
  'S': 16,
  'M': 18,
  'L': 20,
  'XL': 22,
}

const PREMIUM_BACKGROUNDS = [
  { name: '象牙白 (Ivory)', bg: '#FDFBF7', defaultText: { r: 28, g: 28, b: 28 } },
  { name: '亚麻灰 (Flax)', bg: '#F4F5F6', defaultText: { r: 35, g: 38, b: 41 } },
  { name: '鼠尾绿 (Sage)', bg: '#EFEFEA', defaultText: { r: 40, g: 45, b: 42 } },
  { name: '陶土砂 (Clay)', bg: '#F5ECE3', defaultText: { r: 50, g: 42, b: 36 } },
  { name: '暮夜黑 (Obsidian)', bg: '#161616', defaultText: { r: 235, g: 235, b: 235 } },
]

type ContentBlock = 
  | { type: 'text', content: string }
  | { type: 'image', index: number }

type BodyImage = {
  id: string
  url: string
  checked: boolean
}

export default function EditorialEditorV7() {
  const [mounted, setMounted] = useState(false)

  const [edRatio, setEdRatio] = useState<'3:4' | '9:16'>('3:4')
  const [edStudioName, setEdStudioName] = useState('EDITORIAL TYPOGRAPHY®') 
  const [edCoverSubtitle, setEdCoverSubtitle] = useState('STUDIO ARCHIVE / VOL.01') 
  
  const [edLogo, setEdLogo] = useState<string>('')
  const [edDisplayMode, setEdDisplayMode] = useState<'text' | 'logo'>('text')

  const [edTitle, setEdTitle] = useState('设计中的留白与呼吸')
  const [editorialText, setEditorialText] = useState(
    `[SUB]留白不是空无一物，而是视觉的延伸与呼吸的节奏。[/SUB]\n\n在版面中，适当的留白能让核心视觉点更加聚焦。优秀的排版应当像一首诗，行与行之间有恰到好处的停顿。摒弃繁琐的装饰，让文字本身成为设计的主角。\n\n[IMG]\n\n通过精准控制文字的色彩、字体的性格以及纸张的温润底色，我们可以为读者创造沉浸式的、[HL]如同阅读实体纸媒一般的精神体验[/HL]。这正是排版美学的终极意义。`
  )
  const [bodyImages, setBodyImages] = useState<BodyImage[]>([])

  const [coverMaskOpacity, setCoverMaskOpacity] = useState(0)

  const [edSizeLabel, setEdSizeLabel] = useState<'S' | 'M' | 'L' | 'XL'>('M')
  
  const [edCoverImage, setEdCoverImage] = useState<string>('')
  const [edCoverWeight, setEdCoverWeight] = useState(60) 

  const [edFontFamily, setEdFontFamily] = useState<'sans' | 'serif'>('serif')
  const [edBgColor, setEdBgColor] = useState('#FDFBF7')
  const [textR, setTextR] = useState(28)
  const [textG, setTextG] = useState(28)
  const [textB, setTextB] = useState(28)

  const [isExporting, setIsExporting] = useState(false)
  const [activeEditingBlock, setActiveEditingBlock] = useState<string | null>(null)
  
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 })

  useEffect(() => { setMounted(true) }, [])

  const activeImages = useMemo(() => bodyImages.filter(img => img.checked), [bodyImages])

  const edStats = useMemo(() => {
    const cleanText = editorialText
      .replace(/\[IMG\]/g, '')
      .replace(/\[\/?(SUB|HL|CENTER|RIGHT)\]/g, '')
    const charCount = cleanText.replace(/\s/g, '').length
    const readingTime = Math.max(1, Math.ceil(charCount / 350))
    return { charCount, readingTime }
  }, [editorialText])

  const editorialPages = useMemo(() => {
    if (!mounted) return []

    const currentFontSize = FONT_SIZE_MAP[edSizeLabel] || 18
    const contentWidth = 720 - ADVANCED_PADDING_X * 2
    const charsPerLine = Math.floor(contentWidth / currentFontSize)

    const canvasHeight = edRatio === '3:4' ? 960 : 1280
    const headerFooterOverhead = 90
    const availableHeight = canvasHeight
      - ADVANCED_PADDING_TOP
      - ADVANCED_PADDING_BOTTOM
      - Math.max(headerFooterOverhead, HEADER_FOOTER_RESERVE)
      - BODY_SAFETY_SPACE
    const maxLinesPerPage = availableHeight / (currentFontSize * ADVANCED_LINE_HEIGHT)

    const paragraphs = editorialText.split('\n')
    const pages: ContentBlock[][] = []

    let currentBlocks: ContentBlock[] = []
    let currentLines = 0
    let imageCounter = 0

    const startNewPage = () => {
      if (currentBlocks.length > 0) {
        pages.push(currentBlocks)
        currentBlocks = []
        currentLines = 0
      }
    }

    const getVisualLength = (str: string) => {
      let len = 0
      for (let i = 0; i < str.length; i++) {
        len += str.charCodeAt(i) > 255 ? 1 : 0.55
      }
      return len
    }

    paragraphs.forEach((para) => {
      const imageMatch = para.trim().match(/^\[IMG(?::([^\]]+))?\]$/)
      if (imageMatch) {
        const imageIndex = imageMatch[1]
          ? activeImages.findIndex(image => image.id === imageMatch[1])
          : imageCounter++

        if (imageIndex >= 0 && imageIndex < activeImages.length) {
          if (currentLines + IMG_GRID_LINES > maxLinesPerPage && currentLines > 0) {
            startNewPage()
          }
          currentBlocks.push({ type: 'image', index: imageIndex })
          currentLines += IMG_GRID_LINES + 0.5
        }
        return
      }

      if (!para.trim()) {
        if (currentLines + 1.5 > maxLinesPerPage && currentLines > 0) {
          startNewPage()
        }
        currentBlocks.push({ type: 'text', content: ' ' })
        currentLines += 1.5
        return
      }

      let remainingText = para
      while (remainingText.length > 0) {
        const isSubtitleBlock = remainingText.includes('[SUB]')
        const heightCompensation = isSubtitleBlock ? 1.5 : 0 

        const cleanForMath = remainingText.replace(/\[\/?(SUB|HL|CENTER|RIGHT)\]/g, '')
        const visualLen = getVisualLength(cleanForMath)
        const neededLines = Math.max(1, Math.ceil(visualLen / charsPerLine))
        const availableLines = maxLinesPerPage - currentLines

        if (neededLines + heightCompensation <= availableLines || availableLines < 1) {
          if (availableLines < 1 && currentLines > 0) {
            startNewPage()
            continue
          }
          currentBlocks.push({ type: 'text', content: remainingText })
          currentLines += neededLines + 0.5 + heightCompensation
          remainingText = ''
        } else {
          let cutIdx = 0
          let currentVisualLen = 0
          let realIdx = 0
          const maxVisualCapacity = availableLines * charsPerLine
          
          while (realIdx < remainingText.length) {
            if (remainingText.startsWith('[SUB]', realIdx)) { realIdx += 5; continue }
            if (remainingText.startsWith('[/SUB]', realIdx)) { realIdx += 6; continue }
            if (remainingText.startsWith('[HL]', realIdx)) { realIdx += 4; continue }
            if (remainingText.startsWith('[/HL]', realIdx)) { realIdx += 5; continue }
            if (remainingText.startsWith('[CENTER]', realIdx)) { realIdx += 8; continue }
            if (remainingText.startsWith('[/CENTER]', realIdx)) { realIdx += 9; continue }
            if (remainingText.startsWith('[RIGHT]', realIdx)) { realIdx += 7; continue }
            if (remainingText.startsWith('[/RIGHT]', realIdx)) { realIdx += 8; continue }

            const char = remainingText[realIdx]
            const charLen = char.charCodeAt(0) > 255 ? 1 : 0.55
            
            if (currentVisualLen + charLen > maxVisualCapacity) break
            currentVisualLen += charLen
            realIdx++
          }

          cutIdx = realIdx
          if (cutIdx === 0) {
            if (currentLines > 0) { startNewPage(); continue } else { cutIdx = 1 }
          }

          const sub = remainingText.slice(0, cutIdx)
          const openSub = (sub.match(/\[SUB\]/g) || []).length
          const closeSub = (sub.match(/\[\/SUB\]/g) || []).length
          if (openSub > closeSub) {
            const lastOpen = sub.lastIndexOf('[SUB]')
            if (lastOpen > 0) cutIdx = lastOpen
          }

          const openHl = (sub.match(/\[HL\]/g) || []).length
          const closeHl = (sub.match(/\[\/HL\]/g) || []).length
          if (openHl > closeHl) {
            const lastOpen = sub.lastIndexOf('[HL]')
            if (lastOpen > 0) cutIdx = lastOpen
          }

          const openCenter = (sub.match(/\[CENTER\]/g) || []).length
          const closeCenter = (sub.match(/\[\/CENTER\]/g) || []).length
          if (openCenter > closeCenter) {
            const lastOpen = sub.lastIndexOf('[CENTER]')
            if (lastOpen > 0) cutIdx = lastOpen
          }

          const openRight = (sub.match(/\[RIGHT\]/g) || []).length
          const closeRight = (sub.match(/\[\/RIGHT\]/g) || []).length
          if (openRight > closeRight) {
            const lastOpen = sub.lastIndexOf('[RIGHT]')
            if (lastOpen > 0) cutIdx = lastOpen
          }

          const partToFit = remainingText.slice(0, cutIdx)
          if (partToFit.trim()) {
            currentBlocks.push({ type: 'text', content: partToFit })
          }
          
          remainingText = remainingText.slice(cutIdx)
          startNewPage()
        }
      }
    })

    startNewPage()
    return pages
  }, [editorialText, edRatio, edSizeLabel, activeImages, mounted])

  const renderRichText = (content: string) => {
    const parts = content.split(/(\[SUB\].*?\[\/SUB\]|\[HL\].*?\[\/HL\]|\[CENTER\].*?\[\/CENTER\]|\[RIGHT\].*?\[\/RIGHT\])/g)
    
    return parts.map((part, i) => {
      if (part.startsWith('[SUB]') && part.endsWith('[/SUB]')) {
        const innerText = part.slice(5, -6)
        return (
          <div 
            key={i} 
            data-editor-format="sub"
            className="block font-serif font-bold tracking-wider"
            style={{ 
              fontSize: '1.25em', 
              marginTop: '1.5em', 
              marginBottom: '0.8em',
              color: `rgb(${textR}, ${textG}, ${textB})`
            }}
          >
            {innerText}
          </div>
        )
      }
      
      if (part.startsWith('[HL]') && part.endsWith('[/HL]')) {
        const innerText = part.slice(4, -5)
        return (
          <span 
            key={i} 
            data-editor-format="hl"
            className="px-1 mx-[1px] rounded-sm transition-colors"
            style={{ 
              backgroundColor: 'rgba(128, 128, 128, 0.18)', 
            }}
          >
            {innerText}
          </span>
        )
      }

      if (part.startsWith('[CENTER]') && part.endsWith('[/CENTER]')) {
        return (
          <div key={i} data-editor-format="center" className="block text-center">
            {part.slice(8, -9)}
          </div>
        )
      }

      if (part.startsWith('[RIGHT]') && part.endsWith('[/RIGHT]')) {
        return (
          <div key={i} data-editor-format="right" className="block text-right">
            {part.slice(7, -8)}
          </div>
        )
      }

      return <span key={i}>{part}</span>
    })
  }

  const handleSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    
    if (text && text.length > 0 && !text.includes('\n')) {
      const range = selection!.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      setTooltip({
        show: true,
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 50
      })
    } else {
      setTooltip({ show: false, text: '', x: 0, y: 0 })
    }
  }

  const applyFormat = (type: 'sub' | 'hl' | 'center' | 'right') => {
    if (tooltip.text) {
      const safeText = tooltip.text.replace(/\[\/?(SUB|HL|CENTER|RIGHT)\]/g, '')
      const tag = { sub: 'SUB', hl: 'HL', center: 'CENTER', right: 'RIGHT' }[type]
      
      setEditorialText((prev) => prev.replace(tooltip.text, `[${tag}]${safeText}[/${tag}]`))
      setTooltip({ show: false, text: '', x: 0, y: 0 })
      window.getSelection()?.removeAllRanges()
    }
  }

  const handleEdCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = () => setEdCoverImage(reader.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleEdLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = () => setEdLogo(reader.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const addBodyImage = (file: File, insertAfter?: string) => {
    const id = `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const reader = new FileReader()

    reader.onload = () => {
      setBodyImages(previous => [...previous, { id, url: reader.result as string, checked: true }])
      const marker = `[IMG:${id}]`
      setEditorialText(previous => {
        if (insertAfter && previous.includes(insertAfter)) {
          return previous.replace(insertAfter, `${insertAfter}\n\n${marker}`)
        }
        return `${previous.trimEnd()}\n\n${marker}`
      })
    }
    reader.readAsDataURL(file)
  }

  const handleBodyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) addBodyImage(e.target.files[0], activeEditingBlock ?? undefined)
    e.target.value = ''
  }

  const handleEditablePaste = (event: React.ClipboardEvent<HTMLDivElement>, blockContent: string) => {
    const image = Array.from(event.clipboardData.files).find(file => file.type.startsWith('image/'))
    if (!image) return

    event.preventDefault()
    addBodyImage(image, blockContent)
  }

  const serializeEditableContent = (element: HTMLElement) => {
    const serializeNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
      if (node.nodeType !== Node.ELEMENT_NODE) return ''

      const htmlElement = node as HTMLElement
      if (htmlElement.tagName === 'BR') return '\n'

      const content = Array.from(htmlElement.childNodes).map(serializeNode).join('')
      const format = htmlElement.dataset.editorFormat
      if (format === 'sub') return `[SUB]${content}[/SUB]`
      if (format === 'hl') return `[HL]${content}[/HL]`
      if (format === 'center') return `[CENTER]${content}[/CENTER]`
      if (format === 'right') return `[RIGHT]${content}[/RIGHT]`

      // Browsers create divs when Enter is pressed in a contentEditable area.
      return htmlElement.tagName === 'DIV' ? `${content}\n` : content
    }

    return Array.from(element.childNodes).map(serializeNode).join('').replace(/\n$/, '').replace(/\u00a0/g, ' ')
  }

  const updateEditorialBlock = (originalContent: string, element: HTMLElement) => {
    const normalizedContent = serializeEditableContent(element)
    const originalVisibleContent = originalContent.replace(/\[\/?(SUB|HL|CENTER|RIGHT)\]/g, '')

    if (originalContent === ' ') {
      if (normalizedContent === ' ') return
      setEditorialText(previous => previous.replace(
        /\n[ \t]*\n/,
        normalizedContent.trim() ? `\n${normalizedContent}\n` : '\n'
      ))
      return
    }

    if (normalizedContent !== originalContent && normalizedContent !== originalVisibleContent) {
      setEditorialText(previous => previous.replace(originalContent, normalizedContent))
    }
  }

  const removeBlankParagraph = () => {
    setEditorialText(previous => previous.replace(/\n[ \t]*\n/, '\n'))
  }

  const removeBodyImage = (id: string) => {
    setBodyImages(previous => previous.filter(image => image.id !== id))
    setEditorialText(previous => previous
      .replace(`\n\n[IMG:${id}]`, '')
      .replace(`[IMG:${id}]\n\n`, '')
      .replace(`[IMG:${id}]`, '')
    )
  }

  const exportAsImage = async (id: string, name: string) => {
    const node = document.getElementById(id)
    if (!node) return
    const images = Array.from(node.querySelectorAll('img'))
    await Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve })))

    // The editor preview scales the full-size page down to 50%. `html-to-image`
    // otherwise retains that transform while creating a 720px-wide export canvas,
    // which leaves most of the exported image blank.
    const originalTransform = node.style.transform
    node.style.transform = 'none'

    let dataUrl: string
    try {
      dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 2.5,
        width: node.offsetWidth,
        height: node.offsetHeight,
        backgroundColor: edBgColor,
        filter: element => !(element instanceof HTMLElement && element.dataset.exportIgnore === 'true'),
      })
    } finally {
      node.style.transform = originalTransform
    }

    const link = document.createElement('a')
    link.download = `${name}.png`
    link.href = dataUrl
    link.click()
  }

  const exportAllPages = async () => {
    setIsExporting(true)
    try {
      await exportAsImage('ed-cover', `${edStudioName.replace(/ /g, '_')}-00-Cover`)
      await new Promise(res => setTimeout(res, 600)) 
      for (let i = 0; i < editorialPages.length; i++) {
        await exportAsImage(`ed-page-${i}`, `${edStudioName.replace(/ /g, '_')}-Page-${String(i + 1).padStart(2, '0')}`)
        await new Promise(res => setTimeout(res, 600))
      }
    } catch (err) {
      alert("批量导出中断，请检查网络或浏览器设置。")
    } finally {
      setIsExporting(false)
    }
  }

  const getFontFamilyStyle = (f: 'sans' | 'serif') => {
    if (f === 'serif') return '"Noto Serif SC", "Source Han Serif SC", "SimSun", Georgia, serif'
    return STRICT_SANS_SERIF
  }

  const computedTextColor = `rgb(${textR}, ${textG}, ${textB})`

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-[#F0F0F0] flex flex-col lg:flex-row text-zinc-900 font-sans relative">
      
      {tooltip.show && (
        <div
          className="fixed z-50 bg-white text-black text-[12px] font-black p-1 rounded-lg shadow-2xl cursor-pointer transform -translate-x-1/2 flex items-center gap-1 border border-black/10"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <button 
            onClick={() => applyFormat('sub')} 
            className="px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
          >
            <span className="text-[14px]">T</span> 设为小标题
          </button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button 
            onClick={() => applyFormat('hl')} 
            className="px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
          >
            <span className="text-[14px]">🖍️</span> 重点划线
          </button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button
            onClick={() => applyFormat('center')}
            className="px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
          >
            <span className="text-[14px]">≡</span> 居中
          </button>
          <button
            onClick={() => applyFormat('right')}
            className="px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
          >
            <span className="text-[14px]">≡</span> 居右
          </button>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-black tracking-widest uppercase mb-2">正在一键压制全册文件...</h2>
          <p className="text-xs font-mono opacity-50">Please do not close this window.</p>
        </div>
      )}

      <aside className="w-full lg:w-[420px] bg-white h-screen overflow-y-auto p-6 border-r shrink-0 z-20 shadow-xl flex flex-col justify-between">
        <div className="space-y-6 pb-12">
          <div className="flex items-center justify-between border-b pb-4">
            <span className="font-black text-sm tracking-wider">EDITION ENGINE®</span>
            <button onClick={exportAllPages} className="bg-zinc-900 hover:bg-black text-white px-3 py-1.5 rounded text-[10px] font-mono tracking-widest font-bold shadow transition-colors flex items-center gap-1.5">
              <span>⬇️</span> 导出全册
            </button>
          </div>

          <div className="space-y-5">
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black tracking-wide">封面页面配置</span>
              </div>
              <div className="space-y-3 pt-3 border-t border-zinc-200">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] opacity-50 font-mono"><span>图片高度占比</span><span>{edCoverWeight}%</span></div>
                  <input type="range" min="20" max="100" value={edCoverWeight} onChange={e => setEdCoverWeight(Number(e.target.value))} className="w-full accent-black" />
                </div>
                <div className="border border-dashed border-zinc-300 rounded-lg p-2.5 text-center bg-white hover:bg-zinc-50 transition-colors relative cursor-pointer">
                  <span className="text-[10px] opacity-50 block font-bold">点击选择封面大图</span>
                  <input type="file" accept="image/*" onChange={handleEdCoverUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="pt-2 border-t border-zinc-200 space-y-1">
                  <div className="flex justify-between text-[10px] opacity-50 font-bold">
                    <span>封面图片遮罩</span>
                    <span>{coverMaskOpacity}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={coverMaskOpacity} onChange={e => setCoverMaskOpacity(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-4">
              <label className="text-[10px] uppercase font-black opacity-50 tracking-wider block border-b pb-1">📇 文本与标志配置</label>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">品牌标识</label>
                <div className="grid grid-cols-2 gap-1 bg-zinc-200/60 p-1 rounded-lg">
                  {(['text', 'logo'] as const).map(mode => (
                    <button key={mode} onClick={() => setEdDisplayMode(mode)} className={`py-1 text-[10px] font-bold rounded-md transition-all ${edDisplayMode === mode ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}>
                      {mode === 'text' ? '文字' : 'Logo'}
                    </button>
                  ))}
                </div>
              </div>

              {edDisplayMode === 'text' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block">品牌名称</label>
                  <input type="text" value={edStudioName} onChange={e => setEdStudioName(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white focus:border-black outline-none font-mono" placeholder="输入品牌名称" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 block">标志图像 (Logo Asset)</label>
                  <div className="border border-dashed border-zinc-300 rounded-lg p-3 text-center bg-white hover:bg-zinc-50/50 transition-colors relative cursor-pointer">
                    <span className="text-[10px] text-zinc-500 block font-bold">
                      {edLogo ? '✨已加载自定义 Logo（点击更换）' : '➕ 插入自定义 Logo'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleEdLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  {edLogo && <button onClick={() => setEdLogo('')} className="text-[9px] text-red-500 hover:text-red-700 underline block pt-0.5 transition-colors">移除已加载的 Logo</button>}
                </div>
              )}

              <div className="space-y-1 pt-1 border-t border-zinc-200/60">
                <label className="text-[10px] font-black text-zinc-500 tracking-wider flex items-center gap-1">
                  <span>✍️</span> 封面副标题 (Subtitle)
                </label>
                <input type="text" value={edCoverSubtitle} onChange={e => setEdCoverSubtitle(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white focus:border-black outline-none font-mono" placeholder="例如: STUDIO ARCHIVE / VOL.01" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 pb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black opacity-40 tracking-wider">画布比例</label>
                <div className="flex flex-col gap-1.5">
                  {(['3:4', '9:16'] as const).map(ratio => (
                    <button key={ratio} onClick={() => setEdRatio(ratio)} className={`py-1.5 text-[11px] font-bold border rounded-md transition-all ${edRatio === ratio ? 'border-black bg-black text-white' : 'border-zinc-200'}`}>{ratio === '3:4' ? '画册 (3:4)' : '海报 (9:16)'}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black opacity-40 tracking-wider">排版字体</label>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setEdFontFamily('sans')} className={`py-1.5 text-[11px] border rounded-md font-bold ${edFontFamily === 'sans' ? 'border-black bg-black text-white' : 'border-zinc-200'}`}>现代黑体</button>
                  <button onClick={() => setEdFontFamily('serif')} className={`py-1.5 text-[11px] border rounded-md font-serif font-bold ${edFontFamily === 'serif' ? 'border-black bg-black text-white' : 'border-zinc-200'}`}>古典宋体</button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black opacity-40 tracking-wider">正文字号控制</label>
              <div className="grid grid-cols-3 gap-2">
                {(['S', 'M', 'L', 'XL'] as const).map(size => (
                  <button key={size} onClick={() => setEdSizeLabel(size)} className={`py-2 text-xs border rounded-lg font-bold transition-all ${edSizeLabel === size ? 'border-black bg-black text-white font-black' : 'border-zinc-200'}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black opacity-40 tracking-wider">低饱和度底色</label>
              <div className="grid grid-cols-5 gap-1.5">
                {PREMIUM_BACKGROUNDS.map(item => (
                  <button key={item.name} onClick={() => {
                    setEdBgColor(item.bg)
                    setTextR(item.defaultText.r)
                    setTextG(item.defaultText.g)
                    setTextB(item.defaultText.b)
                  }} className="group relative flex flex-col items-center gap-1">
                    <div className="w-full h-8 rounded-md border border-zinc-300 shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: item.bg }} />
                    {edBgColor === item.bg && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black rounded-full border border-white" />}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </aside>

      <section 
        className="flex-1 h-screen overflow-y-auto p-8 lg:p-16 bg-[#E8E8E8] flex flex-col items-center gap-16 pb-44"
        onMouseUp={handleSelection}
      >
        <div className="w-full flex flex-col items-center gap-20">
          <div className="sticky top-6 z-30 w-[360px] flex items-center justify-between rounded-lg border border-zinc-300 bg-white/95 px-3 py-2 text-[10px] font-bold text-zinc-500 shadow-lg backdrop-blur">
            <span>{activeEditingBlock ? '图片将插入当前正文位置' : '点击正文后可在当前位置插入图片'}</span>
            <label className="cursor-pointer rounded bg-black px-2 py-1 text-white transition-colors hover:bg-zinc-700">
              + 添加图片
              <input type="file" accept="image/*" onChange={handleBodyImageUpload} className="hidden" />
            </label>
          </div>
          
          <div className="flex flex-col items-center gap-4 group">
            <div className="flex items-center justify-between w-[360px]">
              <span className="text-[10px] font-black opacity-40 tracking-widest uppercase">PAGE 00 // COVER PAGE</span>
              <button onClick={() => exportAsImage('ed-cover', 'Editorial-Cover-Pro')} className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-black text-white px-2 py-1 rounded">导出此页</button>
            </div>
            
            <div className="bg-white shadow-2xl relative overflow-hidden transition-transform duration-300 group-hover:shadow-3xl" style={{ width: '360px', height: edRatio === '3:4' ? '480px' : '640px' }}>
              <div id="ed-cover" className="absolute inset-0 flex flex-col" style={{ width: '720px', height: edRatio === '3:4' ? '960px' : '1280px', transform: 'scale(0.5)', transformOrigin: 'top left', backgroundColor: edBgColor, fontFamily: getFontFamilyStyle(edFontFamily) }}>
                
                <div className="relative overflow-hidden shrink-0 bg-zinc-200/60" style={{ height: `${edCoverWeight}%` }}>
                  {edCoverImage ? (
                    <>
                      <img crossOrigin="anonymous" src={edCoverImage} className="w-full h-full object-cover" alt="Cover" />
                      <div className="absolute inset-0 bg-black pointer-events-none transition-opacity" style={{ opacity: coverMaskOpacity / 100 }} />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 font-mono text-[11px] uppercase tracking-widest gap-1"><span>[ NO COVER IMAGE LOADED ]</span></div>
                  )}
                  
                  {edCoverWeight >= 75 && (
                    <div className="absolute bottom-16 left-16 right-16 text-white flex flex-col justify-between">
                      <div>
                        <p className="font-serif font-medium text-[18px] tracking-[0.18em] mb-4 opacity-75">{edCoverSubtitle}</p>
                        <h1
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={event => setEdTitle(event.currentTarget.innerText)}
                          className="text-[56px] font-extrabold leading-[1.05] tracking-tighter drop-shadow-sm mb-8 outline-none cursor-text"
                        >
                          {edTitle}
                        </h1>
                      </div>
                      <div className="border-t border-white/30 pt-6 flex justify-between items-end tracking-wide">
                        {edDisplayMode === 'logo' && edLogo ? (
                          <>
                            <div className="text-[16px] font-medium opacity-95 tracking-widest" style={{ fontFamily: STRICT_SANS_SERIF }}>
                              本文约 {edStats.charCount} 字，阅读需要 {edStats.readingTime} 分钟
                            </div>
                            <img crossOrigin="anonymous" src={edLogo} className="h-10 max-w-[180px] object-contain object-right" alt="Cover Logo" />
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 text-[20px] font-bold" style={{ fontFamily: STRICT_SANS_SERIF }}>
                              {edDisplayMode === 'text' && <span className="truncate">{edStudioName}</span>}
                            </div>
                            <div className="text-right text-[16px] font-medium opacity-95 tracking-widest" style={{ fontFamily: STRICT_SANS_SERIF }}>
                              本文约 {edStats.charCount} 字，阅读需要 {edStats.readingTime} 分钟
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {edCoverWeight < 75 && (
                  <div className="flex-1 p-16 flex flex-col justify-between" style={{ color: computedTextColor }}>
                    <div>
                      <p className="font-serif font-medium text-[18px] tracking-[0.18em] mb-4 opacity-75">{edCoverSubtitle}</p>
                      <h1
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={event => setEdTitle(event.currentTarget.innerText)}
                        className="text-[64px] font-extrabold leading-[1.05] tracking-tighter outline-none cursor-text"
                      >
                        {edTitle}
                      </h1>
                    </div>
                    
                    <div className="border-t pt-6 flex justify-between items-end tracking-wide" style={{ borderColor: `${computedTextColor}22` }}>
                      {edDisplayMode === 'logo' && edLogo ? (
                        <>
                          <div className="text-[16px] font-medium opacity-90 tracking-widest" style={{ fontFamily: STRICT_SANS_SERIF }}>
                            本文约 {edStats.charCount} 字，阅读需要 {edStats.readingTime} 分钟
                          </div>
                          <img crossOrigin="anonymous" src={edLogo} className="h-10 max-w-[180px] object-contain object-right" alt="Cover Logo" />
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 text-[20px] font-bold" style={{ fontFamily: STRICT_SANS_SERIF }}>
                            {edDisplayMode === 'text' && <span className="truncate">{edStudioName}</span>}
                          </div>
                          <div className="text-right text-[16px] font-medium opacity-90 tracking-widest" style={{ fontFamily: STRICT_SANS_SERIF }}>
                            本文约 {edStats.charCount} 字，阅读需要 {edStats.readingTime} 分钟
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {editorialPages.map((blocks, index) => (
            <div key={index} className="flex flex-col items-center gap-4 group">
              <div className="flex items-center justify-between w-[360px]">
                <span className="text-[10px] font-black opacity-40 tracking-widest uppercase">PAGE {String(index + 1).padStart(2, '0')} — BODY</span>
                <button onClick={() => exportAsImage(`ed-page-${index}`, `Editorial-Page-${index + 1}`)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-black text-white px-2 py-1 rounded">导出此页</button>
              </div>
              
              <div className="bg-white shadow-xl relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl" style={{ width: '360px', height: edRatio === '3:4' ? '480px' : '640px' }}>
                
                <div id={`ed-page-${index}`} className="absolute inset-0 flex flex-col justify-between" style={{ width: '720px', height: edRatio === '3:4' ? '960px' : '1280px', transform: 'scale(0.5)', transformOrigin: 'top left', backgroundColor: edBgColor, color: computedTextColor, padding: `${ADVANCED_PADDING_TOP}px ${ADVANCED_PADDING_X}px ${ADVANCED_PADDING_BOTTOM}px`, fontFamily: getFontFamilyStyle(edFontFamily) }}>
                  
                  <div className="flex justify-between items-center border-b pb-4 tracking-widest opacity-40 uppercase shrink-0" style={{ borderColor: `${computedTextColor}22`, fontFamily: STRICT_SANS_SERIF }}>
                    <div className="flex items-center gap-3">
                      {(edDisplayMode === 'logo') && edLogo ? (
                        <img crossOrigin="anonymous" src={edLogo} className="h-10 max-w-[150px] object-contain" alt="Header Logo" />
                      ) : null}
                      {edDisplayMode === 'text' && (
                        <span className="text-[14px] font-bold">{edStudioName}</span>
                      )}
                    </div>
                    <span className="text-[14px] font-bold">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  
                  <div className="flex-1 py-6 text-justify overflow-hidden tracking-wide flex flex-col justify-start" style={{ fontSize: `${FONT_SIZE_MAP[edSizeLabel]}px`, lineHeight: ADVANCED_LINE_HEIGHT }}>
                    <div className="space-y-4">
                      {blocks.map((block, bIdx) => {
                        if (block.type === 'text') {
                          return (
                            <div
                              key={bIdx}
                              contentEditable
                              suppressContentEditableWarning
                              onFocus={() => setActiveEditingBlock(block.content)}
                              onBlur={event => updateEditorialBlock(block.content, event.currentTarget)}
                              onPaste={event => handleEditablePaste(event, block.content)}
                              onKeyDown={event => {
                                if (block.content === ' ' && (event.key === 'Backspace' || event.key === 'Delete')) {
                                  event.preventDefault()
                                  removeBlankParagraph()
                                }
                              }}
                              className={`whitespace-pre-wrap outline-none cursor-text ${block.content === ' ' ? 'min-h-[1.95em]' : ''}`}
                            >
                              {renderRichText(block.content)}
                            </div>
                          )
                        } else {
                          const imgSrc = activeImages[block.index]?.url
                          const targetHeight = IMG_GRID_LINES * FONT_SIZE_MAP[edSizeLabel] * ADVANCED_LINE_HEIGHT
                          const bottomMargin = FONT_SIZE_MAP[edSizeLabel] * ADVANCED_LINE_HEIGHT

                          return (
                            <div key={bIdx} className="group/image w-full relative overflow-hidden bg-zinc-200/40 rounded shadow-sm" style={{ height: targetHeight, marginBottom: bottomMargin }}>
                              {imgSrc ? (
                                <>
                                  <img crossOrigin="anonymous" src={imgSrc} className="w-full h-full object-cover" alt="Editorial Body" />
                                  <button
                                    type="button"
                                    data-export-ignore="true"
                                    onClick={() => removeBodyImage(activeImages[block.index].id)}
                                    className="absolute right-3 top-3 rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity hover:bg-red-600 group-hover/image:opacity-100"
                                  >
                                    删除图片
                                  </button>
                                </>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono tracking-widest text-zinc-500 border border-dashed border-zinc-400">
                                  [ MISSING ACTIVE IMAGE ASSET ]
                                </div>
                              )}
                            </div>
                          )
                        }
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-end items-center tracking-widest opacity-30 uppercase pt-4 shrink-0" style={{ fontFamily: STRICT_SANS_SERIF }}>
                    <span className="text-[11px] font-bold">EDITION 2026</span>
                  </div>

                </div>
              </div>
            </div>
          ))}

        </div>
      </section>
    </main>
  )
}
