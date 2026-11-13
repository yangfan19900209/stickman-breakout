/** Screen layout and combat framing are independent. No device/DOM dependency. */
export function viewportLayout(frameWidth: number, frameHeight: number) {
  const portrait = frameHeight > frameWidth;
  const height = portrait ? (720 * frameHeight) / Math.max(1, frameWidth) : 720;
  const width = portrait ? 720 : (720 * frameWidth) / Math.max(1, frameHeight);
  return { width, height, portrait, zoom: width < 1100 ? 1.25 : 1.4 };
}
