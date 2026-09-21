export const R=(cpu=0,heap=0,stack=0,queue=0,dom=0,network=0,native=0,threads=0)=>({cpu,heap,stack,queue,dom,network,native,threads});
export const L=(id,topic,title,source,summary,bad,good,code,visual,resources,traps=[],tips=[],runner='worker')=>({id,topic,title,source,summary,compare:{bad,good},code,visual,resources,traps,tips,runner});
export function formatJavaScript(source=''){
  const text=String(source).replace(/\r\n?/g,'\n').trim();
  if(!text||text.includes('\n'))return text;
  let output='';
  let indent=0;
  let parenDepth=0;
  let quote='';
  let regex=false;
  let escaped=false;
  let lineStart=true;
  const write=value=>{
    if(lineStart){
      if(!value.trim())return;
      output+='  '.repeat(indent);
      lineStart=false;
    }
    output+=value;
  };
  const newline=()=>{
    output=output.replace(/[ \t]+$/,'');
    if(!output.endsWith('\n'))output+='\n';
    lineStart=true;
  };
  for(let index=0;index<text.length;index++){
    const char=text[index];
    const next=text[index+1];
    let previousIndex=index-1;
    while(previousIndex>=0&&/\s/.test(text[previousIndex]))previousIndex--;
    const previous=text[previousIndex]||'';
    if(regex){
      write(char);
      if(escaped)escaped=false;
      else if(char==='\\')escaped=true;
      else if(char==='/')regex=false;
      continue;
    }
    if(quote){
      write(char);
      if(escaped)escaped=false;
      else if(char==='\\')escaped=true;
      else if(char===quote)quote='';
      continue;
    }
    if(char==='"'||char==="'"||char==='`'){write(char);quote=char;continue}
    if(char==='/'&&next!=='/'&&next!=='*'&&(!previous||/[([{:;,=!?&|+*%-]/.test(previous))){write(char);regex=true;continue}
    if(char==='/'&&next==='/'){
      write('//');
      index++;
      while(index+1<text.length)write(text[++index]);
      break;
    }
    if(char==='/'&&next==='*'){
      write('/*');
      index++;
      while(index+1<text.length){
        const part=text[++index];
        write(part);
        if(part==='*'&&text[index+1]==='/'){write('/');index++;break}
      }
      continue;
    }
    if(char==='('){write(char);parenDepth++;continue}
    if(char===')'){write(char);parenDepth=Math.max(0,parenDepth-1);continue}
    if(char==='{'){
      write(char);
      indent++;
      newline();
      continue;
    }
    if(char==='}'){
      if(!lineStart)newline();
      indent=Math.max(0,indent-1);
      write(char);
      if(![';',',',')',']'].includes(next))newline();
      continue;
    }
    if(char===';'&&parenDepth===0){write(char);newline();continue}
    write(char);
  }
  return output.trim();
}
