import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toCanvas } from 'html-to-image';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Debounce function to limit rapid calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Download a file from a blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize SVG string to fix HTML content inside foreignObject
 * Mermaid generates HTML inside foreignObject which may have invalid XML
 * This uses DOM parsing for more reliable sanitization
 */
export function sanitizeSvgForExport(svgString: string): string {
  // Parse as HTML first to let the browser fix the HTML structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'text/html');
  const svgElement = doc.querySelector('svg');
  
  if (!svgElement) {
    // Fallback: try to fix common issues with regex
    return svgString
      .replace(/<br\s*>/gi, '<br/>')
      .replace(/<br\s*\/?\s*>/gi, '<br/>')
      .replace(/<hr\s*>/gi, '<hr/>')
      .replace(/<hr\s*\/?\s*>/gi, '<hr/>');
  }
  
  // Process foreignObject elements to convert HTML to valid XHTML
  const foreignObjects = svgElement.querySelectorAll('foreignObject');
  foreignObjects.forEach((fo) => {
    // Get the innerHTML and sanitize it
    const html = fo.innerHTML;
    // Create a temporary div to parse and re-serialize as XHTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Convert to XHTML-compatible markup
    const xhtml = new XMLSerializer().serializeToString(tempDiv);
    // Remove the wrapper div tags
    const cleanedXhtml = xhtml
      .replace(/^<div[^>]*xmlns="[^"]*"[^>]*>/, '')
      .replace(/<\/div>$/, '');
    
    fo.innerHTML = cleanedXhtml;
  });
  
  // Ensure proper xmlns attributes
  if (!svgElement.getAttribute('xmlns')) {
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  
  // Add xhtml namespace for foreignObject if needed
  foreignObjects.forEach((fo) => {
    const div = fo.querySelector('div');
    if (div && !div.getAttribute('xmlns')) {
      div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    }
  });
  
  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgElement);
}

/**
 * Convert foreignObject HTML content to native SVG text elements
 * This is necessary because foreignObject doesn't render when SVG is drawn to canvas
 */
function convertForeignObjectsToText(svgElement: SVGSVGElement): void {
  const foreignObjects = svgElement.querySelectorAll('foreignObject');
  
  foreignObjects.forEach((fo) => {
    const x = parseFloat(fo.getAttribute('x') || '0');
    const y = parseFloat(fo.getAttribute('y') || '0');
    const width = parseFloat(fo.getAttribute('width') || '100');
    const height = parseFloat(fo.getAttribute('height') || '20');
    
    // Get text content from the foreignObject
    const textContent = fo.textContent?.trim() || '';
    
    if (!textContent) {
      fo.remove();
      return;
    }
    
    // Create SVG text element
    const svgNS = 'http://www.w3.org/2000/svg';
    const textEl = document.createElementNS(svgNS, 'text');
    
    // Position text in center of the foreignObject area
    textEl.setAttribute('x', String(x + width / 2));
    textEl.setAttribute('y', String(y + height / 2));
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('dominant-baseline', 'central');
    textEl.setAttribute('font-family', 'Arial, sans-serif');
    textEl.setAttribute('font-size', '14');
    textEl.setAttribute('fill', '#333');
    
    // Handle multi-line text by splitting
    const lines = textContent.split(/\n|<br\s*\/?>/i).map(l => l.trim()).filter(Boolean);
    
    if (lines.length === 1) {
      textEl.textContent = lines[0];
    } else {
      // Multi-line: use tspan elements
      const lineHeight = 18;
      const startY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((line, i) => {
        const tspan = document.createElementNS(svgNS, 'tspan');
        tspan.setAttribute('x', String(x + width / 2));
        tspan.setAttribute('y', String(startY + i * lineHeight));
        tspan.textContent = line;
        textEl.appendChild(tspan);
      });
    }
    
    // Replace foreignObject with text element
    fo.parentNode?.replaceChild(textEl, fo);
  });
}

/**
 * Embed styles directly into SVG elements for export
 */
