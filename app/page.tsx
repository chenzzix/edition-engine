'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toJpeg } from 'html-to-image'

export default function EditorialTool() {
  const [mounted, setMounted] = useState(false)
  const [ratio, setRatio] = useState<'3:4' | '9:16'>('3:4')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [themeColor, setThemeColor] = useState('#000000')
  const [fullContent, setFullContent] = useState('在此粘贴长文章...')
  const [headerTitle, setHeaderTitle] = useState('TYPOGRAPHY®')

  useEffect(() => setMounted(true), [])

  // 智能行数分页算法：确保底部页边距绝对安全
  const pages = useMemo(() => {
    if (!mounted) return []
    const maxLines = ratio === '3:4' ? 12 : 18
    const charsPerLine = 22 
    const paragraphs = fullContent.split('\n')
    const result: string[] = []
    let currentChunk = ""; let currentLines = 0
    paragraphs.forEach(para => {
      const lines = Math.max(1, Math.ceil(para.length / charsPerLine))
      if (currentLines + lines > maxLines && currentChunk !== "") {
        result.push(currentChunk.trimEnd()); currentChunk = para + '\n'; currentLines = lines
      } else { currentChunk += para + '\n'; currentLines += lines }
    })
    if (currentChunk) result.push(currentChunk.trimEnd())
    return result
  }, [fullContent, ratio, mounted])

  if (!mounted) return null

  const exportJPG = async (id: string, name: string) => {
    const node = document.getElementById(id)
    if (!node) return
    const dataUrl = await toJpeg(node, { quality: 0.95, pixelRatio: 2.5 })
    const link = document.createElement('a'); link.download = `${name}.jpg`; link.href = dataUrl; link.click()
  }

  const boardSize = ratio === '3:4' ? { width: '900px', height: '1200px' } : { width: '900px', height: '1600px' }

  return (
    <main className="min-h-screen bg-zinc-100 flex flex-col lg:flex-row">
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;900&display=swap');`}</style>
      
      <aside className="w-full lg:w-[400px] bg-white h-screen p-8 border-r overflow-y-auto shrink-0">
        <h1 className="text-xl font-black italic mb-8 border-b-2 pb-4 uppercase">Editorial Pro</h1>
        <div className="space-y-6">
          <div><span className="text-[10px] font-bold opacity-40 uppercase">Layout</span>
            <div className="flex gap-2 mt-2">
              {['3:4', '9:16'].map(r => <button key={r} onClick={() => setRatio(r as any)} className={`flex-1 py-2 text-xs border ${ratio === r ? 'bg-black text-white' : ''}`}>{r}</button>)}
            </div>
          </div>
          <input type="text" value={headerTitle} onChange={e => setHeaderTitle(e.target.value)} className="w-full border-b py-2 text-sm font-bold" placeholder="页眉标题" />
          <textarea value={fullContent} onChange={e => setFullContent(e.target.value)} className="w-full border p-3 h-64 text-xs font-serif leading-relaxed" placeholder="输入长文内容..." />
        </div>
      </aside>

      <section className="flex-1 h-screen overflow-y-auto p-12 bg-zinc-200 flex flex-col items-center gap-20 pb-40">
        {pages.map((content, idx) => (
          <div key={idx} className="flex flex-col items-center gap-4">
            <div className="shadow-2xl bg-white relative overflow-hidden" style={{ width: '360px', height: ratio === '3:4' ? '480px' : '640px' }}>
              <div className="origin-top-left scale-[0.4]" style={{ ...boardSize }}>
                <div id={`ed-${idx}`} className="absolute inset-0 grid grid-rows-[auto_1fr_auto] p-[80px] font-serif" style={{ backgroundColor: bgColor, color: '#000' }}>
                  <div className="flex justify-between border-b pb-6 text-[18px] font-black uppercase tracking-widest">
                    <span>{headerTitle}</span><span>PAGE {idx + 1}</span>
                  </div>
                  <div className="py-12 overflow-hidden text-[32px] leading-[2.2] text-justify">{content}</div>
                  <div className="flex justify-end text-[20px] font-bold italic opacity-30">Studio Editorial / 2026</div>
                </div>
              </div>
            </div>
            <button onClick={() => exportJPG(`ed-${idx}`, `Page-${idx+1}`)} className="bg-white px-4 py-2 text-[10px] font-bold rounded-full shadow-md uppercase">Export Page</button>
          </div>
        ))}
      </section>
    </main>
  )
}