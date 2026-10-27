"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { quizData } from "./questions";

type Section = "intro" | "mcq" | "tf" | "short" | "summary";
const slides = [
  { section: "intro" as Section, index: 0, title: "Mở đầu" },
  ...quizData.mcq.map((_, index) => ({ section: "mcq" as Section, index, title: `Lũ lụt ${index+1}` })),
  ...quizData.tf.map((_, index) => ({ section: "tf" as Section, index, title: `Mở nhận định ${index+1}` })),
  ...quizData.shorts.map((_, index) => ({ section: "short" as Section, index, title: `Thảo luận ${index+1}` })),
  { section: "summary" as Section, index: 0, title: "Tổng kết" },
];

type AttemptMap = Record<number, number[]>;
type RevealMap = Record<number, number[]>;

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [attempts, setAttempts] = useState<AttemptMap>({});
  const [reveals, setReveals] = useState<RevealMap>({});
  const [soundOn, setSoundOn] = useState(true);
  const [shortRevealed, setShortRevealed] = useState(false);
  const [full, setFull] = useState(false);
  const stageRef = useRef<HTMLElement | null>(null);
  const current = slides[slide];
  const [curtainKey, setCurtainKey] = useState(0);
  const currentAttempts = current.section === "mcq" ? (attempts[current.index] ?? []) : [];
  const answerFound = current.section === "mcq" && currentAttempts.includes(quizData.mcq[current.index].ans);
  const revealedHere = current.section === "tf" ? (reveals[current.index] ?? []) : [];
  const score = useMemo(() => quizData.mcq.reduce((sum, q, i) => sum + ((attempts[i] ?? []).includes(q.ans) ? 1 : 0), 0), [attempts]);
  const revealedTotal = useMemo(() => Object.keys(reveals).reduce((sum, key) => sum + (reveals[Number(key)] ?? []).length, 0), [reveals]);

  const tone = useCallback((good: boolean) => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.type = "sine";
      osc.frequency.value = good ? 880 : 235;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (good ? 0.23 : 0.36));
      osc.start(); osc.stop(ctx.currentTime + (good ? 0.25 : 0.38)); osc.onended = () => void ctx.close();
    } catch { /* Audio có thể bị trình duyệt chặn trước tương tác đầu tiên. */ }
  }, [soundOn]);

  const go = useCallback((next: number) => {
    setSlide(Math.max(0, Math.min(slides.length - 1, next)));
    setShortRevealed(false); setCurtainKey(k => k + 1);
  }, []);

  const answerMCQ = (choice: number) => {
    if (current.section !== "mcq" || answerFound || currentAttempts.includes(choice)) return;
    const next = [...currentAttempts, choice];
    setAttempts(prev => ({ ...prev, [current.index]: next }));
    const correct = choice === quizData.mcq[current.index].ans;
    tone(correct);
  };

  const revealStatement = (statementIndex: number) => {
    if (current.section !== "tf" || revealedHere.includes(statementIndex)) return;
    setReveals(prev => ({ ...prev, [current.index]: [...(prev[current.index] ?? []), statementIndex] }));
    tone(quizData.tf[current.index].statements[statementIndex].ans);
  };

  const toggleFull = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await stageRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* Toàn màn hình có thể bị chính sách trình duyệt giới hạn. */ }
  }, []);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(slide + 1); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(slide - 1); }
      if (e.key.toLowerCase() === "f") void toggleFull();
    };
    const fsHandler = () => setFull(!!document.fullscreenElement);
    window.addEventListener("keydown", keyHandler); document.addEventListener("fullscreenchange", fsHandler);
    return () => { window.removeEventListener("keydown", keyHandler); document.removeEventListener("fullscreenchange", fsHandler); };
  }, [slide, go, toggleFull]);

  const progress = slide / (slides.length - 1) * 100;
  const sectionLabel = current.section === "intro" ? "MỞ MÀN · TÔI LÀ LŨ LỤT" : current.section === "mcq" ? "CHẶNG 01 · GIẢI MÃ DÒNG LŨ" : current.section === "tf" ? "CHẶNG 02 · MỞ TỪNG NHẬN ĐỊNH" : current.section === "short" ? "CHẶNG 03 · CÙNG SUY NGẪM" : "HÀNH TRÌNH HOÀN TẤT";

  return <main className={`app-shell ${full ? "is-fullscreen" : ""}`} ref={stageRef}>
    <div className="topographic topo-a" aria-hidden="true"/><div className="topographic topo-b" aria-hidden="true"/><div className="rainfall" aria-hidden="true"/><div className="map-grid" aria-hidden="true"/>
    <header className="topbar">
      <div className="brand"><Image src="/logo-to2.png" alt="Logo Tổ 2" width={52} height={52} priority/><div><b>TỔ 2 <span>×</span> ĐỊA LÍ 12</b><small>KẾT NỐI TRI THỨC VỚI CUỘC SỐNG</small></div></div>
      <div className="top-actions"><span className="chapter-mark"><span className="compass-dot">N</span> ĐỊA HÌNH · THỦY VĂN</span><button className="tool-btn" onClick={() => setSoundOn(v => !v)} aria-label="Bật hoặc tắt âm thanh" title="Âm thanh">{soundOn ? "♫" : "♪"}<span>ÂM THANH {soundOn ? "BẬT" : "TẮT"}</span></button><button className="tool-btn fullscreen-trigger" onClick={toggleFull} title="Toàn màn hình (F)">⛶<span>{full ? "THOÁT" : "PHÓNG TO"}</span></button></div>
    </header>
    <div className="progress-track"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
    <section className="stage" aria-label="Sân khấu trình chiếu">
      <div className="frame-corner corner-tl"/><div className="frame-corner corner-tr"/><div className="frame-corner corner-bl"/><div className="frame-corner corner-br"/>
      <div className="stage-meta"><span className="section-label"><i/>{sectionLabel}</span><span className="slide-count">{String(slide + 1).padStart(2,"0")} <i>/</i> {String(slides.length).padStart(2,"0")}</span></div>
      <div className="slide-scene" key={slide}>
        {current.section === "intro" && <div className="intro-layout">
          <div className="intro-copy"><div className="chapter-tag"><span/> PHÓNG SỰ TỪ DÒNG NƯỚC</div><h1>TÔI LÀ<br/><em>LŨ LỤT.</em></h1><p className="intro-sub">Tôi đến từ những cơn mưa — nhưng sức tàn phá của tôi được quyết định bởi nhiều điều hơn thế.</p><div className="gold-rule"/><p className="intro-desc">Một hành trình tương tác về địa hình, thủy văn, rừng đầu nguồn và kỹ năng ứng phó thiên tai. Mỗi lựa chọn mở ra một manh mối.</p><div className="stats"><div><b>10</b><span>GIẢI MÃ</span></div><div><b>40</b><span>NHẬN ĐỊNH Đ/S</span></div><div><b>05</b><span>THẢO LUẬN</span></div></div><button className="primary-btn" onClick={() => go(1)}>MỞ MÀN HÀNH TRÌNH <span>↗</span></button></div>
          <div className="hero-map"><div className="map-ring ring-one"/><div className="map-ring ring-two"/><div className="map-ring ring-three"/><div className="map-water"><svg viewBox="0 0 450 470" role="img" aria-label="Minh họa địa hình núi và dòng lũ"><defs><linearGradient id="river" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#65c4e4"/><stop offset="1" stopColor="#0759a3"/></linearGradient><linearGradient id="mountain" x1="0" x2="0.8" y1="0" y2="1"><stop offset="0" stopColor="#d9e6d2"/><stop offset="1" stopColor="#87aa9a"/></linearGradient></defs><path d="M18 306 95 188 135 239 211 92 273 199 312 143 432 308 432 421 18 421Z" fill="url(#mountain)" stroke="#427d8d" strokeWidth="2"/><path d="M61 279 95 188 117 217 95 218 80 251Z M166 160 211 92 242 147 214 130 197 157Z M292 179 312 143 346 207 317 188Z" fill="#f6fbf5" opacity=".95"/><path d="M215 111 C194 170 269 187 228 232 C189 276 255 294 225 337 C206 365 244 390 223 421 L283 421 C305 391 264 365 300 328 C342 279 265 247 304 209 C337 177 272 147 285 115Z" fill="url(#river)" stroke="#e9f7fb" strokeWidth="5"/><path d="M221 132 C210 170 272 194 239 230 C205 266 267 291 240 331 C223 358 250 383 238 410" fill="none" stroke="#d9f5ff" strokeWidth="3" strokeDasharray="7 10"/><path d="M42 333 Q100 309 151 339 T247 341 T399 335" fill="none" stroke="#e5f3e6" strokeWidth="3"/><path d="M28 355 Q88 333 139 363 T242 365 T422 359" fill="none" stroke="#e5f3e6" strokeWidth="2"/><g fill="#e9b923" stroke="#fff9d8" strokeWidth="2"><circle cx="211" cy="94" r="7"/><circle cx="229" cy="239" r="6"/><circle cx="258" cy="352" r="6"/></g></svg></div><div className="map-label label-head"><b>THƯỢNG NGUỒN</b><small>Mưa · Địa hình dốc</small></div><div className="map-label label-river"><b>DÒNG LŨ</b><small>Nước tập trung nhanh</small></div><div className="map-label label-low"><b>HẠ LƯU</b><small>Nguy cơ ngập</small></div><div className="coordinate coordinate-a">15°N · 108°E</div><div className="coordinate coordinate-b">BẢN ĐỒ RỦI RO / 01</div><div className="compass-rose"><span>N</span><i>✦</i></div><div className="floating-stamp">FIELD<br/><b>REPORT</b><span>● LIVE</span></div></div>
        </div>}

        {current.section === "mcq" && <div className="question-layout">
          <div className="question-rail"><div className="rail-index">{String(current.index+1).padStart(2,"0")}<span>/10</span></div><div className="rail-line"/><div className="rail-vertical">HÀNH TRÌNH THEO DÒNG LŨ</div><div className="rail-coordinate">{12 + current.index}° N</div></div>
          <div className="question-main"><div className="question-kicker"><span className="kicker-icon">↘</span> TÔI LÀ LŨ LỤT <i>·</i> GIẢI MÃ {String(current.index+1).padStart(2,"0")}</div><h2>{quizData.mcq[current.index].q}</h2><p className="instruction">Chọn một phương án. Kết quả sẽ hiện ngay — nếu sai, nhường lượt cho người tiếp theo.</p>
            <div className="options-grid">{quizData.mcq[current.index].opts.map((opt,i) => {
              const wasTried = currentAttempts.includes(i); const correct = i === quizData.mcq[current.index].ans; const cls = wasTried ? (correct ? "option correct" : "option wrong") : "option";
              return <button key={i} className={cls} onClick={() => answerMCQ(i)} disabled={answerFound || wasTried}><span className="option-letter">{String.fromCharCode(65+i)}</span><span className="option-text">{opt}</span><span className="option-mark">{wasTried ? (correct ? "✓" : "×") : <span className="option-open">↗</span>}</span>{wasTried && <span className="answer-chip">{correct ? "CHÍNH XÁC" : "CHƯA ĐÚNG"}</span>}</button>;
            })}</div>
            {currentAttempts.length > 0 && <div className={`live-feedback ${answerFound ? "is-correct" : "is-wrong"}`}><span className="feedback-icon">{answerFound ? "✓" : "×"}</span><div><b>{answerFound ? "ĐÃ TÌM RA ĐÁP ÁN!" : "PHƯƠNG ÁN NÀY CHƯA CHÍNH XÁC"}</b><p>{answerFound ? quizData.mcq[current.index].explain : "Mời một thành viên khác thử phương án còn lại. Câu hỏi vẫn mở cho đến khi tìm được đáp án đúng."}</p></div>{answerFound && <button onClick={() => go(slide+1)}>CÂU TIẾP <span>→</span></button>}</div>}
            <div className="bottom-note"><span className="pulse-dot"/>{answerFound ? "ĐÃ KHÁM PHÁ XONG MANH MỐI" : "MỖI LƯỢT CHỌN ĐỀU MỞ RA MỘT KẾT QUẢ"}<span className="bottom-note-right">{currentAttempts.length}/4 LƯỢT ĐÃ THỬ</span></div>
          </div>
        </div>}

        {current.section === "tf" && <div className="question-layout tf-layout">
          <div className="question-rail"><div className="rail-index">{String(current.index+1).padStart(2,"0")}<span>/10</span></div><div className="rail-line"/><div className="rail-vertical">MỞ HỒ SƠ HIỆN TRƯỜNG</div><div className="rail-coordinate">4 NHẬN ĐỊNH</div></div>
          <div className="question-main"><div className="question-kicker"><span className="kicker-icon">⌁</span> TÔI LÀ LŨ LỤT <i>·</i> HỒ SƠ {String(current.index+1).padStart(2,"0")}</div><h2>{quizData.tf[current.index].q}</h2><p className="instruction">Mỗi thẻ là một nhận định độc lập. Hãy thảo luận trước, rồi bấm từng thẻ để mở đáp án Đúng/Sai.</p>
            <div className="statement-grid">{quizData.tf[current.index].statements.map((statement,i) => {
              const isRevealed = revealedHere.includes(i); return <button key={i} className={`statement-card ${isRevealed ? (statement.ans ? "statement-true" : "statement-false") : ""}`} onClick={() => revealStatement(i)} disabled={isRevealed}>
                <span className="statement-letter">{String.fromCharCode(65+i)}</span><span className="statement-body"><span className="statement-text">{statement.text}</span>{isRevealed && <span className="statement-explain">{statement.explain}</span>}</span><span className={`truth-badge ${isRevealed ? "visible" : ""}`}>{isRevealed ? (statement.ans ? "Đ" : "S") : <span>+</span>}</span>
                {!isRevealed && <span className="tap-hint">MỞ</span>}
              </button>;
            })}</div>
            <div className="bottom-note"><span className="pulse-dot"/>{revealedHere.length === 4 ? "ĐÃ MỞ TOÀN BỘ HỒ SƠ" : "NHẤN TỪNG NHẬN ĐỊNH ĐỂ MỞ KẾT QUẢ"}<span className="bottom-note-right">{revealedHere.length}/4 ĐÃ MỞ</span></div>
            <div className="stage-next"><span>Đ/S ĐƯỢC BỐ TRÍ XEN KẼ: CÓ CÂU 1 ĐÚNG, 2–2, 3 ĐÚNG HOẶC CẢ 4 ĐÚNG.</span>{revealedHere.length === 4 && <button onClick={() => go(slide+1)}>HỒ SƠ TIẾP <b>→</b></button>}</div>
          </div>
        </div>}

        {current.section === "short" && <div className="short-layout"><div className="short-heading"><div className="question-kicker"><span className="kicker-icon">✳</span> CHẶNG CUỐI <i>·</i> CÙNG SUY NGẪM</div><div className="short-index">0{current.index+1}<span> / 05</span></div><h2>{quizData.shorts[current.index].q}</h2><p>Hãy trao đổi cùng các thành viên trong tổ trước khi mở gợi ý tham khảo.</p><button className="primary-btn" onClick={() => setShortRevealed(v => !v)}>{shortRevealed ? "ĐÓNG GỢI Ý" : "MỞ GỢI Ý TRẢ LỜI"}<span>{shortRevealed ? "−" : "＋"}</span></button></div><div className={`answer-card ${shortRevealed ? "revealed" : ""}`}><div className="answer-card-top"><span>GHI CHÚ HIỆN TRƯỜNG</span><span>✳</span></div>{shortRevealed ? <p>{quizData.shorts[current.index].ans}</p> : <div className="answer-placeholder"><div className="lock-mark">?</div><b>Bạn sẽ giải thích hiện tượng này thế nào?</b><small>Thảo luận trước khi mở gợi ý</small></div>}<div className="answer-card-bottom"><span>ĐỊA LÍ 12 · KNTT</span><span>TỔ 2 / {String(current.index+1).padStart(2,"0")}</span></div></div><div className="short-next"><button className="primary-btn" onClick={() => go(slide+1)}>{current.index === 4 ? "KẾT THÚC HÀNH TRÌNH" : "CÂU TIẾP THEO"}<span>→</span></button></div></div>}

        {current.section === "summary" && <div className="summary-layout"><div className="summary-compass">✦</div><div className="chapter-tag"><span/> KẾT THÚC HÀNH TRÌNH</div><h1>TÔI LÀ LŨ LỤT.<br/><em>BẠN ĐÃ HIỂU TÔI HƠN.</em></h1><p className="summary-desc">Thiên tai không phải lúc nào cũng có thể ngăn lại — nhưng tri thức, cảnh báo sớm và hành động đúng lúc có thể cứu sống con người.</p><div className="score-panel"><div><b>{score}<small>/10</small></b><span>CÂU TRẮC NGHIỆM ĐÚNG</span></div><div><b>{revealedTotal}<small>/40</small></b><span>NHẬN ĐỊNH ĐÃ MỞ</span></div><div><b>05</b><span>CÂU THẢO LUẬN</span></div></div><div className="summary-actions"><button className="primary-btn" onClick={() => {setAttempts({});setReveals({});setShortRevealed(false);go(0)}}>TRÌNH CHIẾU LẠI <span>↻</span></button><button className="secondary-btn" onClick={() => go(1)}>ÔN LẠI CÂU HỎI <span>↗</span></button></div><p className="closing-line">BẢO VỆ RỪNG · TÔN TRỌNG DÒNG CHẢY · CHỦ ĐỘNG TRƯỚC THIÊN TAI</p></div>}
      </div>
      <div key={curtainKey} className="stage-curtain" aria-hidden="true"><div/><div/></div>
    </section>
    <footer className="controls"><div className="control-left"><span className="key-hint"><kbd>←</kbd><kbd>→</kbd> ĐIỀU HƯỚNG</span><span className="control-divider"/><span className="control-section">{current.section === "intro" ? "MỞ MÀN" : current.section === "mcq" ? "GIẢI MÃ" : current.section === "tf" ? "NHẬN ĐỊNH" : current.section === "short" ? "THẢO LUẬN" : "TỔNG KẾT"}</span></div><div className="slide-dots" aria-label="Tiến độ slide">{slides.map((s,i) => <button key={i} aria-label={`Đến slide ${i+1}: ${s.title}`} title={s.title} className={`${i===slide?"active":""} ${s.section!==current.section?"muted":""}`} onClick={() => go(i)}/>)}</div><div className="control-right"><button className="nav-btn" onClick={() => go(slide-1)} disabled={slide===0} aria-label="Slide trước">← <span>TRƯỚC</span></button><span className="control-divider"/><button className="nav-btn next-nav" onClick={() => go(slide+1)} disabled={slide===slides.length-1} aria-label="Slide tiếp theo"><span>TIẾP</span> →</button></div></footer>
    <div className="copyright">TỔ 2 <span>✦</span> ĐỊA LÍ 12 · KNTT</div>
  </main>;
}
