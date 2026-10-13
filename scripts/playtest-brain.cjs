/** Read-only playtest policy shared by model and real-keyboard browser runs. */
class PlaytestBrain {
  jumpUntil = 0;
  lastGrenade = -10;
  next(s) {
    const p = s.player,
      time = s.time,
      enemy = s.enemies
        .filter((e) => e.health > 0 && e.kind !== "guard")
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    let axis = 1,
      shoot = false,
      crouch = false,
      aimY = 0,
      grenade = false;
    let wantsJump = false;
    const weaponRange =
      s.weapon === "shotgun" ? 430 : s.weapon === "rocket" ? 900 : 860;
    const useful = s.pickups?.find(
      (i) =>
        Math.abs(i.x - p.x) < 330 &&
        Math.abs(i.y - p.y - 25) < 100 &&
        (i.kind !== "health" || p.health <= 3),
    );
    if (useful) {
      axis = Math.abs(useful.x - p.x) < 18 ? 0 : useful.x > p.x ? 1 : -1;
      shoot = true;
    } else if (s.arenaEntered && s.guardHealth > 0) {
      const boss = s.boss,
        dx = (s.enemies.find((e) => e.kind === "guard")?.x ?? 7840) - p.x;
      axis = dx > 420 ? 1 : 0;
      shoot = true;
      if (boss.warningTime > 0 && Math.abs(p.x - boss.warningX) < 160) {
        axis = p.x < 7000 ? 1 : -1;
      }
      if (enemy && Math.abs(enemy.x - p.x) < 220) {
        axis =
          p.facing === (enemy.x > p.x ? 1 : -1) ? 0 : enemy.x > p.x ? 1 : -1;
        shoot = true;
      }
      if (dx < 230) axis = -1;
    } else if (enemy && Math.abs(enemy.x - p.x) < weaponRange) {
      const dx = enemy.x - p.x,
        dy = enemy.y - p.y;
      if (Math.abs(dy) < 38) {
        const facing = dx > 0 ? 1 : -1;
        axis = Math.abs(dx) > 420 ? facing : 0;
        if (axis === 0 && p.facing !== facing) axis = facing;
        shoot = true;
        crouch =
          p.grounded && (enemy.kind === "ranged" || enemy.kind === "shield");
        if (
          enemy.kind === "shield" &&
          Math.abs(dx) < 340 &&
          s.grenades > 0 &&
          time - this.lastGrenade > 3
        ) {
          grenade = true;
          this.lastGrenade = time;
        }
      } else if (dy > 38) {
        axis = dx > 0 ? 1 : -1;
        const lift = s.mechanisms?.find((m) => m.kind === "lift");
        if (lift && enemy.x > 5100 && enemy.y > 250 && p.y < 270) {
          if (p.x < lift.x + 30) axis = 1;
          else if (p.x > lift.x + lift.w - 30) axis = -1;
          else {
            axis = 0;
            if (
              p.grounded &&
              Math.abs(p.y - lift.y - lift.h) > 3 &&
              lift.y + lift.h < 276
            )
              wantsJump = true;
          }
        } else if (p.grounded) {
          const roof = s.terrain?.find(
            (r) =>
              r.kind === "platform" &&
              !r.entityId &&
              r.x < enemy.x &&
              r.x + r.w > enemy.x &&
              Math.abs(r.y + r.h - enemy.y) < 6,
          );
          if (
            roof &&
            p.x > roof.x - 25 &&
            p.x < roof.x + roof.w + 25 &&
            p.y < enemy.y - 50
          )
            axis = -1;
          else if (Math.abs(dx) < 500) wantsJump = true;
        }
        shoot = Math.abs(dy) < 95;
      } else {
        // Leave the right edge fully; center-based edge decisions can oscillate
        // while the foot collider still overlaps a platform by a few pixels.
        axis=1;
      }
    }
    // Shoot through real breakable cover on the route; conserve finite weapons in open space.
    if (enemy && enemy.kind !== "guard" && Math.abs(enemy.y - p.y) < 38) {
      const direction = enemy.x > p.x ? 1 : -1,
        gunY = p.y + (crouch ? 26 : 44);
      const wall = s.terrain?.some(
        (r) =>
          r.kind !== "ground" &&
          (!r.entityId ||
            s.objects?.some(
              (o) => o.id === r.entityId && o.kind === "concrete",
            )) &&
          r.y <= gunY &&
          r.y + r.h >= gunY &&
          (direction > 0
            ? r.x > p.x && r.x < enemy.x
            : r.x + r.w < p.x && r.x + r.w > enemy.x),
      );
      if (wall) {
        axis = direction;
        crouch = false;
      }
    }
    const rope = s.objects?.find(
      (o) =>
        o.kind === "rope" && o.alive && Math.abs(o.x - p.x) < 190 && p.y > 180,
    );
    if (rope) {
      axis = rope.x > p.x ? 1 : -1;
      shoot = true;
      aimY = 1;
      crouch = false;
    }
    const cover = s.objects?.find(
      (o) =>
        o.alive &&
        o.kind !== "rope" &&
        o.kind !== "hanging" &&
        o.kind !== "concrete" &&
        Math.abs(o.x - p.x) < 700 &&
        o.y < p.y + 50 &&
        o.y + o.h > p.y + 24 &&
        Math.sign(o.x + o.w / 2 - p.x) === (axis || p.facing),
    );
    if (cover) shoot = true;
    if (p.grounded && axis !== 0) {
      const block = s.terrain?.some(
        (r) =>
          r.kind !== "ground" &&
          !r.entityId?.startsWith("gate:") &&
          r.y < p.y + 74 &&
          r.y + r.h > p.y + 2 &&
          (axis > 0
            ? r.x > p.x && r.x - p.x < 74
            : r.x + r.w < p.x && p.x - (r.x + r.w) < 74),
      );
      if (block) wantsJump = true;
    }
    const threat = s.projectileStates?.some(
      (b) =>
        b.owner === "enemy" &&
        Math.abs(b.x - p.x) < 180 &&
        (b.x - p.x) * b.vx < 0 &&
        Math.abs(b.y - p.y - 35) < 115 &&
        (!crouch || b.kind === "cannon"),
    );
    if (p.grounded && threat) wantsJump = true;
    if (wantsJump && p.grounded && time > this.jumpUntil + 0.1)
      this.jumpUntil = time + 0.38;
    const jumpHeld = time < this.jumpUntil;
    const jump = jumpHeld && !this.wasJumpHeld;
    this.wasJumpHeld = jumpHeld;
    if (jumpHeld) crouch = false;
    if (s.guardHealth === 0) {
      axis = 1;
      shoot = false;
    }
    return { axis, jump, jumpHeld, shoot, crouch, aimY, grenade };
  }
}
module.exports = { PlaytestBrain };
