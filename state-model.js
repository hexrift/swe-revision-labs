export const STATE_SCHEMA_VERSION=6;

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
    visited:{},
    code:{},
    mastery:{},
    search:'',
    metrics:{},
    nodeMetrics:{},
    debug:{},
    quiz:{},
    challenge:{currentId:'',startedAt:null,attempts:{},completed:[],results:{},code:{}}
  };
}

function cleanChallengeResult(value){
  if(!obj(value)) return undefined;
  return {
    passed:!!value.passed,
    timedOut:!!value.timedOut,
    duration:Number.isFinite(Number(value.duration))?Math.max(0,Number(value.duration)):0,
    output:typeof value.output==='string'?value.output.slice(0,4000):''
  };
}

export function normalizeState(raw,lessons=[],topics=[],quizzes=[],challenges=[]){
  const defaults=createDefaultState(lessons,topics);
  const source=obj(raw)?raw:{};
  const validLessons=new Set(lessons.map(x=>x.id));
  const validTopics=new Set(topics.map(x=>x.id));
  const validChallenges=new Set(challenges.map(x=>x.id));
  const quizByTopic=new Map(quizzes.map(quiz=>[quiz.topic,quiz]));
  const current=validLessons.has(source.current)?source.current:defaults.current;
  const currentLesson=lessons.find(x=>x.id===current);
  const topic=source.topic===''?'':(validTopics.has(source.topic)?source.topic:(currentLesson?.topic||defaults.topic));
  const legacyVisited=obj(source.comfortable)?source.comfortable:{};
  const explicitVisited=obj(source.visited)?source.visited:{};
  const visitedSource={...legacyVisited,...explicitVisited};
  return {
    schemaVersion:STATE_SCHEMA_VERSION,
    current,
    topic,
    comfortable:record(source.comfortable,validLessons,v=>!!v),
    visited:record(visitedSource,validLessons,v=>!!v),
    code:record(source.code,validLessons,v=>typeof v==='string'?v:undefined),
    mastery:record(source.mastery,validLessons,v=>Array.isArray(v)?Array.from({length:4},(_,i)=>!!v[i]):undefined),
    search:typeof source.search==='string'?source.search.slice(0,120):'',
    metrics:record(source.metrics,validLessons,cleanMetrics),
    nodeMetrics:record(source.nodeMetrics,validLessons,cleanMetrics),
    debug:record(source.debug,validLessons,(value,key)=>{
      if(!obj(value)) return undefined;
      const lesson=lessons.find(item=>item.id===key);
      const optionCount=lesson?.debug?.options?.length??0;
      const answer=Number.isInteger(value.answer)&&optionCount>0&&value.answer>=0&&value.answer<optionCount?value.answer:null;
      return {answer,revealed:answer!==null&&!!value.revealed};
    }),
    quiz:record(source.quiz,validTopics,(value,key)=>{
      const definition=quizByTopic.get(key);
      if(!definition||!obj(value)) return undefined;
      const answers=Array.from({length:definition.questions.length},(_,index)=>{
        const answer=value.answers?.[index];
        return Number.isInteger(answer)&&answer>=0&&answer<definition.questions[index].options.length?answer:null;
      });
      return {answers,submitted:!!value.submitted,passed:!!value.passed};
    }),
    challenge:(()=>{
      const value=obj(source.challenge)?source.challenge:{};
      const currentId=validChallenges.has(value.currentId)?value.currentId:(challenges[0]?.id||'');
      const attempts=record(value.attempts,validChallenges,v=>Number.isInteger(v)&&v>=0?v:undefined);
      const results=record(value.results,validChallenges,cleanChallengeResult);
      const code=record(value.code,validChallenges,v=>typeof v==='string'?v.slice(0,20000):undefined);
      const completed=Array.isArray(value.completed)?[...new Set(value.completed.filter(id=>validChallenges.has(id)))]:[];
      const startedAt=Number.isFinite(Number(value.startedAt))&&Number(value.startedAt)>0?Number(value.startedAt):null;
      return {currentId,startedAt,attempts,completed,results,code};
    })()
  };
}

