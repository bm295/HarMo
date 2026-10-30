import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { tokenize, buildContext, createProvider, keywordSearch, MODEL } from './ai.mjs';
const bad = message => Object.assign(new Error(message), { status: 400 });
function integer(value, fallback, min, max) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < min || value > max) throw bad(`Giá trị phải là số nguyên từ ${min} đến ${max}.`);
  return value;
}
export function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw bad('JSON không hợp lệ.');
  if (typeof body.question !== 'string' || !body.question.trim() || body.question.length > 4000) throw bad('Câu hỏi cần 1–4000 ký tự.');
  const history = body.history ?? [];
  if (!Array.isArray(history) || history.length > 40 || history.length % 2 || history.some((m,i) => !m || m.role !== (i%2 ? 'assistant' : 'user') || typeof m.content !== 'string' || m.content.length > 4000)) throw bad('Lịch sử cần các cặp user/assistant, tối đa 40 tin.');
  const source = body.state;
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw bad('Thiếu trạng thái game.');
  const state = {};
  for (const key of ['day','season','year','money','stamina','seeds','turnips','wood','water','houseLevel','unwateredPlots']) {
    if (!Number.isFinite(source[key]) || source[key] < 0 || source[key] > 1e12) throw bad('Trạng thái không hợp lệ: '+key);
    state[key] = source[key];
  }
  for (const key of ['weather','tomorrowWeather']) {
    if (!['Nắng','Mưa'].includes(source[key])) throw bad('Thời tiết không hợp lệ.');
    state[key] = source[key];
  }
  const temperature = body.temperature ?? 0.4;
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) throw bad('Temperature từ 0 đến 2.');
  return { question: body.question.trim(), state, history, contextBudget: integer(body.contextBudget,2048,512,8192), outputBudget: integer(body.outputBudget,256,32,1024), temperature };
}
export function makeServer(provider = createProvider(process.env.OPENAI_API_KEY)) {
  let busy = 0;
  return createServer(async (req,res) => {
    const send = (status,data) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); };
    if (req.method !== 'POST' || !['/api/ai/tokenize','/api/ai/preview','/api/ai/chat'].includes(req.url)) return send(404,{error:'Không tìm thấy endpoint.'});
    if (req.headers.origin && !['http://localhost:4200','http://127.0.0.1:4200'].includes(req.headers.origin)) return send(403,{error:'Origin không được phép.'});
    if (busy >= 4) return send(429,{error:'Server đang bận. Thử lại sau.'});
    busy++;
    try {
      const chunks = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 65536) throw Object.assign(new Error('Request quá lớn.'),{status:413}); chunks.push(chunk); }
      let body; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw bad('JSON không hợp lệ.'); }
      if (req.url.endsWith('/tokenize')) {
        if (typeof body?.text !== 'string' || body.text.length > 4000) throw bad('Văn bản tối đa 4000 ký tự.');
        return send(200,tokenize(body.text));
      }
      const input = validate(body);
      const start = performance.now();
      const keywords = keywordSearch(input.question).slice(0,3);
      // Preview stays offline; semantic retrieval and inference are explicitly opt-in.
      const matches = req.url.endsWith('/chat') ? await provider.search(input.question) : [];
      const context = buildContext({...input,matches});
      const result = req.url.endsWith('/chat') ? await provider.infer(context,input.temperature) : {};
      send(200,{ ...result, context, matches, keywords, model: result.model ?? MODEL, retrieval: req.url.endsWith('/chat') ? 'embeddings' : 'none (offline preview)', elapsedMs: Math.round(performance.now()-start), questionTokens: tokenize(input.question) });
    } catch(e) { send(e.status ?? 502,{error: e.status ? e.message : 'Không thể kết nối dịch vụ AI. Kiểm tra server và thử lại.'}); }
    finally { busy--; }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) makeServer().listen(3001,'127.0.0.1',()=>console.log('AI API: http://127.0.0.1:3001'));
