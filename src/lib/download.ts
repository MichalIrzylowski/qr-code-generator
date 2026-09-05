export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

export const downloadText = (text: string, filename: string, mime: string): void => {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  try {
    downloadDataUrl(url, filename);
  } finally {
    // Give the click a tick to start before the URL stops resolving.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

/** Turn a user-picked file into the data URI a Logo Overlay holds. */
export const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
