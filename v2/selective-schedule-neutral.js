const params=new URLSearchParams(location.search);
if((params.get('mode')||'').toLowerCase()==='selective'){
  const replaceText=text=>String(text||'')
    .replace(/\d+(?:\s*[–-]\s*\d+)?주차에서는/g,'이 수업에서는')
    .replace(/\d+(?:\s*[–-]\s*\d+)?주차에서/g,'수업에서')
    .replace(/\d+(?:\s*[–-]\s*\d+)?주차의/g,'수업의')
    .replace(/\d+(?:\s*[–-]\s*\d+)?주차/g,'수업')
    .replace(/지난주/g,'이전 모듈');
  const clean=root=>{
    root.querySelectorAll?.('.stepMeta').forEach(el=>el.remove());
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{const parent=node.parentElement;if(!parent||['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(parent.tagName))return;const next=replaceText(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;});
  };
  const run=()=>clean(document.body);if(document.body)run();else document.addEventListener('DOMContentLoaded',run,{once:true});
  const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===Node.ELEMENT_NODE)clean(n);else if(n.nodeType===Node.TEXT_NODE&&n.parentElement){const next=replaceText(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;}})));
  const start=()=>observer.observe(document.body,{childList:true,subtree:true});if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
}