function inlineStyles(svgElement: SVGSVGElement): void {
  // Add default styles for text visibility
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    text, tspan { fill: #333; font-family: Arial, sans-serif; }
    .nodeLabel, .edgeLabel, .label { fill: #333; }
    .node rect, .node circle, .node ellipse, .node polygon, .node path { stroke: #333; }
  `;
  svgElement.insertBefore(style, svgElement.firstChild);
}

/**
 * Convert SVG string to PNG blob - handles foreignObject conversion for proper text rendering
 */
export async function svgToPng(svgString: string, scale: number = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Parse the SVG to get dimensions and ensure proper formatting
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) {
      reject(new Error('Invalid SVG'));
      return;
    }
    
    // Convert foreignObject elements to native SVG text (fixes canvas rendering)
    convertForeignObjectsToText(svgElement);
    
    // Inline styles for export
    inlineStyles(svgElement);
    
    // Get dimensions from the SVG - Mermaid sets these correctly
    let width: number;
    let height: number;
    
    // First try viewBox as it's the most reliable for Mermaid diagrams
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(parseFloat);
      if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
        width = parts[2];
        height = parts[3];
      } else {
        width = parseFloat(svgElement.getAttribute('width') || '800');
        height = parseFloat(svgElement.getAttribute('height') || '600');
      }
    } else {
      width = parseFloat(svgElement.getAttribute('width') || '800');
      height = parseFloat(svgElement.getAttribute('height') || '600');
    }
    
    // Handle percentage or invalid dimensions
    if (isNaN(width) || width <= 0) width = 800;
    if (isNaN(height) || height <= 0) height = 600;
    
    // Add some padding
    const padding = 40;
    const totalWidth = width + padding * 2;
    const totalHeight = height + padding * 2;
    
    // Ensure SVG has xmlns attribute
    if (!svgElement.getAttribute('xmlns')) {
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    
    // Set explicit dimensions for rendering
    svgElement.setAttribute('width', String(width));
    svgElement.setAttribute('height', String(height));
    
    // Serialize the SVG
    const serializer = new XMLSerializer();
    let svgData = serializer.serializeToString(svgElement);
    
    // Ensure XML declaration
    if (!svgData.startsWith('<?xml')) {
      svgData = '<?xml version="1.0" encoding="UTF-8"?>' + svgData;
    }
    
    // Create a data URL instead of blob URL for better compatibility
    const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Use padded dimensions for canvas
      canvas.width = totalWidth * scale;
      canvas.height = totalHeight * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Fill with white background for PNG
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.scale(scale, scale);
      // Draw with padding offset
      ctx.drawImage(img, padding, padding, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create PNG blob'));
        }
      }, 'image/png');
    };
    
    img.onerror = (e) => {
      console.error('Image load error:', e);
      reject(new Error('Failed to load SVG image for PNG conversion'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Convert a DOM element containing an SVG to PNG using html-to-image
 * This properly handles foreignObject elements that don't render via canvas
 */
export async function elementToPng(svgString: string, scale: number = 2): Promise<Blob> {
  // Create a temporary container to render the SVG
  // Must be visible (not display:none or visibility:hidden) for html-to-image
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    z-index: 99999;
    background: white;
    padding: 40px;
  `;
  container.innerHTML = svgString;
  document.body.appendChild(container);
  
  // Get the SVG element and ensure it has proper dimensions
  const svgElement = container.querySelector('svg');
  let width = 800;
  let height = 600;
  
  if (svgElement) {
    // Make sure the SVG has explicit dimensions
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(parseFloat);
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
        svgElement.style.width = `${width}px`;
        svgElement.style.height = `${height}px`;
        svgElement.setAttribute('width', String(width));
        svgElement.setAttribute('height', String(height));
      }
    } else {
      width = parseFloat(svgElement.getAttribute('width') || '800');
      height = parseFloat(svgElement.getAttribute('height') || '600');
    }
  }
  
  // Wait for the browser to render
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    // Use html-to-image toCanvas which returns a canvas directly
    // This avoids the fetch call that toPng does internally
    const canvas = await toCanvas(container, {
      backgroundColor: 'white',
      pixelRatio: scale,
      cacheBust: true,
    });
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    });
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}
