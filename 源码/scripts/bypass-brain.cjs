const { PlaytestBrain } = require("./playtest-brain.cjs");
const {DeckTraversal}=require('./deck-traversal.cjs');
/** Read-only route: play normally, deliberately leave the final infantry group alive. */
class BypassBrain {
  // Medical drops restore two hearts. Use the campaign threshold so losing
  // one heart does not repeatedly turn this route back toward an old drop
  // while each jump temporarily moves that drop out of vertical pickup range.
  combat = new PlaytestBrain({ healthThreshold: 3 });
  decks=new DeckTraversal();
  phase = "approach";
  jumpUntil = 0;
  wasJump = false;
  airJumped = false;
  entries = [];
  retreat = null;
  next(s) {
    const approach = s.zones?.at(-2);
    const arenaStart = s.arena?.start ?? s.zones?.at(-1)?.start;
    // Fight through the campaign, then deliberately leave the last ordinary
    // encounter alive. Derive this route from zone data as the map grows.
    if (
      this.phase === "approach" &&
      s.player.x > approach.start + Math.min(460, (approach.end - approach.start) / 4)
    )
      this.phase = "skip";
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
    if (this.phase === "retreat" && s.player.x < arenaStart - 80) {
      this.retreat = {
        x: s.player.x,
        camera: s.cameraX,
        active: s.boss.active,
      };
      this.phase = "return";
    }
    if (this.phase === "return" && s.arenaEntered) {
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
    if (s.player.grounded) this.airJumped = false;
    if (s.player.grounded && s.time > this.jumpUntil + 0.12) {
      this.jumpUntil = s.time + 0.42;
    } else if (!s.player.grounded && !this.airJumped &&
      s.player.airJumpsRemaining > 0 && s.player.vy < 110 &&
      s.time > this.jumpUntil + 0.07) {
      // Release Space between presses, then use the same normal second jump
      // available to a player to pass infantry and high cover without firing.
      this.jumpUntil = s.time + 0.34;
      this.airJumped = true;
    }
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
      ...(this.decks.next(s,this.phase==='retreat'?-1:1)??{}),
    };
  }
}
module.exports = { BypassBrain };
