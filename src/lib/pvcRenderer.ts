/**
 * PVC Card Studio & High-Res A4 Compositor Engine
 * Standard CR80 PVC: 85.6mm x 53.98mm = 1011px x 638px at 300 DPI
 * Master A4 Canvas: 210mm x 297mm = 2480px x 3508px at 300 DPI
 */

export const CR80_WIDTH = 1011
export const CR80_HEIGHT = 638
export const CR80_CORNER_RADIUS = 28

export const A4_WIDTH = 2480
export const A4_HEIGHT = 3508

export interface CropRegion {
  x: number // 0.0 - 1.0 (normalized)
  y: number
  w: number
  h: number
}

export interface DefaultCropRegions {
  photo: CropRegion
  frontDetails: CropRegion
  backAddress: CropRegion
  qrCode: CropRegion
  cardNumber: CropRegion
}

// Exact tested normalized crop coordinates for UIDAI Standard e-Aadhaar PDF
export const DEFAULT_AADHAAR_REGIONS: DefaultCropRegions = {
  photo: { x: 0.117, y: 0.768, w: 0.087, h: 0.080 },
  frontDetails: { x: 0.213, y: 0.760, w: 0.220, h: 0.060 },
  backAddress: { x: 0.520, y: 0.760, w: 0.236, h: 0.113 },
  qrCode: { x: 0.754, y: 0.760, w: 0.160, h: 0.121 },
  cardNumber: { x: 0.140, y: 0.860, w: 0.210, h: 0.023 },
}

export interface PhotoEnhancements {
  brightness: number // 50 - 150, default 105
  contrast: number   // 50 - 150, default 110
  scale: number      // 80 - 140, default 100
  offsetY: number    // -50 to 50, default 0
  enableGhost: boolean
}

export interface QueuedCard {
  id: string
  docType: string
  customerName?: string
  frontDataUrl: string
  backDataUrl: string
  addedAt: string
}

export interface AadhaarExtractedData {
  aadhaarNumber?: string
  issueDate?: string
  printDate?: string
}

/**
 * Slices a normalized region from a source PDF canvas and optionally removes near-white background
 */
export function slicePdfRegion(
  sourceCanvas: HTMLCanvasElement,
  region: CropRegion,
  removeWhiteBg: boolean = false
): HTMLCanvasElement {
  const sW = sourceCanvas.width
  const sH = sourceCanvas.height

  const sx = Math.max(0, Math.floor(region.x * sW))
  const sy = Math.max(0, Math.floor(region.y * sH))
  const sw = Math.min(sW - sx, Math.max(1, Math.floor(region.w * sW)))
  const sh = Math.min(sH - sy, Math.max(1, Math.floor(region.h * sH)))

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = sw
  outputCanvas.height = sh
  const outCtx = outputCanvas.getContext('2d')
  if (!outCtx) return outputCanvas

  outCtx.imageSmoothingEnabled = true
  outCtx.imageSmoothingQuality = 'high'
  outCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh)

  if (removeWhiteBg) {
    const imgData = outCtx.getImageData(0, 0, sw, sh)
    const data = imgData.data
    const len = data.length
    for (let i = 0; i < len; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Near-white pixel threshold
      if (r > 230 && g > 230 && b > 230) {
        data[i + 3] = 0 // transparent
      }
    }
    outCtx.putImageData(imgData, 0, 0)
  }

  return outputCanvas
}

/**
 * Draws rounded rectangle path on canvas
 */
export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Draws security guilloche wave pattern
 */
