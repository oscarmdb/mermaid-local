import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
 * Convert SVG string to PNG blob
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
    
    // Get or set dimensions
    let width = parseFloat(svgElement.getAttribute('width') || '800');
    let height = parseFloat(svgElement.getAttribute('height') || '600');
    
    // If dimensions are percentages or missing, try viewBox
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox && (isNaN(width) || isNaN(height) || width === 0 || height === 0)) {
      const parts = viewBox.split(/[\s,]+/);
      if (parts.length === 4) {
        width = parseFloat(parts[2]) || 800;
        height = parseFloat(parts[3]) || 600;
      }
    }
    
    // Ensure SVG has xmlns attribute
    if (!svgElement.getAttribute('xmlns')) {
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    
    // Set explicit dimensions on SVG
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
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Fill with white background for PNG
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      
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
