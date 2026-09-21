export const STATE_SCHEMA_VERSION=4;

function obj(value){ return value && typeof value==='object' && !Array.isArray(value); }
function record(raw,valid,mapper){
  const out={};
  if(!obj(raw)) return out;
  for(const [key,value] of Object.entries(raw)){
    if(!valid.has(key)) continue;
    const mapped=mapper(value,key);
    if(mapped!==undefined) out[key]=mapped;
  }
  return out;
}
function cleanMetrics(value){
  if(!obj(value)) return undefined;
  try{return JSON.parse(JSON.stringify(value))}catch{return undefined}
}

export function createDefaultState(lessons=[],topics=[]){
  return {
    schemaVersion:STATE_SCHEMA_VERSION,
    current:lessons[0]?.id||'',
    topic:topics[0]?.id||'',
    comfortable:{},
    code:{},
    mastery:{},
    search:'',
    metrics:{},
    nodeMetrics:{},
    debug:{}
  };
}

export function normalizeState(raw,lessons=[],topics=[]){
  const defaults=createDefaultState(lessons,topics);
  const source=obj(raw)?raw:{};
  const validLessons=new Set(lessons.map(x=>x.id));
  const validTopics=new Set(topics.map(x=>x.id));
  const current=validLessons.has(source.current)?source.current:defaults.current;
  const currentLesson=lessons.find(x=>x.id===current);
  const topic=source.topic===''?'':(validTopics.has(source.topic)?source.topic:(currentLesson?.topic||defaults.topic));
  return {
    schemaVersion:STATE_SCHEMA_VERSION,
    current,
    topic,
    comfortable:record(source.comfortable,validLessons,v=>!!v),
    code:record(source.code,validLessons,v=>typeof v==='string'?v:undefined),
    mastery:record(source.mastery,validLessons,v=>Array.isArray(v)?Array.from({length:4},(_,i)=>!!v[i]):undefined),
    search:typeof source.search==='string'?source.search.slice(0,120):'',
    metrics:record(source.metrics,validLessons,cleanMetrics),
    nodeMetrics:record(source.nodeMetrics,validLessons,cleanMetrics),
    debug:record(source.debug,validLessons,v=>obj(v)?{answer:Number.isInteger(v.answer)?v.answer:null,revealed:!!v.revealed}:undefined)
  };
}

export function reduceState(state,action,{lessons=[],topics=[]}={}){
  const next={...state};
  switch(action.type){
    case 'OPEN_LESSON':{
      const lesson=lessons.find(x=>x.id===action.id);
      if(!lesson) return state;
      next.current=lesson.id; next.topic=lesson.topic; return next;
    }
    case 'SELECT_TOPIC':
      if(action.id===''||topics.some(x=>x.id===action.id)) next.topic=action.id;
      return next;
    case 'SET_SEARCH': next.search=String(action.value||'').slice(0,120); return next;
    case 'SET_CODE': next.code={...state.code,[action.id]:String(action.value??'')}; return next;
    case 'RESET_CODE': { next.code={...state.code}; delete next.code[action.id]; return next; }
    case 'TOGGLE_COMFORT': next.comfortable={...state.comfortable,[action.id]:!state.comfortable[action.id]}; return next;
    case 'SET_MASTERY': {
      const current=state.mastery[action.id]||[false,false,false,false];
      const values=[...current]; values[action.index]=!!action.value;
      next.mastery={...state.mastery,[action.id]:values}; return next;
    }
    case 'SET_METRICS': next.metrics={...state.metrics,[action.id]:cleanMetrics(action.value)}; return next;
    case 'SET_NODE_METRICS': next.nodeMetrics={...state.nodeMetrics,[action.id]:cleanMetrics(action.value)}; return next;
    case 'SET_DEBUG_ANSWER': {
      const current=state.debug[action.id]||{answer:null,revealed:false};
      next.debug={...state.debug,[action.id]:{...current,answer:Number(action.answer),revealed:false}}; return next;
    }
    case 'REVEAL_DEBUG': {
      const current=state.debug[action.id]||{answer:null,revealed:false};
      next.debug={...state.debug,[action.id]:{...current,revealed:true}}; return next;
    }
    default:return state;
  }
}

export function countComfortable(state,lessons=[]){
  return lessons.reduce((sum,lesson)=>sum+(state.comfortable?.[lesson.id]?1:0),0);
}