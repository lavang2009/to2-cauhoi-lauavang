"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { quizData } from "./questions";

type Section = "intro" | "mcq" | "tf" | "short" | "summary";
const slides = [
  { section: "intro" as Section, index: 0, title: "Mở đầu" },
  ...quizData.mcq.map((_, index) => ({ section: "mcq" as Section, index, title: `Trắc nghiệm ${index + 1}` })),
  ...quizData.tf.map((_, index) => ({ section: "tf" as Section, index, title: `Đúng / Sai ${index + 1}` })),
  ...quizData.shorts.map((_, index) => ({ section: "short" as Section, index, title: `Trả lời ngắn ${index + 1}` })),
  { section: "summary" as Section, index: 0, title: "Tổng kết" },
];
type Attempts = Record<number, number[]>;
type Reveals = Record<number, number[]>;

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [attempts, setAttempts] = useState<Attempts>({});
  const [reveals, setReveals] = useState<Reveals>({});
  const [soundOn, setSoundOn] = useState(true);
  const [shortRevealed, setShortRevealed] = useState<Record<number, boolean>>({});
  const [full, setFull] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  const stageRef = useRef<HTMLElement | null>(null);

  const current = slides[slide];
  const currentAttempts = current.section === "mcq" ? (attempts[current.index] ?? []) : [];
  const answerFound = current.section === "mcq" && currentAttempts.includes(quizData.mcq[current.index].ans);
  const revealedHere = current.section === "tf" ? (reveals[current.index] ?? []) : [];
  const shortOpen = current.section === "short" && !!shortRevealed[current.index];

  const canAdvance = useMemo(() => {
    if (current.section === "intro") return true;
    if (current.section === "mcq") return answerFound;
    if (current.section === "tf") return revealedHere.length === quizData.tf[current.index].statements.length;
    if (current.section === "short") return shortOpen;
    return false;
  }, [current, answerFound, revealedHere.length, shortOpen]);

  const score = useMemo(
    () => quizData.mcq.reduce((total, q, i) => total + ((attempts[i] ?? []).includes(q.ans) ? 1 : 0), 0),
    [attempts],
  );
  const revealedTotal = useMemo(
    () => Object.values(reveals).reduce((total, indexes) => total + indexes.length, 0),
    [reveals],
  );

  const playTone = useCallback((correct: boolean) => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioContextType = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextType) return;
      const context = new AudioContextType();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = correct ? 780 : 220;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, context.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (correct ? 0.2 : 0.32));
      oscillator.start();
      oscillator.stop(context.currentTime + (correct ? 0.22 : 0.34));
      oscillator.onended = () => void context.close();
    } catch {
      // Một số trình duyệt có thể chặn âm thanh cho đến lần tương tác đầu tiên.
    }
  }, [soundOn]);

  const go = useCallback((next: number) => {
    const target = Math.max(0, Math.min(slides.length - 1, next));
    if (target > slide && !canAdvance) return;
    setSlide(target);
    setTransitionKey((key) => key + 1);
  }, [slide, canAdvance]);

  const answerMCQ = (choice: number) => {
    if (current.section !== "mcq" || answerFound || currentAttempts.includes(choice)) return;
    setAttempts((previous) => ({
      ...previous,
      [current.index]: [...(previous[current.index] ?? []), choice],
    }));
    playTone(choice === quizData.mcq[current.index].ans);
  };

  const revealStatement = (statementIndex: number) => {
    if (current.section !== "tf" || revealedHere.includes(statementIndex)) return;
    setReveals((previous) => ({
      ...previous,
      [current.index]: [...(previous[current.index] ?? []), statementIndex],
    }));
    playTone(quizData.tf[current.index].statements[statementIndex].ans);
  };

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await stageRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // Toàn màn hình cần được gọi từ thao tác trực tiếp của người dùng.
    }
  }, []);

  const restart = () => {
    setAttempts({});
    setReveals({});
    setShortRevealed({});
    setSlide(0);
    setTransitionKey((key) => key + 1);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inEditable = !!target?.closest("input, textarea, select, [contenteditable='true']");
      // Không chiếm phím Space/Enter khi người dùng đang kích hoạt một nút.
      const activatingButton = !!target?.closest("button") && (event.key === " " || event.key === "Enter");
      if (inEditable || activatingButton || event.altKey || event.ctrlKey || event.metaKey) return;

      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        if (canAdvance) go(slide + 1);
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        go(slide - 1);
      } else if (event.key.toLowerCase() === "f" && !target?.closest("button")) {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    const onFullscreenChange = () => setFull(!!document.fullscreenElement);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [slide, canAdvance, go, toggleFullscreen]);

  const progress = (slide / (slides.length - 1)) * 100;
  const sectionLabel = current.section === "intro" ? "MỞ ĐẦU" : current.section === "mcq" ? "TRẮC NGHIỆM ABCD" : current.section === "tf" ? "NHẬN ĐỊNH ĐÚNG / SAI" : current.section === "short" ? "TRẢ LỜI NGẮN" : "TỔNG KẾT";

  return (
    <main className={`app-shell ${full ? "is-fullscreen" : ""}`} ref={stageRef}>
      <header className="topbar">
        <div className="brand">
          <Image src="/logo-to2.png" alt="Logo Tổ 2" width={48} height={48} priority />
          <div><b>TỔ 2 <span>·</span> ĐỊA LÍ 12</b><small>KẾT NỐI TRI THỨC VỚI CUỘC SỐNG</small></div>
        </div>
        <div className="top-actions">
          <span className="subject-label">ĐỊA HÌNH &amp; THỦY VĂN VIỆT NAM</span>
          <button className="utility-btn" onClick={() => setSoundOn((value) => !value)} aria-label="Bật hoặc tắt âm thanh">{soundOn ? "ÂM THANH: BẬT" : "ÂM THANH: TẮT"}</button>
          <button className="utility-btn" onClick={() => void toggleFullscreen()} aria-label="Bật hoặc thoát toàn màn hình">{full ? "THOÁT TOÀN MÀN HÌNH" : "TOÀN MÀN HÌNH"}</button>
        </div>
      </header>

      <div className="progress-track" aria-label="Tiến trình trình chiếu"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <section className="stage" aria-label="Khung trình chiếu">
        <div className="stage-header">
          <div><span className="section-marker" />{sectionLabel}</div>
          <span className="slide-count">{String(slide + 1).padStart(2, "0")} <i>/</i> {String(slides.length).padStart(2, "0")}</span>
        </div>

        <div className="slide-content" key={transitionKey}>
          {current.section === "intro" && (
            <div className="intro-layout">
              <div className="intro-copy">
                <p className="overline">BÀI THUYẾT TRÌNH TƯƠNG TÁC</p>
                <h1>TÔI LÀ<br /><em>LŨ LỤT.</em></h1>
                <p className="intro-lead">Tôi bắt đầu từ những cơn mưa. Địa hình, rừng đầu nguồn và cách con người chuẩn bị quyết định sức tàn phá của tôi.</p>
                <div className="intro-rule" />
                <p className="intro-description">Cùng Tổ 2 giải mã nguyên nhân lũ lụt, nhận diện nguy cơ và tìm hiểu cách chủ động phòng tránh thiên tai.</p>
                <div className="intro-stats"><div><b>10</b><span>ABCD</span></div><div><b>10</b><span>ĐÚNG / SAI</span></div><div><b>05</b><span>TRẢ LỜI NGẮN</span></div></div>
                <button className="primary-btn" onClick={() => go(1)}>BẮT ĐẦU <span>→</span></button>
              </div>
              <div className="terrain-panel" aria-label="Minh họa lũ từ vùng núi xuống hạ lưu">
                <svg viewBox="0 0 520 450" role="img" aria-label="Minh họa núi, sông và đồng bằng">
                  <defs><linearGradient id="hill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dbe9df"/><stop offset="1" stopColor="#8eb3a5"/></linearGradient><linearGradient id="water" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#69bdd8"/><stop offset="1" stopColor="#075d91"/></linearGradient></defs>
                  <g fill="none" stroke="#a5c4b8" strokeWidth="1.2" opacity=".85"><path d="M0 112 Q75 20 166 100 T348 86 T520 44"/><path d="M0 132 Q78 41 166 119 T350 104 T520 64"/><path d="M0 154 Q78 64 167 141 T352 126 T520 88"/><path d="M0 178 Q85 89 177 166 T355 151 T520 111"/><path d="M0 205 Q95 116 190 193 T365 177 T520 139"/><path d="M0 235 Q95 148 194 221 T370 205 T520 171"/></g>
                  <path d="M0 310 L72 218 119 257 202 103 269 212 324 166 408 273 465 229 520 294 520 450 0 450Z" fill="url(#hill)" stroke="#5a8e89" strokeWidth="2"/>
                  <path d="M167 169 L202 103 238 162 210 145 194 166Z M46 253 L72 218 96 239 73 235Z M292 211 L324 166 354 208 325 193Z" fill="#f9fcf5"/>
                  <path d="M214 123 C194 174 278 199 235 243 C197 284 279 311 241 350 C218 376 258 408 244 450 L316 450 C327 411 287 383 322 343 C364 295 285 271 326 226 C355 193 287 158 292 127Z" fill="url(#water)" stroke="#f0fbff" strokeWidth="5"/>
                  <path d="M230 146 C216 183 273 209 246 244 S278 309 253 349 S270 408 262 438" fill="none" stroke="#e0f7ff" strokeWidth="3" strokeDasharray="8 9"/>
                  <path d="M0 361 Q91 338 169 365 T333 364 T520 356 M0 390 Q91 367 169 394 T333 393 T520 385 M0 418 Q91 395 169 422 T333 421 T520 413" fill="none" stroke="#ecf6e8" strokeWidth="2"/>
                  <g fill="#f0c22a" stroke="#fff" strokeWidth="2"><circle cx="202" cy="105" r="7"/><circle cx="235" cy="245" r="6"/><circle cx="286" cy="378" r="6"/></g>
                </svg>
                <div className="terrain-key"><span><i className="key-rain"/> MƯA ĐẦU NGUỒN</span><span><i className="key-river"/> DÒNG CHẢY</span><span><i className="key-lowland"/> HẠ LƯU</span></div>
              </div>
            </div>
          )}

          {current.section === "mcq" && (
            <div className="question-layout">
              <aside className="question-index"><span>CÂU</span><b>{String(current.index + 1).padStart(2, "0")}</b><i /> <small>10</small></aside>
              <div className="question-main">
                <div className="question-overline">TÔI LÀ LŨ LỤT <span>/</span> CHỌN MỘT ĐÁP ÁN</div>
                <h2>{quizData.mcq[current.index].q}</h2>
                <p className="question-instruction">Bấm một phương án để kiểm tra ngay. Nếu sai, câu hỏi vẫn mở cho người tiếp theo.</p>
                <div className="options-grid">{quizData.mcq[current.index].opts.map((option, index) => {
                  const tried = currentAttempts.includes(index);
                  const correct = index === quizData.mcq[current.index].ans;
                  return <button key={index} className={`option ${tried ? (correct ? "is-correct" : "is-wrong") : ""}`} onClick={() => answerMCQ(index)} disabled={answerFound || tried}>
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span><span className="option-text">{option}</span><span className="option-result">{tried ? (correct ? "✓" : "×") : ""}</span>
                    {tried && <span className="option-status">{correct ? "ĐÚNG" : "SAI"}</span>}
                  </button>;
                })}</div>
                {currentAttempts.length > 0 && <div className={`answer-feedback ${answerFound ? "feedback-correct" : "feedback-wrong"}`} role="status">
                  <strong>{answerFound ? "✓ ĐÁP ÁN CHÍNH XÁC" : "× CHƯA ĐÚNG — MỜI NGƯỜI TIẾP THEO"}</strong>
                  <p>{answerFound ? quizData.mcq[current.index].explain : "Hãy đọc lại câu hỏi và thử một phương án khác."}</p>
                </div>}
                <div className="question-footnote"><span>{answerFound ? "ĐÃ HOÀN THÀNH CÂU HỎI" : `${currentAttempts.length}/4 phương án đã thử`}</span><span>{answerFound ? "Có thể chuyển sang câu kế tiếp" : "Đáp án chưa chọn vẫn còn mở"}</span></div>
              </div>
            </div>
          )}

          {current.section === "tf" && (
            <div className="question-layout tf-layout">
              <aside className="question-index"><span>PHẦN</span><b>{String(current.index + 1).padStart(2, "0")}</b><i /><small>10</small></aside>
              <div className="question-main">
                <div className="question-overline">TÔI LÀ LŨ LỤT <span>/</span> MỞ TỪNG NHẬN ĐỊNH</div>
                <h2>{quizData.tf[current.index].q}</h2>
                <p className="question-instruction">Thảo luận từng nhận định A–D. Bấm vào thẻ để mở đáp án Đ hoặc S cùng giải thích.</p>
                <div className="statement-grid">{quizData.tf[current.index].statements.map((statement, index) => {
                  const opened = revealedHere.includes(index);
                  return <button key={index} className={`statement-card ${opened ? (statement.ans ? "statement-correct" : "statement-wrong") : ""}`} onClick={() => revealStatement(index)} disabled={opened}>
                    <span className="statement-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="statement-content"><span className="statement-text">{statement.text}</span>{opened && <span className="statement-explanation">{statement.explain}</span>}</span>
                    <span className={`truth-mark ${opened ? "shown" : ""}`}>{opened ? (statement.ans ? "Đ" : "S") : "+"}</span>
                  </button>;
                })}</div>
                <div className="question-footnote"><span>{revealedHere.length === 4 ? "ĐÃ MỞ ĐỦ 4 NHẬN ĐỊNH" : `${revealedHere.length}/4 nhận định đã mở`}</span><span>Đ = Đúng · S = Sai</span></div>
              </div>
            </div>
          )}

          {current.section === "short" && (
            <div className="short-layout">
              <div className="short-heading"><div className="question-overline">TÔI LÀ LŨ LỤT <span>/</span> CÙNG SUY NGẪM</div><div className="short-number">0{current.index + 1}<span> / 05</span></div><h2>{quizData.shorts[current.index].q}</h2><p>Trao đổi trong tổ trước khi mở gợi ý trả lời.</p><button className="primary-btn" onClick={() => setShortRevealed((previous) => ({ ...previous, [current.index]: true }))} disabled={shortOpen}>{shortOpen ? "GỢI Ý ĐÃ MỞ" : "XEM GỢI Ý TRẢ LỜI"}<span>{shortOpen ? "✓" : "+"}</span></button></div>
              <div className="short-answer"><div className="short-answer-head">GỢI Ý THAM KHẢO <span>ĐỊA LÍ 12</span></div>{shortOpen ? <p>{quizData.shorts[current.index].ans}</p> : <div className="short-placeholder"><b>Hãy thử trả lời trước.</b><span>Gợi ý chỉ hiện khi người thuyết trình chọn mở.</span></div>}<div className="short-answer-foot">TỔ 2 <span>·</span> KẾT NỐI TRI THỨC</div></div>
            </div>
          )}

          {current.section === "summary" && (
            <div className="summary-layout"><p className="overline">KẾT THÚC BÀI THUYẾT TRÌNH</p><h1>TÔI LÀ LŨ LỤT.<br /><em>BẠN ĐÃ HIỂU TÔI HƠN.</em></h1><p className="summary-description">Thiên tai không phải lúc nào cũng có thể ngăn lại. Hiểu biết, cảnh báo sớm và hành động đúng lúc có thể giảm thiệt hại và bảo vệ sự sống.</p><div className="summary-stats"><div><b>{score}<small>/10</small></b><span>CÂU ABCD ĐÚNG</span></div><div><b>{revealedTotal}<small>/40</small></b><span>NHẬN ĐỊNH ĐÃ MỞ</span></div><div><b>05</b><span>CÂU TRẢ LỜI NGẮN</span></div></div><div className="summary-actions"><button className="primary-btn" onClick={restart}>TRÌNH CHIẾU LẠI <span>↻</span></button><button className="secondary-btn" onClick={() => go(1)}>ÔN LẠI CÂU HỎI <span>→</span></button></div><p className="closing-line">BẢO VỆ RỪNG · TÔN TRỌNG DÒNG CHẢY · CHỦ ĐỘNG TRƯỚC THIÊN TAI</p></div>
          )}
        </div>
        <div className="curtain" key={`curtain-${transitionKey}`} aria-hidden="true"><span /><span /></div>
      </section>

      <footer className="controls">
        <div className="control-label"><span className="key-hint"><kbd>←</kbd><kbd>→</kbd></span><span>{sectionLabel}</span></div>
        <div className="navigation"><button className="nav-btn" onClick={() => go(slide - 1)} disabled={slide === 0}>← <span>TRƯỚC</span></button><span className="nav-count">{String(slide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>{current.section === "summary" ? <button className="nav-btn next-btn" onClick={restart}>LÀM LẠI ↻</button> : <button className="nav-btn next-btn" onClick={() => go(slide + 1)} disabled={!canAdvance}> <span>{current.section === "intro" ? "BẮT ĐẦU" : current.section === "short" && current.index === quizData.shorts.length - 1 ? "KẾT THÚC" : "TIẾP"}</span> →</button>}</div>
      </footer>
    </main>
  );
}
