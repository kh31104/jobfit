(function(){
 const MAIN_KEY='careerCompassV64';
 const EXTRA_KEY='careerNavigationViaTop5ExtraV4';
 try{
  const raw=localStorage.getItem(MAIN_KEY);
  if(!raw){
   localStorage.removeItem(EXTRA_KEY);
   return;
  }
  const data=JSON.parse(raw);
  if(Array.isArray(data.via)&&data.via.length>=5){
   localStorage.setItem(EXTRA_KEY,JSON.stringify({
    x4:String(data.via[3]||''),
    x5:String(data.via[4]||'')
   }));
  }
 }catch(e){}
})();
