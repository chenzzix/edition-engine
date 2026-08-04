'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { toPng } from 'html-to-image'

const ADVANCED_LINE_HEIGHT = 1.95
const ADVANCED_PADDING_X = 64
const ADVANCED_PADDING_Y = 56
const IMG_GRID_LINES = 12

const STRICT_SANS_SERIF = 'system-ui, -apple-system, "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif'

const FONT_SIZE_MAP = {
  small: 18,
  medium: 22,
  large: 25,
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

export default function EditorialEditorV7() {
  const [mounted, setMounted] = useState(false)

  const [edRatio, setEdRatio] = useState<'3:4' | '9:16'>('3:4')
  const [edStudioName, setEdStudioName] = useState('EDITORIAL TYPOGRAPHY®') 
  const [edCoverSubtitle, setEdCoverSubtitle] = useState('STUDIO ARCHIVE / VOL.01') 
  
  const [edLogo, setEdLogo] = useState<string>('')
  const [edDisplayMode, setEdDisplayMode] = useState<'text' | 'logo'>('text')

  // 【更新】：默认封面标题修改为“设计中的留白与呼吸”
  const [edTitle, setEdTitle] = useState('设计中的留白与呼吸')
  const [editorialText, setEditorialText] = useState('留白不是空无一物，而是视觉的延伸与呼吸的节奏。在版面中，适当的留白能让核心视觉点更加聚焦。\n\n[IMG]\n\n优秀的排版应当像一首诗，行与行之间有恰到好处的停顿。摒弃繁琐的装饰，让文字本身成为设计的主角。通过精准控制文字的色彩、字体的性格以及纸张的温润底色，我们可以为读者创造沉浸式的、如同阅读实体纸媒一般的精神体验。')
  const [bodyImages, setBodyImages] = useState<{ url: string; checked: boolean }[]>([])

  const [coverMaskOpacity, setCoverMaskOpacity] = useState(0)

  const [edSizeLabel, setEdSizeLabel] = useState<'small' | 'medium' | 'large'>('medium')
  
  const [edCoverImage, setEdCoverImage] = useState<string>('')
  const [edCoverWeight, setEdCoverWeight] = useState(60) 

  const [edFontFamily, setEdFontFamily] = useState<'sans' | 'serif'>('serif')
  const [edBgColor, setEdBgColor] = useState('#FDFBF7')
  const [textR, setTextR] = useState(28)
  const [textG, setTextG] = useState(28)
  const [textB, setTextB] = useState(28)

  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const activeImages = useMemo(() => bodyImages.filter(img => img.checked), [bodyImages])

  const edStats = useMemo(() => {
    const cleanText = editorialText.replace(/\[IMG\]/g, '')
    const charCount = cleanText.replace(/\s/g, '').length
    const readingTime = Math.ceil(charCount / 350)
    return { charCount, readingTime }
  }, [editorialText])

  const editorialPages = useMemo(() => {
    if (!mounted) return []
    const currentFontSize = FONT_SIZE_MAP[edSizeLabel]
    const charsPerLine = Math.floor((720 - ADVANCED_PADDING_X * 2) / currentFontSize)
    const canvasHeight = edRatio === '3:4' ? 960 : 1280
    
    const headerFooterOverhead = 80 
    const availableHeight = canvasHeight - ADVANCED_PADDING_Y * 2 - headerFooterOverhead
    const maxLines = Math.floor(availableHeight / (currentFontSize * ADVANCED_LINE_HEIGHT))

    const paragraphs = editorialText.split('\n')
    const result: ContentBlock[][] = []
    
    let currentBlocks: ContentBlock[] = []
    let currentChunk = ""
    let currentLines = 0
    let imageCounter = 0

    const pushTextChunk = () => {
      if (currentChunk.trim()) {
        currentBlocks.push({ type: 'text', content: currentChunk.trimEnd() })
        currentChunk = ""
      }
    }

    const pushNewPage = () => {
      pushTextChunk()
      if (currentBlocks.length > 0) {
        result.push(currentBlocks)
        currentBlocks = []
        currentLines = 0
      }
    }

    paragraphs.forEach(para => {
      if (para.trim() === '[IMG]') {
        if (imageCounter < activeImages.length) {
          if (currentLines + IMG_GRID_LINES > maxLines && currentLines > 0) {
            pushNewPage()
          }
          pushTextChunk()
          currentBlocks.push({ type: 'image', index: imageCounter++ })
          currentLines += IMG_GRID_LINES + 1 
        }
        return
      }

      if (!para.trim()) {
        currentChunk += '\n'
        currentLines += 1
        return
      }

      const linesNeeded = Math.max(1, Math.ceil(para.length / charsPerLine))
      if (currentLines + linesNeeded > maxLines && currentChunk !== "") {
        pushNewPage()
        currentChunk = para + '\n\n'
        currentLines = linesNeeded + 1
      } else {
        currentChunk += para + '\n\n'
        currentLines += linesNeeded + 1
      }
    })
    
    pushNewPage()
    return result
  }, [editorialText, edRatio, edSizeLabel, activeImages, mounted])

  const handleEdCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setEdCoverImage(URL.createObjectURL(e.target.files[0]))
  }

  const handleEdLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setEdLogo(URL.createObjectURL(e.target.files[0]))
  }

  const handleBodyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBodyImages(prev => [...prev, { url: URL.createObjectURL(e.target.files![0]), checked: true }])
    }
  }

  const exportAsImage = async (id: string, name: string) => {
    const node = document.getElementById(id)
    if (!node) return
    const dataUrl = await toPng(node, { 
      quality: 1, 
      pixelRatio: 2.5,
      backgroundColor: edBgColor 
    })
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
      
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
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
                <label className="text-[10px] font-bold text-zinc-400 block">品牌名称</label>
                <input type="text" value={edStudioName} onChange={e => setEdStudioName(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs bg-white focus:border-black outline-none font-mono" placeholder="输入品牌名称" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">正文标识呈现模式</label>
                <div className="grid grid-cols-2 gap-1 bg-zinc-200/60 p-1 rounded-lg">
                  {(['text', 'logo'] as const).map(mode => (
                    <button key={mode} onClick={() => setEdDisplayMode(mode)} className={`py-1 text-[10px] font-bold rounded-md transition-all ${edDisplayMode === mode ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}>
                      {mode === 'text' ? '仅文字' : '仅 Logo'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block">标志图像 (Logo Asset)</label>
                <div className="border border-dashed border-zinc-300 rounded-lg p-3 text-center bg-white hover:bg-zinc-50/50 transition-colors relative cursor-pointer">
                  <span className="text-[10px] text-zinc-500 block font-bold">
                    {edLogo ? '✨已加载自定义 Logo (点击更换)' : '➕ 插入自定义 Logo 资产'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleEdLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {edLogo && <button onClick={() => setEdLogo('')} className="text-[9px] text-red-500 hover:text-red-700 underline block pt-0.5 transition-colors">移除已加载的 Logo</button>}
              </div>

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
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button key={size} onClick={() => setEdSizeLabel(size)} className={`py-2 text-xs border rounded-lg font-bold transition-all ${edSizeLabel === size ? 'border-black bg-black text-white font-black' : 'border-zinc-200'}`}>
                    {size === 'small' ? '小 (18px)' : size === 'medium' ? '中 (22px)' : '大 (25px)'}
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

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-[10px] uppercase font-black opacity-40 tracking-wider">编辑正文与排版图</label>
              </div>
              
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 block">🖼️ 正文插图库 (换行输入 [IMG] 即可插入)</span>
                <div className="grid grid-cols-4 gap-2">
                  {bodyImages.map((imgObj, idx) => (
                    <div key={idx} className="relative aspect-square bg-zinc-200 rounded-lg overflow-hidden border border-zinc-300 group/img shadow-sm">
                      <img src={imgObj.url} className={`w-full h-full object-cover transition-all ${!imgObj.checked ? 'opacity-30 grayscale scale-95' : ''}`} alt="body asset" />
                      <div className="absolute bottom-1 left-1 bg-black/70 rounded p-1 flex items-center justify-center backdrop-blur-sm z-10 border border-white/20">
                        <input 
                          type="checkbox" 
                          checked={imgObj.checked} 
                          onChange={() => {
                            setBodyImages(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item))
                          }} 
                          className="w-3.5 h-3.5 accent-white cursor-pointer rounded"
                        />
                      </div>
                      <button onClick={() => setBodyImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0.5 right-0.5 bg-black/60 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10">×</button>
                    </div>
                  ))}
                  <label className="aspect-square border border-dashed border-zinc-300 rounded-lg hover:bg-zinc-100 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <span className="text-[18px] text-zinc-400 font-bold">+</span>
                    <span className="text-[8px] text-zinc-400 scale-90">添加配图</span>
                    <input type="file" accept="image/*" onChange={handleBodyImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <input type="text" value={edTitle} onChange={e => setEdTitle(e.target.value)} placeholder="画册大标题" className="w-full border-b-2 border-zinc-300 focus:border-black py-1 font-bold text-md outline-none transition-colors" />
              <textarea value={editorialText} onChange={e => setEditorialText(e.target.value)} className="w-full border rounded-xl p-3 h-56 text-xs leading-relaxed font-serif outline-none focus:border-black bg-zinc-50/50" placeholder="在此输入长文章正文内容...\n\n需要插图的地方换行输入 [IMG]" />
            </div>
          </div>
        </div>
      </aside>

      <section className="flex-1 h-screen overflow-y-auto p-8 lg:p-16 bg-[#E8E8E8] flex flex-col items-center gap-16 pb-44">
        <div className="w-full flex flex-col items-center gap-20">
          
          {/* ========================================== */}
          {/* 1. 独立封面页 */}
          {/* ========================================== */}
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
                      <img src={edCoverImage} className="w-full h-full object-cover" alt="Cover" />
                      <div className="absolute inset-0 bg-black pointer-events-none transition-opacity" style={{ opacity: coverMaskOpacity / 100 }} />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 font-mono text-[11px] uppercase tracking-widest gap-1"><span>[ NO COVER IMAGE LOADED ]</span></div>
                  )}
                  
                  {edCoverWeight >= 75 && (
                    <div className="absolute bottom-16 left-16 right-16 text-white flex flex-col justify-between">
                      <div>
                        {/* 【更新】：优化副标题为 Serif、Medium、18px、字间距 0.18em、opacity 0.75、左对齐，去掉了 uppercase/mono */}
                        <p className="font-serif font-medium text-[18px] tracking-[0.18em] mb-4 opacity-75">{edCoverSubtitle}</p>
                        {/* 【更新】：标题去掉 uppercase，调整 line-height 为 1.05 */}
                        <h1 className="text-[56px] font-extrabold leading-[1.05] tracking-tighter drop-shadow-sm mb-8">{edTitle}</h1>
                      </div>
                      <div className="border-t border-white/30 pt-6 flex justify-between items-end tracking-wide">
                        {/* 【更新】：去掉封面左下角 Logo，只保留品牌名称文字 */}
                        <div className="flex items-center gap-3 text-[20px] font-bold" style={{ fontFamily: STRICT_SANS_SERIF }}>
                          <span className="truncate">{edStudioName}</span>
                        </div>
                        {/* 【更新】：字数统计文字放大至 16px，增加 tracking-widest */}
                        <div className="text-right text-[16px] font-medium opacity-95 tracking-widest" style={{ fontFamily: STRICT_SANS_SERIF }}>
                          本文约 {edStats.charCount} 字，阅读需要 {edStats.readingTime} 分钟
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {edCoverWeight < 75 && (
                  <div className="flex-1 p-16 flex flex-col justify-between" style={{ color: computedTextColor }}>
                    <div>
                      {/* 【更新】：优化副标题为 Serif、Medium、18px、字间距 0.18em、opacity 0.75、左对齐 */}
                      <p className="font-serif font-medium text-[18px] tracking-[0.18em] mb-4 opacity-75">{edCoverSubtitle}</p>
                      {/* 【更新】：标题去掉 uppercase，调整 line-height 为 1.05 */}
                      <h1 className="text-[64px] font-extrabold leading-[1.05] tracking-tighter">{edTitle}</h1>
                    </div>
                    
                    <div className="border-t pt-6 flex justify-between items-end tracking-wide" style={{ borderColor: `${computedTextColor}22` }}>
                      {/* 【更新】：去掉封面左下角 Logo，只保留品牌名称文字 */}
                      <div className="flex items-center gap-3 text-[20px] font-bold" style={{ fontFamily: STRICT_SANS_SERIF }}>
                        <span className="truncate">{edStudioName}</span>
                      </div>
                      {/* 【更新】：字数统计文字放大至 16px，增加 tracking-widest */}
                      <div className="text-right text-[16px] font-medium opacity-90 tracking-widest" style={{ fontFamily: STRICT_SANS_SERIF }}>
                        本文约 {edStats.charCount} 字，阅读需要 {edStats.readingTime} 分钟
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 2. 正文分页列表 */}
          {/* ========================================== */}
          {editorialPages.map((blocks, index) => (
            <div key={index} className="flex flex-col items-center gap-4 group">
              <div className="flex items-center justify-between w-[360px]">
                <span className="text-[10px] font-black opacity-40 tracking-widest uppercase">PAGE {String(index + 1).padStart(2, '0')} // BODY</span>
                <button onClick={() => exportAsImage(`ed-page-${index}`, `Editorial-Page-${index + 1}`)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-black text-white px-2 py-1 rounded">导出此页</button>
              </div>
              
              <div className="bg-white shadow-xl relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl" style={{ width: '360px', height: edRatio === '3:4' ? '480px' : '640px' }}>
                
                <div id={`ed-page-${index}`} className="absolute inset-0 flex flex-col justify-between" style={{ width: '720px', height: edRatio === '3:4' ? '960px' : '1280px', transform: 'scale(0.5)', transformOrigin: 'top left', backgroundColor: edBgColor, color: computedTextColor, padding: `${ADVANCED_PADDING_Y}px ${ADVANCED_PADDING_X}px`, fontFamily: getFontFamilyStyle(edFontFamily) }}>
                  
                  {/* 正文页眉 */}
                  <div className="flex justify-between items-center border-b pb-4 tracking-widest opacity-40 uppercase shrink-0" style={{ borderColor: `${computedTextColor}22`, fontFamily: STRICT_SANS_SERIF }}>
                    <div className="flex items-center gap-3">
                      {(edDisplayMode === 'logo') && edLogo ? (
                        <img src={edLogo} className="h-10 max-w-[150px] object-contain" alt="Header Logo" />
                      ) : null}
                      {(edDisplayMode === 'text' || (!edLogo && edDisplayMode === 'logo')) && (
                        <span className="text-[14px] font-bold">{edStudioName}</span>
                      )}
                    </div>
                    <span className="text-[14px] font-bold">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  
                  <div className="flex-1 py-6 text-justify overflow-hidden tracking-wide flex flex-col justify-start" style={{ fontSize: `${FONT_SIZE_MAP[edSizeLabel]}px`, lineHeight: ADVANCED_LINE_HEIGHT }}>
                    <div className="space-y-4">
                      {blocks.map((block, bIdx) => {
                        if (block.type === 'text') {
                          return <div key={bIdx} className="whitespace-pre-wrap">{block.content}</div>
                        } else {
                          const imgSrc = activeImages[block.index]?.url
                          const targetHeight = IMG_GRID_LINES * FONT_SIZE_MAP[edSizeLabel] * ADVANCED_LINE_HEIGHT
                          const bottomMargin = FONT_SIZE_MAP[edSizeLabel] * ADVANCED_LINE_HEIGHT

                          return (
                            <div key={bIdx} className="w-full relative overflow-hidden bg-zinc-200/40 rounded shadow-sm" style={{ height: targetHeight, marginBottom: bottomMargin }}>
                              {imgSrc ? (
                                <img src={imgSrc} className="w-full h-full object-cover" alt="Editorial Body" />
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