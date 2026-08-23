export type ChapterId = "start" | "move" | "edit" | "power" | "workspace" | "cph";

export type Lesson = {
  id: string;
  chapter: ChapterId;
  title: string;
  keys: string[];
  description: string;
  before: string[];
  after: string[];
  cursorBefore?: [number, number];
  cursorAfter?: [number, number];
  mode?: "NORMAL" | "INSERT" | "VISUAL" | "COMMAND";
  panel?: "judge" | "companion";
};

export const chapters = [
  { id: "start" as const, label: "01 起步", short: "模式與存檔" },
  { id: "move" as const, label: "02 移動", short: "不用方向鍵" },
  { id: "edit" as const, label: "03 編輯", short: "刪改複製" },
  { id: "power" as const, label: "04 進階", short: "搜尋與巨集" },
  { id: "workspace" as const, label: "05 工作區", short: "分割與檔案" },
  { id: "cph" as const, label: "06 競賽", short: "模板與測資" },
];

const base = [
  "#include <bits/stdc++.h>",
  "using namespace std;",
  "",
  "int main() {",
  "    vector<int> nums = {4, 2, 7};",
  "    int answer = 0;",
  "    for (int value : nums) answer += value;",
  "    cout << answer << '\\n';",
  "    return 0;",
  "}",
];

const lesson = (
  id: string,
  chapter: ChapterId,
  title: string,
  keys: string[],
  description: string,
  before: string[] = base,
  after: string[] = before,
  cursorBefore: [number, number] = [5, 9],
  cursorAfter: [number, number] = cursorBefore,
  extra: Partial<Lesson> = {},
): Lesson => ({ id, chapter, title, keys, description, before, after, cursorBefore, cursorAfter, ...extra });

