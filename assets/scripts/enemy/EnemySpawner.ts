import { AbandonedBase } from "../level/LevelData";
import { EnemyController } from "./EnemyController";
import { EnemySpawn } from "../level/LevelData";
import { TankBoss } from "./TankBoss";
import { ColossusBoss } from "./ColossusBoss";
export class EnemySpawner {
  enemies: EnemyController[] = [];
  reset(data: EnemySpawn[] = AbandonedBase.enemies): void {
    this.enemies = data.map((d) =>
      d.kind === "colossus"
        ? new ColossusBoss(d)
        : d.kind === "guard"
          ? new TankBoss(d)
          : new EnemyController(d),
    );
    this.guard.onSummon = (x) => {
      const count = this.enemies.filter(
        (e) => e.alive && e.id.startsWith("reinforce"),
      ).length;
      if (count >= 4) return;
      for (let i = 0; i < 2; i++)
        this.enemies.push(
          new EnemyController({
            id: `reinforce-${this.enemies.length}`,
            kind: i === 0 ? "ranged" : "melee",
            x: x + i * 80,
            y: 150,
            patrol: 20,
          }),
        );
    };
  }
  get remaining(): number {
    return this.enemies.filter((e) => e.alive).length;
  }
  get kills(): number {
    return this.enemies.length - this.remaining;
  }
  get guard(): TankBoss | ColossusBoss {
    return (this.enemies.find((e) => e.kind === "colossus") ??
      this.enemies.find((e) => e.kind === "guard"))! as TankBoss | ColossusBoss;
  }
  get miniBoss(): TankBoss | undefined {
    return this.enemies.find(
      (e) => e.kind === "guard" && (e as TankBoss).miniBoss,
    ) as TankBoss | undefined;
  }
}