export function drawGuillochePattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string = 'rgba(20, 130, 80, 0.05)'
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.2
  const step = 26
  for (let y = -40; y < h + 60; y += step) {
    ctx.beginPath()
    ctx.moveTo(-20, y)
    for (let x = -20; x <= w + 40; x += 40) {
      const cp1x = x + 15
      const cp1y = y + Math.sin(x * 0.02) * 16
      const cp2x = x + 30
      const cp2y = y - Math.cos(x * 0.02) * 16
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x + 40, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * Draws Detailed Satyamev Jayate (Lion Capital Emblem) in Black Vector Paths
 */
export function drawSatyamevEmblem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number = 55,
  h: number = 75
) {
  ctx.save()
  ctx.translate(x, y)
  const scaleX = w / 55
  const scaleY = h / 75
  ctx.scale(scaleX, scaleY)

  ctx.fillStyle = '#111827'
  ctx.strokeStyle = '#111827'

  // Center Lion Head & Mane
  ctx.beginPath()
  ctx.moveTo(27.5, 0)
  ctx.lineTo(33, 4); ctx.lineTo(34, 11); ctx.lineTo(38, 13); ctx.lineTo(34, 17); ctx.lineTo(35, 25); ctx.lineTo(31, 30); ctx.lineTo(27.5, 32)
  ctx.lineTo(24, 30); ctx.lineTo(20, 25); ctx.lineTo(21, 17); ctx.lineTo(17, 13); ctx.lineTo(21, 11); ctx.lineTo(22, 4)
  ctx.closePath()
  ctx.fill()

  // Left Lion Profile
  ctx.beginPath()
  ctx.moveTo(18, 9); ctx.lineTo(10, 7); ctx.lineTo(7, 12); ctx.lineTo(12, 15); ctx.lineTo(10, 23); ctx.lineTo(16, 28); ctx.lineTo(20, 23)
  ctx.closePath()
  ctx.fill()

  // Right Lion Profile
  ctx.beginPath()
  ctx.moveTo(37, 9); ctx.lineTo(45, 7); ctx.lineTo(48, 12); ctx.lineTo(43, 15); ctx.lineTo(45, 23); ctx.lineTo(39, 28); ctx.lineTo(35, 23)
  ctx.closePath()
  ctx.fill()

  // Abacus Drum (Horizontal platform)
  ctx.fillRect(8, 35, 39, 9)

  // Center Ashoka Chakra wheel on drum
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(27.5, 39.5, 3.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111827'
  ctx.beginPath()
  ctx.arc(27.5, 39.5, 1.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Lower Bell / Lotus Base
  ctx.beginPath()
  ctx.moveTo(12, 44)
  ctx.quadraticCurveTo(8, 54, 6, 57)
  ctx.lineTo(49, 57)
  ctx.quadraticCurveTo(47, 54, 43, 44)
  ctx.closePath()
  ctx.fill()

  // Bottom pedestal step
  ctx.fillRect(4, 58, 47, 4)

  // Motto: "सत्यमेव जयते"
  ctx.font = 'bold 11px "Noto Sans Devanagari", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('सत्यमेव जयते', 27.5, 74)

  ctx.restore()
}

/**
 * Draws Official Aadhaar Sun/Fingerprint Logo with "आधार" / "AADHAAR" text
 */
export function drawAadhaarLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number = 115,
  h: number = 80,
  isBack: boolean = false
) {
  ctx.save()
  ctx.translate(x, y)
  const scale = w / 115
  ctx.scale(scale, scale)

  const cx = 57.5
  const cy = 34

  // Sunburst Rays / Fingerprint Concentric Arcs
  const numRays = 18
  for (let i = 0; i < numRays; i++) {
    const angle = Math.PI + (i / (numRays - 1)) * Math.PI
    const isRed = i % 2 === 0
    ctx.strokeStyle = isRed ? '#d9251d' : '#f59e0b'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    const r1 = 12 + (i % 3) * 2
    const r2 = 28 + (i % 4) * 3
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2)
    ctx.stroke()
  }

  // Inner red sun circle
  ctx.fillStyle = '#d9251d'
  ctx.beginPath()
  ctx.arc(cx, cy, 9, 0, Math.PI * 2)
  ctx.fill()

  // Inner yellow center dot
  ctx.fillStyle = '#fef08a'
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fill()

  // Bottom Text
  ctx.fillStyle = '#d9251d'
  if (isBack) {
    ctx.font = 'bold 15px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('AADHAAR', cx, 70)
  } else {
    ctx.font = 'bold 18px "Noto Sans Devanagari", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('आधार', cx, 70)
  }

  ctx.restore()
}

/**
 * Draws Metallic Hologram Badge Effect
 */
export function drawHologramBadge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 115) {
  ctx.save()
  ctx.translate(x, y)

  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, 'rgba(226, 232, 240, 0.75)')
  grad.addColorStop(0.25, 'rgba(186, 230, 253, 0.65)')
  grad.addColorStop(0.5, 'rgba(254, 240, 138, 0.65)')
  grad.addColorStop(0.75, 'rgba(251, 207, 232, 0.65)')
  grad.addColorStop(1, 'rgba(167, 243, 208, 0.75)')

  roundedRect(ctx, 0, 0, size, size, 16)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Inner emblem silhouette
  ctx.save()
  ctx.globalAlpha = 0.5
  drawSatyamevEmblem(ctx, size / 2 - 18, size / 2 - 25, 36, 48)
  ctx.restore()

  // Shimmer circle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

/**
 * Footer Icons for Back Card
 */
function drawTelephoneIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#1f2937'
  ctx.beginPath()
  ctx.moveTo(3, 4)
  ctx.quadraticCurveTo(10, 0, 17, 4)
  ctx.lineTo(19, 8)
  ctx.lineTo(15, 10)
  ctx.lineTo(13, 7)
  ctx.quadraticCurveTo(10, 7, 7, 11)
  ctx.quadraticCurveTo(10, 15, 12, 16)
  ctx.lineTo(14, 14)
  ctx.lineTo(17, 17)
  ctx.lineTo(14, 20)
  ctx.quadraticCurveTo(7, 19, 2, 12)
  ctx.quadraticCurveTo(0, 7, 3, 4)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawMailIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 3, 20, 14)
  ctx.beginPath()
  ctx.moveTo(0, 3)
  ctx.lineTo(10, 11)
  ctx.lineTo(20, 3)
  ctx.stroke()
  ctx.restore()
}

function drawGlobeIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(10, 10, 8.5, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(1.5, 10)
  ctx.lineTo(18.5, 10)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(10, 10, 4.2, 8.5, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/**
 * Helper to draw rounded pill bar with centered text
 */
function drawPillBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: string,
  text: string,
  font: string,
  textColor: string = '#111827'
) {
  ctx.save()
  ctx.fillStyle = fillColor
  roundedRect(ctx, x, y, w, h, h / 2)
  ctx.fill()

  ctx.fillStyle = textColor
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + w / 2, y + h / 2)
  ctx.restore()
}

/**
 * EXACT 1:1 UIDAI PHYSICAL PVC AADHAAR CARD RENDERER (1011 x 638 px)
 */
export function renderAadhaarPvc(
  frontCanvas: HTMLCanvasElement,
  backCanvas: HTMLCanvasElement,
  slicedPhoto: HTMLCanvasElement | null,
  slicedFrontText: HTMLCanvasElement | null,
  slicedBackAddress: HTMLCanvasElement | null,
  slicedQrCode: HTMLCanvasElement | null,
  slicedCardNumber: HTMLCanvasElement | null,
  enhancements: PhotoEnhancements,
  extractedData?: AadhaarExtractedData
) {
  const aadhaarNumber = extractedData?.aadhaarNumber
  const issueDate = extractedData?.issueDate || '01/01/2024'
  const printDate = extractedData?.printDate || new Date().toLocaleDateString('en-GB')

  // ==========================================
  // --- FRONT SIDE (1011 x 638 px) ---
  // ==========================================
  frontCanvas.width = CR80_WIDTH
  frontCanvas.height = CR80_HEIGHT
  const fCtx = frontCanvas.getContext('2d')
  if (!fCtx) return

  fCtx.clearRect(0, 0, CR80_WIDTH, CR80_HEIGHT)
  fCtx.save()

  // 1. Background Gradient: soft mint-green (#dcf2e6) bottom-left to warm-peach/cream (#f9e8d8) top-right
  const fGrad = fCtx.createLinearGradient(0, CR80_HEIGHT, CR80_WIDTH, 0)
  fGrad.addColorStop(0, '#dcf2e6')
  fGrad.addColorStop(0.5, '#ffffff')
  fGrad.addColorStop(1, '#f9e8d8')
  fCtx.fillStyle = fGrad
  fCtx.fillRect(0, 0, CR80_WIDTH, CR80_HEIGHT)

  // Security Guilloche Waves
  drawGuillochePattern(fCtx, CR80_WIDTH, CR80_HEIGHT, 'rgba(20, 130, 80, 0.05)')
  drawGuillochePattern(fCtx, CR80_WIDTH, CR80_HEIGHT, 'rgba(243, 112, 33, 0.04)')

  // Center Faint Watermark (Opacity 0.08)
  fCtx.save()
  fCtx.globalAlpha = 0.08
  drawAadhaarLogo(fCtx, 435, 330, 140, 100, false)
  fCtx.restore()

  // 2. Header Row (Y: 25 to Y: 115)
  // Left: Black Satyamev Jayate Emblem (X: 55, Y: 22, W: 55, H: 75)
  drawSatyamevEmblem(fCtx, 55, 22, 55, 75)

  // Center Pill Bars (X: 160 to X: 760, W: 580)
  drawPillBar(
    fCtx,
    160,
    32,
    580,
    36,
    '#f37021',
    'भारत सरकार',
    'bold 26px "Noto Sans Devanagari", Arial, sans-serif',
    '#111827'
  )
  drawPillBar(
    fCtx,
    160,
    70,
    580,
    36,
    '#138808',
    'Government of India',
    'bold 25px Arial, sans-serif',
    '#111827'
  )

  // Right: Aadhaar Logo in red & yellow arcs (X: 835, Y: 28, W: 115, H: 80)
  drawAadhaarLogo(fCtx, 835, 28, 115, 80, false)

  // 3. Vertical Issue Date (X: 38, Y: 260)
  fCtx.save()
  fCtx.translate(38, 260)
  fCtx.rotate(-Math.PI / 2)
  fCtx.font = 'bold 17px Arial, sans-serif'
  fCtx.fillStyle = '#374151'
  fCtx.fillText(`Issue Date: ${issueDate}`, 0, 0)
  fCtx.restore()

  // 4. User Photo (X: 68, Y: 130, W: 215, H: 260)
  const photoX = 68
  const photoY = 130
  const photoW = 215
  const photoH = 260

  // Subtle white border (3px)
  fCtx.fillStyle = '#ffffff'
  fCtx.strokeStyle = '#cbd5e1'
  fCtx.lineWidth = 3
  roundedRect(fCtx, photoX, photoY, photoW, photoH, 10)
  fCtx.fill()
  fCtx.stroke()

  if (slicedPhoto) {
    fCtx.save()
    roundedRect(fCtx, photoX + 2, photoY + 2, photoW - 4, photoH - 4, 8)
    fCtx.clip()

    fCtx.filter = `brightness(${enhancements.brightness}%) contrast(${enhancements.contrast}%)`
    const scaleFactor = enhancements.scale / 100
    const scaledW = photoW * scaleFactor
    const scaledH = photoH * scaleFactor
    const offX = photoX + (photoW - scaledW) / 2
    const offY = photoY + (photoH - scaledH) / 2 + enhancements.offsetY

    fCtx.drawImage(slicedPhoto, offX, offY, scaledW, scaledH)
    fCtx.restore()
  }

  // 5. Front Details Slice (X: 315, Y: 140, W: 480, H: 195)
  if (slicedFrontText) {
    fCtx.save()
    fCtx.drawImage(slicedFrontText, 315, 140, 480, 195)
    fCtx.restore()
  }

  // 6. Hologram Badge (Bottom-Left: X: 310, Y: 370, W: 115, H: 115)
  if (enhancements.enableGhost) {
    drawHologramBadge(fCtx, 310, 370, 115)
  }

  // 7. Bottom-Right Ghost Image (X: 840, Y: 385, W: 110, H: 130)
  if (slicedPhoto && enhancements.enableGhost) {
    const ghostX = 840
    const ghostY = 385
    const ghostW = 110
    const ghostH = 130

    fCtx.save()
    fCtx.globalAlpha = 0.40
    fCtx.filter = 'grayscale(100%) contrast(135%)'
    roundedRect(fCtx, ghostX, ghostY, ghostW, ghostH, 8)
    fCtx.clip()
    fCtx.drawImage(slicedPhoto, ghostX, ghostY, ghostW, ghostH)
    fCtx.restore()

    // Vertical Mini 12-Digit Number immediately to left of ghost image (X: 825, Y: 490)
    fCtx.save()
    fCtx.translate(825, 490)
    fCtx.rotate(-Math.PI / 2)
    fCtx.font = 'bold 14px Arial, sans-serif'
    fCtx.fillStyle = '#374151'
    fCtx.fillText(aadhaarNumber || 'XXXX XXXX XXXX', 0, 0)
    fCtx.restore()
  }

  // 8. 12-Digit Number (Centered at X: 505, Y: 545)
  if (aadhaarNumber) {
    fCtx.font = 'bold 46px Arial, sans-serif'
    fCtx.fillStyle = '#1f2937'
    fCtx.textAlign = 'center'
    fCtx.fillText(aadhaarNumber, 505, 545)
    fCtx.textAlign = 'left'
  } else if (slicedCardNumber) {
    // Fallback: draw sliced number image
    fCtx.drawImage(slicedCardNumber, 345, 510, 320, 44)
  }

  // 9. Bottom Red Divider & Three-Part Slogan (Y: 568 to 638)
  fCtx.fillStyle = '#d9251d'
  fCtx.fillRect(0, 568, CR80_WIDTH, 3)

  // Slogan: "मेरा " (black) + "आधार" (red) + ", मेरी पहचान" (black)
  fCtx.font = 'bold 34px "Noto Sans Devanagari", Arial, sans-serif'
  const wPart1 = fCtx.measureText('मेरा ').width
  const wPart2 = fCtx.measureText('आधार').width
  const wPart3 = fCtx.measureText(', मेरी पहचान').width
  const totalSloganW = wPart1 + wPart2 + wPart3
  const sloganStartX = 505 - totalSloganW / 2
  const sloganY = 614

  fCtx.fillStyle = '#111827'
  fCtx.fillText('मेरा ', sloganStartX, sloganY)
  fCtx.fillStyle = '#d9251d'
  fCtx.fillText('आधार', sloganStartX + wPart1, sloganY)
  fCtx.fillStyle = '#111827'
  fCtx.fillText(', मेरी पहचान', sloganStartX + wPart1 + wPart2, sloganY)

  // Outer border & soft rounded corner clip
  fCtx.strokeStyle = '#cbd5e1'
  fCtx.lineWidth = 2
  roundedRect(fCtx, 1, 1, CR80_WIDTH - 2, CR80_HEIGHT - 2, CR80_CORNER_RADIUS)
  fCtx.stroke()
  fCtx.restore()

  // ==========================================
  // --- BACK SIDE (1011 x 638 px) ---
  // ==========================================
  backCanvas.width = CR80_WIDTH
  backCanvas.height = CR80_HEIGHT
  const bCtx = backCanvas.getContext('2d')
  if (!bCtx) return

  bCtx.clearRect(0, 0, CR80_WIDTH, CR80_HEIGHT)
  bCtx.save()

  // Background
  const bGrad = bCtx.createLinearGradient(0, CR80_HEIGHT, CR80_WIDTH, 0)
  bGrad.addColorStop(0, '#dcf2e6')
  bGrad.addColorStop(0.5, '#ffffff')
  bGrad.addColorStop(1, '#f9e8d8')
  bCtx.fillStyle = bGrad
  bCtx.fillRect(0, 0, CR80_WIDTH, CR80_HEIGHT)

  drawGuillochePattern(bCtx, CR80_WIDTH, CR80_HEIGHT, 'rgba(20, 130, 80, 0.05)')

  // 1. Header Row (Y: 25 to Y: 115)
  // Left: Black Satyamev Jayate Emblem (X: 55, Y: 22, W: 55, H: 75)
  drawSatyamevEmblem(bCtx, 55, 22, 55, 75)

  // Center Pill Bars (X: 145 to X: 810, W: 660)
  drawPillBar(
    bCtx,
    145,
    32,
    660,
    36,
    '#f37021',
    'भारतीय विशिष्ट पहचान प्राधिकरण',
    'bold 23px "Noto Sans Devanagari", Arial, sans-serif',
    '#111827'
  )
  drawPillBar(
    bCtx,
    145,
    70,
    660,
    36,
    '#138808',
    'Unique Identification Authority of India',
    'bold 22px Arial, sans-serif',
    '#111827'
  )

  // Right: Aadhaar Logo (X: 840, Y: 28, W: 115, H: 80) with "AADHAAR"
  drawAadhaarLogo(bCtx, 840, 28, 115, 80, true)

  // 2. Vertical Print Date (X: 35, Y: 265)
  bCtx.save()
  bCtx.translate(35, 265)
  bCtx.rotate(-Math.PI / 2)
  bCtx.font = 'bold 17px Arial, sans-serif'
  bCtx.fillStyle = '#374151'
  bCtx.fillText(`Print Date: ${printDate}`, 0, 0)
  bCtx.restore()

  // 3. Address Block (X: 65, Y: 135, W: 525, H: 320)
  if (slicedBackAddress) {
    bCtx.save()
    bCtx.drawImage(slicedBackAddress, 65, 135, 525, 320)
    bCtx.restore()
  } else {
    bCtx.fillStyle = '#64748b'
    bCtx.font = 'italic 16px sans-serif'
    bCtx.fillText('Address block will appear here...', 80, 200)
  }

  // 4. QR Code (Pure white square padding at X: 612, Y: 127, W: 371, H: 371)
  bCtx.fillStyle = '#ffffff'
  bCtx.strokeStyle = '#e2e8f0'
  bCtx.lineWidth = 2
  bCtx.fillRect(612, 127, 371, 371)
  bCtx.strokeRect(612, 127, 371, 371)

  if (slicedQrCode) {
    bCtx.save()
    bCtx.imageSmoothingEnabled = false // Keep QR pixels razor-sharp
    bCtx.drawImage(slicedQrCode, 620, 135, 355, 355)
    bCtx.restore()
  } else {
    bCtx.fillStyle = '#94a3b8'
    bCtx.font = 'bold 15px sans-serif'
    bCtx.textAlign = 'center'
    bCtx.fillText('QR Code Area', 620 + 355 / 2, 135 + 355 / 2)
    bCtx.textAlign = 'left'
  }

  // 5. 12-Digit Number on Back (Centered at X: 340, Y: 545)
  if (aadhaarNumber) {
    bCtx.font = 'bold 44px Arial, sans-serif'
    bCtx.fillStyle = '#1f2937'
    bCtx.textAlign = 'center'
    bCtx.fillText(aadhaarNumber, 340, 545)
    bCtx.textAlign = 'left'
  } else if (slicedCardNumber) {
    bCtx.drawImage(slicedCardNumber, 180, 510, 320, 44)
  }

  // Bottom Red Line (3px) at Y: 568
  bCtx.fillStyle = '#d9251d'
  bCtx.fillRect(0, 568, CR80_WIDTH, 3)

  // 6. Back Footer Contact Bar (Y: 572 to 638)
  bCtx.font = 'bold 22px Arial, sans-serif'
  bCtx.fillStyle = '#1f2937'

  // Left: Telephone + 1947 (X: 160, Y: 612)
  drawTelephoneIcon(bCtx, 160, 594)
  bCtx.fillText('1947', 190, 612)

  // Center: Envelope + help@uidai.gov.in (X: 495, Y: 612)
  drawMailIcon(bCtx, 465, 595)
  bCtx.fillText('help@uidai.gov.in', 495, 612)

  // Right: Globe + www.uidai.gov.in (X: 830, Y: 612)
  drawGlobeIcon(bCtx, 800, 594)
  bCtx.fillText('www.uidai.gov.in', 830, 612)

  // Outer border
  bCtx.strokeStyle = '#cbd5e1'
  bCtx.lineWidth = 2
  roundedRect(bCtx, 1, 1, CR80_WIDTH - 2, CR80_HEIGHT - 2, CR80_CORNER_RADIUS)
  bCtx.stroke()
  bCtx.restore()
}

