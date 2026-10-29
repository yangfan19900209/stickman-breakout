import { AnimationState, Facing } from "../core/Types";
import { WeaponId } from "../core/GameConfig";
import { Ink } from "./Ink";
import { CharacterArt } from "./CharacterArt";
import { MechanicalEnemyArt } from "./MechanicalEnemyArt";
import { ColossusArt } from "./ColossusArt";
import { ComicActorArt } from "./ComicActorArt";
export interface RenderActor {
  x: number;
  y: number;
  facing: Facing;
  animation: AnimationState;
  animationTime: number;
  stride?: number;
  groundSlope?: number;
  landTime?: number;
  vx?: number;
  airJumpTime?: number;
  throwTime?: number;
  meleeTime?: number;
  meleeStage?:number;meleeProgress?:number;meleeStance?:"stand"|"crouch"|"jump";
  health?: number;
  maxHealth?: number;
  action?: string;
  recoil: number;
  deadTime: number;
  invincible?: number;
  kind?: string;
  aimPitch?: number;
  weaponId?: WeaponId;
  shieldHealth?: number;
  windup?: number;
  crouched?: boolean;
  hitTime?: number;
  laserTime?:number;
}
export class StickmanRenderer {
  playerStatus() { return this.comic.playerStatus; }
  bossStatus() { return this.comic.bossStatus; }
  private comic = new ComicActorArt();
  begin(ink: Ink): void {
    this.comic.begin(ink);
  }
  end(): void {
    this.comic.end();
  }
  private art = new CharacterArt();
  private machines = new MechanicalEnemyArt();
  private colossus = new ColossusArt();
  draw(ink: Ink, actor: RenderActor, cameraX: number): void {
    if (this.comic.draw(ink, actor, cameraX)) return;
    if (actor.kind === "colossus") this.colossus.draw(ink, actor, cameraX);
    else if (actor.kind === "turret" || actor.kind === "guard") {
      ink.strokeScale = 1.5;
      this.machines.draw(ink, actor, cameraX);
      ink.strokeScale = 1;
    } else this.art.draw(ink, actor, cameraX);
  }
}
