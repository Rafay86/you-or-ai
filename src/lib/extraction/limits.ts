export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export class UploadError extends Error {}

export function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

/** Checks type and size before anything is read, and confirms the bytes match the claimed type. */
export function validateUpload(file: { name: string; size: number }, head?: Uint8Array): AllowedExtension {
  const ext = extensionOf(file.name) as AllowedExtension;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new UploadError('This file type is not supported. Upload a PDF, Word (.docx), or plain text file.');
  }
  if (file.size === 0) throw new UploadError('This file is empty.');
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(`This file is ${(file.size / 1024 / 1024).toFixed(2)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }
  if (head) {
    const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46; // %PDF
    const isZip = head[0] === 0x50 && head[1] === 0x4b; // PK
    if (ext === 'pdf' && !isPdf) throw new UploadError('This file is named .pdf but is not a PDF.');
    if (ext === 'docx' && !isZip) throw new UploadError('This file is named .docx but is not a Word document.');
    if ((ext === 'txt' || ext === 'md') && (isPdf || isZip)) throw new UploadError('This file is named as text but contains a binary document. Rename it with the right extension.');
  }
  return ext;
}
