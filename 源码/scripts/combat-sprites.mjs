/** Read actual SpriteFrame/color/transform state without modifying the game. */
export async function combatSprites(page){return page.evaluate(async()=>{
 const cc=await System.import('cc'),result=[];
 function visit(n){if(!n.activeInHierarchy)return;const sprite=n.getComponent(cc.Sprite),f=sprite?.spriteFrame;
  if(f&&(/^(projectile\.|mech\.|effect\.|shot\.|fx\.)/.test(f.name)||n.name.startsWith('Comic combat pool/')||n.name.startsWith('Shot/'))){const c=sprite.color,t=n.getComponent(cc.UITransform);result.push({frame:f.name,node:n.name,x:n.position.x,y:n.position.y,angle:n.angle,width:t.contentSize.width,height:t.contentSize.height,color:[c.r,c.g,c.b,c.a],rect:[f.rect.x,f.rect.y,f.rect.width,f.rect.height],texture:[f.texture.width,f.texture.height]});}
  for(const child of n.children)visit(child);
 }visit(cc.director.getScene());return result;
});}
