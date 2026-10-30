import { Injectable } from '@angular/core';
export interface ChatMessage { role: 'user' | 'assistant'; content: string; }
export interface FarmSnapshot {
  day: number; season: number; year: number; money: number; stamina: number;
  seeds: number; turnips: number; wood: number; water: number; houseLevel: number;
  unwateredPlots: number; weather: string; tomorrowWeather: string;
}
export interface TokenReport { count: number; encoding: string; tokens: { id: number; text: string }[]; }
export interface AiResult {
  answer?: string; model: string; elapsedMs: number; retrieval: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  finishReason?: string; questionTokens: TokenReport;
  context: { messages: { role: string; content: string }[]; estimatedInputTokens: number; contextBudget: number; outputBudget: number; droppedHistoryMessages: number; selectedDocuments: string[] };
  matches: { id: string; text: string; score: number; dimensions: number }[];
  keywords: { id: string; text: string; score: number }[];
}
@Injectable({ providedIn: 'root' })
export class AiClientService {
  async post<T>(path: string, body: unknown): Promise<T> {
    let response: Response;
    try { response = await fetch('/api/ai/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(70000) }); }
    catch { throw new Error('Không kết nối được AI API. Hãy chạy npm run server rồi thử lại.'); }
    let data;
    try { data = await response.json(); } catch { throw new Error('AI API chưa sẵn sàng. Kiểm tra server và proxy.'); }
    if (!response.ok) throw new Error(data.error ?? 'AI API gặp lỗi.');
    return data as T;
  }
}
