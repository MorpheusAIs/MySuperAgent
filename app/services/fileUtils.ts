/**
 * Download a string as a file in the browser
 * @param content - The content to download
 * @param filename - The filename to use
 * @param contentType - The content type of the file
 */
export const downloadFile = (
  content: string,
  filename: string,
  contentType: string
): void => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
