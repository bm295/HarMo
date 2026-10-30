import { Component, ElementRef, HostListener, inject, input, output, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiClientService, AiResult, ChatMessage, FarmSnapshot, TokenReport } from '../../core/ai/ai-client.service';
@Component({
  selector: 'app-npc-chat', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <div class="backdrop" (click)="closed.emit()">
      <section role="dialog" aria-modal="true" aria-labelledby="ai-title" (click)="$event.stopPropagation()">
        <header><h2 id="ai-title">🌿 Ellie · AI Lab</h2><button (click)="closed.emit()" aria-label="Đóng AI Lab">×</button></header>
        <p>Hỏi Ellie về nông trại hiện tại. AI chỉ tư vấn và không thay đổi tiến trình.</p>
        <p class="hint">Khi bấm “Hỏi Ellie”, câu hỏi, trạng thái và lịch sử đang mở sẽ được gửi tới dịch vụ AI. Xem context và đếm token chạy trên server của bạn, không gọi model.</p>
        <div class="history" aria-live="polite">
          @for (message of history; track $index) { <p><strong>{{ message.role === 'user' ? 'Bạn' : 'Ellie' }}:</strong> {{ message.content }}</p> }
        </div>
        <label for="ai-question">Câu hỏi / văn bản thử tokenizer</label>
        <textarea id="ai-question" [(ngModel)]="question" maxlength="4000" rows="3" [disabled]="busy"></textarea>
        <div class="settings">
          <label>Ngân sách context (token)<input type="number" [(ngModel)]="contextBudget" min="512" max="8192" [disabled]="busy"></label>
          <label>Dành cho đầu ra<input type="number" [(ngModel)]="outputBudget" min="32" max="1024" [disabled]="busy"></label>
          <label>Temperature<input type="number" [(ngModel)]="temperature" min="0" max="2" step="0.1" [disabled]="busy"></label>
        </div>
        <div class="actions">
          <button (click)="run('tokenize')" [disabled]="busy || !question.trim()">Đếm token</button>
          <button (click)="run('preview')" [disabled]="busy || !question.trim()">Xem context</button>
          <button (click)="run('chat')" [disabled]="busy || !question.trim()">Hỏi Ellie · gọi AI</button>
          <button (click)="clear()" [disabled]="busy">Xóa hội thoại</button>
        </div>
        @if (busy) { <p role="status">Đang xử lý…</p> }
        @if (error) { <p role="alert" class="error">{{ error }}</p> }
        @if (tokens) {
          <h3>Tokens · {{ tokens.count }} · {{ tokens.encoding }}</h3>
          <p>Token khác từ và ký tự. Một token có thể chỉ chứa một phần byte của ký tự Unicode; xem cả chuỗi để đọc đúng tiếng Việt.</p>
          <div class="tokens">@for (token of tokens.tokens; track $index) { <span [title]="'Token ID: ' + token.id">{{ token.text | json }} <small>#{{ token.id }}</small></span> }</div>
        }
        @if (result; as r) {
          <h3>Context window</h3>
          <p>Đầu vào ước lượng: {{ r.context.estimatedInputTokens }} · dành cho đầu ra: {{ r.context.outputBudget }} / ngân sách thử nghiệm: {{ r.context.contextBudget }} token.</p>
          <p>Đã bỏ {{ r.context.droppedHistoryMessages }} tin lịch sử. Ngân sách này là giới hạn của bài thực hành, không phải dung lượng tối đa của model. Số token đóng gói chat là ước lượng có dự phòng.</p>
          <details><summary>Context chính xác đã dựng / gửi</summary><pre>{{ r.context.messages | json }}</pre></details>
          <h3>Embeddings và tìm từ khóa</h3>
          <p>{{ r.retrieval }}. Cosine đo độ gần vector, không phải xác suất câu trả lời đúng.</p>
          @for (match of r.matches; track match.id) { <p><strong>{{ match.id }}</strong> · cosine {{ match.score | number:'1.3-3' }} · {{ match.dimensions }} chiều · {{ r.context.selectedDocuments.includes(match.id) ? 'đã đưa vào context' : 'không vừa ngân sách' }}<br>{{ match.text }}</p> }
          <details><summary>So sánh thứ hạng từ khóa (số từ trùng)</summary><pre>{{ r.keywords | json }}</pre></details>
          <h3>Inference</h3>
          <p>Model: {{ r.model }} · toàn bộ luồng: {{ r.elapsedMs }} ms · temperature: {{ lastTemperature }}</p>
          @if (r.usage) { <p>Usage từ provider: input {{ r.usage.prompt_tokens }}, output {{ r.usage.completion_tokens }}, tổng {{ r.usage.total_tokens }} token. Kết thúc: {{ r.finishReason }}.</p> }
          @else { <p>Chưa chạy inference. Inference dùng model đã huấn luyện để sinh câu trả lời; hội thoại không tự huấn luyện model.</p> }
        }
      </section>
    </div>`,
  styles: [`
    :host { position:fixed; inset:0; z-index:1000; font:15px/1.5 system-ui,sans-serif; color:#20382a; }
    .backdrop { height:100%; background:#10291cb8; display:grid; place-items:center; padding:16px; box-sizing:border-box; }
    section { background:#fffdf6; width:min(850px,100%); max-height:90dvh; overflow:auto; padding:24px; border-radius:18px; box-sizing:border-box; box-shadow:0 12px 60px #0005; }
    header { display:flex; align-items:center; justify-content:space-between; gap:16px; } h2 { margin:0; } h3 { margin-bottom:8px; }
    button { cursor:pointer; border:1px solid #8da78f; border-radius:8px; background:#e6f1dc; color:#183d25; padding:9px 13px; font:inherit; } button:disabled { opacity:.5; cursor:wait; }
    textarea,input { font:inherit; box-sizing:border-box; border:1px solid #8da78f; border-radius:6px; padding:8px; background:white; color:#20382a; } textarea { width:100%; }
    .settings,.actions { display:flex; flex-wrap:wrap; gap:10px; margin:12px 0; } label { display:block; } input { display:block; width:145px; }
    .hint { color:#526455; font-size:13px; } .error { color:#a12626; } .history p { white-space:pre-wrap; }
    pre { white-space:pre-wrap; overflow-wrap:anywhere; background:#eef1e9; padding:12px; max-height:300px; overflow:auto; }
    .tokens { display:flex; flex-wrap:wrap; gap:5px; max-height:180px; overflow:auto; } .tokens span { background:#e1edda; border-radius:4px; padding:3px 6px; } small { color:#526455; }
    :focus-visible { outline:3px solid #277b58; outline-offset:2px; }
  `]
})
export class NpcChatComponent implements AfterViewInit, OnDestroy {
  readonly snapshot = input.required<FarmSnapshot>();
  readonly closed = output<void>();
  private readonly api = inject(AiClientService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly returnTarget = document.activeElement as HTMLElement | null;
  private disposed = false;
  question = 'Ngày mai mưa, hôm nay tôi nên làm gì?';
  contextBudget = 2048; outputBudget = 256; temperature = 0.4; lastTemperature = 0.4;
  history: ChatMessage[] = []; tokens?: TokenReport; result?: AiResult; error = ''; busy = false;
  ngAfterViewInit(): void { this.host.nativeElement.querySelector<HTMLTextAreaElement>('textarea')?.focus(); }
  ngOnDestroy(): void { this.disposed = true; this.returnTarget?.focus(); }
  clear(): void { this.history = []; this.result = undefined; this.tokens = undefined; this.error = ''; }
  async run(mode: 'tokenize' | 'preview' | 'chat'): Promise<void> {
    if (this.busy) return;
    this.busy = true; this.error = ''; this.result = undefined; this.tokens = undefined;
    const question = this.question.trim();
    try {
      if (mode === 'tokenize') {
        const tokens = await this.api.post<TokenReport>(mode,{ text: question });
        if (!this.disposed) this.tokens = tokens;
      } else {
        const result = await this.api.post<AiResult>(mode,{ question, state: this.snapshot(), history: this.history, contextBudget: this.contextBudget, outputBudget: this.outputBudget, temperature: this.temperature });
        if (this.disposed) return;
        this.result = result; this.tokens = result.questionTokens; this.lastTemperature = this.temperature;
        if (result.answer) { this.history = [...this.history, {role:'user',content:question}, {role:'assistant',content:result.answer}].slice(-40) as ChatMessage[]; this.question = ''; }
      }
    } catch(e) { if (!this.disposed) this.error = e instanceof Error ? e.message : 'Không thể xử lý.'; }
    finally { this.busy = false; }
  }
  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { event.stopPropagation(); this.closed.emit(); }
    if (event.key !== 'Tab') return;
    const items = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]),textarea:not([disabled]),input:not([disabled]),summary'));
    const first = items[0], last = items[items.length-1];
    if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
    else if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
  }
}