export function reduceState(state,action,{lessons=[],topics=[],quizzes=[],challenges=[]}={}){
  const next={...state};
  const validLesson=lessons.some(lesson=>lesson.id===action.id);
  const validChallenge=challenges.some(challenge=>challenge.id===action.id);
  switch(action.type){
    case 'OPEN_LESSON':{
      const lesson=lessons.find(x=>x.id===action.id);
      if(!lesson) return state;
      next.current=lesson.id; next.topic=lesson.topic;
      next.visited={...state.visited,[lesson.id]:true};
      return next;
    }
    case 'SELECT_TOPIC':
      if(action.id===''||topics.some(x=>x.id===action.id)) next.topic=action.id;
      return next;
    case 'SET_SEARCH': next.search=String(action.value||'').slice(0,120); return next;
    case 'SET_CODE': if(!validLesson)return state; next.code={...state.code,[action.id]:String(action.value??'')}; return next;
    case 'RESET_CODE': { if(!validLesson)return state; next.code={...state.code}; delete next.code[action.id]; return next; }
    case 'TOGGLE_COMFORT': if(!validLesson)return state; next.comfortable={...state.comfortable,[action.id]:!state.comfortable[action.id]}; return next;
    case 'SET_MASTERY': {
      if(!validLesson||!Number.isInteger(action.index)||action.index<0||action.index>3)return state;
      const current=state.mastery[action.id]||[false,false,false,false];
      const values=[...current]; values[action.index]=!!action.value;
      next.mastery={...state.mastery,[action.id]:values}; return next;
    }
    case 'SET_METRICS': if(!validLesson)return state; next.metrics={...state.metrics,[action.id]:cleanMetrics(action.value)}; return next;
    case 'SET_NODE_METRICS': if(!validLesson)return state; next.nodeMetrics={...state.nodeMetrics,[action.id]:cleanMetrics(action.value)}; return next;
    case 'SET_DEBUG_ANSWER': {
      const lesson=lessons.find(item=>item.id===action.id);
      const answer=Number(action.answer);
      const optionCount=lesson?.debug?.options?.length??0;
      if(optionCount===0||!Number.isInteger(answer)||answer<0||answer>=optionCount)return state;
      const current=state.debug[action.id]||{answer:null,revealed:false};
      next.debug={...state.debug,[action.id]:{...current,answer,revealed:false}}; return next;
    }
    case 'REVEAL_DEBUG': {
      if(!validLesson||state.debug[action.id]?.answer===null||state.debug[action.id]?.answer===undefined)return state;
      const current=state.debug[action.id]||{answer:null,revealed:false};
      next.debug={...state.debug,[action.id]:{...current,revealed:true}}; return next;
    }
    case 'SET_QUIZ_ANSWER': {
      const topic=topics.find(item=>item.id===action.topic);
      const definition=quizzes.find(item=>item.topic===action.topic);
      const questionIndex=Number(action.question);
      const answer=Number(action.answer);
      if(!topic||!definition||!Number.isInteger(questionIndex)||questionIndex<0||questionIndex>=definition.questions.length||!Number.isInteger(answer)||answer<0||answer>=definition.questions[questionIndex].options.length)return state;
      const current=state.quiz[action.topic]||{answers:Array(definition.questions.length).fill(null),submitted:false,passed:false};
      if(current.submitted)return state;
      const answers=Array.from({length:definition.questions.length},(_,index)=>current.answers?.[index]??null);
      answers[questionIndex]=answer;
      next.quiz={...state.quiz,[action.topic]:{answers,submitted:false,passed:false}};
      return next;
    }
    case 'RETAKE_QUIZ': {
      const definition=quizzes.find(item=>item.topic===action.topic);
      if(!definition||!topics.some(item=>item.id===action.topic))return state;
      next.quiz={...state.quiz,[action.topic]:{answers:Array(definition.questions.length).fill(null),submitted:false,passed:false}};
      return next;
    }
    case 'SUBMIT_QUIZ': {
      const definition=quizzes.find(item=>item.topic===action.topic);
      if(!definition||!topics.some(item=>item.id===action.topic))return state;
      const current=state.quiz[action.topic]||{answers:Array(definition.questions.length).fill(null),submitted:false,passed:false};
      if(current.answers.length!==definition.questions.length||current.answers.some(answer=>answer===null||answer===undefined))return state;
      const passed=definition.questions.every((question,index)=>current.answers[index]===question.answer);
      next.quiz={...state.quiz,[action.topic]:{...current,submitted:true,passed}};
      return next;
    }
    case 'START_CHALLENGE': {
      if(!validChallenge)return state;
      const startedAt=Number(action.startedAt);
      if(!Number.isFinite(startedAt)||startedAt<=0)return state;
      next.challenge={...state.challenge,currentId:action.id,startedAt};
      return next;
    }
    case 'SET_CHALLENGE_CODE': {
      if(!validChallenge)return state;
      next.challenge={...state.challenge,code:{...state.challenge.code,[action.id]:String(action.value??'')}};
      return next;
    }
    case 'RECORD_CHALLENGE_RESULT': {
      if(!validChallenge||!obj(action.result))return state;
      const result=cleanChallengeResult(action.result);
      if(!result)return state;
      const attempts=(state.challenge.attempts?.[action.id]||0)+1;
      const completed=state.challenge.completed?.includes(action.id)?state.challenge.completed:[...(state.challenge.completed||[]),action.id];
      next.challenge={...state.challenge, currentId:action.id, startedAt:null, attempts:{...state.challenge.attempts,[action.id]:attempts}, completed, results:{...state.challenge.results,[action.id]:result}};
      return next;
    }
    case 'RESET_CHALLENGE': {
      if(!validChallenge)return state;
      const results={...state.challenge.results};
      const attempts={...state.challenge.attempts};
      const code={...state.challenge.code};
      delete results[action.id];
      delete attempts[action.id];
      delete code[action.id];
      next.challenge={...state.challenge,currentId:action.id,startedAt:null,attempts,results,code,completed:(state.challenge.completed||[]).filter(id=>id!==action.id)};
      return next;
    }
    case 'NEXT_CHALLENGE': {
      if(!challenges.length)return state;
      const completed=new Set(state.challenge.completed||[]);
      const currentIndex=challenges.findIndex(challenge=>challenge.id===state.challenge.currentId);
      const ordered=[...challenges.slice(Math.max(0,currentIndex+1)),...challenges.slice(0,Math.max(0,currentIndex+1))];
      const nextChallenge=ordered.find(challenge=>!completed.has(challenge.id));
      next.challenge={...state.challenge,currentId:nextChallenge?.id||'',startedAt:null};
      return next;
    }
    case 'RESET_CHALLENGES':
      next.challenge={currentId:challenges[0]?.id||'',startedAt:null,attempts:{},completed:[],results:{},code:{}};
      return next;
    default:return state;
  }
}

export function countComfortable(state,lessons=[]){
  return lessons.reduce((sum,lesson)=>sum+(state.comfortable?.[lesson.id]?1:0),0);
}

export function countVisited(state,lessons=[]){
  return lessons.reduce((sum,lesson)=>sum+(state.visited?.[lesson.id]?1:0),0);
}

export function countCompletedTopics(state,topics=[]){
  return topics.reduce((sum,topic)=>sum+(state.quiz?.[topic.id]?.passed?1:0),0);
}
