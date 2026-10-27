 "use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { quizData } from "./questions";

type Section = "intro" | "mcq" | "tf" | "short" | "summary";
type AnswerState = { chosen: number | boolean | null; checked: boolean };
const allSlides = [
  { section: "intro" as Section, index: 0, title: "Mở đầu" },
  ...quizData.mcq.map((_, index) => ({ section: "mcq" as Section, index, title: `Trắc nghiệm ${index+1}` })),
  ...quizData.tf.map((_, index) => ({ section: "tf" as Section, index, title: `Đúng / Sai ${index+1}` })),
  ...quizData.shorts.map((_, index) => ({ section: "short" as Section, index, title: `Trả lời ngắn ${index+1}` })),
  { section: "summary" as Section, index: 0, title: "Tổng kết" },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [soundOn, setSoundOn] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [shortRevealed, setShortRevealed] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  const current = allSlides[slide];
  const key = `${current.section}-${current.index}`;
  const state = answers[key] || { chosen: null, checked: false };
  const score = useMemo(() => {
    let total = 0;
    Object.entries(answers).forEach(([k, v]) => {
      if (!v.checked) return;
      if (k.startsWith("mcq-")) {
        const i = Number(k.split("-")[1]); if (v.chosen === quizData.mcq[i].ans) total++;
      } else if (k.startsWith("tf-")) {
        const i = Number(k.split("-")[1]); if (v.chosen === quizData.tf[i].ans) total++;
      }
    });
    return total;
  }, [answers]);

  const tone = useCallback((correct: boolean) => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = correct ? 880 : 220;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (correct ? 0.24 : 0.38));
      osc.start(); osc.stop(ctx.currentTime + (correct ? 0.25 : 0.4));
      osc.onended = () => ctx.close();
    } catch {}
  }, [soundOn]);

  const go = useCallback((next: number) => {
    setSlide(Math.max(0, Math.min(allSlides.length - 1, next)));
    setShowAnswer(false); setShortRevealed(false);
  }, []);
  const setChoice = (choice: number | boolean) => {
    if (state.checked) return;
    setAnswers(prev => ({ ...prev, [key]: { chosen: choice, checked: false } }));
  };
  const check = () => {
    if (current.section !== "mcq" && current.section !== "tf") return;
    if (state.chosen === null) return;
    const correct = current.section === "mcq"
      ? state.chosen === quizData.mcq[current.index].ans
      : state.chosen === quizData.tf[current.index].ans;
    setAnswers(prev => ({ ...prev, [key]: { chosen: state.chosen, checked: true } }));
    setShowAnswer(true); tone(correct);
  };
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) { await stageRef.current?.requestFullscreen(); setFullscreen(true); }
      else { await document.exitFullscreen(); setFullscreen(false); }
    } catch {}
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(slide + 1); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(slide - 1); }
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      if (e.key === "Escape") setFullscreen(false);
    };
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    window.addEventListener("keydown", onKey); document.addEventListener("fullscreenchange", onFs);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFs); };
  }, [slide, go]);
  const progress = slide / (allSlides.length - 1) * 100;

  return <main className="app-shell" ref={stageRef as any}>
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar">
      <div className="brand"><Image src="/logo-to2.png" alt="Logo Tổ 2" width={54} height={54} priority/><div><b>TỔ 2 <span>•</span> ĐỊA LÍ 12</b><small>KẾT NỐI TRI THỨC VỚI CUỘC SỐNG</small></div></div>
      <div className="top-actions"><span className="live-pill"><i/> TRÌNH CHIẾU</span><button className="icon-btn" onClick={() => setSoundOn(!soundOn)} title="Bật/tắt âm thanh" aria-label="Bật/tắt âm thanh">{soundOn ? "♫" : "♩"}<span>Âm thanh {soundOn ? "bật" : "tắt"}</span></button><button className="icon-btn fullscreen-btn" onClick={toggleFullscreen} title="Toàn màn hình">⛶<span>{fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}</span></button></div>
    </header>
    <div className="progress-track"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
    <section className="stage">
      <div className="slide-meta"><span className="eyebrow">{current.section === "intro" ? "BÀI THUYẾT TRÌNH" : current.section === "mcq" ? "PHẦN 01 / TRẮC NGHIỆM" : current.section === "tf" ? "PHẦN 02 / ĐÚNG – SAI" : current.section === "short" ? "PHẦN 03 / TRẢ LỜI NGẮN" : "HOÀN THÀNH"}</span><span className="slide-count">{String(slide+1).padStart(2,"0")} <i>/</i> {String(allSlides.length).padStart(2,"0")}</span></div>

      {current.section === "intro" && <div className="intro-layout">
        <div className="intro-copy"><div className="chapter-tag"><span/> ĐỊA LÍ TỰ NHIÊN VIỆT NAM</div><h1>LŨ LỤT<br/><em>& LŨ QUÉT</em></h1><p className="intro-sub">Hiểu nguyên nhân · Nhận diện rủi ro · Chủ động phòng tránh</p><div className="intro-line"/><p className="intro-desc">Bộ câu hỏi tương tác giúp hệ thống kiến thức về thiên tai, bảo vệ rừng và phát triển bền vững.</p><div className="stats"><div><b>10</b><span>TRẮC NGHIỆM</span></div><div><b>10</b><span>ĐÚNG / SAI</span></div><div><b>05</b><span>TRẢ LỜI NGẮN</span></div></div><button className="primary-btn" onClick={() => go(1)}>BẮT ĐẦU THỬ THÁCH <span>→</span></button></div>
        <div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="hero-logo"><Image src="/logo-to2.png" alt="Biểu trưng Tổ 2" width={260} height={260} priority/></div><div className="float-note note-top"><span>01</span><div><b>NHẬN BIẾT</b><small>Hiểu đúng hiện tượng</small></div></div><div className="float-note note-bottom"><span>02</span><div><b>VẬN DỤNG</b><small>Phân tích tình huống</small></div></div><div className="crosshair cross-one">✳</div><div className="crosshair cross-two">✳</div></div>
      </div>}

      {current.section === "mcq" && <div className="question-layout">
        <div className="question-number"><span>CÂU HỎI</span><b>{String(current.index+1).padStart(2,"0")}</b><div className="number-line"/></div>
        <div className="question-main"><h2>{quizData.mcq[current.index].q}</h2><div className="options-grid">{quizData.mcq[current.index].opts.map((opt, i) => {
          const selected = state.chosen === i; const correct = i === quizData.mcq[current.index].ans;
          const cls = state.checked && correct ? "option correct" : state.checked && selected && !correct ? "option wrong" : selected ? "option selected" : "option";
          return <button key={i} className={cls} onClick={() => setChoice(i)} disabled={state.checked}><span className="option-letter">{String.fromCharCode(65+i)}</span><span className="option-text">{opt}</span><span className="option-mark">{state.checked && correct ? "✓" : state.checked && selected ? "×" : selected ? "●" : ""}</span></button>
        })}</div>
        {state.checked && <div className={`feedback ${state.chosen === quizData.mcq[current.index].ans ? "feedback-good":"feedback-bad"}`}><b>{state.chosen === quizData.mcq[current.index].ans ? "✓ Chính xác!" : "✕ Chưa chính xác"}</b><span>Đáp án: {String.fromCharCode(65+quizData.mcq[current.index].ans)}.</span><p>{quizData.mcq[current.index].explain}</p></div>}
        <div className="question-actions">{!state.checked ? <button className="primary-btn" onClick={check} disabled={state.chosen === null}>KIỂM TRA ĐÁP ÁN <span>✓</span></button> : <button className="primary-btn" onClick={() => go(slide+1)}>CÂU TIẾP THEO <span>→</span></button>}<span className="hint">Chọn một phương án phù hợp nhất</span></div></div>
      </div>}

      {current.section === "tf" && <div className="question-layout tf-layout">
        <div className="question-number"><span>NHẬN ĐỊNH</span><b>{String(current.index+1).padStart(2,"0")}</b><div className="number-line"/></div>
        <div className="question-main"><div className="type-chip">ĐÚNG HAY SAI?</div><h2>{quizData.tf[current.index].q}</h2><div className="tf-options">
          {[true,false].map((v) => { const selected = state.chosen === v; const correct = v === quizData.tf[current.index].ans; const cls = state.checked && correct ? "tf-option correct" : state.checked && selected ? "tf-option wrong" : selected ? "tf-option selected" : "tf-option"; return <button key={String(v)} className={cls} onClick={() => setChoice(v)} disabled={state.checked}><span className="tf-symbol">{v ? "✓" : "×"}</span><span>{v ? "ĐÚNG" : "SAI"}</span>{state.checked && correct && <b className="tf-result">ĐÁP ÁN ĐÚNG</b>}{state.checked && selected && !correct && <b className="tf-result">BẠN ĐÃ CHỌN</b>}</button>})}
        </div>
        {state.checked && <div className={`feedback ${state.chosen === quizData.tf[current.index].ans ? "feedback-good":"feedback-bad"}`}><b>{state.chosen === quizData.tf[current.index].ans ? "✓ Chính xác!" : "✕ Chưa chính xác"}</b><p>{quizData.tf[current.index].explain}</p></div>}
        <div className="question-actions">{!state.checked ? <button className="primary-btn" onClick={check} disabled={state.chosen === null}>XÁC NHẬN <span>✓</span></button> : <button className="primary-btn" onClick={() => go(slide+1)}>NHẬN ĐỊNH TIẾP <span>→</span></button>}<span className="hint">Đọc kỹ nhận định trước khi chọn</span></div></div>
      </div>}

      {current.section === "short" && <div className="short-layout"><div className="short-heading"><span className="eyebrow">CÂU HỎI MỞ</span><div className="short-index">0{current.index+1}<span>/ 05</span></div><h2>{quizData.shorts[current.index].q}</h2><p>Hãy cùng suy nghĩ và trao đổi trước khi xem gợi ý trả lời.</p><button className="primary-btn" onClick={() => setShortRevealed(!shortRevealed)}>{shortRevealed ? "ẨN GỢI Ý" : "HIỆN GỢI Ý TRẢ LỜI"} <span>{shortRevealed ? "−" : "+"}</span></button></div><div className={`answer-card ${shortRevealed ? "revealed" : ""}`}><div className="answer-card-top"><span>GỢI Ý THAM KHẢO</span><span>✳</span></div>{shortRevealed ? <p>{quizData.shorts[current.index].ans}</p> : <div className="answer-placeholder"><div className="lock-mark">?</div><b>Bạn nghĩ đáp án là gì?</b><small>Bấm “Hiện gợi ý trả lời” sau khi thảo luận</small></div>}<div className="answer-card-bottom"><span>ĐỊA LÍ 12</span><span>TỔ 2</span></div></div><div className="short-next"><button className="primary-btn" onClick={() => go(slide+1)}>{current.index === 4 ? "XEM TỔNG KẾT" : "CÂU TIẾP THEO"} <span>→</span></button></div></div>}

      {current.section === "summary" && <div className="summary-layout"><div className="summary-icon">✦</div><span className="eyebrow">THỬ THÁCH HOÀN TẤT</span><h1>RẤT TỐT!<br/><em>HÃY CÙNG BẢO VỆ RỪNG.</em></h1><p className="summary-desc">Mỗi hiểu biết đúng hôm nay là một bước chuẩn bị tốt hơn trước thiên tai ngày mai.</p><div className="score-panel"><div><b>{score}<small>/20</small></b><span>ĐIỂM CÂU ĐÓNG</span></div><div><b>{Object.values(answers).filter(a=>a.checked).length}<small>/20</small></b><span>ĐÃ TRẢ LỜI</span></div><div><b>25</b><span>TỔNG SỐ CÂU</span></div></div><button className="primary-btn" onClick={() => {setAnswers({});go(0)}}>TRÌNH CHIẾU LẠI <span>↻</span></button></div>}
    </section>
    <footer className="controls">
      <div className="control-left"><span className="key-hint"><kbd>←</kbd><kbd>→</kbd> DI CHUYỂN</span><span className="control-divider"/><span className="control-section">{current.section === "intro" ? "GIỚI THIỆU" : current.section === "mcq" ? "TRẮC NGHIỆM" : current.section === "tf" ? "ĐÚNG / SAI" : current.section === "short" ? "TRẢ LỜI NGẮN" : "TỔNG KẾT"}</span></div>
      <div className="slide-dots">{allSlides.map((s,i) => <button key={i} aria-label={`Đến slide ${i+1}`} title={s.title} className={`${i===slide?"active":""} ${s.section!==current.section?"muted":""}`} onClick={() => go(i)}/>)}</div>
      <div className="control-right"><button className="nav-btn" onClick={() => go(slide-1)} disabled={slide===0} aria-label="Slide trước">← <span>TRƯỚC</span></button><span className="control-divider"/><button className="nav-btn next-nav" onClick={() => go(slide+1)} disabled={slide===allSlides.length-1} aria-label="Slide tiếp theo"><span>TIẾP</span> →</button></div>
    </footer>
    <div className="copyright">TỔ 2 <span>✦</span> ĐỊA LÍ 12 KNTT</div>
  </main>;
}
