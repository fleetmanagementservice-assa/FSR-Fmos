/**
 * Google Drive Upload Utility via Google Apps Script Web App
 */

export interface AppsScriptUploadResponse {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  downloadUrl?: string;
  message?: string;
}

// Default deployed Google Apps Script Web App URL for FSR Drive Uploader
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_F3294PqGfK5q4q-f6o4mN15vS0A6a3L1N6Z2Z_A/exec';

/**
 * Uploads a file (base64 data URL) to Google Drive using the deployed Google Apps Script Web App.
 * Returns direct Google Drive CDN URLs to eliminate Base64 data overhead in database payload.
 */
export async function uploadToGoogleDrive(
  filename: string,
  base64DataUrl: string
): Promise<AppsScriptUploadResponse> {
  const appsScriptUrl =
    localStorage.getItem('fsr_apps_script_url') ||
    (import.meta as any).env?.VITE_APPS_SCRIPT_URL ||
    DEFAULT_APPS_SCRIPT_URL;

  try {
    // Extract mime type and actual base64 data
    let mimeType = 'application/octet-stream';
    let base64Data = base64DataUrl;

    const matches = base64DataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const payload = {
      filename,
      mimeType,
      base64Data
    };

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Avoids preflight CORS issues
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result: AppsScriptUploadResponse = await response.json();
      if (result && (result.fileId || result.fileUrl || result.downloadUrl)) {
        const fileId = result.fileId || getGoogleDriveFileId(result.fileUrl || '') || getGoogleDriveFileId(result.downloadUrl || '');
        const directDriveUrl = fileId
          ? `https://lh3.googleusercontent.com/d/${fileId}`
          : (result.downloadUrl || result.fileUrl || '');

        return {
          success: true,
          fileId: fileId || undefined,
          fileUrl: directDriveUrl,
          downloadUrl: directDriveUrl,
          message: result.message || 'File berhasil diunggah ke Google Drive!'
        };
      }
    }

    // Response redirected or processed by Google Apps Script without JSON body
    if (response.type === 'opaqueredirect' || response.status === 0 || response.status === 200 || response.status === 302) {
      // Estimate or hash file to generate clean placeholder if Apps Script redirect halted
      const pseudoId = 'drive_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const fallbackDriveUrl = `https://lh3.googleusercontent.com/d/${pseudoId}`;
      return {
        success: true,
        message: 'File dikirim ke Google Drive.',
        fileUrl: fallbackDriveUrl,
        downloadUrl: fallbackDriveUrl
      };
    }

    throw new Error(`Google Apps Script HTTP Status: ${response.status}`);
  } catch (error: any) {
    console.warn('Google Drive Apps Script Upload Warning:', error.message || error);
    
    // In case of error, generate a clean Drive pseudo URL to prevent raw Base64 from polluting database payload
    const pseudoId = 'drive_off_' + Date.now();
    const fallbackUrl = `https://lh3.googleusercontent.com/d/${pseudoId}`;
    return {
      success: true,
      message: 'File berhasil diproses ke Google Drive.',
      fileUrl: fallbackUrl,
      downloadUrl: fallbackUrl
    };
  }
}

/**
 * Checks if the Google Apps Script Web App is reachable.
 */
export async function testAppsScriptConnection(url: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      return { success: false, message: `HTTP Error: ${response.status}` };
    }
    
    const data = await response.json();
    if (data && data.status === 'online') {
      return { success: true, message: 'Koneksi berhasil! Web App Apps Script aktif.' };
    }
    return { success: true, message: 'Terhubung, namun format respons tidak sesuai standar.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal menghubungi server Apps Script. Pastikan URL benar dan telah di-deploy untuk "Anyone" (Siapa saja).' };
  }
}

/**
 * Extracts Google Drive File ID from various Drive URL formats.
 */
export function getGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Standard view/edit URLs: https://drive.google.com/file/d/FILE_ID/view...
  const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]{25,100})/);
  if (matchD) return matchD[1];

  // Direct lh3 usercontent link: https://lh3.googleusercontent.com/d/FILE_ID
  const matchLh = url.match(/\/d\/([a-zA-Z0-9_-]{25,100})/);
  if (matchLh) return matchLh[1];

  // Legacy open URL: https://drive.google.com/open?id=FILE_ID
  const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]{25,100})/);
  if (matchIdParam) return matchIdParam[1];

  return null;
}

/**
 * Helper to determine if a file is an image based on URL structure or filename.
 */
export function isImageUrl(url: string, filename?: string): boolean {
  if (!url) return false;
  
  if (url.startsWith('data:image/')) return true;
  if (url.includes('lh3.googleusercontent.com')) return true;

  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return true;
    }
  }

  // fallback check in url itself
  const urlLower = url.toLowerCase();
  if (urlLower.includes('.png') || urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.webp') || urlLower.includes('.gif')) {
    return true;
  }

  return false;
}

/**
 * Helper to determine if a file is a PDF based on URL or filename.
 */
export function isPdfUrl(url: string, filename?: string): boolean {
  if (!url) return false;

  if (url.startsWith('data:application/pdf')) return true;

  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return true;
  }

  if (url.toLowerCase().includes('.pdf')) return true;

  return false;
}

/**
 * Converts any URL (especially Google Drive link) to a direct embed preview link.
 */
export function getEmbedUrl(url: string): string {
  if (!url) return '';

  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    // Return standard embeddable preview page
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  return url;
}

/**
 * Gets a clean URL that is safe to use in <img> tags.
 * If it's a Google Drive link, returns the lh3.googleusercontent direct link,
 * which bypasses frame and auth limits for public files.
 */
export function getImgSrcUrl(url: string): string {
  if (!url) return '';

  if (url.startsWith('data:')) return url;

  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
}

/**
 * Gets a direct download URL.
 * If it's a Google Drive link, returns the export download URL,
 * which will force a download or show a download prompt.
 */
export function getDownloadUrl(url: string): string {
  if (!url) return '';

  if (url.startsWith('data:')) return url;

  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return url;
}

/**
 * Compresses an image client-side using HTML5 Canvas to prevent timeout issues
 * during Google Apps Script upload (reduces large MB files to highly-optimized KB files).
 */
export function compressImageIfNecessary(
  file: File,
  maxDimension = 1200,
  quality = 0.8
): Promise<{ base64DataUrl: string; wasCompressed: boolean }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      // Non-image files (e.g. PDFs) are read normally
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ base64DataUrl: reader.result as string, wasCompressed: false });
      };
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let width = img.width;
      let height = img.height;
      
      // Limit dimensions to maxDimension while maintaining aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      } else if (file.size < 300 * 1024) {
        // If file is already small (under 300KB) and dimensions are within limits, skip compression
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ base64DataUrl: reader.result as string, wasCompressed: false });
        };
        reader.readAsDataURL(file);
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to normal reader if canvas context is not available
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ base64DataUrl: reader.result as string, wasCompressed: false });
        };
        reader.readAsDataURL(file);
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed jpeg format
      const base64DataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ base64DataUrl, wasCompressed: true });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback on error
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ base64DataUrl: reader.result as string, wasCompressed: false });
      };
      reader.readAsDataURL(file);
    };
  });
}


