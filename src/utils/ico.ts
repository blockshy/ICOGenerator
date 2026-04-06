/**
 * Multi-resolution ICO generator.
 * Takes an array of blobs and their corresponding sizes.
 */
export async function generateMultiResIco(images: { blob: Blob; size: number }[]): Promise<Blob> {
  const count = images.length;
  const header = new Uint8Array(6);
  header[0] = 0; header[1] = 0; // Reserved
  header[2] = 1; header[3] = 0; // Type (1 for ICO)
  header[4] = count & 0xff;     // Count (low byte)
  header[5] = (count >> 8) & 0xff; // Count (high byte)

  const entries = new Uint8Array(16 * count);
  const imageDataBuffers: Uint8Array[] = [];
  let currentOffset = 6 + 16 * count;

  for (let i = 0; i < count; i++) {
    const { blob, size } = images[i];
    const buffer = new Uint8Array(await blob.arrayBuffer());
    imageDataBuffers.push(buffer);

    const entryOffset = i * 16;
    entries[entryOffset + 0] = size >= 256 ? 0 : size;   // Width
    entries[entryOffset + 1] = size >= 256 ? 0 : size;   // Height
    entries[entryOffset + 2] = 0;                        // Color palette
    entries[entryOffset + 3] = 0;                        // Reserved
    entries[entryOffset + 4] = 1;                        // Color planes
    entries[entryOffset + 5] = 0;
    entries[entryOffset + 6] = 32;                       // Bits per pixel
    entries[entryOffset + 7] = 0;

    // Size of image data
    const dataSize = buffer.length;
    entries[entryOffset + 8] = dataSize & 0xff;
    entries[entryOffset + 9] = (dataSize >> 8) & 0xff;
    entries[entryOffset + 10] = (dataSize >> 16) & 0xff;
    entries[entryOffset + 11] = (dataSize >> 24) & 0xff;

    // Offset of image data
    entries[entryOffset + 12] = currentOffset & 0xff;
    entries[entryOffset + 13] = (currentOffset >> 8) & 0xff;
    entries[entryOffset + 14] = (currentOffset >> 16) & 0xff;
    entries[entryOffset + 15] = (currentOffset >> 24) & 0xff;

    currentOffset += dataSize;
  }

  const finalBuffer = new Uint8Array(currentOffset);
  finalBuffer.set(header, 0);
  finalBuffer.set(entries, 6);
  
  let dataPointer = 6 + 16 * count;
  for (const buffer of imageDataBuffers) {
    finalBuffer.set(buffer, dataPointer);
    dataPointer += buffer.length;
  }

  return new Blob([finalBuffer], { type: 'image/x-icon' });
}
