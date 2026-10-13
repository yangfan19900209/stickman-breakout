import { AnimationState, Facing } from "../core/Types";
import { WeaponId } from "../core/GameConfig";
import { Ink } from "./Ink";
import { CharacterArt } from "./CharacterArt";
import { MechanicalEnemyArt } from "./MechanicalEnemyArt";
export interface RenderActor {
  x: number;
  y: number;
  facing: Facing;
  animation: AnimationState;
  animationTime: number;
  recoil: number;
  deadTime: number;
  invincible?: number;
  kind?: string;
  aimPitch?: number;
  weaponId?: WeaponId;
  shieldHealth?: number;
  windup?: number;
}
export class StickmanRenderer {
  private art = new CharacterArt();
  private machines = new MechanicalEnemyArt();
  draw(ink: Ink, actor: RenderActor, cameraX: number): void {
    if (actor.kind === "turret" || actor.kind === "guard")
      this.machines.draw(ink, actor, cameraX);
    else this.art.draw(ink, actor, cameraX);
  }
}
