/**
 * Cloudinary raw PDFs open inline by default; fl_attachment forces download.
 */
export function getResumeDownloadUrl(resumeUrl: string): string {
  const url = String(resumeUrl ?? "").trim();
  if (!url) return "";

  if (url.includes("/upload/") && !url.includes("fl_attachment")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }

  return url;
}
