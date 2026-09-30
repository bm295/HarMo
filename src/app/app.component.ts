import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, signal } from '@angular/core';

type ToolId = 'hand' | 'hoe' | 'seeds' | 'can' | 'axe' | 'hammer';
type PlotState = 'empty' | 'tilled' | 'seeded' | 'growing' | 'ready';
type Weather = 'Nắng' | 'Mưa';
type SceneId = 'farm' | 'house';
type HousePanel = 'bookshelf' | 'journal' | 'television' | 'toolbox' | 'kitchen' | 'upgrade';
type TvChannel = 'weather' | 'events' | 'shopping';
type ControlPresetId = 'classic' | 'wasd' | 'arrows';
type ShopItemId = 'seed-box' | 'copper-pan' | 'flower-vase';
type RecipeId = 'turnip-soup' | 'farm-stew';

interface Plot {
  id: number;
  state: PlotState;
  watered: boolean;
  growth: number;
}

interface GameState {
  cows: number;
  sheep: number;
  barnLevel: 1 | 2;
  fodder: number;
  trough: number;
  grassSeeds: number;
  grass: number;
  grassGrowth: number;
  fish: number;
  fishFeed: number;
  water: number;
  storedWood: number;
  fence: number;
  animalsOutside: boolean;
  horseOutside: boolean;
  farmerName: string;
  farmName: string;
  day: number;
  season: number;
  year: number;
  time: number;
  weather: Weather;
  tomorrowWeather: Weather;
  money: number;
  stamina: number;
  wood: number;
  logAvailable: boolean;
  seeds: number;
  turnips: number;
  affection: number;
  houseLevel: 1 | 2 | 3;
  controlPreset: ControlPresetId;
  mealsCooked: number;
  orderedItems: ShopItemId[];
  plots: Plot[];
}

interface Tool {
  id: ToolId;
  icon: string;
  label: string;
  description: string;
}

interface ControlBinding {
  label: string;
  value: string;
}

interface ControlPreset {
  id: ControlPresetId;
  name: string;
  description: string;
  icon: string;
  bindings: {
    previous: ControlBinding;
    next: ControlBinding;
    home: ControlBinding;
    journal: ControlBinding;
    menu: ControlBinding;
  };
}

interface SeasonEvent {
  day: number;
  name: string;
  icon: string;
  description: string;
}

interface TvProduct {
  id: ShopItemId;
  icon: string;
  name: string;
  description: string;
  price: number;
  repeatable: boolean;
}

interface Recipe {
  id: RecipeId;
  icon: string;
  name: string;
  description: string;
  turnips: number;
  energy: number;
}

const JOURNAL_STORAGE_KEY = 'moc-lan-farm-journal-v2';

const CONTROL_PRESETS: ControlPreset[] = [
  {
    id: 'classic', name: 'Cổ điển', icon: '⌨️', description: 'Phím tắt cân bằng cho hai tay.',
    bindings: {
      previous: { label: 'Q', value: 'q' }, next: { label: 'E', value: 'e' },
      home: { label: 'H', value: 'h' }, journal: { label: 'J', value: 'j' }, menu: { label: 'M', value: 'm' }
    }
  },
  {
    id: 'wasd', name: 'WASD', icon: '🎮', description: 'Thuận tiện khi tay trái đặt trên WASD.',
    bindings: {
      previous: { label: 'A', value: 'a' }, next: { label: 'D', value: 'd' },
      home: { label: 'F', value: 'f' }, journal: { label: 'R', value: 'r' }, menu: { label: 'C', value: 'c' }
    }
  },
  {
    id: 'arrows', name: 'Một tay', icon: '🖐️', description: 'Điều khiển gọn bằng cụm phím mũi tên.',
    bindings: {
      previous: { label: '←', value: 'arrowleft' }, next: { label: '→', value: 'arrowright' },
      home: { label: '↑', value: 'arrowup' }, journal: { label: '↓', value: 'arrowdown' }, menu: { label: '/', value: '/' }
    }
  }
];

