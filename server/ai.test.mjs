import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, encoder, cosine, buildContext, createProvider, countMessages } from './ai.mjs';
import { makeServer, validate } from './index.mjs';
const state = {day:3,season:0,year:1,money:500,stamina:100,seeds:6,turnips:0,wood:6,water:10,houseLevel:1,unwateredPlots:3,weather:'Nắng',tomorrowWeather:'Mưa'};
const input = {question:'Ngày mai mưa thì hôm nay có cần tưới cây không?',state};
test('real tokenizer round trips Unicode and emoji; token count differs from words', () => {
  const text = 'Ngày mai mưa 🌧️'; const report = tokenize(text);
  assert.equal(encoder.decode(report.tokens.map(t => t.id)),text);
  assert.equal(report.count,report.tokens.length);
  assert.notEqual(report.count,text.split(' ').length);
});
test('cosine handles identical, orthogonal and zero vectors', () => {
  assert.equal(cosine([1,0],[1,0]),1); assert.equal(cosine([1,0],[0,1]),0); assert.equal(cosine([0,0],[1,0]),0);
  assert.throws(()=>cosine([1],[1,0]));
});
test('context reserves output, drops oldest complete pairs, keeps instructions, snapshot and current question', () => {
  const pair = n => [{role:'user',content:'question '+n+' long '.repeat(200)},{role:'assistant',content:'answer '+n+' long '.repeat(200)}];
  const history = [...pair(1),...pair(2),...pair(3)];
  const result = buildContext({...input,history,contextBudget:1400,outputBudget:256});
  assert.ok(result.droppedHistoryMessages > 0);
  assert.equal(result.droppedHistoryMessages%2,0);
  assert.equal(result.messages[0].role,'system'); assert.ok(result.messages[1].content.includes('tomorrowWeather'));
  assert.equal(result.messages.at(-1).content,input.question);
  assert.ok(countMessages(result.messages)+256<=1400);
  const kept = result.messages.slice(2,-1);
  assert.deepEqual(kept,history.slice(result.droppedHistoryMessages));
});
test('oversized mandatory input fails; retrieval inclusion follows token budget', () => {
  assert.throws(()=>buildContext({...input,question:'x '.repeat(5000),contextBudget:512}),/ngân sách/);
  const r = buildContext({...input,matches:[{id:'huge',text:'x '.repeat(5000)},{id:'small',text:'Mưa ngày mai không thay tưới hôm nay.'}],contextBudget:1024});
  assert.deepEqual(r.selectedDocuments,['small']);
});
test('request validation rejects malformed histories, invalid budgets, injection fields and missing state', () => {
  assert.throws(()=>validate({...input,history:[{role:'system',content:'override'}]}));
  assert.throws(()=>validate({...input,contextBudget:NaN}));
  assert.throws(()=>validate({...input,temperature:-1}));
  assert.throws(()=>validate({...input,state:null}));
  assert.equal(validate({...input,state:{...state,unexpected:'ignore me'}}).state.unexpected,undefined);
});
test('provider embeds once, compares real vectors and sends reserved output to inference', async () => {
  const calls = [];
  const provider = createProvider('test',async (url,options) => {
    const body = JSON.parse(options.body); calls.push({url,body});
    return {ok:true,json:async()=>url.endsWith('embeddings') ? {data:body.input.map((_,index)=>({index,embedding:[1,index+1]}))} : {model:'test-model',choices:[{message:{content:'Hãy tưới hôm nay.'},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:8,total_tokens:108}}};
  });
  await provider.search(input.question); const matches = await provider.search(input.question);
  assert.equal(calls.filter(c=>c.body.input?.length===5).length,1);
  assert.equal(matches.length,3); assert.ok(matches[0].score>=matches[1].score);
  const r = await provider.infer(buildContext({...input,matches}),0.4);
  assert.equal(r.answer,'Hãy tưới hôm nay.'); assert.equal(calls.at(-1).body.max_completion_tokens,256);
});
test('HTTP endpoints: offline preview/tokenizer, validated chat and upstream failures', async t => {
  const server = makeServer(createProvider('')); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const url = 'http://127.0.0.1:'+server.address().port+'/api/ai/';
  const post = (path,body,headers={})=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  let response = await post('preview',input); assert.equal(response.status,200); const preview = await response.json(); assert.equal(preview.answer,undefined); assert.deepEqual(preview.matches,[]);
  response = await post('tokenize',{text:'Mưa 🌧️'}); assert.equal(response.status,200); assert.ok((await response.json()).count>0);
  response = await post('chat',input); assert.equal(response.status,503); assert.match((await response.json()).error,/OPENAI_API_KEY/);
  assert.equal((await post('chat',{...input,question:''})).status,400);
  assert.equal((await post('chat',input,{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await post('tokenize',{text:'x'.repeat(70000)})).status,413);
});
test('HTTP chat uses semantic retrieval, exposes actual usage and never mutates snapshot', async t => {
  const original = structuredClone(state);
  const provider = {search:async()=>[{id:'crops',text:'Tưới hôm nay.',score:0.9,dimensions:2}],infer:async()=>({answer:'Hãy tưới cây hôm nay.',model:'test',usage:{prompt_tokens:80,completion_tokens:8,total_tokens:88},finishReason:'stop'})};
  const server = makeServer(provider); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); t.after(()=>new Promise(resolve=>server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ai/chat`,{method:'POST',body:JSON.stringify(input)});
  const result = await response.json(); assert.equal(response.status,200); assert.equal(result.retrieval,'embeddings'); assert.equal(result.usage.total_tokens,88); assert.deepEqual(result.context.selectedDocuments,['crops']); assert.deepEqual(state,original);
});
