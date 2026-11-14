import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {SpreadsheetFile,Workbook} from '@oai/artifact-tool';
const project='/Users/yangfan/Desktop/线条突围/stickman-breakout';
const evidence=`${project}/开发进度/验证记录/supplies-patterns-20261114`;
const out=`${project}/开发计划/关卡/道具清单/outputs/01a1da04-096f-7e13-858f-bc43e0bfa6e3`;
await fs.mkdir(out,{recursive:true});await fs.mkdir(`${evidence}/spreadsheet`,{recursive:true});
const data=JSON.parse(await fs.readFile(`${evidence}/inventory.json`,'utf8'));
const workbook=Workbook.create(),sheets=[];
for(const [idx,key]of['land','ocean'].entries()){
 const rows=data[key],sheet=workbook.worksheets.add(idx?'第二关':'第一关'),last=13+rows.length;
 sheets.push(sheet);sheet.showGridLines=false;sheet.tabColor=idx?'#425E8F':'#34495E';
 const used=sheet.getRange(`A1:Q${last}`);used.format.font={name:'Arial',size:11,color:'#242B35'};
 used.format.rowHeight=25;used.format.verticalAlignment='center';used.format.wrapText=false;
 const widths=[90,225,140,90,150,90,230,130,105,105,110,280,24,255,1050,24,430];
 widths.forEach((width,col)=>sheet.getRangeByIndexes(0,col,last,1).format.columnWidthPx=width);
 sheet.getRange('A1:Q1').format.rowHeight=12;
 sheet.getRange('A2').values=[[idx?'第二关道具位置与数量':'第一关道具位置与数量']];
 sheet.getRange('A2').format.font={size:16,bold:true};sheet.getRange('A2:L2').format.rowHeight=30;
 sheet.getRange('A2:L2').format.borders={bottom:{style:'thin',color:'#9FAFC1'}};
 const range=col=>`${col}14:${col}${last}`;
 const count=(criteria=[])=>`=SUMIFS(${range('F')}${criteria.map(([col,value])=>`,${range(col)},"${value}"`).join('')})`;
 const metrics=idx?[
  ['A4','补给箱','B4',count([['H','固定物件']]),9],['C4','声波箱','D4',count([['B','补给箱·声波']]),4],
  ['E4','鱼雷箱','F4',count([['B','补给箱·鱼雷火箭']]),3],['G4','水下手雷箱','H4',count([['B','补给箱·水下手雷']]),2],
  ['I4','锚雷','J4',count([['B','锚雷']]),3],['K4','过场箱','L4',count([['H','过场物件']]),1],
  ['A6','条件血包','B6',count([['B','血包'],['H','低血量触发']]),6],['C6','Boss血包','D6',count([['B','血包'],['H','击杀掉落']]),1],
  ['E6','声波掉落','F6',count([['B','声波补给']]),8],['G6','鱼雷掉落（含小Boss）','H6',count([['B','鱼雷火箭补给']]),5],
  ['I6','补给上限','J6','=SUM(B4,B6,D6,F6,H6)',29]
 ]:[
  ['A4','场景物件','B4',count([['H','固定物件']]),40],['C4','空箱','D4',`=SUMIFS(${range('F')},${range('B')},"木箱")+SUMIFS(${range('F')},${range('B')},"悬挂箱")`,13],
  ['E4','油桶','F4',count([['B','油桶']]),10],['G4','沙袋','H4',count([['B','沙袋']]),7],
  ['I4','混凝土','J4',count([['B','混凝土障碍']]),4],['K4','绳索及桥','L4',`=SUMIFS(${range('F')},${range('B')},"绳索")+SUMIFS(${range('F')},${range('B')},"吊桥")`,4],
  ['A6','火箭箱','B6',count([['B','木箱·火箭筒']]),2],['C6','手雷箱','D6',count([['B','木箱·手雷']]),2],
  ['E6','条件血包','F6',count([['B','血包'],['H','低血量触发']]),5],['G6','Boss血包','H6',count([['B','血包'],['H','击杀掉落']]),1],
  ['I6','补给上限','J6','=SUM(B6,D6,F6,H6)',10]
 ];
 sheet.getRange('A8').values=[['在黄色列填写调整后的坐标、数量或说明，留空表示保留现状。填 0 表示移除。改表后需回写到游戏才会生效。']];
 sheet.getRange('A9').values=[[idx?'X 向右增大，Y 向上增大。箱子坐标为中心 X、落稳后的底边 Y。掉落行的 X/Y 是携带敌人的出生参考点。':'X 向右增大，Y 向上增大。固定场景物件用左下角坐标，血包用生成锚点。当前数据已包含箱子尺寸等运行前修正。']];
 sheet.getRange('A10').values=[[idx?'小 Boss 初始 (5860,360)，大 Boss 初始 (15860,350)。血包 6 个条件点和 1 个击杀奖励。补给上限不含锚雷及过场箱。':'小 Boss 初始 (6160,150)，约 X=5260 激活。血包已从 5110 前移到 4590；油桶从 5330、5420 移到 5930、6020。']];
 sheet.getRange('A11').values=[[idx?'初始装备：生命 5，水下手雷 3，无限鱼叉和潜水刀。血包按需出现、每点最多一次。敌人掉落随死亡位置变化。':'初始装备：生命 5，手雷 3，无限步枪和战术刀。场景物件 40 件已包含 4 个补给箱，不能把箱内补给再加到场景件数。']];
 sheet.getRange('A8:L11').format.font={size:10,color:'#596575'};
 sheet.getRange('I8:L8').format.fill=null;
 const headers=['编号','种类 / 内容','区域','当前 X','当前 Y','件数上限','每件补给效果','出现方式','调整后 X','调整后 Y','调整后数量','修改说明'];
 sheet.getRange('A13:L13').values=[headers];
 const body=rows.map((r,i)=>[`L${idx+1}-${String(i+1).padStart(2,'0')}`,r.type,r.zone,r.x,r.y,r.qty,r.effect,r.mode,null,null,null,null]);
 sheet.getRange(`A14:L${last}`).values=body;
 sheet.getRange(`N13:O${last}`).values=[['原始标识','定位 / 触发说明'],...rows.map(r=>[r.id,r.note])];
 sheet.getRange(`Q13:Q${last}`).values=[['数据来源（当前代码）'],...rows.map(r=>[r.source])];
 const table=sheet.tables.add(`A13:L${last}`,true,idx?'OceanItems':'LandItems');table.showFilterButton=true;table.style='TableStyleLight9';
 sheet.getRange('A13:L13').format={fill:'#34495E',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:29};
 sheet.getRange('I13:L13').format.fill='#936722';
 sheet.getRange(`I14:L${last}`).format.fill='#FFF1CC';
 sheet.getRange(`D14:F${last}`).setNumberFormat('0.0');sheet.getRange(`D14:F${last}`).format.horizontalAlignment='center';
 sheet.getRange(`A14:A${last}`).format.horizontalAlignment='center';
 sheet.getRange(`I14:K${last}`).setNumberFormat('0.0');sheet.getRange(`I14:K${last}`).format.horizontalAlignment='right';
 sheet.getRange(`F14:F${last}`).setNumberFormat('0');sheet.getRange(`K14:K${last}`).setNumberFormat('0');
 sheet.getRange(`N13:O${last}`).format.font={size:10,color:'#586575'};sheet.getRange(`Q13:Q${last}`).format.font={size:10,color:'#586575'};
 sheet.getRange('N13:O13').format.font={bold:true};sheet.getRange('Q13').format.font={bold:true};
 sheet.dataValidations.add({range:`K14:K${last}`,rule:{type:'whole',operator:'between',formula1:0,formula2:999}});
 sheet.freezePanes.freezeRows(13);sheet.freezePanes.freezeColumns(3);
 for(const [label,text,value,formula]of metrics){sheet.getRange(label).values=[[text]];sheet.getRange(label).format.font={size:10,color:'#64748B'};sheet.getRange(value).formulas=[[formula]];sheet.getRange(value).format.font={size:14,bold:true,color:'#1E293B'};sheet.getRange(value).setNumberFormat('0');sheet.getRange(value).format.horizontalAlignment='center';}
 for(const [,,,formula]of metrics)assert.ok(formula.startsWith('='));
 // Persist external check expectations separately from the user worksheet.
 sheets[idx]={sheet,metrics,last};
}
workbook.recalculate();
const checks=[];
for(const {sheet,metrics,last}of sheets){
 for(const [,,cell,,expected]of metrics){assert.equal(sheet.getRange(cell).values[0][0],expected,`${sheet.name}!${cell}`);checks.push({sheet:sheet.name,cell,value:expected});}
 assert.ok(sheet.getRange(`I14:L${last}`).values.every(row=>row.every(x=>x===null||x==='')));
 const inspection=await workbook.inspect({kind:'table',range:`${sheet.name}!A4:L6`,include:'values,formulas',tableMaxRows:3,tableMaxCols:12,maxChars:4000});
 await fs.writeFile(`${evidence}/spreadsheet/${sheet.name}-inspection.jsonl`,inspection.ndjson);
 for(const [suffix,range]of[['overview','A1:L23'],['tail',`A${last-8}:L${last}`]]){
  const png=await workbook.render({sheetName:sheet.name,range,scale:1.5,format:'png'});
  await fs.writeFile(`${evidence}/spreadsheet/${sheet.name}-${suffix}.png`,new Uint8Array(await png.arrayBuffer()));
 }
}
const errors=await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'formula error scan',maxChars:1500});
await fs.writeFile(`${evidence}/spreadsheet/formula-scan.jsonl`,errors.ndjson);
const output=await SpreadsheetFile.exportXlsx(workbook),file=`${out}/两关道具位置与数量.xlsx`;await output.save(file);
await fs.writeFile(`${evidence}/spreadsheet/checks.json`,JSON.stringify({file,checks,landRows:data.land.length,oceanRows:data.ocean.length},null,2));
console.log(JSON.stringify({file,landRows:data.land.length,oceanRows:data.ocean.length,checks:checks.length,formulaScan:errors.ndjson}));