/**
 * Renders PAN Card Template
 */
export function renderPanPvc(
  frontCanvas: HTMLCanvasElement,
  backCanvas: HTMLCanvasElement,
  photoCanvas: HTMLCanvasElement | null,
  enhancements: PhotoEnhancements,
  details: { name: string; fatherName: string; dob: string; panNumber: string; qrDataUrl?: string }
) {
  frontCanvas.width = CR80_WIDTH
  frontCanvas.height = CR80_HEIGHT
  const ctx = frontCanvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, CR80_WIDTH, CR80_HEIGHT)
  ctx.save()

  // Background
  const grad = ctx.createLinearGradient(0, 0, CR80_WIDTH, CR80_HEIGHT)
  grad.addColorStop(0, '#f0f9ff')
  grad.addColorStop(0.5, '#ffffff')
  grad.addColorStop(1, '#fef2f2')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CR80_WIDTH, CR80_HEIGHT)

  drawGuillochePattern(ctx, CR80_WIDTH, CR80_HEIGHT, 'rgba(2, 132, 199, 0.05)')

  // Top Header Banner
  ctx.fillStyle = '#0284c7'
  ctx.fillRect(0, 0, CR80_WIDTH, 68)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px "Noto Sans Devanagari", sans-serif'
  ctx.fillText('आयकर विभाग / INCOME TAX DEPARTMENT', 45, 33)
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText('भारत सरकार / GOVT. OF INDIA', 45, 56)

  // Photo
  const px = 55
  const py = 110
  const pw = 200
  const ph = 260
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(px, py, pw, ph)

  if (photoCanvas) {
    ctx.save()
    ctx.filter = `brightness(${enhancements.brightness}%) contrast(${enhancements.contrast}%)`
    ctx.drawImage(photoCanvas, px, py, pw, ph)
    ctx.restore()
  }

  // Signature box
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1.5
  ctx.fillRect(px, py + ph + 25, pw + 40, 80)
  ctx.strokeRect(px, py + ph + 25, pw + 40, 80)
  ctx.fillStyle = '#64748b'
  ctx.font = 'italic 13px sans-serif'
  ctx.fillText('Signature / हस्ताक्षर', px + 40, py + ph + 70)

  // Details
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText('Permanent Account Number Card / स्थायी लेखा संख्या कार्ड', 310, 115)

  ctx.fillStyle = '#0284c7'
  ctx.font = 'extrabold 32px monospace'
  ctx.fillText(details.panNumber || 'ABCDE1234F', 310, 165)

  ctx.fillStyle = '#475569'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText('Name / नाम:', 310, 210)
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 20px sans-serif'
  ctx.fillText((details.name || 'FULL NAME').toUpperCase(), 310, 235)

  ctx.fillStyle = '#475569'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText("Father's Name / पिता का नाम:", 310, 280)
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 19px sans-serif'
  ctx.fillText((details.fatherName || "FATHER'S NAME").toUpperCase(), 310, 305)

  ctx.fillStyle = '#475569'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText('Date of Birth / जन्म तिथि:', 310, 350)
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 19px sans-serif'
  ctx.fillText(details.dob || '01/01/1990', 310, 375)

  // QR Code on right
  if (details.qrDataUrl) {
    const qrImg = new Image()
    qrImg.src = details.qrDataUrl
    qrImg.onload = () => {
      ctx.drawImage(qrImg, CR80_WIDTH - 240, 320, 180, 180)
    }
  }

  // Outer border
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  roundedRect(ctx, 1, 1, CR80_WIDTH - 2, CR80_HEIGHT - 2, CR80_CORNER_RADIUS)
  ctx.stroke()
  ctx.restore()

  // Back side simple
  backCanvas.width = CR80_WIDTH
  backCanvas.height = CR80_HEIGHT
  const bCtx = backCanvas.getContext('2d')
  if (!bCtx) return
  bCtx.fillStyle = '#f8fafc'
  bCtx.fillRect(0, 0, CR80_WIDTH, CR80_HEIGHT)
  drawGuillochePattern(bCtx, CR80_WIDTH, CR80_HEIGHT, 'rgba(2, 132, 199, 0.05)')
  bCtx.fillStyle = '#334155'
  bCtx.font = '15px sans-serif'
  bCtx.fillText('This card is personal and not transferable.', 60, 120)
  bCtx.fillText('If found, please return to: Income Tax Department.', 60, 150)
}

