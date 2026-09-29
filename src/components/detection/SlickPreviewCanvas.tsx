import React, { useEffect, useRef } from 'react';
import { SARPreviewMode } from '../../types';
import { DEMO_SLICK_GEOMETRY } from '../../data/demoData';

interface SlickPreviewCanvasProps {
  mode: SARPreviewMode;
  onModeChange: (mode: SARPreviewMode) => void;
  /** Real model output (data: URLs) from the Colab backend; demo drawing when absent */
  images?: { sarPng: string; maskPng: string; probabilityPng: string };
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const SlickPreviewCanvas: React.FC<SlickPreviewCanvasProps> = ({ mode, onModeChange, images }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ---------------------------------------------------------------- LIVE IMAGES
  useEffect(() => {
    if (!images) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let cancelled = false;

    Promise.all([loadImage(images.sarPng), loadImage(images.maskPng)]).then(([sar, mask]) => {
      if (cancelled) return;
      const W = canvas.width;
      const H = canvas.height;
      // Fit the whole scene inside the square canvas (letterbox)
      const s = Math.min(W / sar.width, H / sar.height);
      const dw = sar.width * s;
      const dh = sar.height * s;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;

      if (mode === 'sar' || mode === 'overlay') {
        ctx.drawImage(sar, dx, dy, dw, dh);
      }
      if (mode === 'mask') {
        // Binary mask: recolour the model mask to white on black
        const off = document.createElement('canvas');
        off.width = mask.width;
        off.height = mask.height;
        const octx = off.getContext('2d')!;
        octx.drawImage(mask, 0, 0);
        octx.globalCompositeOperation = 'source-in';
        octx.fillStyle = '#ffffff';
        octx.fillRect(0, 0, off.width, off.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, dx, dy, dw, dh);
      }
      if (mode === 'overlay') {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(mask, dx, dy, dw, dh);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mode, images]);

  // ---------------------------------------------------------------- DEMO DRAWING
  useEffect(() => {
    if (images) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (mode === 'sar' || mode === 'overlay') {
      // Create realistic noisy SAR sea surface
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      // Deterministic noise for consistent appearance
      let seed = 12345;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          // Sea texture: backscatter around 85-130
          const baseNoise = 85 + rnd() * 45;
          data[idx] = baseNoise;
          data[idx + 1] = baseNoise + 4;
          data[idx + 2] = baseNoise + 8;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Add SAR azimuth & range raster lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
      }
    } else {
      // Pure mask mode: deep black background
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, width, height);
    }

    // Exact geographic-to-canvas projection of DEMO_SLICK_GEOMETRY coordinates
    const poly1 = DEMO_SLICK_GEOMETRY.coordinates[0];
    const poly2 = DEMO_SLICK_GEOMETRY.coordinates[1];

    const allCoords = [...poly1, ...poly2];
    let minLon = Infinity,
      maxLon = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;
    allCoords.forEach(([lon, lat]) => {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });

    const midLon = (minLon + maxLon) / 2;
    const midLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos((midLat * Math.PI) / 180);

    const spanX = (maxLon - minLon) * cosLat;
    const spanY = maxLat - minLat;

    const pad = 24;
    const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);

    const project = ([lon, lat]: [number, number] | number[]): [number, number] => {
      const x = width / 2 + (lon - midLon) * cosLat * scale;
      const y = height / 2 - (lat - midLat) * scale;
      return [x, y];
    };

    const drawPolygonPath = (pts: [number, number][]) => {
      if (pts.length === 0) return;
      const [startLon, startLat] = pts[0];
      const [sx, sy] = project([startLon, startLat]);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = project(pts[i]);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    // Render exact slick geometry matching the Leaflet map
    ctx.beginPath();
    drawPolygonPath(poly1 as [number, number][]);
    drawPolygonPath(poly2 as [number, number][]);

    if (mode === 'sar') {
      // Dark radar backscatter damping (-8.7 dB suppression)
      ctx.fillStyle = 'rgba(12, 16, 22, 0.92)';
      ctx.fill();
    } else if (mode === 'mask') {
      // Binary segmentation mask
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (mode === 'overlay') {
      // Translucent slick mask overlaid on SAR with theme orange styling (#D95800)
      ctx.fillStyle = 'rgba(217, 88, 0, 0.32)';
      ctx.fill();
      ctx.strokeStyle = '#D95800';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Centroid marker matching map
      const [cx, cy] = project([
        DEMO_SLICK_GEOMETRY.centroid.lon,
        DEMO_SLICK_GEOMETRY.centroid.lat,
      ]);
      ctx.fillStyle = '#0F62FE';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [mode, images]);

  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#64748B] font-bold text-[10px] tracking-wider uppercase">SAR SENSOR CROP</span>
        <div className="flex items-center rounded-lg bg-slate-100 border border-slate-200 p-0.5">
          {(['sar', 'mask', 'overlay'] as SARPreviewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                mode === m
                  ? 'bg-[#0F62FE] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full aspect-square bg-[#05070d] border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 text-[10px] text-[#1E293B] bg-white/95 px-2.5 py-1 rounded-md border border-slate-200 pointer-events-none shadow-xs font-medium">
          {mode === 'sar' && (images ? 'Sentinel-1 VV Channel (uploaded scene)' : 'Sentinel-1 VV Channel (-8.7 dB depression)')}
          {mode === 'mask' && 'DeepLabV3+ ResNet-50 Binary Mask'}
          {mode === 'overlay' && 'Segmentation Overlay (62.6% IoU)'}
        </div>
      </div>
    </div>
  );
};