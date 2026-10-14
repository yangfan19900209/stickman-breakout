const { PlaytestBrain } = require("./playtest-brain.cjs");
/** Read-only route: play normally, deliberately leave the final infantry group alive. */
class BypassBrain {
  combat = new PlaytestBrain();
  phase = "approach";
  jumpUntil = 0;
  wasJump = false;
  entries = [];
  retreat = null;
  next(s) {
    if (this.phase === "approach" && s.player.x > 5650) this.phase = "skip";
    if (this.phase === "skip" && s.boss.active) {
      this.entries.push({
        x: s.player.x,
        boss: s.guardHealth,
        skipped: s.enemies
          .filter((e) => e.health > 0 && e.kind !== "guard")
          .map((e) => e.id),
      });
      this.phase = "retreat";
    }
    if (this.phase === "retreat" && s.player.x < 6660 && !s.boss.active) {
      this.retreat = {
        x: s.player.x,
        camera: s.cameraX,
        active: s.boss.active,
      };
      this.phase = "return";
    }
    if (this.phase === "return" && s.boss.active) {
      this.entries.push({
        x: s.player.x,
        boss: s.guardHealth,
        skipped: s.enemies
          .filter((e) => e.health > 0 && e.kind !== "guard")
          .map((e) => e.id),
      });
      this.phase = "done";
    }
    if (this.phase === "approach") return this.combat.next(s);
    if (s.player.grounded && s.time > this.jumpUntil + 0.12)
      this.jumpUntil = s.time + 0.42;
    const jumpHeld = s.time < this.jumpUntil,
      jump = jumpHeld && !this.wasJump;
    this.wasJump = jumpHeld;
    return {
      axis: this.phase === "retreat" ? -1 : 1,
      jump,
      jumpHeld,
      shoot: false,
      crouch: false,
      grenade: false,
      aimY: 0,
    };
  }
}
module.exports = { BypassBrain };
