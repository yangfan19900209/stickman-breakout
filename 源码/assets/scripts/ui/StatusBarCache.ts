/** Cache presentation inputs only; health and encounter ownership stay in simulation. */
export class StatusBarCache {
  private owner?: object;
  private health = -1;
  private maximum = -1;
  private width = -1;
  private height = -1;
  samples = 0;
  builds = 0;
  invalidate(): void { this.owner = undefined; }
  changed(owner: object, health: number, maximum: number, width: number, height: number): boolean {
    this.samples++;
    if (this.owner === owner && this.health === health && this.maximum === maximum &&
        this.width === width && this.height === height) return false;
    this.owner = owner;
    this.health = health;
    this.maximum = maximum;
    this.width = width;
    this.height = height;
    this.builds++;
    return true;
  }
}