const SEASON_EVENTS: SeasonEvent[][] = [
  [
    { day: 8, name: 'Lễ hội Nữ thần Mùa xuân', icon: '🌸', description: 'Quảng trường làng · 10:00' },
    { day: 18, name: 'Hội chợ Gà', icon: '🐔', description: 'Quảng trường làng · 09:00' },
    { day: 24, name: 'Đêm ngắm sao', icon: '✨', description: 'Đỉnh núi Mẹ · 18:00' }
  ],
  [
    { day: 7, name: 'Lễ hội Biển', icon: '🏖️', description: 'Bãi biển · 10:00' },
    { day: 17, name: 'Hội chợ Bò', icon: '🐄', description: 'Nông trại Yodel · 09:00' },
    { day: 24, name: 'Lễ hội Pháo hoa', icon: '🎆', description: 'Bãi biển · 18:00' }
  ],
  [
    { day: 9, name: 'Lễ hội Thu hoạch', icon: '🥕', description: 'Quảng trường làng · 10:00' },
    { day: 18, name: 'Hội chợ Cừu', icon: '🐑', description: 'Nông trại Yodel · 09:00' },
    { day: 26, name: 'Hội Trăng rằm', icon: '🌕', description: 'Đỉnh núi Mẹ · 18:00' }
  ],
  [
    { day: 10, name: 'Đua chó mùa Đông', icon: '🐕', description: 'Quảng trường làng · 10:00' },
    { day: 20, name: 'Lễ hội Lửa ấm', icon: '🔥', description: 'Quảng trường làng · 17:00' },
    { day: 30, name: 'Đêm Giao mùa', icon: '🔔', description: 'Nhà thờ · 23:00' }
  ]
];

const TV_PRODUCTS: TvProduct[] = [
  { id: 'seed-box', icon: '🌱', name: 'Hộp hạt giống 12 gói', description: 'Nhận ngay 12 hạt củ cải.', price: 180, repeatable: true },
  { id: 'copper-pan', icon: '🍳', name: 'Bộ nồi đồng', description: 'Món ăn hồi thêm 10 thể lực.', price: 450, repeatable: false },
  { id: 'flower-vase', icon: '🏺', name: 'Bình hoa đồng nội', description: 'Trang trí bàn trong căn nhà.', price: 280, repeatable: false }
];

const RECIPES: Recipe[] = [
  { id: 'turnip-soup', icon: '🥣', name: 'Súp củ cải', description: 'Một bữa nhẹ, ấm bụng.', turnips: 1, energy: 25 },
  { id: 'farm-stew', icon: '🍲', name: 'Hầm rau nhà nông', description: 'No lâu sau một ngày làm việc.', turnips: 2, energy: 50 }
];

const FRESH_GAME: GameState = {
  cows: 0, sheep: 0, barnLevel: 1, fodder: 0, trough: 0, grassSeeds: 0, grass: 0, grassGrowth: 0,
  fish: 0, fishFeed: 0, water: 10, storedWood: 0, fence: 0, animalsOutside: false, horseOutside: false,
  farmerName: 'Pete', farmName: 'Mộc Lan', day: 3, season: 0, year: 1,
  time: 390, weather: 'Nắng', tomorrowWeather: 'Mưa', money: 500, stamina: 100,
  wood: 6, logAvailable: true, seeds: 6, turnips: 0, affection: 0, houseLevel: 1,
  controlPreset: 'classic', mealsCooked: 0, orderedItems: [],
  plots: Array.from({ length: 12 }, (_, id) => ({ id, state: id < 3 ? 'tilled' : 'empty', watered: false, growth: 0 }))
};

