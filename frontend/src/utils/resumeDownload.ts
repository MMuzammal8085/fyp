/**
 * Cloudinary raw PDFs open inline by default; fl_attachment forces download.
 */
export function getResumeDownloadUrl(resumeUrl: string): string {
  const url = String(resumeUrl ?? "").trim();
  if (!url) return "";

  if (url.includes("/upload/") && !url.includes("fl_attachment")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }

  if (url.includes("res.cloudinary.com") && !url.includes("fl_attachment")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }

  return url;
}

export function getResumeViewUrl(resumeUrl: string): string {
  return String(resumeUrl ?? "").trim();
}

/**
 * Download resume (handles cross-origin Cloudinary URLs).
 */
export async function downloadResume(
  resumeUrl: string,
  filename = "resume.pdf",
): Promise<void> {
  const url = getResumeDownloadUrl(resumeUrl);
  if (!url) return;

  const safeName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("fetch failed");

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = safeName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
