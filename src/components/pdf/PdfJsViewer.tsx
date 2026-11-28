"use client"

// Renders a PDF with pdf.js. This module (and pdf.js itself) is only
// downloaded when the user asks to see the PDF; see PDFviewer.tsx.
import React, { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist'
import { Loader2, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type Props = {
  url: string
  // page to scroll to; `nonce` changes on every jump
  target: { page: number; nonce: number } | null
}

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function Page({ doc, number, width, zoom }: { doc: PDFDocumentProxy; number: number; width: number; zoom: number }) {
  const holder = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  // only render pages near the viewport, so long PDFs stay light
  useEffect(() => {
    const el = holder.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    doc.getPage(number).then((page) => {
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      const scale = (width / base.width) * zoom
      setSize({ w: base.width * scale, h: base.height * scale })
    })
    return () => { cancelled = true }
  }, [doc, number, width, zoom])

  useEffect(() => {
    if (!visible || !size || !canvas.current) return
    let task: RenderTask | null = null
    let cancelled = false
    doc.getPage(number).then((page) => {
      if (cancelled || !canvas.current) return
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = page.getViewport({ scale: (size.w / base.width) * dpr })
      const c = canvas.current
      c.width = Math.floor(viewport.width)
      c.height = Math.floor(viewport.height)
      task = page.render({ canvas: c, canvasContext: c.getContext('2d')!, viewport })
      task.promise.catch(() => { /* cancelled */ })
    })
    return () => { cancelled = true; task?.cancel() }
  }, [doc, number, visible, size])

  return (
    <div ref={holder} data-page={number} className='mx-auto mb-3 bg-white shadow-sm'
      style={{ width: size?.w ?? width, height: size?.h ?? width * 1.3 }}>
      <canvas ref={canvas} aria-label={`Page ${number}`} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default function PdfJsViewer({ url, target }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState(false)
  const [width, setWidth] = useState(0)
  const [zoomIdx, setZoomIdx] = useState(2)
  const [current, setCurrent] = useState(1)

  useEffect(() => {
    const task = getDocument({ url, withCredentials: false })
    task.promise.then(setDoc, (e) => { if (!task.destroyed) { console.warn(e); setError(true) } })
    return () => { task.destroy() }
  }, [url])

  // fit pages to the pane width, and re-fit when the pane resizes
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(Math.max(200, el.clientWidth - 24)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // jump to a page when an answer's page reference is clicked
  useEffect(() => {
    if (!doc || !target) return
    const page = Math.min(Math.max(1, target.page), doc.numPages)
    // wait a frame so page placeholders have their sizes
    requestAnimationFrame(() => {
      scroller.current?.querySelector(`[data-page="${page}"]`)?.scrollIntoView({ block: 'start' })
    })
  }, [doc, target])

  const onScroll = () => {
    const el = scroller.current
    if (!el) return
    const top = el.getBoundingClientRect().top
    for (const p of el.querySelectorAll<HTMLElement>('[data-page]')) {
      if (p.getBoundingClientRect().bottom > top + 40) { setCurrent(Number(p.dataset.page)); break }
    }
  }

  if (error) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm'>
        <p>Couldn&apos;t show the PDF here.</p>
        <a href={url} target='_blank' rel='noopener noreferrer' className='underline'>Open it in a new tab</a>
      </div>
    )
  }

  const zoom = ZOOMS[zoomIdx]
  return (
    <div className='flex h-full w-full flex-col'>
      <div className='flex items-center justify-between gap-2 border-b px-2 py-1 text-xs'>
        <span aria-live='polite'>{doc ? `Page ${current} of ${doc.numPages}` : 'Loading…'}</span>
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='icon' className='size-7' aria-label='Zoom out' disabled={zoomIdx === 0} onClick={() => setZoomIdx((i) => i - 1)}><Minus className='size-3' /></Button>
          <span className='w-10 text-center'>{Math.round(zoom * 100)}%</span>
          <Button variant='ghost' size='icon' className='size-7' aria-label='Zoom in' disabled={zoomIdx === ZOOMS.length - 1} onClick={() => setZoomIdx((i) => i + 1)}><Plus className='size-3' /></Button>
          <a href={url} target='_blank' rel='noopener noreferrer' className='ml-2 underline opacity-75'>New tab</a>
        </div>
      </div>
      <div ref={scroller} onScroll={onScroll} className='min-h-0 grow overflow-auto bg-muted p-3' data-testid='pdf-pages'>
        {!doc || !width ? (
          <div className='flex h-full items-center justify-center'><Loader2 className='size-8 animate-spin' /></div>
        ) : (
          Array.from({ length: doc.numPages }, (_, i) => (
            <Page key={i + 1} doc={doc} number={i + 1} width={width} zoom={zoom} />
          ))
        )}
      </div>
    </div>
  )
}