/**
 * Renders Driving License or ABHA or Generic Manual Template
 */
export function renderGenericPvc(
  frontCanvas: HTMLCanvasElement,
  backCanvas: HTMLCanvasElement,
  photoCanvas: HTMLCanvasElement | null,
  enhancements: PhotoEnhancements,
  docType: string,
  details: {
    title: string
    name: string
    dob: string
    gender: string
    idNumber: string
    address: string
    qrDataUrl?: string
  }
) {
  frontCanvas.width = CR80_WIDTH
  frontCanvas.height = CR80_HEIGHT
  const fCtx = frontCanvas.getContext('2d')
  if (!fCtx) return

  fCtx.clearRect(0, 0, CR80_WIDTH, CR80_HEIGHT)
  fCtx.save()

  const isDL = docType === 'Driving License'
  const isAbha = docType === 'ABHA Card'

  const headerColor = isDL ? '#eab308' : isAbha ? '#0d9488' : '#10b981'
  const headerText = isDL
    ? 'UNION OF INDIA / DRIVING LICENCE'
    : isAbha
    ? 'National Health Authority / आयुष्मान भारत (ABHA)'
    : (details.title || 'IDENTITY CARD').toUpperCase()

  const fGrad = fCtx.createLinearGradient(0, 0, 0, CR80_HEIGHT)
  fGrad.addColorStop(0, '#ffffff')
  fGrad.addColorStop(1, '#f8fafc')
  fCtx.fillStyle = fGrad
  fCtx.fillRect(0, 0, CR80_WIDTH, CR80_HEIGHT)

  drawGuillochePattern(fCtx, CR80_WIDTH, CR80_HEIGHT, 'rgba(16, 185, 129, 0.05)')

  // Header Banner
  fCtx.fillStyle = headerColor
  fCtx.fillRect(0, 0, CR80_WIDTH, 70)

  fCtx.fillStyle = isDL ? '#713f12' : '#ffffff'
  fCtx.font = 'bold 22px sans-serif'
  fCtx.fillText(headerText, 45, 45)

  // Photo
  const px = 55
  const py = 120
  const pw = 220
  const ph = 280
  fCtx.fillStyle = '#f1f5f9'
  fCtx.strokeStyle = '#cbd5e1'
  fCtx.lineWidth = 2
  roundedRect(fCtx, px, py, pw, ph, 10)
  fCtx.fill()
  fCtx.stroke()

  if (photoCanvas) {
    fCtx.save()
    roundedRect(fCtx, px + 2, py + 2, pw - 4, ph - 4, 8)
    fCtx.clip()
    fCtx.filter = `brightness(${enhancements.brightness}%) contrast(${enhancements.contrast}%)`
    fCtx.drawImage(photoCanvas, px, py, pw, ph)
    fCtx.restore()
  }

  // Front Details
  fCtx.fillStyle = '#64748b'
  fCtx.font = 'bold 14px sans-serif'
  fCtx.fillText('ID / CARD NUMBER:', 310, 135)
  fCtx.fillStyle = '#0f172a'
  fCtx.font = 'extrabold 28px monospace'
  fCtx.fillText(details.idNumber || 'XXXXXXXXXXXX', 310, 175)

  fCtx.fillStyle = '#64748b'
  fCtx.font = 'bold 14px sans-serif'
  fCtx.fillText('FULL NAME:', 310, 220)
  fCtx.fillStyle = '#0f172a'
  fCtx.font = 'bold 22px sans-serif'
  fCtx.fillText(details.name || 'Cardholder Name', 310, 250)

  fCtx.fillStyle = '#64748b'
  fCtx.font = 'bold 14px sans-serif'
  fCtx.fillText('DOB / जन्म तारीख:', 310, 300)
  fCtx.fillStyle = '#0f172a'
  fCtx.font = 'bold 18px sans-serif'
  fCtx.fillText(details.dob || '01/01/1995', 310, 330)

  fCtx.fillStyle = '#64748b'
  fCtx.font = 'bold 14px sans-serif'
  fCtx.fillText('GENDER / लिंग:', 580, 300)
  fCtx.fillStyle = '#0f172a'
  fCtx.font = 'bold 18px sans-serif'
  fCtx.fillText(details.gender || 'MALE / FEMALE', 580, 330)

  if (photoCanvas && enhancements.enableGhost) {
    fCtx.save()
    fCtx.globalAlpha = 0.35
    fCtx.filter = 'grayscale(100%) contrast(140%)'
    fCtx.drawImage(photoCanvas, CR80_WIDTH - 165, CR80_HEIGHT - 210, 115, 145)
    fCtx.restore()
  }

  fCtx.fillStyle = '#0f172a'
  fCtx.fillRect(0, CR80_HEIGHT - 50, CR80_WIDTH, 50)
  fCtx.fillStyle = '#ffffff'
  fCtx.font = 'bold 16px sans-serif'
  fCtx.textAlign = 'center'
  fCtx.fillText('OFFICIAL DIGITAL PVC CARD FORMAT', CR80_WIDTH / 2, CR80_HEIGHT - 18)
  fCtx.textAlign = 'left'

  fCtx.strokeStyle = '#cbd5e1'
  fCtx.lineWidth = 2
  roundedRect(fCtx, 1, 1, CR80_WIDTH - 2, CR80_HEIGHT - 2, CR80_CORNER_RADIUS)
  fCtx.stroke()
  fCtx.restore()

  // Back side
  backCanvas.width = CR80_WIDTH
  backCanvas.height = CR80_HEIGHT
  const bCtx = backCanvas.getContext('2d')
  if (!bCtx) return

  bCtx.clearRect(0, 0, CR80_WIDTH, CR80_HEIGHT)
  bCtx.save()
  bCtx.fillStyle = '#ffffff'
  bCtx.fillRect(0, 0, CR80_WIDTH, CR80_HEIGHT)
  drawGuillochePattern(bCtx, CR80_WIDTH, CR80_HEIGHT, 'rgba(16, 185, 129, 0.05)')

  bCtx.fillStyle = headerColor
  bCtx.fillRect(0, 0, CR80_WIDTH, 20)

  bCtx.fillStyle = '#475569'
  bCtx.font = 'bold 16px sans-serif'
  bCtx.fillText('PERMANENT ADDRESS / संपूर्ण पत्ता:', 50, 80)

  bCtx.fillStyle = '#0f172a'
  bCtx.font = 'bold 18px sans-serif'
  const lines = (details.address || 'Address line 1, Area, City, District, State - Pincode').split('\n')
  lines.forEach((line, i) => {
    bCtx.fillText(line, 50, 115 + i * 28)
  })

  if (details.qrDataUrl) {
    const qrImg = new Image()
    qrImg.src = details.qrDataUrl
    qrImg.onload = () => {
      bCtx.drawImage(qrImg, CR80_WIDTH - 320, 90, 270, 270)
    }
  }

  bCtx.strokeStyle = '#cbd5e1'
  bCtx.lineWidth = 2
  roundedRect(bCtx, 1, 1, CR80_WIDTH - 2, CR80_HEIGHT - 2, CR80_CORNER_RADIUS)
  bCtx.stroke()
  bCtx.restore()
}

