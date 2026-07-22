import React, { useEffect, useState, useRef } from "react";
import type {
  DocumentAttachment,
  DocumentEntityType,
} from "../types";
import {
  fetchAttachments,
  uploadAttachment,
  deleteAttachment,
  getAttachmentPreviewUrl,
  getAttachmentDownloadUrl,
} from "../api";

interface DocumentAttachmentSectionProps {
  entityType: DocumentEntityType;
  entityId: number;
  readOnly?: boolean;
  title?: string;
  className?: string;
}

export const DocumentAttachmentSection: React.FC<DocumentAttachmentSectionProps> = ({
  entityType,
  entityId,
  readOnly = false,
  title = "Tệp đính kèm (Ảnh / PDF)",
  className = "",
}) => {
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<DocumentAttachment | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAttachments = async () => {
    if (!entityId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAttachments(entityType, entityId);
      setAttachments(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách tệp đính kèm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [entityType, entityId]);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`File '${file.name}' vượt quá giới hạn 20MB`);
        }
        await uploadAttachment(entityType, entityId, file);
      }
      await loadAttachments();
    } catch (err: any) {
      setError(err.message || "Lỗi tải tệp lên");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (readOnly) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (attachment: DocumentAttachment) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tệp '${attachment.file_name}'?`)) {
      return;
    }
    try {
      setError(null);
      await deleteAttachment(attachment.id);
      await loadAttachments();
    } catch (err: any) {
      setError(err.message || "Không thể xóa tệp");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const isImage = (mime: string) => mime.startsWith("image/");
  const isPdf = (mime: string) => mime.includes("pdf");

  return (
    <div className={`mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {title} ({attachments.length})
        </span>

        {!readOnly && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-1 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? "Đang tải lên..." : "Tải tệp lên"}
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
        className="hidden"
      />

      {error && (
        <div className="mb-2 p-2 text-xs bg-red-50 text-red-600 border border-red-200 rounded flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {!readOnly && attachments.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 bg-white"
          }`}
        >
          <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-1 text-xs text-slate-600 font-medium">Kéo & thả file ảnh hoặc PDF vào đây, hoặc click để chọn tệp</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ JPG, PNG, WEBP, PDF (Tối đa 20MB)</p>
        </div>
      )}

      {loading ? (
        <div className="py-3 text-center text-xs text-slate-500">Đang tải tệp đính kèm...</div>
      ) : attachments.length > 0 ? (
        <div className="space-y-1.5 mt-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 hover:border-slate-300 transition text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                  isPdf(att.mime_type) ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {isPdf(att.mime_type) ? "PDF" : "IMG"}
                </span>

                <span className="font-medium text-slate-800 truncate" title={att.file_name}>
                  {att.file_name}
                </span>

                <span className="text-slate-400 text-[11px] shrink-0">
                  ({formatFileSize(att.file_size)})
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Xem trước button */}
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(att)}
                  className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                  title="Xem trước"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                {/* Tải về button */}
                <a
                  href={getAttachmentDownloadUrl(att.id)}
                  download={att.file_name}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition"
                  title="Tải về"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>

                {/* Xóa button */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(att)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition"
                    title="Xóa tệp"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* PREVIEW MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
              <div className="flex items-center gap-2 truncate pr-4">
                <span className="font-semibold text-sm truncate">{previewAttachment.file_name}</span>
                <span className="text-xs text-slate-400 shrink-0">
                  ({formatFileSize(previewAttachment.file_size)})
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getAttachmentDownloadUrl(previewAttachment.id)}
                  download={previewAttachment.file_name}
                  className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải xuống
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-md transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-slate-900/5 min-h-[400px] flex items-center justify-center p-4">
              {isImage(previewAttachment.mime_type) ? (
                <img
                  src={getAttachmentPreviewUrl(previewAttachment.id)}
                  alt={previewAttachment.file_name}
                  className="max-w-full max-h-[75vh] object-contain rounded shadow-lg"
                />
              ) : isPdf(previewAttachment.mime_type) ? (
                <iframe
                  src={getAttachmentPreviewUrl(previewAttachment.id)}
                  title={previewAttachment.file_name}
                  className="w-full h-[75vh] rounded border border-slate-200"
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-slate-600 mb-3">Định dạng file không hỗ trợ xem trực tiếp.</p>
                  <a
                    href={getAttachmentDownloadUrl(previewAttachment.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm inline-block"
                  >
                    Tải về máy để xem
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
