import { GameConfig as C, WeaponId } from "../core/GameConfig";

/** One synchronous description consumed by HUD, actor, shots and audio. */
export function weaponPresentation(id: WeaponId, ammo: number) {
  const config = C.weapons[id];
  return {
    id, name: config.name, ammo,
    icon: `weapon.${id}` as `weapon.${WeaponId}`,
    ammoText: id === "knife" ? "近战 · 三段连击" : ammo < 0 ? "∞  弹药" : `剩余 ${ammo} 发`,
    projectile: id === "knife" ? null : id === "rocket" ? "rocket" as const : id === "shotgun" ? "pellet" as const : "bullet" as const,
    sound: id, width: id === "knife" ? 44 : id === "rocket" ? 66 : 59,
    mode: id === "knife" ? "melee" as const : "ranged" as const,
    muzzleExtra: id === "rifle" ? 0 : 9,
  };
}
