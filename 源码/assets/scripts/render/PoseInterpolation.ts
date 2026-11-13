/** Read-only presentation between fixed physics ticks. Gameplay retains the
 * current pose; the reusable view inherits getters (equipment/animation). */
export class PoseInterpolation<T extends { x: number; y: number; stride?: number }> {
  readonly view: T;
  private x: number;
  private y: number;
  private stride: number;
  private readonly fields: (keyof T)[];
  constructor(private readonly source: T) {
    this.view = Object.create(source) as T;
    this.fields = Object.keys(source).filter(key => "value" in Object.getOwnPropertyDescriptor(source, key)!) as (keyof T)[];
    this.x = source.x; this.y = source.y; this.stride = source.stride ?? 0;
  }
  capture(): void {
    this.x = this.source.x; this.y = this.source.y; this.stride = this.source.stride ?? 0;
  }
  sample(alpha: number): T {
    const s = this.source;
    // Pose/muzzle selectors also spread actor fields. Keep those own fields in
    // the reusable view while inheriting accessor properties from the source.
    for (const key of this.fields) this.view[key] = s[key];
    // Reset/teleport never draws a trail through the level.
    if (Math.abs(s.x - this.x) + Math.abs(s.y - this.y) > 100) this.capture();
    const t = Math.max(0, Math.min(1, alpha));
    this.view.x = this.x + (s.x - this.x) * t;
    this.view.y = this.y + (s.y - this.y) * t;
    if (s.stride !== undefined) this.view.stride = this.stride + (s.stride - this.stride) * t;
    return this.view;
  }
}
