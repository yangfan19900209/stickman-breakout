import { Color, KeyCode, Label, Node, UITransform } from "cc";
import { Ink, node } from "../render/Ink";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { PersonalRecords } from "../social/PersonalRecords";
import { canEnterChapter } from "../social/ChapterAccess";
import { formatTime } from "../social/RunRecords";
import { SafeInsets } from "./ControlLayout";
import { ControlArt } from "./ControlSkin";
import { GameConfig } from "../core/GameConfig";

const ink=new Color(34,32,29), muted=new Color(108,102,93), paper=new Color(246,241,232);
/** Formal campaign entry, independent of developer preview and invitation parameters. */
export class ChapterSelectPanel {
  readonly root: Node;
  private content: Node;
  private status: Label;
  private detail: Label[]=[];
  private buttons: Node[]=[];
  private rotate: Label;
  private busy=false;
  constructor(parent:Node, private adapter:CocosInputAdapter, private personal:PersonalRecords,
    private onChoose:(chapter:1|2)=>Promise<boolean>) {
    this.root=node(parent,"Chapter selection modal");
    const background=new Ink(node(this.root,"Chapter paper"));
    background.rect(-5000,-5000,10000,10000,paper,paper,0);
    this.content=node(this.root,"Chapter selection content");
    this.label("选择关卡",0,236,44,680,68);
    this.button("返回首页",414,236,196,96,()=>this.close());
    this.label("重返战场，挑战自己的最快纪录",0,164,24,900,40,muted);
    ["01  废弃前哨站","02  深海突围"].forEach((title,index)=>{
      const x=index===0?-268:268;
      this.label(title,x,76,32,500,56);
      this.detail.push(this.label("",x,-4,25,490,106,muted));
      this.buttons.push(this.button(index===0?"重玩第一关":"进入第二关",x,-114,456,100,()=>void this.choose((index+1) as 1|2)));
    });
    this.status=this.label("",0,-220,23,1050,65,muted);
    this.rotate=this.label("请横屏选择关卡",0,0,48,1000,100);
    this.rotate.node.parent=this.root; this.rotate.node.active=false;
    this.root.active=false;
  }
  private label(value:string,x:number,y:number,size:number,w:number,h:number,color=ink):Label {
    const target=node(this.content,value,x,y,w,h), label=target.addComponent(Label);
    label.string=value;label.fontFamily="sans-serif";label.fontSize=size;label.lineHeight=size*1.5;
    label.color=color;label.overflow=Label.Overflow.SHRINK;return label;
  }
  private button(value:string,x:number,y:number,w:number,h:number,click:()=>void):Node {
    const target=node(this.content,value,x,y,w,h);
    ControlArt.sprite(target,"Generated chapter button","menu",w,h);
    const label=node(target,value,0,0,w-28,60).addComponent(Label);
    label.string=value;label.fontFamily="sans-serif";label.fontSize=28;label.lineHeight=38;label.color=ink;
    label.overflow=Label.Overflow.SHRINK;this.adapter.registerUI(target,click);return target;
  }
  get visible():boolean{return this.root.active;}
  open():void {
    this.root.active=true;this.busy=false;this.refresh();
    this.adapter.setModal(this.root,()=>this.close(),key=>{
      if(key===KeyCode.DIGIT_1 || key===KeyCode.ENTER)void this.choose(1);
      if(key===KeyCode.DIGIT_2)void this.choose(2);
    });
  }
  close():void {if(!this.visible || this.busy)return;this.root.active=false;this.adapter.setModal();}
  private refresh():void {
    const r=this.personal.records;
    this.detail.forEach((label,index)=>{
      const best=r.times[(index+1) as 1|2];
      label.string=`${r.cleared>=index+1?"已通关":"已解锁"}\n${best?`最快 ${formatTime(best.ms)}`:"暂无竞速纪录"}`;
    });
    this.buttons[1].getComponentInChildren(Label)!.string=r.cleared>=2?"重玩第二关":"进入第二关";
    this.status.string=`微信内每条视频得 1 次复活 · 每关最多 ${GameConfig.revive.videoLimit} 次 · 复活不计最快纪录\n`+
      (this.personal.saved?"第三关筹备中":"本机保存失败，退出后进度可能丢失");
  }
  private async choose(chapter:1|2):Promise<void> {
    if(this.busy || !this.visible || !this.content.active || !canEnterChapter(this.personal.records,chapter))return;
    this.busy=true;this.status.string="正在准备战场…";
    let ok=false;
    try {ok=await this.onChoose(chapter);} finally {this.busy=false;}
    if(ok)this.close();else this.status.string="战场未能打开，请重试或返回首页";
  }
  update(width:number,height:number,portrait:boolean,insets:SafeInsets):void {
    this.root.setPosition(width/2+(insets.left-insets.right)/2,height/2+(insets.bottom-insets.top)/2);
    const scale=Math.min(1,(width-insets.left-insets.right-48)/1080,(height-insets.top-insets.bottom-36)/580);
    this.content.setScale(scale,scale,1);this.content.active=!portrait;this.rotate.node.active=portrait;
  }
  snapshot(){return {visible:this.visible,loading:this.busy,unlocked:[1,...(canEnterChapter(this.personal.records,2)?[2]:[])],
    status:this.status.string,buttons:this.buttons.map(n=>({text:n.getComponentInChildren(Label)!.string,
      x:this.root.position.x+n.position.x*this.content.scale.x,y:this.root.position.y+n.position.y*this.content.scale.y,
      width:n.getComponent(UITransform)!.width*this.content.scale.x,height:n.getComponent(UITransform)!.height*this.content.scale.y}))};}
}
