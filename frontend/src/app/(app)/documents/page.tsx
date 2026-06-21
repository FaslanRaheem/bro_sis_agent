// ============================================================
// src/app/(app)/documents/page.tsx
// Document repository — HR/Admin upload & manage PDFs.
// ============================================================

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Loader2,
  CloudUpload,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/guards/RoleGuard";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  useViewDocument,
} from "@/features/documents/hooks/useDocuments";
import type { Document } from "@/types/models";

function UploadDropzone() {
  const upload = useUploadDocument();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [done, setDone] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Client-side validation: PDF only
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        return; // react-dropzone already shows error via accept prop
      }

      setDone(false);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 85));
      }, 150);

      try {
        await upload.mutateAsync(formData);
        setUploadProgress(100);
        setDone(true);
        setTimeout(() => {
          setDone(false);
          setUploadProgress(0);
        }, 2000);
      } finally {
        clearInterval(interval);
      }
    },
    [upload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: { "application/pdf": [".pdf"] },
      maxFiles: 1,
      disabled: upload.isPending,
    });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        } ${upload.isPending ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} aria-label="Upload PDF document" />
        <div className="flex flex-col items-center gap-3">
          {done ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : upload.isPending ? (
            <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
          ) : (
            <CloudUpload className="w-10 h-10 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {done
                ? "Uploaded successfully!"
                : isDragActive
                ? "Drop your PDF here"
                : "Drag & drop a PDF, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF files only</p>
          </div>
        </div>
      </div>

      {upload.isPending && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading to GCS & Pinecone…</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      {fileRejections.length > 0 && (
        <p className="text-xs text-destructive">
          Only PDF files are accepted. Please try again.
        </p>
      )}
    </div>
  );
}

function DocumentRow({ doc }: { doc: Document }) {
  const deleteDoc = useDeleteDocument();
  const viewDoc = useViewDocument();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handlePreview = async () => {
    const url = await viewDoc.mutateAsync(doc.id);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate max-w-[300px]">{doc.filename}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {doc.uploaded_by ?? "—"}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
          {new Date(doc.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs gap-1"
              onClick={handlePreview}
              disabled={viewDoc.isPending}
            >
              {viewDoc.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              Preview
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>
        </td>
      </tr>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{doc.filename}</strong> will be permanently deleted from GCS
              and removed from the Pinecone index. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteDoc.mutate(doc.id);
                setConfirmDelete(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function DocumentsPage() {
  const { data: documents, isLoading } = useDocuments();

  return (
    <RoleGuard
      allowedRoles={["hr", "admin"]}
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access restricted to HR and Admin.</p>
        </div>
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Document Repository</h1>
          <p className="text-sm text-muted-foreground">
            Upload PDFs to GCS and Pinecone for AI-powered policy search
          </p>
        </div>

        {/* Upload zone */}
        <UploadDropzone />

        {/* Documents list */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-xl overflow-hidden bg-card"
        >
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Uploaded Documents ({documents?.length ?? 0})
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Filename", "Uploaded By", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : documents && documents.length > 0 ? (
                <AnimatePresence>
                  {documents.map((doc, idx) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      style={{ display: "table-row" }}
                    >
                      <DocumentRow doc={doc} />
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No documents uploaded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </RoleGuard>
  );
}
