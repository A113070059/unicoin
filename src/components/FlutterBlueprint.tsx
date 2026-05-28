import React, { useState } from 'react';
import { 
  FolderTree, 
  Database, 
  Palette, 
  Code2, 
  Key, 
  Copy, 
  Check, 
  BookOpen, 
  RefreshCw, 
  Layers,
  Sparkles
} from 'lucide-react';

interface FlutterBlueprintProps {
  currentBudgetUsage: number; // e.g. 0 to 100
}

export default function FlutterBlueprint({ currentBudgetUsage }: FlutterBlueprintProps) {
  const [activeTab, setActiveTab] = useState<'structure' | 'models' | 'sync' | 'state' | 'apis'>('structure');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const folderStructureText = `lib/
├── main.dart                      # App 入口與全局初始化 (SecureStorage / Isar db)
├── app.dart                       # MaterialApp 設置、路由與 MultiBlocProvider
├── core/
│   ├── theme/
│   │   ├── app_theme.dart         # 一般青春馬卡龍主題
│   │   └── dirt_eating_theme.dart # 「吃土模式」黑白/土色主題 (預算剩餘 < 20% 自動切換)
│   ├── network/
│   │   └── api_client.dart        # 封裝 HTTP/Dio 請求與 TLS/HTTPS 安全認證
│   ├── storage/
│   │   └── secure_storage_helper.dart # 手動加密載具及隱私 API 密鑰儲存
│   └── utils/
│       └── aa_splitter_core.dart  # AA制最小化交易（簡化債務關係）核心演算法
├── data/
│   ├── datasources/
│   │   ├── transaction_local_ds.dart # 本地 SQLite/Isar 資料庫接頭 (支援離線寫入)
│   │   └── invoice_remote_ds.dart    # 串接財政部發票 API 遠端接頭
│   ├── models/
│   │   ├── transaction_model.dart # 記帳資料模型 (對應 Local DB JSON)
│   │   └── aa_group_model.dart     # AA分帳群組與對帳單對應模型
│   └── repositories/
│       └── transaction_repository_impl.dart # 管理 Local-first 讀寫與遠端同步邏輯
├── domain/
│   ├── entities/
│   │   └── transaction_entity.dart # 純淨業務邏輯實體
│   └── usecases/
│       ├── get_monthly_budget_flow.dart
│       ├── calculate_aa_split.dart
│       └── sync_invoice_carrier.dart
└── presentation/
    ├── managers/                    # BLoC / Cubit 狀態管理器
    │   ├── budget/                  # 預算控管 Cubit (觸發吃土警報)
    │   ├── ledger/                  # 記帳流程 Cubit (保證 3 次點擊完成)
    │   └── aa_split/                # AA群組催帳狀態
    └── pages/
        ├── lock_screen.dart         # 面容辨識 / 指紋解鎖安全性畫面
        ├── main_navigation.dart     # 底部導航欄彙整
        ├── quick_ledger_page.dart   # 極速記帳輸入鍵盤
        ├── budget_dashboard.dart    # 大學生專屬收支報表
        └── aa_group_split_page.dart # AA分帳、代墊款一鍵分享頁面`;

  const dartTransactionCode = `// lib/data/models/transaction_model.dart
import 'package:equatable/equatable.dart';

class TransactionModel extends Equatable {
  final String id;
  final double amount;
  final String category;
  final String note;
  final DateTime date;
  final bool isInvoiceSynced;

  const TransactionModel({
    required this.id,
    required this.amount,
    required this.category,
    required this.note,
    required this.date,
    this.isInvoiceSynced = false,
  });

  // 轉換為本地 SQLite 儲存格式
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'amount': amount,
      'category': category,
      'note': note,
      'date': date.toIso8601String(),
      'is_invoice_synced': isInvoiceSynced ? 1 : 0,
    };
  }

  // 從 SQLite 讀取並實例化
  factory TransactionModel.fromMap(Map<String, dynamic> map) {
    return TransactionModel(
      id: map['id'] as String,
      amount: (map['amount'] as num).toDouble(),
      category: map['category'] as String,
      note: map['note'] as String,
      date: DateTime.parse(map['date'] as String),
      isInvoiceSynced: map['is_invoice_synced'] == 1,
    );
  }

  @override
  List<Object?> get props => [id, amount, category, note, date, isInvoiceSynced];
}`;

  const dartAASplitCode = `// lib/core/utils/aa_splitter_core.dart
/// AA分帳核心演算法 - 最小還款路徑最佳化 (Greedy Algorithm)
class Debt {
  final String debtor;    // 債務人
  final String creditor;  // 債權人
  final double amount;    // 還款金額
  Debt(this.debtor, this.creditor, this.amount);
}

class AASplitterCore {
  static List<Debt> calculateOptimalRepayments({
    required double totalAmount,
    required String paidBy,
    required List<String> participants,
    required Map<String, double> customShares, // 每人應付額（若是平分，則為 total/size）
  }) {
    // 1. 計算每個人相對於自己「付出的實得差值」 (Net Balance)
    // Balance = (自己付過的金額) - (自己應該負擔的金額)
    final Map<String, double> balances = {};
    for (var person in participants) {
      balances[person] = 0.0;
    }

    // 投入付出
    balances[paidBy] = (balances[paidBy] ?? 0.0) + totalAmount;

    // 扣除應付份額
    customShares.forEach((person, share) {
      if (balances.containsKey(person)) {
        balances[person] = (balances[person] ?? 0.0) - share;
      }
    });

    // 2. 分離出債務人與債權人
    final List<MapEntry<String, double>> debtors = [];
    final List<MapEntry<String, double>> creditors = [];

    balances.forEach((person, balance) {
      if (balance < -0.01) {
        debtors.add(MapEntry(person, balance.abs()));
      } else if (balance > 0.01) {
        creditors.add(MapEntry(person, balance));
      }
    });

    List<Debt> solution = [];
    int dIdx = 0, cIdx = 0;

    // 3. 貪婪雙指針撮合最小化還款鏈條
    while (dIdx < debtors.length && cIdx < creditors.length) {
      var debtor = debtors[dIdx];
      var creditor = creditors[cIdx];

      double settleAmount = debtor.value < creditor.value ? debtor.value : creditor.value;

      solution.add(Debt(debtor.key, creditor.key, double.parse(settleAmount.toStringAsFixed(1))));

      // 更新餘額
      debtors[dIdx] = MapEntry(debtor.key, debtor.value - settleAmount);
      creditors[cIdx] = MapEntry(creditor.key, creditor.value - settleAmount);

      if (debtors[dIdx].value <= 0.01) dIdx++;
      if (creditors[cIdx].value <= 0.01) cIdx++;
    }

    return solution;
  }
}`;

  const dartThemeStateCode = `// lib/presentation/managers/budget/budget_cubit.dart
import 'package:flutter_bloc/flutter_bloc.dart';

enum ThemeModeType { standard, mudWeeping, dirtEating }

class BudgetState {
  final double monthlyLimit;
  final double currentExpense;
  final ThemeModeType activeTheme;

  BudgetState({
    required this.monthlyLimit,
    required this.currentExpense,
    required this.activeTheme,
  });

  double get usagePercentage => monthlyLimit > 0 ? (currentExpense / monthlyLimit) * 100 : 0.0;

  BudgetState copyWith({
    double? monthlyLimit,
    double? currentExpense,
    ThemeModeType? activeTheme,
  }) {
    return BudgetState(
      monthlyLimit: monthlyLimit ?? this.monthlyLimit,
      currentExpense: currentExpense ?? this.currentExpense,
      activeTheme: activeTheme ?? this.activeTheme,
    );
  }
}

class BudgetCubit extends Cubit<BudgetState> {
  BudgetCubit() : super(BudgetState(
    monthlyLimit: 6000, 
    currentExpense: 0, 
    activeTheme: ThemeModeType.standard
  ));

  void updateExpense(double newExpense) {
    ThemeModeType newTheme = ThemeModeType.standard;
    double percentage = (newExpense / state.monthlyLimit) * 100;

    if (percentage >= 100.0) {
      newTheme = ThemeModeType.dirtEating; // 介面轉為黑白/土色吃土模式
    } else if (percentage >= 80.0) {
      newTheme = ThemeModeType.mudWeeping; // 警示模式 (錢包在哭泣提示)
    }

    emit(state.copyWith(
      currentExpense: newExpense,
      activeTheme: newTheme,
    ));
  }
}`;

  return (
    <div id="flutter-system-blueprints" className="bg-[#121620] text-gray-200 p-6 rounded-2xl shadow-xl border border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Structural Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 text-xs font-semibold rounded-full border border-sky-455">
              Flutter 系統架構設計
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              設計模式：Clean Arch
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            UniCoin 雙平台架構設計藍圖
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            依據 PRD 所規劃的 Local-First 離線混合型 Flutter 架構，可在無網路下優先秒級記帳。
          </p>
        </div>
      </div>

      {/* Main Tab Controller inside Blueprint Column */}
      <div className="flex bg-slate-900/40 p-1 rounded-xl gap-1 mb-4 border border-gray-800/40 shrink-0">
        <button
          id="btn-tab-structure"
          onClick={() => setActiveTab('structure')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition ${
            activeTab === 'structure' 
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow' 
              : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          目錄結構
        </button>
        <button
          id="btn-tab-models"
          onClick={() => setActiveTab('models')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition ${
            activeTab === 'models' 
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow' 
              : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Dart 核心 Model
        </button>
        <button
          id="btn-tab-sync"
          onClick={() => setActiveTab('sync')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition ${
            activeTab === 'sync' 
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow' 
              : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          離線與載具同步
        </button>
        <button
          id="btn-tab-state"
          onClick={() => setActiveTab('state')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition ${
            activeTab === 'state' 
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow' 
              : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          動態吃土 Theme
        </button>
        <button
          id="btn-tab-apis"
          onClick={() => setActiveTab('apis')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition relative ${
            activeTab === 'apis' 
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow' 
              : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          AA制與安全規格
        </button>
      </div>

      {/* Tab Contents View Container */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-[400px]">
        {activeTab === 'structure' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-gray-800/80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Flutter 完整專案夾結構配置 (Clean Architecture)
                </span>
                <button 
                  id="btn-copy-structure"
                  onClick={() => triggerCopy(folderStructureText, 'structure')}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition"
                >
                  {copiedText === 'structure' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedText === 'structure' ? '已複製' : '快速複製'}
                </button>
              </div>
              <pre className="font-mono text-xs text-gray-300 whitespace-pre leading-relaxed bg-slate-950 p-4 rounded-lg overflow-x-auto border border-gray-950">
                {folderStructureText}
              </pre>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-900/30 p-3.5 rounded-xl border border-gray-800/50">
                <h4 className="text-xs text-indigo-400 font-bold mb-1">極速開機 & 離線優先</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  系統於 <code>main.dart</code> 同步啟動本地 <code>SQLite / Isar DB</code>，本地讀秒小於 100ms。無網狀態下全數功能可用，聯網時靜默上傳。
                </p>
              </div>
              <div className="bg-slate-900/30 p-3.5 rounded-xl border border-gray-800/50">
                <h4 className="text-xs text-indigo-400 font-bold mb-1">安全防護 & 條碼保護</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  載具條碼及敏感財務數據一律透過 <code>flutter_secure_storage</code> 作出系統 Keychain AES256 層級高規格加密掩藏，防堵外洩。
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-4">
            {/* Dart Model Code block 1 */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-gray-800/80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                  📄 transaction_model.dart (記帳 Model 與 SQLite 解析)
                </span>
                <button 
                  id="btn-copy-transaction-code"
                  onClick={() => triggerCopy(dartTransactionCode, 'txModel')}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition"
                >
                  {copiedText === 'txModel' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedText === 'txModel' ? '已複製' : '複製模型'}
                </button>
              </div>
              <pre className="font-mono text-[11px] text-gray-300 bg-slate-950 p-4 rounded-lg overflow-x-auto max-h-[300px] border border-gray-950">
                {dartTransactionCode}
              </pre>
            </div>

            {/* Dart Core Algorithm 2 */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-gray-800/80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  ⚙️ aa_splitter_core.dart (貪婪演算法 - AA 分帳最佳還款路徑)
                </span>
                <button 
                  id="btn-copy-aa-code"
                  onClick={() => triggerCopy(dartAASplitCode, 'aaModel')}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition"
                >
                  {copiedText === 'aaModel' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedText === 'aaModel' ? '已複製' : '複製演算法'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
                自動將複雜的分帳關係（多對多代墊）極簡化。例如，4個人共吃 hotpot，一人代墊，其餘分帳。算法會自動壓縮成僅包含<b>最少比數</b>的「誰該給誰多少錢」轉帳清單。
              </p>
              <pre className="font-mono text-[11px] text-gray-300 bg-slate-950 p-4 rounded-lg overflow-x-auto max-h-[300px] border border-gray-950">
                {dartAASplitCode}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-gray-800/80 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
                財政部電子發票載具同步架構 (Offline-First Flow)
              </h3>
              
              <div className="relative border-l-2 border-slate-700 pl-4 ml-2 space-y-4 py-2">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <p className="text-xs font-bold text-sky-400">1. 本地載具條碼暫存 Encryption</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    使用者輸入手機條碼（例如 <code>/AB12345</code>）後，直接透過 Flutter 呼叫底層 KeyStore/Keychain 將條碼本地高強度加密暫存。
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <p className="text-xs font-bold text-sky-400">2. 靜默後台同步 (Background Slilent Sync)</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    利用 Flutter <code>workmanager</code> 執行雙小時輪詢。向後端 Proxy API 發送請求，安全讀取財政部電子發票明細（明細經過遮蔽與去識別化）。
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <p className="text-xs font-bold text-sky-400">3. 自動分類轉化歸檔 (Auto-Categorization)</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    如果發票商店為便利商店或學餐（如全家、7-11、校園餐廳），系統核心自動推薦歸類在「學餐/宵夜」或「書籍教材」。不破壞極速記帳體驗。
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-450" />
                  <p className="text-xs font-bold text-indigo-400">4. 自動對獎即時推播 (Invoice Prize Draw)</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    每逢雙月 (2, 4, 6...) 25 日，後台收到中獎號碼廣播後立即於本地資料庫逐筆對碰，若中獎則發送趣味「吃土救星！加菜金中獎囉」推播警示。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2.5">
              <Database className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-300">本地離線資料庫 SQLite 設計提示</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  大學生時常在地下學餐、偏遠宿社或收訊不良處消費。<code>TransactionTable</code> 資料表上設有 <code>synced</code> (BOOLEAN 0/1) 欄位。所有手動記帳均在 <b>0 毫秒</b>完成本地寫入，背景偵測網路恢復時，才自動向伺服器補跑 UPSERT 邏輯。
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'state' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-gray-800/80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                  💡 BLoC 狀態管理：預算連動「動態吃土主題」
                </span>
                <button 
                  id="btn-copy-cubit"
                  onClick={() => triggerCopy(dartThemeStateCode, 'cubitCode')}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition"
                >
                  {copiedText === 'cubitCode' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedText === 'cubitCode' ? '已複製' : '複製 Cubit'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                利用離線 BLoC 狀態，當計算月花費達總預算 <b>80%</b> 時發送悲傷哭泣警示圖，達 <b>100% (預算歸零)</b> 時啟動全局灰階土灰「吃土模式」Theme。
              </p>
              <pre className="font-mono text-[11px] text-gray-300 bg-slate-950 p-4 rounded-lg overflow-x-auto max-h-[220px] border border-gray-950">
                {dartThemeStateCode}
              </pre>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-xl border border-gray-800/60">
              <h4 className="text-xs font-bold text-white mb-2">吃土機制對應 UI 切換代碼 (Flutter View Integration)</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-1.5">
                在 Flutter 的 <code>MaterialApp</code> 入口點透過 <code>BlocBuilder</code> 監控預算，實時變更 <code>ThemeData</code>：
              </p>
              <div className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-gray-300 overflow-x-auto">
                {`BlocBuilder<BudgetCubit, BudgetState>(\n  builder: (context, state) {\n    return MaterialApp(\n      title: 'UniCoin',\n      theme: state.activeTheme == ThemeModeType.dirtEating\n          ? getDirtEatingTheme()  // 黑白色調與土灰色吃土特別版\n          : getStandardTheme(),   // 活力大學生馬卡龍彩虹色\n      home: const MainNavigationPage(),\n    );\n  },\n)`}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-400">當前模擬器預算使用率：</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  currentBudgetUsage >= 100 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : currentBudgetUsage >= 80 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {currentBudgetUsage.toFixed(1)}% ({currentBudgetUsage >= 100 ? '吃土中' : currentBudgetUsage >= 80 ? '警戒中' : '正常'})
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apis' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-gray-800/80 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                AA 拆分與一鍵催款 API/分享規約
              </h3>
              
              <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-sky-300 space-y-2">
                <p className="text-gray-400">// POST /api/v1/aa-groups - 創立分帳群體</p>
                <p className="text-gray-200">Request Body:</p>
                <p className="text-emerald-400 text-[10px] whitespace-pre">{`{\n  "group_name": "期末學餐聚會",\n  "total_amount": 1200,\n  "paid_by_name": "阿強",\n  "participants": ["阿強", "小明", "小美", "阿珍"],\n  "split_shares": {\n    "阿強": 300, "小明": 300, "小美": 300, "阿珍": 300\n  }\n}`}</p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-white">催墊款分享規約 (Generate Line/Messenger Templates)</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  PRD 要求為防止大學生催錢尷尬，一鍵催款功能會自動生出「幽默趣味催繳卡片/文案」，透過 Flutter 的 <code>share_plus</code> 套件呼叫原生分享對話框：
                </p>
                
                <div className="bg-slate-900/60 p-3 rounded-lg border border-gray-800 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">迷因催錢範本 A (暴躁型)</span>
                  </div>
                  <p className="text-xs text-gray-300 italic">
                    「您有一筆未付款：【宵夜代墊】$300 元正等待由 <b>小明</b> 處理。再不還，下次泡麵裡面就沒有調味包了唷！🍜 快點還給 <b>阿強</b>！」
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-gray-800 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span className="text-xs font-semibold text-sky-400">迷因催錢範本 B (吃土同理心)</span>
                  </div>
                  <p className="text-xs text-gray-300 italic">
                    「救救孩子！<b>阿強</b> 的錢包正在加護病房急救中。上次聚餐代墊了您的 $300，快還他好讓他遠離『吃土模式』，功德無量！🧎」
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-3.5 space-y-2">
              <h4 className="text-xs font-bold text-sky-300">大學生生物辨識驗證 (Local Biometrics)</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                保護學生隱私。在 Flutter 中，利用 <code>local_auth</code> 套件在 App 喚醒時自動拉起生物識別防護：
              </p>
              <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-gray-400">
                {`final LocalAuthentication auth = LocalAuthentication();\nfinal bool isSupported = await auth.isDeviceSupported();\nfinal bool didAuthenticate = await auth.authenticate(\n  localizedReason: 'UniCoin 需要驗證以讀取您的個人帳目',\n  options: const AuthenticationOptions(biometricOnly: true),\n);`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Quick-start hint footer */}
      <div className="pt-4 border-t border-gray-800/80 mt-4 shrink-0 flex items-center justify-between text-[11px] text-gray-400">
        <span>UniCoin Flutter Core System 設計專案檔</span>
        <span className="text-sky-400 flex items-center gap-1">
          配合右側 Live 仿真模擬器連動 <span className="animate-ping w-1.5 h-1.5 bg-sky-400 rounded-full inline-block" />
        </span>
      </div>
    </div>
  );
}
