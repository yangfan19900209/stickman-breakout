import { AbandonedBase } from "../level/LevelData";
import { EnemyController } from "./EnemyController";
export class EnemySpawner {
  enemies: EnemyController[] = [];
  reset(): void {
    this.enemies = AbandonedBase.enemies.map(
      (data) => new EnemyController(data),
    );
  }
  get remaining(): number {
    return this.enemies.filter((e) => e.alive).length;
  }
  get kills(): number {
    return this.enemies.length - this.remaining;
  }
  get guard(): EnemyController {
    return this.enemies.find((e) => e.kind === "guard")!;
  }
}
