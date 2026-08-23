"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chapters, lessons, totalCommands, type ChapterId, type Lesson } from "./tutorial-data";

const STORAGE_KEY = "vim-keyboard-academy-progress";

function highlight(line: string) {
  const parts = line.split(/(\/\/.*|#[A-Za-z]+|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:int|long|bool|void|return|for|while|if|else|using|namespace|const|auto|struct|class|template|true|false)\b|\b(?:vector|string|pair|priority_queue|cout|cin|sort)\b|\b\d+\b)/g);
  return parts.map((part, index) => {
    let className = "";
    if (/^\/\//.test(part)) className = "syn-comment";
    else if (/^#/.test(part)) className = "syn-pre";
    else if (/^["']/.test(part)) className = "syn-string";
    else if (/^(int|long|bool|void|return|for|while|if|else|using|namespace|const|auto|struct|class|template|true|false)$/.test(part)) className = "syn-keyword";
    else if (/^(vector|string|pair|priority_queue|cout|cin|sort)$/.test(part)) className = "syn-type";
    else if (/^\d+$/.test(part)) className = "syn-number";
    return <span className={className} key={`${part}-${index}`}>{part}</span>;
  });
}

function Editor({ lesson, showAfter, keyPulse }: { lesson: Lesson; showAfter: boolean; keyPulse: number }) {
  const code = showAfter ? lesson.after : lesson.before;
  const cursor = showAfter ? lesson.cursorAfter : lesson.cursorBefore;
  const mode = showAfter ? "NORMAL" : lesson.mode ?? "NORMAL";
  return (
    <div className="terminal" aria-label="Vim 動畫示範區">
      <div className="terminal-titlebar">
        <div className="lights" aria-hidden="true"><i /><i /><i /></div>
        <div className="tab-title"><span className="file-plus">＋</span> solution.cpp</div>
        <div className="terminal-meta">SF Mono · GitHub Dark</div>
      </div>
      <div className={`workspace ${lesson.panel ? "with-panel" : ""}`}>
        <div className="editor-pane">
          <div className="code" key={`${lesson.id}-${showAfter}-${keyPulse}`}>
            {code.map((line, lineIndex) => {
              const lineNo = lineIndex + 1;
              const isCursorLine = cursor?.[0] === lineNo;
              const col = Math.max(1, cursor?.[1] ?? 1);
              const before = line.slice(0, col - 1);
              const char = line[col - 1] || " ";
              const after = line.slice(col);
              return (
                <div className={`code-line ${isCursorLine ? "active-line" : ""}`} key={`${line}-${lineIndex}`}>
                  <span className="line-number">{lineNo}</span>
                  <code>{isCursorLine ? <>{highlight(before)}<span className="cursor">{char}</span>{highlight(after)}</> : highlight(line || " ")}</code>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 12 - code.length) }).map((_, index) => <div className="code-line empty" key={`empty-${index}`}><span className="line-number">~</span></div>)}
          </div>
          <div className="vim-status">
            <strong className={`mode mode-${mode.toLowerCase()}`}>{mode}</strong>
            <span>solution.cpp {showAfter ? "[完成]" : ""}</span>
            <span className="status-right">cpp&nbsp;&nbsp; utf-8[unix]&nbsp;&nbsp; {cursor?.[0]}:{cursor?.[1]} &nbsp;All</span>
          </div>
        </div>
        {lesson.panel === "judge" && <JudgePanel showAfter={showAfter} />}
        {lesson.panel === "companion" && <CompanionPanel showAfter={showAfter} />}
      </div>
    </div>
  );
}

function JudgePanel({ showAfter }: { showAfter: boolean }) {
  return <aside className="judge-panel" aria-label="CPH Modern 模擬面板">
    <div className="panel-title"><span>CPH MODERN</span><span className="live-dot" /> </div>
    <div className="panel-actions"><kbd>a</kbd> add <kbd>d</kbd> delete <kbd>r</kbd> run <kbd>R</kbd> all</div>
    {["2 7 4", "5 1 3", "1 2 3 4"].map((input, index) => <div className={`test-card ${showAfter ? "passed" : ""}`} key={input}>
      <div><strong>TC {index + 1}</strong><span>{showAfter ? "Accepted" : "Ready"}</span></div>
      <code>{input}</code><small>{showAfter ? `${2 + index}.4 ms` : "expected ready"}</small>
    </div>)}
    <button className="run-all" type="button">▶ Run All <kbd>R</kbd></button>
  </aside>;
}

function CompanionPanel({ showAfter }: { showAfter: boolean }) {
  return <aside className="judge-panel companion-panel" aria-label="Competitive Companion 匯入流程">
    <div className="panel-title"><span>COMPANION</span><span className="live-dot" /></div>
    <div className="browser-card"><span>codeforces.com/problem/A</span><b>＋</b></div>
    <div className={`connection ${showAfter ? "success" : ""}`}><i /> {showAfter ? "Problem received" : "Listening :27121"}</div>
    <ol><li className={showAfter ? "done" : ""}>建立 A_Two_Sum.cpp</li><li className={showAfter ? "done" : ""}>套用 cp 模板</li><li className={showAfter ? "done" : ""}>匯入 3 組 samples</li><li className={showAfter ? "done" : ""}>打開 CPH Modern</li></ol>
  </aside>;
}

function KeySequence({ keys, pulse }: { keys: string[]; pulse: number }) {
  return <div className="key-sequence" key={pulse} aria-label={`按鍵：${keys.join("，")}`}>
    {keys.slice(0, 5).map((key, index) => <span key={`${key}-${index}`}><kbd style={{ animationDelay: `${index * 80}ms` }}>{key}</kbd>{index < Math.min(keys.length, 5) - 1 && <i>→</i>}</span>)}
    {keys.length > 5 && <em>+{keys.length - 5}</em>}
  </div>;
}

export default function Home() {
  const [activeId, setActiveId] = useState(lessons[0].id);
  const [chapter, setChapter] = useState<ChapterId | "all">("all");
  const [query, setQuery] = useState("");
  const [showAfter, setShowAfter] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [pulse, setPulse] = useState(0);
  const [practice, setPractice] = useState(false);
  const [typed, setTyped] = useState("");
  const [practiceState, setPracticeState] = useState<"idle" | "good" | "bad">("idle");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const active = lessons.find((item) => item.id === activeId) ?? lessons[0];
  const filtered = useMemo(() => lessons.filter((item) => {
    const matchChapter = chapter === "all" || item.chapter === chapter;
    const haystack = `${item.title} ${item.description} ${item.keys.join(" ")}`.toLowerCase();
    return matchChapter && haystack.includes(query.toLowerCase());
  }), [chapter, query]);

  useEffect(() => {
    try { setCompleted(new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))); } catch { /* ignore invalid local data */ }
  }, []);

  const markComplete = useCallback((id: string) => {
    setCompleted((current) => {
      const next = new Set(current).add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const restart = useCallback(() => {
    setShowAfter(false); setPlaying(true); setPulse((value) => value + 1); setTyped(""); setPracticeState("idle");
  }, []);

  useEffect(() => { restart(); }, [activeId, restart]);

  useEffect(() => {
    if (!playing || practice) return;
    const timer = window.setTimeout(() => {
      if (!showAfter) { setShowAfter(true); markComplete(active.id); }
      else setPlaying(false);
    }, 1450 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, practice, showAfter, speed, active.id, markComplete]);

  const chooseLesson = (id: string) => { setActiveId(id); document.getElementById("player")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const moveLesson = (direction: number) => {
    const index = lessons.findIndex((item) => item.id === active.id);
    setActiveId(lessons[(index + direction + lessons.length) % lessons.length].id);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (event.key === "/") { event.preventDefault(); searchRef.current?.focus(); return; }
      if (practice) {
        event.preventDefault();
        if (event.key === "Escape") { setPractice(false); setTyped(""); return; }
        const printable = event.key.length === 1 ? event.key : event.key === "Enter" ? "↵" : event.key === "Tab" ? "⇥" : "";
        if (!printable) return;
        const next = typed + printable;
        setTyped(next);
        const expected = active.keys[0].replace("<Tab>", "⇥").replace("Enter", "↵");
        if (expected.startsWith(next)) setPracticeState(next === expected ? "good" : "idle");
        else setPracticeState("bad");
        if (next === expected) { setShowAfter(true); markComplete(active.id); window.setTimeout(() => { setTyped(""); setPracticeState("idle"); }, 900); }
        return;
      }
      if (event.code === "Space") { event.preventDefault(); setPlaying((value) => !value); }
      else if (event.key === "ArrowRight") moveLesson(1);
      else if (event.key === "ArrowLeft") moveLesson(-1);
      else if (event.key.toLowerCase() === "r") restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [practice, typed, active, markComplete, restart]);

  const progress = Math.round((completed.size / lessons.length) * 100);
  return <main>
    <header className="site-header">
      <a className="brand" href="#top"><span>V</span><strong>VIM KEYBOARD</strong><small>ACADEMY</small></a>
      <nav aria-label="主要導覽"><a href="#player">互動教學</a><a href="#curriculum">全部課程</a><a href="#cheatsheet">快捷鍵</a></nav>
      <a className="github-link" href="https://github.com/benjamin-shih-tw/vim-keyboard-academy" target="_blank" rel="noreferrer">GitHub ↗</a>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><span /> BUILT FOR COMPETITIVE PROGRAMMING</p>
        <h1>用鍵盤，把 Vim<br />練成<span>肌肉記憶。</span></h1>
        <p className="hero-lead">不是快捷鍵清單。每個操作都在你的 GitHub Dark 編輯器與 CPH Modern 工作流裡，逐鍵播放、立即練習。</p>
        <div className="hero-actions"><a className="primary" href="#player">▶ 開始第一課</a><button type="button" onClick={() => setPractice(true)}>⌨ 直接練習</button></div>
        <div className="stats"><div><strong>{lessons.length}</strong><span>互動課程</span></div><div><strong>{totalCommands}</strong><span>個操作</span></div><div><strong>0</strong><span>滑鼠需求</span></div></div>
      </div>
      <div className="hero-preview"><Editor lesson={lessons[40]} showAfter keyPulse={1} /><div className="floating-key"><kbd>\j</kbd><span>Judge ready</span></div></div>
    </section>

    <section className="player-section" id="player">
      <div className="section-heading"><div><p>INTERACTIVE PLAYER</p><h2>看一次，按一次，就記住。</h2></div><div className="progress-card"><span>你的進度 <b>{completed.size}/{lessons.length}</b></span><div><i style={{ width: `${progress}%` }} /></div><small>{progress}% completed · 保存在這台裝置</small></div></div>
      <div className="lesson-shell">
        <aside className="lesson-sidebar">
          <label className="search"><span>⌕</span><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋指令或課程…" aria-label="搜尋課程" /><kbd>/</kbd></label>
          <div className="chapter-tabs"><button className={chapter === "all" ? "active" : ""} onClick={() => setChapter("all")}>全部</button>{chapters.map((item) => <button className={chapter === item.id ? "active" : ""} onClick={() => setChapter(item.id)} key={item.id}>{item.label}</button>)}</div>
          <div className="lesson-list">{filtered.map((item) => <button className={`${item.id === active.id ? "active" : ""} ${completed.has(item.id) ? "complete" : ""}`} onClick={() => chooseLesson(item.id)} key={item.id}><i>{completed.has(item.id) ? "✓" : String(lessons.indexOf(item) + 1).padStart(2, "0")}</i><span><strong>{item.title}</strong><small>{item.keys.slice(0, 3).join(" · ")}</small></span></button>)}{!filtered.length && <p className="empty-search">找不到符合的課程</p>}</div>
        </aside>
        <div className="lesson-main">
          <div className="lesson-topline"><div><span>{chapters.find((item) => item.id === active.chapter)?.label}</span><h3>{active.title}</h3><p>{active.description}</p></div><button className={`practice-toggle ${practice ? "active" : ""}`} onClick={() => { setPractice((value) => !value); setPlaying(false); setTyped(""); }}><span>⌨</span>{practice ? "結束練習" : "鍵盤練習"}</button></div>
          <KeySequence keys={active.keys} pulse={pulse} />
          <Editor lesson={active} showAfter={showAfter} keyPulse={pulse} />
          {practice && <div className={`practice-bar ${practiceState}`}><span>{practiceState === "good" ? "✓" : practiceState === "bad" ? "×" : "⌨"}</span><div><small>請直接按下</small><strong>{active.keys[0]}</strong></div><code>{typed || "_"}</code><em>Esc 離開</em></div>}
          <div className="player-controls"><button onClick={() => moveLesson(-1)} aria-label="上一課">←</button><button className="play" onClick={() => { if (showAfter) restart(); else setPlaying((value) => !value); }}>{playing ? "Ⅱ 暫停" : showAfter ? "↻ 重播" : "▶ 播放"}</button><button onClick={() => { setShowAfter(true); setPlaying(false); markComplete(active.id); }} aria-label="顯示結果">完成狀態</button><button onClick={() => moveLesson(1)} aria-label="下一課">→</button><label>速度<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{[0.5, 1, 1.5, 2].map((item) => <option key={item} value={item}>{item}×</option>)}</select></label></div>
        </div>
      </div>
    </section>

    <section className="curriculum" id="curriculum">
      <div className="section-heading"><div><p>FULL CURRICULUM</p><h2>從離開 Insert，到一鍵跑完 samples。</h2></div></div>
      <div className="chapter-grid">{chapters.map((item, chapterIndex) => {
        const items = lessons.filter((entry) => entry.chapter === item.id);
        const done = items.filter((entry) => completed.has(entry.id)).length;
        return <article key={item.id}><div className="chapter-number">0{chapterIndex + 1}</div><div className="chapter-head"><span>{item.label.replace(/^\d+ /, "")}</span><small>{item.short}</small></div><ul>{items.slice(0, 6).map((entry) => <li key={entry.id}><button onClick={() => chooseLesson(entry.id)}>{completed.has(entry.id) ? "✓" : "→"} {entry.title}</button><kbd>{entry.keys[0]}</kbd></li>)}</ul><button className="chapter-cta" onClick={() => { setChapter(item.id); chooseLesson(items[0].id); }}>開始這章 <span>{done}/{items.length}</span></button></article>;
      })}</div>
    </section>

    <section className="cheatsheet" id="cheatsheet">
      <div><p>KEYBOARD FIRST</p><h2>你真正需要記住的路徑</h2><span>網站本身也不需要滑鼠。</span></div>
      <div className="shortcut-grid"><div><kbd>/</kbd><span>搜尋課程</span></div><div><kbd>Space</kbd><span>播放／暫停</span></div><div><kbd>← →</kbd><span>上一課／下一課</span></div><div><kbd>R</kbd><span>重播動畫</span></div><div><kbd>Esc</kbd><span>離開練習</span></div><div><kbd>\j</kbd><span>Vim 開 Judge</span></div></div>
    </section>

    <footer><div className="brand"><span>V</span><strong>VIM KEYBOARD</strong><small>ACADEMY</small></div><p>為你的 Vim、C++ 與 CPH Modern 工作流打造。</p><a href="#top">回到頂端 ↑</a></footer>
  </main>;
}
