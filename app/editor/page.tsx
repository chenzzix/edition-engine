'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toPng } from 'html-to-image'

// 排版黄金常数（精细化调整页边距与行高，最大化版面利用率）
const ADVANCED_LINE_HEIGHT = 1.95
const ADVANCED_PADDING_X = 64 // 左右页边距 (px)
const ADVANCED_PADDING_Y = 48 // 上下页边距 (px) - 缩小上下边距以容纳更多文字
const IMG_GRID_LINES = 10     // 图片占用预估行数

const FONT_SIZE_MAP: Record<string, number> = {
  'S': 16,
  'M': 18,
  'L': 20,
  'XL': 22,
}

type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'image'; index: number }

export default function EditorPage() {
  const [mounted, setMounted] = useState(false)
  const [edRatio, setEdRatio] = useState<'3:4' | '9:16'>('3:4')
  const [edSizeLabel, setEdSizeLabel] = useState<'S' | 'M' | 'L' | 'XL'>('M')
  const [edFontFamily, setEdFontFamily] = useState<string>('SongTi')
  const [edBgColor, setEdBgColor] = useState<string>('#FBF9F5')
  const [edTextColor, setEdTextColor] = useState<string>('#1C1C1C')
  const [activeImages, setActiveImages] = useState<string[]>([])
  
  const [editorialText, setEditorialText] = useState<string>(
    `留白不是空无一物，而是视觉的延伸与呼吸的节奏。在版面中，适当的留白能让核心视觉点更加聚焦。\n\n` +
    `核心驱动力：基于灵魂指示星和命主星，解读我此生灵魂渴望体验的主要课题是什么？进化的方向（南北交点轴线）：基于南北交点，指出我过于熟悉、容易陷入的“舒适区”（前世习气）在哪里？以及我此生必须努力拓展、甚至感到陌生的“进化区”在哪里？\n\n` +
    `识别“定业”与惯性：不要只告诉我“某星在某宫不好”，请将其翻译为心理模式。指出我生命中反复出现的、根深蒂固的思维或情绪惯性是什么？（例如：在关系中总是无意识地自我牺牲，或者在事业上总是因为完美主义而停滞）。\n\n` +
    `这些惯性在生活中通常以什么样的“挑战”或“困境”呈现？理解并转化这些模式，是通往自我掌控的关键一步。`
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // 计算字数与预计阅读时间
  const totalChars = useMemo(() => {
    return editorialText.replace(/\s/g, '').length
  }, [editorialText])

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(totalChars / 350))
  }, [totalChars])

  // 精准分页引擎算法（解决过早换页和底部留白过大问题）
  const editorialPages = useMemo(() => {
    if (!mounted) return []

    const currentFontSize = FONT_SIZE_MAP[edSizeLabel] || 18
    const contentWidth = 720 - ADVANCED_PADDING_X * 2
    const charsPerLine = Math.floor(contentWidth / currentFontSize)

    const canvasHeight = edRatio === '3:4' ? 960 : 1280
    // 页眉页脚加内边距所占空间预留
    const headerFooterOverhead = 90
    const availableHeight = canvasHeight - ADVANCED_PADDING_Y * 2 - headerFooterOverhead
    const maxLinesPerPage = Math.floor(availableHeight / (currentFontSize * ADVANCED_LINE_HEIGHT))

    const paragraphs = editorialText.split('\n')
    const pages: ContentBlock[][] = []

    let currentBlocks: ContentBlock[] = []
    let currentChunk = ''
    let currentLines = 0
    let imageCounter = 0

    const pushTextChunk = () => {
      if (currentChunk.trim()) {
        currentBlocks.push({ type: 'text', content: currentChunk.trimEnd() })
        currentChunk = ''
      }
    }

    const startNewPage = () => {
      pushTextChunk()
      if (currentBlocks.length > 0) {
        pages.push(currentBlocks)
        currentBlocks = []
        currentLines = 0
      }
    }

    paragraphs.forEach((para) => {
      // 图片占位处理
      if (para.trim() === '[IMG]') {
        if (imageCounter < activeImages.length) {
          if (currentLines + IMG_GRID_LINES > maxLinesPerPage && currentLines > 0) {
            startNewPage()
          }
          pushTextChunk()
          currentBlocks.push({ type: 'image', index: imageCounter++ })
          currentLines += IMG_GRID_LINES
        }
        return
      }

      // 空行处理（换行紧凑化）
      if (!para.trim()) {
        currentChunk += '\n'
        currentLines += 0.8
        return
      }

      // 计算当前段落行数
      const paraLines = Math.max(1, Math.ceil(para.length / charsPerLine))

      // 如果加起来超出页面最大容纳行数，则分页
      if (currentLines + paraLines > maxLinesPerPage && currentLines > 0) {
        startNewPage()
        currentChunk = para + '\n'
        currentLines = paraLines + 0.5
      } else {
        currentChunk += para + '\n'
        currentLines += paraLines + 0.5
      }
    })

    startNewPage()
    return pages
  }, [editorialText, edRatio, edSizeLabel, activeImages, mounted])

  // 图片上传处理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      setActiveImages((prev) => [...prev, url])
      setEditorialText((prev) => prev + '\n\n[IMG]\n\n')
    }
  }

  // 导出单页 PNG 图片
  const handleExport = async (pageIndex: number) => {
    const el = document.getElementById(`ed-page-${pageIndex}`)
    if (!el) return
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `editorial-page-${pageIndex + 1}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('导出图片失败，请重试')
    }
  }

  // 字体映射
  const getFontFamilyStyle = (fontKey: string) => {
    switch (fontKey) {
      case 'SongTi':
        return '"SimSun", "STSong", "Songti SC", "Noto Serif SC", serif'
      case 'HeiTi':
        return '"PingFang SC", "Microsoft YaHei", "Heiti SC", sans-serif'
      case 'KaiTi':
        return '"Kaiti SC", "STKaiti", "KaiTi", serif'
      default:
        return 'serif'
    }
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen w-full bg-[#121212] text-white font-sans overflow-hidden">
      {/* 左侧控制面板 */}
      <div className="w-[380px] h-full bg-[#1E1E1E] border-r border-[#2C2C2C] flex flex-col p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-wider text-white">
            EDITORIAL PRO®
          </h1>
          <p className="text-xs text-gray-400 mt-1">版面美学与自动分页生成器</p>
        </div>

        {/* 1. 画布比例 */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">
            Layout / 页面比例
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setEdRatio('3:4')}
              className={`py-2 text-xs font-semibold rounded border transition-all ${
                edRatio === '3:4'
                  ? 'bg-white text-black border-white'
                  : 'bg-[#2A2A2A] text-gray-300 border-[#3A3A3A] hover:bg-[#333]'
              }`}
            >
              3 : 4
            </button>
            <button
              onClick={() => setEdRatio('9:16')}
              className={`py-2 text-xs font-semibold rounded border transition-all ${
                edRatio === '9:16'
                  ? 'bg-white text-black border-white'
                  : 'bg-[#2A2A2A] text-gray-300 border-[#3A3A3A] hover:bg-[#333]'
              }`}
            >
              9 : 16
            </button>
          </div>
        </div>

        {/* 2. 字号选择 */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">
            Font Size / 字号大小
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['S', 'M', 'L', 'XL'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setEdSizeLabel(size)}
                className={`py-1.5 text-xs font-semibold rounded border transition-all ${
                  edSizeLabel === size
                    ? 'bg-white text-black border-white'
                    : 'bg-[#2A2A2A] text-gray-300 border-[#3A3A3A] hover:bg-[#333]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 字体选择 */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">
            Typography / 字体风格
          </label>
          <select
            value={edFontFamily}
            onChange={(e) => setEdFontFamily(e.target.value)}
            className="w-full bg-[#2A2A2A] text-white border border-[#3A3A3A] rounded px-3 py-2 text-xs outline-none focus:border-white"
          >
            <option value="SongTi">宋体 / Classic Serif</option>
            <option value="HeiTi">黑体 / Modern Sans</option>
            <option value="KaiTi">楷体 / Calligraphy</option>
          </select>
        </div>

        {/* 4. 配色选择 */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">
            Color Palette / 配色主题
          </label>
          <div className="flex gap-3">
            {[
              { bg: '#FBF9F5', text: '#1C1C1C', name: '米白' },
              { bg: '#FFFFFF', text: '#000000', name: '纯白' },
              { bg: '#1A1A1A', text: '#E5E5E5', name: '暗黑' },
              { bg: '#F2EFE9', text: '#2D3748', name: '复古' },
            ].map((theme, i) => (
              <button
                key={i}
                onClick={() => {
                  setEdBgColor(theme.bg)
                  setEdTextColor(theme.text)
                }}
                className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center overflow-hidden transition-transform hover:scale-105"
                style={{ backgroundColor: theme.bg }}
                title={theme.name}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.text }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 5. 配图插入 */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">
            Insert Image / 插入配图
          </label>
          <label className="w-full py-2 bg-[#2A2A2A] hover:bg-[#333] border border-dashed border-[#444] rounded text-xs text-center cursor-pointer block text-gray-300 transition-colors">
            + 点击上传图片 (自动插入 [IMG])
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {/* 6. 文案输入框 */}
        <div className="flex-1 flex flex-col min-h-[200px]">
          <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">
            Content Editor / 正文内容
          </label>
          <textarea
            value={editorialText}
            onChange={(e) => setEditorialText(e.target.value)}
            placeholder="在此粘贴长文章..."
            className="w-full flex-1 bg-[#141414] text-gray-200 border border-[#333] rounded p-3 text-xs leading-relaxed outline-none focus:border-gray-500 resize-none font-mono"
          />
        </div>
      </div>

      {/* 右侧实时渲染与预览区 */}
      <div className="flex-1 h-full bg-[#121212] overflow-y-auto p-12 flex flex-col items-center gap-12">
        {editorialPages.map((pageBlocks, pageIndex) => (
          <div key={pageIndex} className="flex flex-col items-center">
            {/* 页面画布 */}
            <div
              id={`ed-page-${pageIndex}`}
              className="relative shadow-2xl flex flex-col justify-between overflow-hidden transition-all"
              style={{
                width: '720px',
                height: edRatio === '3:4' ? '960px' : '1280px',
                backgroundColor: edBgColor,
                color: edTextColor,
                padding: `${ADVANCED_PADDING_Y}px ${ADVANCED_PADDING_X}px`,
                fontFamily: getFontFamilyStyle(edFontFamily),
              }}
            >
              {/* 页眉区 */}
              <div className="w-full border-b pb-3 mb-4 flex justify-between items-end border-current opacity-80">
                <div>
                  <div className="text-[10px] tracking-widest uppercase opacity-50 font-mono">
                    VOLUME INDEX
                  </div>
                  <div className="text-xs font-bold tracking-wider font-mono">
                    EDITORIAL TYPOGRAPHY®
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] tracking-widest uppercase opacity-50 font-mono">
                    TOTAL CONTENT
                  </div>
                  <div className="text-xs font-medium font-mono">{totalChars} 字</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-widest uppercase opacity-50 font-mono">
                    EST. DURATION
                  </div>
                  <div className="text-xs font-medium font-mono text-emerald-700">
                    阅读约 {readingTime} 分钟
                  </div>
                </div>
              </div>

              {/* 正文区域（紧凑布局，自动充实页面底部） */}
              <div
                className="flex-1 overflow-hidden flex flex-col justify-start text-justify tracking-wide"
                style={{
                  fontSize: `${FONT_SIZE_MAP[edSizeLabel]}px`,
                  lineHeight: ADVANCED_LINE_HEIGHT,
                }}
              >
                {pageBlocks.map((block, bIdx) => {
                  if (block.type === 'text') {
                    return (
                      <div key={bIdx} className="mb-2 whitespace-pre-wrap">
                        {block.content}
                      </div>
                    )
                  }
                  if (block.type === 'image') {
                    const imgSrc = activeImages[block.index]
                    return (
                      <div
                        key={bIdx}
                        className="my-3 w-full h-[220px] bg-gray-200 overflow-hidden rounded relative border border-black/10"
                      >
                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt="uploaded"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              {/* 页脚区 */}
              <div className="w-full border-t pt-3 mt-4 flex justify-between items-center border-current opacity-70 text-[10px] font-mono tracking-widest uppercase">
                <div>TYPOGRAPHY® // LAYOUT SYSTEM</div>
                <div>PAGE {String(pageIndex + 1).padStart(2, '0')}</div>
                <div>EDITION 2026</div>
              </div>
            </div>

            {/* 单页导出按钮 */}
            <button
              onClick={() => handleExport(pageIndex)}
              className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full text-xs tracking-wider uppercase transition-colors"
            >
              Export Page {pageIndex + 1}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}