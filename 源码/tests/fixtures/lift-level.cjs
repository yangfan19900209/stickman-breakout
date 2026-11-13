// Isolated mechanics regression. Authored Chapter 01 no longer contains lifts.
const {LevelController}=require('../../.test-build/assets/scripts/level/LevelController.js');
module.exports=()=>new LevelController({name:'mechanism-fixture',width:4000,spawn:{x:100,y:150},exit:{x:3900,y:150},enemies:[],objects:[],
 solids:[{x:0,y:0,w:4000,h:150,kind:'ground'}],
 mechanisms:['C','E'].map((letter,i)=>({id:'lift-'+letter,kind:'lift',x:1000+i*1000,y:168,w:180,h:24,minY:168,maxY:296,speed:65})),
});