function normalizeGameState(value: unknown): GameState {
  const source = value && typeof value === 'object' ? value as Partial<GameState> : {};
  const validPlotStates: PlotState[] = ['empty', 'tilled', 'seeded', 'growing', 'ready'];
  const incomingPlots = Array.isArray(source.plots) ? source.plots : [];
  const plots = FRESH_GAME.plots.map((fallback, id) => {
    const incoming = incomingPlots[id];
    if (!incoming || typeof incoming !== 'object') return { ...fallback };
    const candidate = incoming as Partial<Plot>;
    return {
      id,
      state: validPlotStates.includes(candidate.state as PlotState) ? candidate.state as PlotState : fallback.state,
      watered: typeof candidate.watered === 'boolean' ? candidate.watered : false,
      growth: Number.isFinite(candidate.growth) ? Math.max(0, Number(candidate.growth)) : 0
    };
  });
  const level = source.houseLevel === 2 || source.houseLevel === 3 ? source.houseLevel : 1;
  const preset = CONTROL_PRESETS.some(item => item.id === source.controlPreset) ? source.controlPreset as ControlPresetId : 'classic';
  const validShopIds: ShopItemId[] = ['copper-pan', 'flower-vase'];
  const orderedItems = Array.isArray(source.orderedItems)
    ? [...new Set(source.orderedItems.filter((item): item is ShopItemId => validShopIds.includes(item as ShopItemId)))]
    : [];
  const numberOr = (candidate: unknown, fallback: number, minimum = 0): number =>
    Number.isFinite(candidate) ? Math.max(minimum, Number(candidate)) : fallback;
  const integerOr = (candidate: unknown, fallback: number, minimum: number, maximum?: number): number => {
    const normalized = Number.isFinite(candidate) ? Math.trunc(Number(candidate)) : fallback;
    return Math.min(maximum ?? Number.MAX_SAFE_INTEGER, Math.max(minimum, normalized));
  };

  return {
    cows: integerOr(source.cows, 0, 0, 20), sheep: integerOr(source.sheep, 0, 0, 20),
    barnLevel: source.barnLevel === 2 ? 2 : 1,
    fodder: integerOr(source.fodder, 0, 0), trough: integerOr(source.trough, 0, 0),
    grassSeeds: integerOr(source.grassSeeds, 0, 0), grass: integerOr(source.grass, 0, 0),
    grassGrowth: integerOr(source.grassGrowth, 0, 0, 3),
    fish: integerOr(source.fish, 0, 0), fishFeed: integerOr(source.fishFeed, 0, 0),
    water: integerOr(source.water, 10, 0, 10), storedWood: integerOr(source.storedWood, 0, 0),
    fence: integerOr(source.fence, 0, 0), animalsOutside: source.animalsOutside === true,
    horseOutside: source.horseOutside === true,
    farmerName: typeof source.farmerName === 'string' ? source.farmerName : FRESH_GAME.farmerName,
    farmName: typeof source.farmName === 'string' ? source.farmName : FRESH_GAME.farmName,
    day: integerOr(source.day, FRESH_GAME.day, 1, 30),
    season: integerOr(source.season, FRESH_GAME.season, 0, 3),
    year: integerOr(source.year, FRESH_GAME.year, 1),
    time: integerOr(source.time, FRESH_GAME.time, 0, 1430),
    weather: source.weather === 'Mưa' ? 'Mưa' : 'Nắng',
    tomorrowWeather: source.tomorrowWeather === 'Mưa' ? 'Mưa' : 'Nắng',
    money: numberOr(source.money, FRESH_GAME.money),
    stamina: Math.min(100, numberOr(source.stamina, FRESH_GAME.stamina)),
    wood: numberOr(source.wood, FRESH_GAME.wood),
    logAvailable: typeof source.logAvailable === 'boolean' ? source.logAvailable : true,
    seeds: numberOr(source.seeds, FRESH_GAME.seeds),
    turnips: numberOr(source.turnips, FRESH_GAME.turnips),
    affection: Math.min(100, numberOr(source.affection, FRESH_GAME.affection)),
    houseLevel: level,
    controlPreset: preset,
    mealsCooked: integerOr(source.mealsCooked, 0, 0),
    orderedItems,
    plots
  };
}

function isRecognizableGameState(value: unknown): value is Partial<GameState> {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  const numericFields = ['day', 'season', 'year', 'time', 'money', 'stamina', 'wood', 'seeds', 'turnips', 'affection'];
  return Array.isArray(state['plots'])
    && state['plots'].length === FRESH_GAME.plots.length
    && (state['houseLevel'] === 1 || state['houseLevel'] === 2 || state['houseLevel'] === 3)
    && numericFields.every(field => Number.isFinite(state[field]));
}

function isSupportedSavePayload(value: unknown): value is { game: string; version: 1 | 2; savedAt?: unknown; state: Partial<GameState> } {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return payload['game'] === 'Moc Lan Farm'
    && (payload['version'] === 1 || payload['version'] === 2)
    && isRecognizableGameState(payload['state']);
}

