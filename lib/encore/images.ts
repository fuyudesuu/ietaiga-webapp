/** Image fields accept bundled assets or compressed raster uploads, never markup. */
export function safeItemImage(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\/[a-zA-Z0-9_/-]+\.(jpe?g|png|webp)$/.test(value)) return value;
  if (
    value.length <= 280_000 &&
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)
  )
    return value;
  return undefined;
}

/** Decode, resize and re-encode: strips metadata and limits local storage usage. */
export async function prepareItemImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP photo.");
  if (file.size > 12 * 1024 * 1024)
    throw new Error("This photo is over 12 MB. Choose a smaller image.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => {
      throw new Error("This photo couldn’t be opened. Try another image.");
    });
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error("Choose a photo with a valid size.");
    const scale = Math.min(
      1,
      1000 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Photo editing is unavailable in this browser.");
    context.fillStyle = "#14233e";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.65, 0.45, 0.3]) {
      const result = canvas.toDataURL("image/jpeg", quality);
      if (safeItemImage(result)) return result;
    }
    throw new Error(
      "This photo has too much detail to save locally. Try a smaller crop.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
