/**
 * Programmatic image buffer helpers for E2E image tests.
 * No binary files checked into repo — follows TestWorkbookBuilder pattern.
 */

/** Minimal valid 1x1 white PNG (68 bytes). */
export function createPngBuffer(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8" +
      "z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
}

/** Minimal valid 1x1 white JPEG (~631 bytes). */
export function createJpegBuffer(): Buffer {
  return Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQE" +
      "BQoHBwYIDAoMCwsKCwsKDA4PEA8ODBMTFBQTExwbGxscHx8fHx8fHx8fHx//" +
      "2wBDAQMEBAUEBQkFBQkfDQsNHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f" +
      "Hx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAABAAEDASIAAhEBAxEB/8QA" +
      "FAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEA" +
      "AAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMR" +
      "AD8AKwA//9k=",
    "base64"
  );
}

/** 5MB + 1 byte buffer starting with valid PNG header (triggers server 400). */
export function createOversizedBuffer(): Buffer {
  const pngHeader = createPngBuffer();
  const size = 5 * 1024 * 1024 + 1;
  const buf = Buffer.alloc(size);
  pngHeader.copy(buf);
  return buf;
}

/** Generate N frame buffers as multipart-ready object for 360 upload API.
 *  Uses JPEG because the 360 route runs Sharp optimization which needs a
 *  more robust image buffer than the minimal 68-byte PNG. */
export function createFrameSet(
  count: number
): Record<string, { name: string; mimeType: string; buffer: Buffer }> {
  const frames: Record<string, { name: string; mimeType: string; buffer: Buffer }> = {};
  for (let i = 0; i < count; i++) {
    frames[`frame${i}`] = {
      name: `frame-${String(i).padStart(3, "0")}.jpg`,
      mimeType: "image/jpeg",
      buffer: createJpegBuffer(),
    };
  }
  return frames;
}

/** Plain text file descriptor for type-rejection tests. */
export const TEXT_FILE = {
  name: "test.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("This is not an image"),
};