function validSavedAt(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private focusReturnTarget: HTMLElement | null = null;
  protected readonly seasons = ['Xuân', 'Hạ', 'Thu', 'Đông'];
  protected readonly weekdays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
  protected readonly tools: Tool[] = [
    { id: 'hand', icon: '✋', label: 'Tay không', description: 'Thu hoạch nông sản đã chín.' },
    { id: 'hoe', icon: '⛏️', label: 'Cuốc', description: 'Làm tơi một ô đất trống.' },
    { id: 'seeds', icon: '🌱', label: 'Hạt củ cải', description: 'Gieo trên ô đất đã cuốc.' },
    { id: 'can', icon: '💧', label: 'Bình tưới', description: 'Tưới cây một lần mỗi ngày.' },
    { id: 'axe', icon: '🪓', label: 'Rìu', description: 'Chặt gỗ để nâng cấp nhà.' },
    { id: 'hammer', icon: '🔨', label: 'Búa', description: 'Dụng cụ sửa chữa nông trại.' }
  ];
  protected readonly controlPresets = CONTROL_PRESETS;
  protected readonly tvProducts = TV_PRODUCTS;
  protected readonly recipes = RECIPES;
  protected readonly selectedTool = signal<ToolId>('hand');
  protected readonly state = signal<GameState>(structuredClone(FRESH_GAME));
  protected readonly scene = signal<SceneId>('farm');
  protected readonly activePanel = signal<HousePanel | null>(null);
  protected readonly tvChannel = signal<TvChannel>('weather');
  protected readonly notice = signal('Một ngày mới bắt đầu. Hãy chăm sóc nông trại của bạn!');
  protected readonly showGuide = signal(false);
  protected readonly showMenu = signal(false);
  protected readonly lastJournalSave = signal<string | null>(null);
  protected readonly journalHasSave = signal(false);

  protected readonly clock = computed(() => {
    const time = this.state().time;
    const hour = Math.floor(time / 60);
    return `${String(hour).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
  });
  protected readonly weekdayIndex = computed(() => {
    const game = this.state();
    const absoluteDay = (game.year - 1) * 120 + game.season * 30 + game.day - 1;
    return absoluteDay % 7;
  });
  protected readonly weekday = computed(() => this.weekdays[this.weekdayIndex()]);
  protected readonly isSaturday = computed(() => this.weekdayIndex() === 5);
  protected readonly selectedLabel = computed(() => this.tools.find(tool => tool.id === this.selectedTool())?.label ?? '');
  protected readonly selectedControl = computed(() =>
    this.controlPresets.find(preset => preset.id === this.state().controlPreset) ?? this.controlPresets[0]
  );
  protected readonly nextEvent = computed(() => {
    const game = this.state();
    const seasonEvents = SEASON_EVENTS[game.season] ?? SEASON_EVENTS[0];
    const upcoming = seasonEvents.find(event => event.day >= game.day);
    if (upcoming) return { ...upcoming, season: this.seasons[game.season] };
    const nextSeason = (game.season + 1) % this.seasons.length;
    return { ...SEASON_EVENTS[nextSeason][0], season: this.seasons[nextSeason] };
  });
  protected readonly upgradePlan = computed(() => {
    if (this.state().houseLevel === 1) {
      return { level: 2 as const, title: 'Mở rộng phòng sinh hoạt', money: 350, wood: 10, detail: 'Thêm diện tích và một góc để đồ rộng rãi.' };
    }
    if (this.state().houseLevel === 2) {
      return { level: 3 as const, title: 'Xây tổ ấm gia đình', money: 900, wood: 25, detail: 'Mở khóa nhà bếp và giường đôi cho gia đình.' };
    }
    return null;
  });
  protected readonly journalSaveLabel = computed(() => {
    const value = this.lastJournalSave();
    if (!value) return 'Chưa có trang nhật ký nào được lưu';
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return 'Thời điểm lưu không xác định';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  });

  constructor() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (isSupportedSavePayload(payload)) {
        this.journalHasSave.set(true);
        this.lastJournalSave.set(validSavedAt(payload.savedAt));
      }
    } catch {
      // A damaged local slot should not prevent a fresh game from starting.
    }
  }

  protected selectTool(tool: ToolId): void {
    this.selectedTool.set(tool);
    this.notice.set(`Đã chọn ${this.tools.find(item => item.id === tool)?.label}.`);
  }

  protected cycleTool(direction: -1 | 1): void {
    const current = this.tools.findIndex(tool => tool.id === this.selectedTool());
    const next = (current + direction + this.tools.length) % this.tools.length;
    this.selectTool(this.tools[next].id);
  }

  protected interact(plotId: number): void {
    const game = structuredClone(this.state());
    const plot = game.plots[plotId];
    const tool = this.selectedTool();
    let message = 'Công cụ này không dùng được ở đây.';
    let cost = 0;

    if (tool === 'hoe' && plot.state === 'empty') {
      plot.state = 'tilled'; cost = 4; message = 'Bạn đã cuốc một ô đất mới.';
    } else if (tool === 'seeds' && plot.state === 'tilled' && game.seeds > 0) {
      plot.state = 'seeded'; game.seeds--; cost = 2; message = 'Hạt củ cải đã được gieo xuống.';
    } else if (tool === 'can' && ['seeded', 'growing'].includes(plot.state) && !plot.watered && game.water > 0) {
      game.water--;
      plot.watered = true; cost = 2; message = 'Mảnh đất đã được tưới mát.';
    } else if (tool === 'can' && game.water === 0) {
      message = 'Bình tưới đã cạn. Hãy lấy nước ở ao cá.';
    } else if (tool === 'hand' && plot.state === 'ready') {
      plot.state = 'tilled'; plot.growth = 0; plot.watered = false; game.turnips++; message = 'Thu hoạch củ cải! Hãy bán nó để kiếm tiền.';
    } else if (tool === 'seeds' && game.seeds === 0) {
      message = 'Bạn đã hết hạt giống. Ghé cửa hàng để mua thêm nhé.';
    }

    if (cost && game.stamina < cost) {
      this.notice.set('Bạn đã kiệt sức. Hãy về nhà ngủ để nghỉ ngơi.');
      return;
    }
    game.stamina -= cost;
    if (cost) game.time = Math.min(1430, game.time + 10);
    this.state.set(game);
    this.notice.set(message);
  }

  protected chopWood(): void {
    const game = structuredClone(this.state());
    if (this.selectedTool() !== 'axe') { this.notice.set('Hãy chọn Rìu để chặt khúc gỗ này.'); return; }
    if (!game.logAvailable) { this.notice.set('Hôm nay đã hết gỗ. Khúc gỗ mới sẽ xuất hiện vào sáng mai.'); return; }
    if (game.stamina < 6) { this.notice.set('Bạn không còn đủ sức.'); return; }
    game.wood += 2; game.logAvailable = false; game.stamina -= 6; game.time = Math.min(1430, game.time + 10);
    this.state.set(game); this.notice.set('Bạn nhận được 2 Gỗ. Khúc gỗ mới sẽ xuất hiện vào sáng mai.');
  }

  protected buySeeds(): void {
    const game = structuredClone(this.state());
    if (game.money < 120) { this.notice.set('Bạn không đủ tiền mua hạt giống.'); return; }
    game.money -= 120; game.seeds += 6; this.state.set(game);
    this.notice.set('Đã mua một túi 6 hạt củ cải với giá 120G.');
  }

  protected farmAction(action: string): void {
    const game = structuredClone(this.state());
    const pay = (amount: number): boolean => {
      if (game.money < amount) { this.notice.set(`Bạn cần ${amount}G.`); return false; }
      game.money -= amount; return true;
    };
    let message = '';
    switch (action) {
      case 'cow': case 'sheep':
        if (game.cows + game.sheep >= game.barnLevel * 10) { message = 'Chuồng đã đầy. Hãy nâng cấp để nuôi thêm.'; break; }
        if (!pay(action === 'cow' ? 500 : 400)) return;
        if (action === 'cow') game.cows++; else game.sheep++;
        message = `Đã đưa ${action === 'cow' ? 'bò' : 'cừu'} vào chuồng.`; break;
      case 'barn':
        if (game.barnLevel === 2) { message = 'Chuồng đã đạt sức chứa 20 con.'; break; }
        if (game.storedWood < 10 || !pay(800)) { message = 'Nâng cấp cần 800G và 10 gỗ trong kho.'; break; }
        game.storedWood -= 10; game.barnLevel = 2; message = 'Chuồng đã mở rộng, sức chứa 20 con.'; break;
      case 'fodder': if (!pay(100)) return; game.fodder += 10; message = 'Đã mua 10 phần thức ăn tại Green Ranch.'; break;
      case 'trough':
        if (!game.fodder && !game.grass) { message = 'Không có cỏ hoặc thức ăn để bỏ vào máng.'; break; }
        if (game.grass) game.grass--; else game.fodder--;
        game.trough++; message = 'Đã thêm một phần thức ăn vào máng.'; break;
      case 'grass-seeds': if (!pay(60)) return; game.grassSeeds += 3; message = 'Đã mua 3 hạt giống cỏ ở siêu thị.'; break;
      case 'plant-grass':
        if (!game.grassSeeds || game.grassGrowth) { message = 'Cần hạt giống và luống cỏ trống.'; break; }
        game.grassSeeds--; game.grassGrowth = 1; message = 'Đã gieo cỏ. Cỏ sẽ lớn sau hai đêm.'; break;
      case 'harvest-grass':
        if (game.grassGrowth < 3) { message = 'Cỏ chưa sẵn sàng thu hoạch.'; break; }
        game.grass += 5; game.grassGrowth = 0; message = 'Đã thu hoạch 5 phần cỏ làm thức ăn.'; break;
      case 'fish': if (!pay(80)) return; game.fish++; message = 'Đã thả một con cá vào ao.'; break;
      case 'fish-feed': if (!pay(50)) return; game.fishFeed += 10; message = 'Đã mua 10 phần thức ăn cho cá ở siêu thị.'; break;
      case 'feed-fish':
        if (!game.fish || !game.fishFeed) { message = 'Cần có cá và thức ăn cho cá.'; break; }
        game.fishFeed--; message = 'Bạn đã cho cá ăn.'; break;
      case 'water': game.water = 10; message = 'Đã lấy đầy nước cho bình tưới từ ao.'; break;
      case 'store-wood':
        if (!game.wood) { message = 'Bạn không có gỗ để cất.'; break; }
        game.wood--; game.storedWood++; message = 'Đã cất 1 gỗ vào nhà chứa.'; break;
      case 'take-wood':
        if (!game.storedWood) { message = 'Nhà chứa không còn gỗ.'; break; }
        game.storedWood--; game.wood++; message = 'Đã lấy 1 gỗ từ nhà chứa.'; break;
      case 'fence':
        if (game.storedWood < 2) { message = 'Cần 2 gỗ trong nhà chứa để xây hàng rào.'; break; }
        game.storedWood -= 2; game.fence++; message = 'Đã xây một đoạn hàng rào.'; break;
      case 'outside':
        if (!game.cows && !game.sheep) { message = 'Chuồng chưa có bò hoặc cừu.'; break; }
        if (!game.animalsOutside && !game.fence) { message = 'Hãy xây hàng rào trước để tránh chó hoang.'; break; }
        game.animalsOutside = !game.animalsOutside; message = game.animalsOutside ? 'Đã thả vật nuôi trong khu có hàng rào.' : 'Đã đưa vật nuôi về chuồng.'; break;
      case 'horse':
        if (game.year === 1 && game.season < 3) { message = 'Ngựa sẽ đến vào mùa đông đầu tiên.'; break; }
        if (game.weather === 'Mưa') { game.horseOutside = false; message = 'Trời mưa, ngựa ở trong chuồng.'; break; }
        game.horseOutside = !game.horseOutside; message = game.horseOutside ? 'Ngựa đang dạo chơi ngoài trời.' : 'Ngựa đã về chuồng.'; break;
      default: return;
    }
    this.state.set(game); this.notice.set(message);
  }

  protected sellProduce(): void {
    const game = structuredClone(this.state());
    if (!game.turnips) { this.notice.set('Túi đồ chưa có nông sản để bán.'); return; }
    const earned = game.turnips * 60; game.money += earned; game.turnips = 0; this.state.set(game);
    this.notice.set(`Zack đã nhận hàng. Bạn kiếm được ${earned}G!`);
  }

  protected talkToEllie(): void {
    const game = structuredClone(this.state());
    game.affection = Math.min(100, game.affection + 2); this.state.set(game);
    this.notice.set('Ellie: “Buổi sáng ở nông trại thật dễ chịu. Đừng làm việc quá sức nhé!”  ♥ +2');
  }

  protected talkToFamily(member: 'wife' | 'son'): void {
    this.notice.set(member === 'wife'
      ? 'Ellie: “Em sẽ chuẩn bị bữa sáng. Anh nhớ xem dự báo thời tiết nhé!” ♥'
      : 'Ben: “Bố ơi, hôm nay mình ra đồng cùng nhau nhé!”');
  }

  protected enterHouse(): void {
    this.scene.set('house');
    this.notice.set(`Bạn bước vào căn nhà cấp ${this.state().houseLevel}. Mọi thứ thật ấm cúng.`);
  }

  protected leaveHouse(): void {
    this.activePanel.set(null);
    this.scene.set('farm');
    this.notice.set('Bạn trở lại nông trại. Một ngày mới vẫn đang chờ phía trước!');
  }

  protected openPanel(panel: HousePanel): void {
    if (panel === 'kitchen' && this.state().houseLevel < 3) {
      this.notice.set('Nhà bếp sẽ được mở khóa khi căn nhà đạt cấp 3.');
      return;
    }
    this.focusReturnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.activePanel.set(panel);
    if (panel === 'television') this.tvChannel.set('weather');
    setTimeout(() => document.querySelector<HTMLElement>('.house-overlay .house-panel .close')?.focus());
  }

  protected closePanel(): void {
    const returnTarget = this.focusReturnTarget;
    this.focusReturnTarget = null;
    this.activePanel.set(null);
    if (returnTarget?.isConnected) setTimeout(() => returnTarget.focus());
  }

  protected sleepInBed(): void {
    this.closePanel();
    this.nextDay();
  }

  protected nextDay(): void {
    const game = structuredClone(this.state());
    for (const plot of game.plots) {
      if (plot.watered || game.weather === 'Mưa') {
        plot.growth++;
        if (plot.state === 'seeded') plot.state = 'growing';
        if (plot.growth >= 3 && plot.state === 'growing') plot.state = 'ready';
      }
      plot.watered = false;
    }
    game.day++;
    if (game.grassGrowth > 0) game.grassGrowth = Math.min(3, game.grassGrowth + 1);
    const livestock = game.cows + game.sheep;
    game.trough = Math.max(0, game.trough - livestock);
    game.fishFeed = Math.max(0, game.fishFeed - game.fish);
    if (game.day > 30) { game.day = 1; game.season++; }
    if (game.season > 3) { game.season = 0; game.year++; }
    game.time = 360; game.stamina = 100;
    game.logAvailable = true;
    game.weather = game.tomorrowWeather;
    if (game.weather === 'Mưa') { game.horseOutside = false; game.animalsOutside = false; }
    game.tomorrowWeather = Math.random() > 0.72 ? 'Mưa' : 'Nắng';
    this.state.set(game);
    this.notice.set(`Bạn thức dậy vào ${this.weekday()}, ngày ${game.day}. Hôm nay trời ${game.weather.toLowerCase()}.`);
  }

  protected upgradeHouse(): void {
    const plan = this.upgradePlan();
    if (!plan) { this.notice.set('Căn nhà đã đạt cấp tối đa.'); return; }
    const game = structuredClone(this.state());
    if (game.money < plan.money || game.wood < plan.wood) {
      this.notice.set(`Bạn cần ${plan.money}G và ${plan.wood} Gỗ để nâng nhà lên cấp ${plan.level}.`);
      return;
    }
    game.money -= plan.money;
    game.wood -= plan.wood;
    game.houseLevel = plan.level;
    this.state.set(game);
    this.closePanel();
    this.notice.set(plan.level === 3
      ? 'Căn nhà đã lên cấp 3! Nhà bếp và không gian cho gia đình đã sẵn sàng.'
      : 'Căn nhà đã lên cấp 2. Không gian sinh hoạt rộng rãi hơn rồi!');
  }

  protected setControlPreset(preset: ControlPresetId): void {
    const game = structuredClone(this.state());
    game.controlPreset = preset;
    this.state.set(game);
    const selected = this.controlPresets.find(item => item.id === preset);
    this.notice.set(`Đã đổi kiểu điều khiển sang “${selected?.name}”.`);
  }

  protected equipFromChest(tool: ToolId): void {
    this.selectTool(tool);
    this.closePanel();
    this.notice.set(`Bạn lấy ${this.tools.find(item => item.id === tool)?.label} từ thùng dụng cụ.`);
  }

  protected selectTvChannel(channel: TvChannel): void {
    this.tvChannel.set(channel);
  }

  protected hasPurchased(item: ShopItemId): boolean {
    return this.state().orderedItems.includes(item);
  }

  protected buyTvItem(itemId: ShopItemId): void {
    if (!this.isSaturday()) {
      this.notice.set('Shopping Channel chỉ nhận đơn vào Thứ Bảy hàng tuần.');
      return;
    }
    const item = this.tvProducts.find(product => product.id === itemId);
    if (!item) return;
    const game = structuredClone(this.state());
    if (!item.repeatable && game.orderedItems.includes(item.id)) {
      this.notice.set('Món đồ này đã có trong căn nhà của bạn.');
      return;
    }
    if (game.money < item.price) {
      this.notice.set(`Bạn còn thiếu ${item.price - game.money}G để đặt ${item.name}.`);
      return;
    }
    game.money -= item.price;
    if (item.id === 'seed-box') game.seeds += 12;
    else game.orderedItems.push(item.id);
    this.state.set(game);
    this.notice.set(`Đã đặt ${item.name} qua Shopping Channel. Zack vừa giao tới nhà!`);
  }

  protected cook(recipeId: RecipeId): void {
    if (this.state().houseLevel < 3) return;
    const recipe = this.recipes.find(item => item.id === recipeId);
    if (!recipe) return;
    const game = structuredClone(this.state());
    if (game.turnips < recipe.turnips) {
      this.notice.set(`Bạn cần ${recipe.turnips} củ cải để nấu ${recipe.name}.`);
      return;
    }
    if (game.stamina >= 100) {
      this.notice.set('Bạn vẫn đang tràn đầy thể lực. Hãy để dành nguyên liệu cho lúc khác.');
      return;
    }
    const panBonus = game.orderedItems.includes('copper-pan') ? 10 : 0;
    game.turnips -= recipe.turnips;
    game.stamina = Math.min(100, game.stamina + recipe.energy + panBonus);
    game.time = Math.min(1430, game.time + 20);
    game.mealsCooked++;
    this.state.set(game);
    this.notice.set(`Bạn nấu và thưởng thức ${recipe.name}. Thể lực đã hồi phục!`);
  }

  protected saveToJournal(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const savedAt = new Date().toISOString();
      const payload = { game: 'Moc Lan Farm', version: 2, savedAt, state: this.state() };
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(payload));
      this.lastJournalSave.set(savedAt);
      this.journalHasSave.set(true);
      this.notice.set('Nhật ký đã ghi lại toàn bộ hành trình của bạn. Có thể yên tâm nghỉ rồi!');
    } catch {
      this.notice.set('Trình duyệt không cho phép ghi nhật ký lúc này. Hãy thử lưu thành file.');
    }
  }

  protected loadFromJournal(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (!raw) throw new Error();
      const payload = JSON.parse(raw);
      if (!isSupportedSavePayload(payload)) throw new Error();
      this.state.set(normalizeGameState(payload.state));
      this.lastJournalSave.set(validSavedAt(payload.savedAt));
      this.journalHasSave.set(true);
      this.notice.set(`Đã mở lại trang nhật ký ngày ${this.state().day}. Chào mừng bạn trở lại!`);
    } catch {
      this.notice.set('Trang nhật ký đã lưu không hợp lệ hoặc không còn tồn tại.');
    }
  }

  protected saveGame(): void {
    const payload = { game: 'Moc Lan Farm', version: 2, savedAt: new Date().toISOString(), state: this.state() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `moc-lan-farm-day-${this.state().day}.save.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.notice.set('Đã lưu game xuống ổ cứng. Hãy giữ file .save.json cẩn thận!');
    this.showMenu.set(false);
  }

  protected loadGame(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        if (!isSupportedSavePayload(payload)) throw new Error();
        this.state.set(normalizeGameState(payload.state));
        this.notice.set(`Đã tải bản lưu ngày ${this.state().day}. Chào mừng bạn trở lại!`);
        this.showMenu.set(false);
      } catch {
        this.notice.set('File lưu không hợp lệ hoặc đã bị hỏng.');
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  protected newGame(): void {
    if (!confirm('Bắt đầu lại từ đầu? Tiến trình chưa lưu sẽ bị mất.')) return;
    this.state.set(structuredClone(FRESH_GAME));
    this.scene.set('farm');
    this.activePanel.set(null);
    this.notice.set('Chào mừng tới Nông trại Mộc Lan!');
    this.showMenu.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  protected handleKeyboard(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      if (this.activePanel()) this.closePanel();
      else if (this.showGuide()) this.showGuide.set(false);
      else if (this.showMenu()) this.showMenu.set(false);
      return;
    }
    if (key === 'tab' && this.activePanel()) {
      this.trapPanelFocus(event);
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.matches('input, textarea, select') || this.activePanel() || this.showGuide() || this.showMenu()) return;
    if (key === 'x' && this.scene() === 'farm') { this.farmAction('store-wood'); event.preventDefault(); return; }
    const bindings = this.selectedControl().bindings;
    if (key === bindings.previous.value) this.cycleTool(-1);
    else if (key === bindings.next.value) this.cycleTool(1);
    else if (key === bindings.home.value) this.scene() === 'farm' ? this.enterHouse() : this.leaveHouse();
    else if (key === bindings.journal.value) {
      if (this.scene() === 'house') this.openPanel('journal');
      else this.notice.set('Cuốn nhật ký đang ở trong nhà. Hãy trở về để sử dụng.');
    } else if (key === bindings.menu.value) this.showMenu.set(true);
    else return;
    event.preventDefault();
  }

  private trapPanelFocus(event: KeyboardEvent): void {
    const dialog = document.querySelector<HTMLElement>('.house-overlay [role="dialog"]');
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), label, input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    } else if (!dialog.contains(document.activeElement)) {
      first.focus();
      event.preventDefault();
    }
  }
}
