'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { toPng } from 'html-to-image'

// 高级感黄金排版常数
const ADVANCED_LINE_HEIGHT = 1.95
const ADVANCED_PADDING_X = 64
const ADVANCED_PADDING_Y = 56
const IMG_GRID_LINES = 12

const STRICT_SANS_SERIF = 'system-ui, -apple-system, "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif'

const FONT_SIZE_MAP: Record<string, number> = {
  'S': 16,
  'M': 18,
  'L': 20,
  'XL': 22,
}

type ContentBlock = 
  | { type: 'text', content: string }
  | { type: 'image', index: number }

export default function EditorPage() {
  const [mounted, setMounted] = useState(false)

  const [edRatio, setEdRatio] = useState<'3:4' | '9:16'>('3:4')
  const [edSizeLabel, setEdSizeLabel] = useState<'S' | 'M' | 'L' | 'XL'>('M')
  const [edFontFamily, setEdFontFamily] = useState<string>('SongTi')
  
  const [edBgColor, setEdBgColor] = useState<string>('#FBF9F5')
  const [edTextColor, setEdTextColor] = useState<string>('#1C1C1C')
  
  const [edStudioName, setEdStudioName] = useState('EDITORIAL TYPOGRAPHY®') 
  const [edCoverSubtitle, setEdCoverSubtitle] = useState('STUDIO ARCHIVE / VOL.01') 
  
  // 细节5：默认大标题修改
  const [edTitle, setEdTitle] = useState('设计中的留白与呼吸')
  
  const [edLogo, setEdLogo] = useState<string>('')
  const [edDisplayMode, setEdDisplayMode] = useState<'text' | 'logo'>('text')

  const [edCoverImage, setEdCoverImage] = useState<string>('')
  const [edCoverWeight, setEdCoverWeight] = useState(60) 
  const [coverMaskOpacity, setCoverMaskOpacity] = useState(0)

  const [bodyImages, setBodyImages] = useState<{ url: string; checked: boolean }[]>([])
  const [isExporting, setIsExporting] = useState(false)
  
  // 悬浮划词高亮工具条状态
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 })

  const [editorialText, setEditorialText] = useState<string>(
    `[H]留白不是空无一物，而是视觉的延伸与呼吸的节奏。[/H]在版面中，适当的留白能让核心视觉点更加聚焦。\n\n` +
    `核心驱动力：基于灵魂指示星和命主星，解读我此生灵魂渴望体验的主要课题是什么？进化的方向（南北交点轴线）：基于南北交点，指出我过于熟悉、容易陷入的“舒适区”（前世习气）在哪里？以及我此生必须努力拓展、甚至感到陌生的“进化区”在哪里？\n\n` +
    `[IMG]\n\n` +
    `识别“定业”与惯性：不要只告诉我“某星在某宫不好”，请将其翻译为心理模式。指出我生命中反复出现的、根深蒂固的思维或情绪惯性是什么？（例如：在关系中总是无意识地自我牺牲，或者在事业上总是因为完美主义而停滞）。\n\n` +
    `这些惯性在生活中通常以什么样的“挑战”或“困境”呈现？理解并转化这些模式，是通往自我掌控的关键一步。`
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeImages = useMemo(() => bodyImages.filter(img => img.checked), [bodyImages])

  const totalChars = useMemo(() => {
    return editorialText
      .replace(/\[IMG\]/g, '')
      .replace(/\[\/?H\]/g, '')
      .replace(/\s/g, '').length
  }, [editorialText])

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(totalChars / 350))
  }, [totalChars])

  // 重构版物理分页引擎（严格 DOM 同步，彻底消除大留白）
  const editorialPages = useMemo(() => {
    if (!mounted) return []

    const currentFontSize = FONT_SIZE_MAP[edSizeLabel] || 18
    const contentWidth = 720 - ADVANCED_PADDING_X * 2
    const charsPerLine = Math.floor(contentWidth / currentFontSize)

    const canvasHeight = edRatio === '3:4' ? 960 : 1280
    const headerFooterOverhead = 90
    const availableHeight = canvasHeight - ADVANCED_PADDING_Y * 2 - headerFooterOverhead
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

    // 视觉长度计算：英文标点等占 0.55 个汉字位，修正排版偏差
    const getVisualLength = (str: string) => {
      let len = 0
      for (let i = 0; i < str.length; i++) {
        len += str.charCodeAt(i) > 255 ? 1 : 0.55
      }
      return len
    }

    paragraphs.forEach((para) => {
      if (para.trim() === '[IMG]') {
        if (imageCounter < activeImages.length) {
          if (currentLines + IMG_GRID_LINES > maxLinesPerPage && currentLines > 0) {
            startNewPage()
          }
          currentBlocks.push({ type: 'image', index: imageCounter++ })
          currentLines += IMG_GRID_LINES + 0.5 // +0.5 对应 DOM 中的 space-y-4 margin
        }
        return
      }

      // 处理多余的纯空行
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
        const cleanForMath = remainingText.replace(/\[\/?H\]/g, '')
        const visualLen = getVisualLength(cleanForMath)
        const neededLines = Math.max(1, Math.ceil(visualLen / charsPerLine))
        const availableLines = maxLinesPerPage - currentLines

        if (neededLines <= availableLines || availableLines < 1) {
          // 如果剩余空间极小，但这是本页第一行，强行装入，否则换页
          if (availableLines < 1 && currentLines > 0) {
            startNewPage()
            continue
          }
          currentBlocks.push({ type: 'text', content: remainingText })
          currentLines += neededLines + 0.5 // +0.5 抵消 space-y-4 的 margin
          remainingText = ''
        } else {
          // 当前页装不下，逐字切割
          let cutIdx = 0
          let currentVisualLen = 0
          let realIdx = 0
          const maxVisualCapacity = availableLines * charsPerLine
          
          while (realIdx < remainingText.length) {
            // 安全跳过高亮标签，不计入排版长度
            if (remainingText.startsWith('[H]', realIdx)) {
              realIdx += 3
              continue
            }
            if (remainingText.startsWith('[/H]', realIdx)) {
              realIdx += 4
              continue
            }

            const char = remainingText[realIdx]
            const charLen = char.charCodeAt(0) > 255 ? 1 : 0.55
            
            if (currentVisualLen + charLen > maxVisualCapacity) {
              break
            }
            currentVisualLen += charLen
            realIdx++
          }

          cutIdx = realIdx

          if (cutIdx === 0) {
            if (currentLines > 0) {
              startNewPage()
              continue
            } else {
              cutIdx = 1
            }
          }

          // 防切割保护：避免 [H] 被生硬截断
          const sub = remainingText.slice(0, cutIdx)
          const openTags = (sub.match(/\[H\]/g) || []).length
          const closeTags = (sub.match(/\[\/H\]/g) || []).length
          if (openTags > closeTags) {
            const lastOpen = sub.lastIndexOf('[H]')
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

  // 处理富文本渲染：解析 [H]...[/H] 高亮小标题
  const renderTextWithHighlights = (content: string) => {
    const parts = content.split(/(\[H\].*?\[\/H\])/g)
    return parts.map((part, i) => {
      if (part.startsWith('[H]') && part.endsWith('[/H]')) {
        const innerText = part.slice(3, -4)
        return (
          <span 
            key={i} 
            className="font-black px-1.5 py-[2px] mx-[2px] rounded-sm transition-colors shadow-sm"
            style={{ 
              backgroundColor: edTextColor, 
              color: edBgColor, 
              letterSpacing: '0.05em' 
            }}
          >
            {innerText}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  // 划词选取事件监听
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
        y: rect.top - 45
      })
    } else {
      setTooltip({ show: false, text: '', x: 0, y: 0 })
    }
  }

  const applyHeadingHighlight = () => {
    if (tooltip.text) {
      const safeText = tooltip.text.replace(/\[\/?H\]/g, '')
      setEditorialText((prev) => prev.replace(tooltip.text, `[H]${safeText}[/H]`))
      setTooltip({ show: false, text: '', x: 0, y: 0 })
      window.getSelection()?.removeAllRanges()
    }
  }

  const handleEdCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEdCoverImage(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleEdLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEdLogo(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleBodyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBodyImages(prev => [...prev, { url: URL.createObjectURL(e.target.files![0]), checked: true }])
    }
  }

  const getFontFamilyStyle = (fontKey: string) => {
    switch (fontKey) {
      case 'SongTi': return '"SimSun", "STSong", "Songti SC", "Noto Serif SC", serif'
      case 'HeiTi': return '"PingFang SC", "Microsoft YaHei", "Heiti SC", sans-serif'
      case 'KaiTi': return '"Kaiti SC", "STKaiti", "KaiTi", serif'
      default: return 'serif'
    }
  }

  const exportAsImage = async (id: string, name: string) => {
    const el = document.getElementById(id)
    if (!el) return
    try {
      const dataUrl = await toPng(el, { 
        pixelRatio: 2.5,
        backgroundColor: edBgColor 
      })
      const link = document.createElement('a')
      link.download = `${name}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('导出图片失败，请重试')
    }
  }

  const exportAllPages = async () => {
    setIsExporting(true)
    try {
      await exportAsImage('ed-cover', 'editorial-cover')
      await new Promise(res => setTimeout(res, 500))
      for (let i = 0; i < editorialPages.length; i++) {
        await exportAsImage(`ed-page-${i}`, `editorial-page-${i + 1}`)
        await new Promise(res => setTimeout(res, 500))
      }
    } catch (err) {
      alert('批量导出中断')
    } finally {
      setIsExporting(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen w-full bg-[#121212] text-white font-sans overflow-hidden relative">
      
      {tooltip.show && (
        <div
          className="fixed z-50 bg-white text-black text-[12px] font-black px-4 py-2 rounded-full shadow-2xl cursor-pointer transform -translate-x-1/2 flex items-center gap-2 hover:bg-gray-200 hover:scale-105 transition-all border border-black/10"
          style={{ left: tooltip.x, top: tooltip.y }}
          onClick={applyHeadingHighlight}
        >
          ✨ 设为排版小标题
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-black tracking-widest uppercase mb-2">正在一键压制全册文件...</h2>
          <p className="text-xs font-mono opacity-50">Please do not close this window.</p>
        </div>
      )}

      {/* 左侧控制面板 */}
      <div className="w-[400px] h-full bg-[#1E1E1E] border-r border-[#2C2C2C] flex flex-col p-6 overflow-y-auto shrink-0 z-20">
        <div className="mb-6 flex justify-between items-center border-b border-[#2C2C2C] pb-4">
          <div>
            <h1 className="text-lg font-bold tracking-wider text-white">
              EDITORIAL PRO®
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">版面美学与自动分页生成器</p>
          </div>
          <button onClick={exportAllPages} className="bg-white hover:bg-gray-200 text-black px-3 py-1.5 rounded text-[10px] font-mono tracking-widest font-bold transition-colors">
            ⬇️ 导出全册
          </button>
        </div>

        <div className="space-y-5 pb-12">
          {/* 1. 封面配置 */}
          <div className="p-3 bg-[#252525] rounded-lg border border-[#333] space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 block font-bold">Cover Configuration / 封面配置</span>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono"><span>封面图高度占比</span><span>{edCoverWeight}%</span></div>
              <input type="range" min="20" max="100" value={edCoverWeight} onChange={e => setEdCoverWeight(Number(e.target.value))} className="w-full accent-white" />
            </div>

            <label className="w-full py-2 bg-[#2A2A2A] hover:bg-[#333] border border-dashed border-[#444] rounded text-xs text-center cursor-pointer block text-gray-300 transition-colors">
              {edCoverImage ? '✨ 更换封面大图' : '+ 选择封面大图'}
              <input type="file" accept="image/*" className="hidden" onChange={handleEdCoverUpload} />
            </label>

            <div className="space-y-1 pt-1 border-t border-[#333]">
              <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                <span>封面黑色遮罩透明度</span>
                <span>{coverMaskOpacity}%</span>
              </div>
              <input type="range" min="0" max="100" value={coverMaskOpacity} onChange={e => setCoverMaskOpacity(Number(e.target.value))} className="w-full accent-white cursor-pointer" />
            </div>
          </div>

          {/* 2. 品牌与标识配置 */}
          <div className="p-3 bg-[#252525] rounded-lg border border-[#333] space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 block font-bold">Brand & Logo / 品牌与标识</span>
            
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 block">品牌/工作室名称</label>
              <input type="text" value={edStudioName} onChange={e => setEdStudioName(e.target.value)} className="w-full bg-[#1A1A1A] text-white border border-[#3A3A3A] rounded px-3 py-1.5 text-xs outline-none focus:border-white font-mono" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 block">正文标识呈现模式</label>
              <div className="grid grid-cols-2 gap-1 bg-[#1A1A1A] p-1 rounded">
                {(['text', 'logo'] as const).map(mode => (
                  <button key={mode} onClick={() => setEdDisplayMode(mode)} className={`py-1 text-[10px] font-bold rounded transition-all ${edDisplayMode === mode ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                    {mode === 'text' ? '仅文字' : '仅 Logo'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 block">Logo 资产文件</label>
              <label className="w-full py-1.5 bg-[#2A2A2A] hover:bg-[#333] border border-dashed border-[#444] rounded text-[11px] text-center cursor-pointer block text-gray-300 transition-colors">
                {edLogo ? '✨ 已上传 Logo (点击更换)' : '+ 上传 Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleEdLogoUpload} />
              </label>
              {edLogo && <button onClick={() => setEdLogo('')} className="text-[9px] text-red-400 hover:underline block pt-0.5">移除 Logo</button>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 block">副标题 / 卷期号</label>
              <input type="text" value={edCoverSubtitle} onChange={e => setEdCoverSubtitle(e.target.value)} className="w-full bg-[#1A1A1A] text-white border border-[#3A3A3A] rounded px-3 py-1.5 text-xs outline-none focus:border-white font-mono" />
            </div>
          </div>

          {/* 3. 画布比例与字体 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1.5 font-medium">Layout / 页面比例</label>
              <div className="flex gap-1">
                {(['3:4', '9:16'] as const).map(r => (
                  <button key={r} onClick={() => setEdRatio(r)} className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-all ${edRatio === r ? 'bg-white text-black border-white' : 'bg-[#2A2A2A] text-gray-300 border-[#3A3A3A]'}`}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1.5 font-medium">Typography / 字体</label>
              <select value={edFontFamily} onChange={e => setEdFontFamily(e.target.value)} className="w-full bg-[#2A2A2A] text-white border border-[#3A3A3A] rounded px-2 py-1.5 text-xs outline-none focus:border-white">
                <option value="SongTi">宋体 / Serif</option>
                <option value="HeiTi">黑体 / Sans</option>
                <option value="KaiTi">楷体 / Kai</option>
              </select>
            </div>
          </div>

          {/* 4. 字号选择 */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1.5 font-medium">Font Size / 字号大小</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['S', 'M', 'L', 'XL'] as const).map((size) => (
                <button key={size} onClick={() => setEdSizeLabel(size)} className={`py-1.5 text-xs font-semibold rounded border transition-all ${edSizeLabel === size ? 'bg-white text-black border-white' : 'bg-[#2A2A2A] text-gray-300 border-[#3A3A3A]'}`}>{size}</button>
              ))}
            </div>
          </div>

          {/* 5. 配色主题 */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1.5 font-medium">Color Palette / 配色主题</label>
            <div className="flex gap-3">
              {[
                { bg: '#FBF9F5', text: '#1C1C1C', name: '米白' },
                { bg: '#FFFFFF', text: '#000000', name: '纯白' },
                { bg: '#1A1A1A', text: '#E5E5E5', name: '暗黑' },
                { bg: '#F2EFE9', text: '#2D3748', name: '复古' },
              ].map((theme, i) => (
                <button key={i} onClick={() => { setEdBgColor(theme.bg); setEdTextColor(theme.text); }} className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center overflow-hidden transition-transform hover:scale-105" style={{ backgroundColor: theme.bg }} title={theme.name}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.text }} />
                </button>
              ))}
            </div>
          </div>

          {/* 6. 配图库管理 */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1.5 font-medium">Insert Images / 正文插图库 ([IMG])</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {bodyImages.map((imgObj, idx) => (
                <div key={idx} className="relative aspect-square bg-[#2A2A2A] rounded overflow-hidden border border-[#3A3A3A] group">
                  <img src={imgObj.url} className={`w-full h-full object-cover transition-all ${!imgObj.checked ? 'opacity-30 grayscale' : ''}`} alt="asset" />
                  <div className="absolute bottom-1 left-1 bg-black/70 rounded p-0.5 z-10">
                    <input type="checkbox" checked={imgObj.checked} onChange={() => setBodyImages(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item))} className="w-3 h-3 accent-white cursor-pointer" />
                  </div>
                  <button onClick={() => setBodyImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0.5 right-0.5 bg-red-600 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
              <label className="aspect-square bg-[#2A2A2A] hover:bg-[#333] border border-dashed border-[#444] rounded flex flex-col items-center justify-center cursor-pointer text-gray-400">
                <span className="text-lg">+</span>
                <span className="text-[9px]">添加图片</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleBodyImageUpload} />
              </label>
            </div>
          </div>

          {/* 7. 标题与正文输入 */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-[10px] uppercase tracking-widest text-gray-400 block font-medium">Content Editor / 文章内容</label>
              <span className="text-[10px] text-emerald-400 font-bold animate-pulse">💡 支持右侧划词自动高亮</span>
            </div>
            <input type="text" value={edTitle} onChange={e => setEdTitle(e.target.value)} placeholder="画册大标题" className="w-full bg-[#141414] text-white border border-[#333] rounded px-3 py-2 text-xs outline-none focus:border-white font-bold" />
            <textarea value={editorialText} onChange={e => setEditorialText(e.target.value)} placeholder="在此粘贴长文章..." className="w-full h-48 bg-[#141414] text-gray-200 border border-[#333] rounded p-3 text-xs leading-relaxed outline-none focus:border-white resize-none font-mono" />
          </div>
        </div>
      </div>

      {/* 右侧预览区 */}
      <div 
        className="flex-1 h-screen bg-[#121212] overflow-y-auto p-12 flex flex-col items-center gap-16 pb-32"
        onMouseUp={handleSelection}
      >
        
        {/* 封面预览 */}
        <div className="flex flex-col items-center gap-3 group">
          <div className="flex justify-between w-[360px] text-[10px] font-mono tracking-widest text-gray-400 uppercase">
            <span>PAGE 00 // COVER</span>
            <button onClick={() => exportAsImage('ed-cover', 'editorial-cover')} className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-2 py-0.5 rounded font-bold">导出此页</button>
          </div>
          <div className="relative shadow-2xl overflow-hidden" style={{ width: '360px', height: edRatio === '3:4' ? '480px' : '640px' }}>
            <div id="ed-cover" className="absolute inset-0 flex flex-col justify-between" style={{ width: '720px', height: edRatio === '3:4' ? '960px' : '1280px', transform: 'scale(0.5)', transformOrigin: 'top left', backgroundColor: edBgColor, color: edTextColor, fontFamily: getFontFamilyStyle(edFontFamily) }}>
              
              <div className="relative overflow-hidden shrink-0 bg-black/10" style={{ height: `${edCoverWeight}%` }}>
                {edCoverImage ? (
                  <>
                    <img src={edCoverImage} className="w-full h-full object-cover" alt="Cover" />
                    <div className="absolute inset-0 bg-black pointer-events-none transition-opacity" style={{ opacity: coverMaskOpacity / 100 }} />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono tracking-widest opacity-40 uppercase">[ NO COVER IMAGE ]</div>
                )}
              </div>

              {/* 细节6: 副标题美观和谐并严格左对齐大标题 */}
              <div className="flex-1 p-16 flex flex-col justify-between">
                <div className="space-y-2">
                  <div 
                    className="text-[13px] font-semibold tracking-[0.25em] uppercase opacity-70" 
                    style={{ fontFamily: STRICT_SANS_SERIF }}
                  >
                    {edCoverSubtitle}
                  </div>
                  <h1 className="text-[52px] font-extrabold leading-[1.1] uppercase tracking-tight">
                    {edTitle}
                  </h1>
                </div>

                <div className="border-t pt-6 flex justify-between items-end border-current opacity-80" style={{ fontFamily: STRICT_SANS_SERIF }}>
                  <div className="flex items-center gap-3 text-lg font-bold">
                    {edLogo && <img src={edLogo} className="h-8 max-w-[120px] object-contain" alt="Logo" />}
                    <span>{edStudioName}</span>
                  </div>
                  
                  {/* 细节4: 放大字数阅读时间，调大到 15px 并加粗 */}
                  <div className="text-right text-[15px] font-bold opacity-90 leading-relaxed tracking-wider">
                    本文约 {totalChars} 字，阅读需要 {readingTime} 分钟
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 正文预览 */}
        {editorialPages.map((pageBlocks, pageIndex) => (
          <div key={pageIndex} className="flex flex-col items-center gap-3 group">
            <div className="flex justify-between w-[360px] text-[10px] font-mono tracking-widest text-gray-400 uppercase">
              <span>PAGE {String(pageIndex + 1).padStart(2, '0')} // BODY</span>
              <button onClick={() => exportAsImage(`ed-page-${pageIndex}`, `editorial-page-${pageIndex + 1}`)} className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-2 py-0.5 rounded font-bold">导出此页</button>
            </div>

            <div className="relative shadow-2xl overflow-hidden" style={{ width: '360px', height: edRatio === '3:4' ? '480px' : '640px' }}>
              <div id={`ed-page-${pageIndex}`} className="absolute inset-0 flex flex-col justify-between" style={{ width: '720px', height: edRatio === '3:4' ? '960px' : '1280px', transform: 'scale(0.5)', transformOrigin: 'top left', backgroundColor: edBgColor, color: edTextColor, padding: `${ADVANCED_PADDING_Y}px ${ADVANCED_PADDING_X}px`, fontFamily: getFontFamilyStyle(edFontFamily) }}>
                
                {/* 页眉区 */}
                <div className="flex justify-between items-center border-b pb-4 tracking-widest opacity-50 uppercase shrink-0" style={{ borderColor: `${edTextColor}22`, fontFamily: STRICT_SANS_SERIF }}>
                  <div className="flex items-center gap-3">
                    {edDisplayMode === 'logo' && edLogo ? (
                      <img src={edLogo} className="h-8 max-w-[140px] object-contain" alt="Header Logo" />
                    ) : (
                      <span className="text-xs font-bold">{edStudioName}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold font-mono">{String(pageIndex + 1).padStart(2, '0')}</span>
                </div>

                {/* 正文内容区 */}
                <div className="flex-1 py-6 overflow-hidden flex flex-col justify-start text-justify tracking-wide selection:bg-black/20" style={{ fontSize: `${FONT_SIZE_MAP[edSizeLabel]}px`, lineHeight: ADVANCED_LINE_HEIGHT }}>
                  <div className="space-y-4">
                    {pageBlocks.map((block, bIdx) => {
                      if (block.type === 'text') {
                        return (
                          <div key={bIdx} className="whitespace-pre-wrap">
                            {renderTextWithHighlights(block.content)}
                          </div>
                        )
                      }
                      if (block.type === 'image') {
                        const imgSrc = activeImages[block.index]?.url
                        const targetHeight = IMG_GRID_LINES * FONT_SIZE_MAP[edSizeLabel] * ADVANCED_LINE_HEIGHT
                        const bottomMargin = FONT_SIZE_MAP[edSizeLabel] * ADVANCED_LINE_HEIGHT
                        return (
                          <div key={bIdx} className="w-full relative overflow-hidden bg-black/5 rounded shadow-sm" style={{ height: targetHeight, marginBottom: bottomMargin }}>
                            {imgSrc && <img src={imgSrc} className="w-full h-full object-cover" alt="body asset" />}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>

                {/* 细节3: 去掉正文左下角 Logo，保留干练极简页脚 */}
                <div className="flex justify-between items-center tracking-widest opacity-40 uppercase pt-4 shrink-0 text-[10px] font-mono border-t" style={{ borderColor: `${edTextColor}11`, fontFamily: STRICT_SANS_SERIF }}>
                  <div></div>
                  <div>EDITION 2026</div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}