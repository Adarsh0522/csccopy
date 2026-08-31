'use client'

import * as pdfjsLib from 'pdfjs-dist'

// Set the worker source to the locally installed pdfjs-dist worker
// In a Next.js environment, we can point to the unpkg or a local public path.
// For simplicity and avoiding public folder copies in this setup, we'll use a reliable CDN 
// that matches the installed version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

/**
 * Loads a PDF document from a File object.
 * Triggers a callback if a password is required.
 */
export async function loadPdf(
  file: File,
  password?: string
): Promise<pdfjsLib.PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer()
  
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    password: password,
  })

  return await loadingTask.promise
}

/**
 * Renders a specific page of a PDF document to a given canvas element.
 */
export async function renderPdfPageToCanvas(
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 2.0 // Render at 2x resolution for better quality when cropping
) {
  const page = await pdfDocument.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not get 2D context from canvas')

  canvas.width = viewport.width
  canvas.height = viewport.height

  const renderContext: any = {
    canvasContext: context,
    viewport: viewport,
  }

  await page.render(renderContext).promise
  
  return { width: viewport.width, height: viewport.height }
}