/**
 * High-Resolution Master A4 Compositor (2480 x 3508 px at 300 DPI)
 * Fits 5 horizontal slots (10 sides total: 5 Front on left, 5 Back on right)
 */
export async function composeA4Sheet(
  a4Canvas: HTMLCanvasElement,
  queuedCards: QueuedCard[]
): Promise<void> {
  a4Canvas.width = A4_WIDTH
  a4Canvas.height = A4_HEIGHT
  const ctx = a4Canvas.getContext('2d')
  if (!ctx) return

  // 1. Clean pure white A4 background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT)

  // 2. Header Guide Marks & Operator Banner
  ctx.fillStyle = '#94a3b8'
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText('CSCCopy 300 DPI Precision PVC Sheet  |  Print Scale: 100% (No Scaling / Fit to Paper: OFF)', 180, 85)

  ctx.textAlign = 'right'
  ctx.fillText(`Slots Loaded: ${queuedCards.length}/5  |  CR80 Standard (85.6mm x 54mm)`, A4_WIDTH - 180, 85)
  ctx.textAlign = 'left'

  const ROW_START_Y = 140
  const ROW_GAP = 30
  const FRONT_X = 180
  const BACK_X = 1289
  const CARD_W = CR80_WIDTH   // 1011
  const CARD_H = CR80_HEIGHT  // 638

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // 3. Render 5 Slots
  for (let i = 0; i < 5; i++) {
    const rowY = ROW_START_Y + i * (CARD_H + ROW_GAP)
    const card = queuedCards[i]

    if (card) {
      // Draw Front Card
      try {
        const frontImg = await loadImage(card.frontDataUrl)
        ctx.drawImage(frontImg, FRONT_X, rowY, CARD_W, CARD_H)
      } catch (err) {
        console.error('Failed to draw front card', err)
      }

      // Draw Back Card
      try {
        const backImg = await loadImage(card.backDataUrl)
        ctx.drawImage(backImg, BACK_X, rowY, CARD_W, CARD_H)
      } catch (err) {
        console.error('Failed to draw back card', err)
      }

      // Center Fold Line (Dashed between Front and Back)
      ctx.save()
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      ctx.setLineDash([8, 8])
      const foldX = 1240
      ctx.beginPath()
      ctx.moveTo(foldX, rowY - 12)
      ctx.lineTo(foldX, rowY + CARD_H + 12)
      ctx.stroke()
      ctx.restore()

      // Cutting Guide Borders & Corner Crop Marks
      ctx.save()
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 1
      ctx.strokeRect(FRONT_X, rowY, CARD_W, CARD_H)
      ctx.strokeRect(BACK_X, rowY, CARD_W, CARD_H)

      // Corner Crosshair Marks
      drawCornerMarks(ctx, FRONT_X, rowY, CARD_W, CARD_H)
      drawCornerMarks(ctx, BACK_X, rowY, CARD_W, CARD_H)
      ctx.restore()

    } else {
      // Empty Slot Outline
      ctx.save()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.setLineDash([12, 12])
      
      ctx.strokeRect(FRONT_X, rowY, CARD_W, CARD_H)
      ctx.strokeRect(BACK_X, rowY, CARD_W, CARD_H)

      ctx.fillStyle = '#cbd5e1'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Slot ${i + 1} : Front Card (Empty)`, FRONT_X + CARD_W / 2, rowY + CARD_H / 2)
      ctx.fillText(`Slot ${i + 1} : Back Card (Empty)`, BACK_X + CARD_W / 2, rowY + CARD_H / 2)
      ctx.textAlign = 'left'
      ctx.restore()
    }
  }
}

/**
 * Draws sharp corner crop marks for cutting precision
 */
function drawCornerMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  len: number = 20
) {
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x - len, y); ctx.lineTo(x, y); ctx.lineTo(x, y - len)
  ctx.moveTo(x + w + len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y - len)
  ctx.moveTo(x - len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h + len)
  ctx.moveTo(x + w + len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h + len)
  ctx.stroke()
}
