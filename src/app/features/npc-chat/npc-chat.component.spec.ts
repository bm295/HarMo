import { TestBed } from '@angular/core/testing';
import { NpcChatComponent } from './npc-chat.component';
import { AiClientService } from '../../core/ai/ai-client.service';
describe('Ellie AI Lab', () => {
  const snapshot = { day:3,season:0,year:1,money:500,stamina:100,seeds:6,turnips:0,wood:6,water:10,houseLevel:1,unwateredPlots:3,weather:'Nắng',tomorrowWeather:'Mưa' };
  let api: jasmine.SpyObj<AiClientService>;
  beforeEach(() => {
    api = jasmine.createSpyObj('AiClientService',['post']);
    TestBed.configureTestingModule({imports:[NpcChatComponent],providers:[{provide:AiClientService,useValue:api}]});
  });
  function create() {
    const fixture = TestBed.createComponent(NpcChatComponent);
    fixture.componentRef.setInput('snapshot',snapshot); fixture.detectChanges(); return fixture;
  }
  it('surfaces backend errors and preserves unsent question/history for retry', async () => {
    api.post.and.rejectWith(new Error('Chưa cấu hình OPENAI_API_KEY'));
    const fixture = create(), c = fixture.componentInstance;
    const question = c.question; await c.run('chat'); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('OPENAI_API_KEY');
    expect(c.history).toEqual([]); expect(c.question).toBe(question); expect(c.busy).toBeFalse();
  });
  it('tokenizes without sending game state or history', async () => {
    api.post.and.resolveTo({count:1,encoding:'o200k_base',tokens:[{id:42,text:'Hello'}]});
    const c = create().componentInstance; c.question = 'Hello'; await c.run('tokenize');
    expect(api.post).toHaveBeenCalledOnceWith('tokenize',{text:'Hello'}); expect(c.history.length).toBe(0); expect(c.tokens?.count).toBe(1);
  });
  it('appends successful chat as complete pairs, sends snapshot without changing it', async () => {
    api.post.and.resolveTo({answer:'Tưới hôm nay.',questionTokens:{count:1,tokens:[],encoding:'o200k_base'}});
    const c = create().componentInstance, question = c.question;
    await c.run('chat');
    expect(c.history).toEqual([{role:'user',content:question},{role:'assistant',content:'Tưới hôm nay.'}]);
    expect(c.question).toBe(''); expect(snapshot.money).toBe(500);
    expect(api.post.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({state:snapshot,history:[],contextBudget:2048,outputBudget:256}));
  });
  it('closing while waiting does not update conversation with a late response', async () => {
    let resolve!: (value: unknown) => void;
    api.post.and.returnValue(new Promise(r=>resolve=r));
    const fixture = create(), c = fixture.componentInstance;
    const pending = c.run('chat'); fixture.destroy(); resolve({answer:'late'}); await pending;
    expect(c.history).toEqual([]); expect(c.result).toBeUndefined();
  });
});