export const lessons: Lesson[] = [
  lesson("modes", "start", "三種核心模式", ["i", "Esc", "v"], "i 進入輸入、Esc 回到 NORMAL、v 開始選取。迷路時先按 Esc。", base, base, [5, 9], [5, 9]),
  lesson("save-quit", "start", "存檔與離開", [":w", ":q", ":wq", ":q!"], "冒號開啟命令列；w 寫入、q 離開，q! 放棄未存修改。", base, base, [8, 6], [8, 6], { mode: "COMMAND" }),
  lesson("insert", "start", "精準進入 Insert", ["i", "a", "I", "A"], "i/a 在游標前後輸入；I/A 直接到行首或行尾。", ["    int total = 0;"], ["    const int total = 0; // sum"], [1, 5], [1, 30], { mode: "INSERT" }),
  lesson("open-line", "start", "快速新增一行", ["o", "O"], "o 在下方開新行；O 在上方開新行，並直接進入 Insert。", ["int main() {", "    return 0;", "}"], ["int main() {", "    ios::sync_with_stdio(false);", "    return 0;", "}"], [2, 5], [2, 5], { mode: "INSERT" }),
  lesson("substitute", "start", "替換字元與整行", ["s", "S", "cc"], "s 刪除目前字元並輸入；S 或 cc 會重寫整行。", ["    int answr = 0;"], ["    long long answer = 0;"], [1, 12], [1, 17], { mode: "INSERT" }),

  lesson("hjkl", "move", "基本方向", ["h", "j", "k", "l"], "左、下、上、右。手不用離開主鍵區。", base, base, [5, 9], [7, 18]),
  lesson("words", "move", "按單字跳躍", ["w", "b", "e"], "w 到下一個字首、b 回上一個字首、e 到字尾；大寫 W/B/E 以空白分段。", base, base, [7, 5], [7, 19]),
  lesson("line", "move", "行首與行尾", ["0", "^", "$"], "0 到實際行首、^ 到第一個非空白、$ 到行尾。", base, base, [7, 18], [7, 29]),
  lesson("file", "move", "整份檔案跳躍", ["gg", "G", "42G"], "gg 到第一行、G 到最後一行；數字加 G 直達指定行。", base, base, [7, 18], [1, 1]),
  lesson("screen", "move", "半頁與整頁移動", ["Ctrl-d", "Ctrl-u", "Ctrl-f", "Ctrl-b"], "d/u 移動半頁，f/b 移動整頁。", base, base, [2, 1], [8, 1]),
  lesson("center", "move", "固定視線位置", ["zz", "zt", "zb"], "把游標所在行放到畫面中央、頂端或底端。", base, base, [7, 9], [7, 9]),
  lesson("scroll", "move", "畫面微調", ["Ctrl-e", "Ctrl-y"], "只捲動畫面一行，不改變游標所在文字。", base, base, [6, 9], [6, 9]),

  lesson("delete-char", "edit", "刪除字元", ["x", "X"], "x 刪除游標下字元；X 刪除游標前字元。", ["    int answwer = 0;"], ["    int answer = 0;"], [1, 12], [1, 11]),
  lesson("delete-line", "edit", "刪除整行", ["dd", "5dd", "D"], "dd 刪一行，數字可重複；D 從游標刪到行尾。", base, base.slice(0, 6).concat(base.slice(7)), [7, 5], [7, 5]),
  lesson("delete-motion", "edit", "動作組合", ["dw", "de", "db", "d0"], "d 是刪除運算子，後面接移動範圍：word、end、back、行首。", ["    int temporary answer = 0;"], ["    int answer = 0;"], [1, 9], [1, 9]),
  lesson("text-object", "edit", "文字物件", ["diw", "di(", "da(", "di{", "da\""], "i 是 inside，a 是 around；能精準刪除單字、括號、區塊或引號內容。", ["    sort(nums.begin(), nums.end());"], ["    sort();"], [1, 18], [1, 10]),
  lesson("change", "edit", "刪除後直接輸入", ["cw", "ciw", "C", "ci\"", "ci("], "c 和 d 使用相同範圍，但完成後會進入 Insert。", ["    int res = calculate(nums);"], ["    long long answer = calculate(nums);"], [1, 9], [1, 21], { mode: "INSERT" }),
  lesson("replace", "edit", "單字元替換", ["r", "R", "~"], "r 改一個字元，R 連續覆寫，~ 切換大小寫。", ["    bool Valid = flase;"], ["    bool valid = false;"], [1, 10], [1, 22]),
  lesson("case", "edit", "大小寫轉換", ["guw", "gUw"], "gu 轉小寫、gU 轉大寫，再接範圍。", ["    int ANSWER = maxValue;"], ["    int answer = MAXVALUE;"], [1, 9], [1, 18]),
  lesson("yank", "edit", "複製與貼上", ["yy", "5yy", "yw", "yiw", "y$", "p", "P"], "y 複製範圍；p 在後方貼上，P 在前方貼上。", ["    int answer = 0;", "    return answer;"], ["    int answer = 0;", "    int answer = 0;", "    return answer;"], [1, 5], [2, 5]),
  lesson("undo", "edit", "復原、重做、重複", ["u", "Ctrl-r", "."], "u 復原，Ctrl-r 重做；點號會重複上一次修改。", ["    value += 1;", "    value += 1;"], ["    value += 2;", "    value += 2;"], [1, 14], [2, 14]),
  lesson("visual", "edit", "視覺選取", ["v", "V", "Ctrl-v"], "v 選字元、V 選整行、Ctrl-v 選矩形；再接 y/d/c/>/</=。", base, base, [5, 5], [7, 20], { mode: "VISUAL" }),
  lesson("indent", "edit", "縮排與格式化", [">>", "<<", "==", "gg=G", "=%", "=i{"], "左右縮排目前行，或用 = 自動格式化範圍與整份檔案。", ["int main(){", "int x=1;", "if(x){", "cout<<x;", "}", "}"], ["int main(){", "    int x=1;", "    if(x){", "        cout<<x;", "    }", "}"], [1, 1], [4, 9]),

  lesson("search", "power", "搜尋與下一筆", ["/word", "?word", "n", "N", "*", "#", ":noh"], "/ 往下、? 往上；n/N 前後巡覽，*/# 搜尋游標下單字，noh 清除高亮。", base, base, [6, 14], [7, 13]),
  lesson("substitute-command", "power", "整檔取代", [":s/a/b/g", ":%s/a/b/g", ":%s/a/b/gc"], "s 改目前行，%s 改全檔；c 會逐筆詢問。", ["int result = 0;", "result += value;", "cout << result;"], ["int answer = 0;", "answer += value;", "cout << answer;"], [1, 5], [3, 9], { mode: "COMMAND" }),
  lesson("jumps", "power", "跳躍歷史", ["Ctrl-o", "Ctrl-i", "g;", "g,"], "Ctrl-o/i 在跳點歷史前後移動；g;/g, 巡覽修改位置。", base, base, [2, 1], [8, 5]),
  lesson("definition", "power", "定義與上次修改", ["gd", "gD", "'.", "`."], "gd 跳到區域定義，gD 到全域定義；單引號到行、反引號到精確位置。", ["int limit = 10;", "", "int main() {", "    cout << limit;", "}"], ["int limit = 10;", "", "int main() {", "    cout << limit;", "}"], [4, 15], [1, 5]),
  lesson("marks", "power", "自訂書籤", ["ma", "'a", "`a", ":marks"], "m 加字母建立 mark；單引號回該行，反引號回精確欄位。", base, base, [7, 17], [7, 17]),
  lesson("macro", "power", "錄製巨集", ["qa", "q", "@a", "@@", "10@a"], "qa 開始錄到 a，q 停止；@a 播放，@@ 重播，數字可批次執行。", ["1", "2", "3", "4"], ["item[1]", "item[2]", "item[3]", "item[4]"], [1, 1], [4, 8]),
  lesson("registers", "power", "命名暫存器", [":registers", "\"ayy", "\"ap", "\"_dd"], "把內容存到 a 並貼上；黑洞暫存器 _ 可刪除但不覆蓋剪貼簿。", ["    int keep = 1;", "    int remove = 2;"], ["    int keep = 1;", "    int keep = 1;"], [1, 5], [2, 5]),
  lesson("numbers", "power", "數字加減與序列", ["Ctrl-a", "Ctrl-x", "g Ctrl-a"], "直接增加或減少游標附近數字；視覺選取後可建立遞增序列。", ["case 1", "case 1", "case 1"], ["case 1", "case 2", "case 3"], [1, 6], [3, 6]),

  lesson("buffers", "workspace", "Buffer 導航", [":ls", ":bn", ":bp", ":b name", ":bd", "Ctrl-^"], "列出、前後切換、依名稱開啟與關閉 buffer；Ctrl-^ 回上一個檔案。", ["// solution.cpp", "int main() {}"], ["// template.cpp", "int main() {}"], [1, 1], [1, 1]),
  lesson("split", "workspace", "分割視窗", [":sp", ":vs", "Ctrl-w h/j/k/l", "Ctrl-w w"], "水平或垂直分割；Ctrl-w 加方向鍵式按鍵切換焦點。", base, base, [5, 9], [5, 9]),
  lesson("resize", "workspace", "整理分割視窗", ["Ctrl-w =", "Ctrl-w _", "Ctrl-w |", "Ctrl-w +/-", "Ctrl-w >/<"], "平均、最大化或細調分割區尺寸。", base, base, [5, 9], [5, 9]),
  lesson("close-window", "workspace", "關閉與保留視窗", ["Ctrl-w q", "Ctrl-w o"], "q 關目前視窗；o 只保留目前視窗。", base, base, [5, 9], [5, 9]),
  lesson("tabs", "workspace", "Tab 工作區", [":tabnew", ":tabclose", "gt", "gT", "3gt"], "建立與關閉 tab，往前後巡覽，或用數字直達。", base, base, [5, 9], [5, 9]),
  lesson("netrw", "workspace", "內建檔案總管", ["\\e", "Enter", "-", "%", "d", "D", "R", "q", "i"], "開啟 Netrw；進入、上一層、新檔、新資料夾、刪除、改名與切換檢視。", ["CODE/", "  solution.cpp", "  template.cpp", "  .cph-modern/"], ["CODE/", "  A_Two_Sum.cpp", "  template.cpp", "  .cph-modern/"], [2, 3], [2, 3]),

  lesson("templates", "cph", "叫出你的 C++ 模板", ["cp<Tab>", "normal<Tab>"], "cp 展開競賽模板，normal 展開乾淨 main；Tab 會確認 snippet。", ["cp"], ["#include <bits/stdc++.h>", "using namespace std;", "", "int main() {", "    ios::sync_with_stdio(false);", "    cin.tie(nullptr);", "    ", "    return 0;", "}"], [1, 3], [7, 5], { mode: "INSERT" }),
  lesson("companion", "cph", "網站一鍵匯入題目", ["網站上的 +"], "在 Codeforces、AtCoder 等題面按 Competitive Companion 的 +，Vim 會自動建立 C++ 檔並匯入 samples。", ["Listening on port 27121…"], ["✓ Created A_Two_Sum.cpp", "✓ Imported 3 sample testcases", "✓ Opened CPH Modern"], [1, 1], [3, 1], { panel: "companion" }),
  lesson("judge-open", "cph", "開啟 Judge 面板", ["\\j"], "從目前 C++ 檔開啟右側 CPH Modern 面板；測資會保存在檔案旁。", base, base, [6, 9], [6, 9], { panel: "judge" }),
  lesson("test-edit", "cph", "編輯與管理測資", ["i", "a", "d"], "面板內 i 編輯 Input/Expected、a 新增 testcase、d 刪除目前 testcase。", base, base, [6, 9], [6, 9], { panel: "judge" }),
  lesson("run", "cph", "執行目前或全部", ["\\r", "\\a", "r", "R"], "編輯器中 \\r 跑目前、\\a 跑全部；Judge 面板裡則用 r 與 R。", base, base, [7, 9], [7, 9], { panel: "judge" }),
  lesson("verdicts", "cph", "看懂執行結果", ["Accepted", "Wrong Answer", "Compile Error", "Runtime Error", "Timeout"], "綠色通過、紅色答案或程式錯誤、黃色超時；同時顯示 actual output 與 runtime。", base, base, [7, 9], [7, 9], { panel: "judge" }),
  lesson("judge-help", "cph", "Judge 面板快捷鍵", ["?", "q"], "? 隨時顯示完整快捷鍵；q 關閉面板並回到程式。", base, base, [7, 9], [7, 9], { panel: "judge" }),
];

export const totalCommands = lessons.reduce((sum, item) => sum + item.keys.length, 0);
