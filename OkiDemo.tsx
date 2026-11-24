import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PhoneFrame } from './PhoneFrame';
import './app.css';
import './oki.css';

/* ------------------------------------------------------------------ */
/* Anna's numbers — read from her accounts (illustrative, PLN)         */
/* ------------------------------------------------------------------ */
const ANNA = {
  name: 'Anna',
  bonus: 12000,
  balance: 80000,
  buffer: 27000,
  income: 12800,
  fixed: 5100,
  consumption: 3700,
  external: 1500,
  leftover: [2100, 2600, 2300, 2900, 2500, 14500], // Jul–Dec, Dec incl. bonus
};
const ABOVE = ANNA.balance - ANNA.buffer; // 53,000
const SPARE = ANNA.income - ANNA.fixed - ANNA.consumption - ANNA.external; // 2,500
const OKI_LIMIT = 100000;
const RETURN = 0.06;
const BELKA = 0.19;

const pln = (n: number) => `PLN ${Math.round(n).toLocaleString('en-US')}`;

type Stage =
  | 'lock'
  | 'pulse'
  | 'understand'
  | 'adjust'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'offer'
  | 'done'
  | 'advisor';

/* ------------------------------------------------------------------ */
type Turn = { id: number; who: 'me' | 'mo'; text?: ReactNode; card?: ReactNode; stage?: Stage };

export default function OkiDemo() {
  const [stage, setStage] = useState<Stage>('lock');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [lump, setLump] = useState(ABOVE);
  const [monthly, setMonthly] = useState(2000);
  const [answers, setAnswers] = useState<string[]>([]);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thinking) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    else lastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [turns, thinking]);

  function push(t: Omit<Turn, 'id'>) {
    setTurns((p) => [...p, { ...t, id: ++idRef.current }]);
  }

  type Snap = { stage: Stage; turns: Turn[]; answers: string[]; lump: number; monthly: number };
  const undo = useRef<Snap[]>([]);
  const redo = useRef<Snap[]>([]);
  const snap = (): Snap => ({ stage, turns, answers, lump, monthly });
  function restore(x: Snap) {
    setStage(x.stage);
    setTurns(x.turns);
    setAnswers(x.answers);
    setLump(x.lump);
    setMonthly(x.monthly);
  }
  /** Every step the customer takes is undoable with the arrow keys. */
  function record() {
    undo.current.push(snap());
    redo.current = [];
  }

  function customer(text: string, next: () => void) {
    record();
    push({ who: 'me', text });
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      next();
    }, 900);
  }

  function go(s: Stage) {
    setStage(s);
    push({ who: 'mo', stage: s });
  }

  function restart() {
    undo.current = [];
    redo.current = [];
    setTurns([]);
    setStage('lock');
    setLump(ABOVE);
    setMonthly(2000);
    setAnswers([]);
  }

  function openFromNotification() {
    record();
    setThinking(true);
    setStage('pulse');
    setTimeout(() => {
      setThinking(false);
      push({ who: 'mo', stage: 'pulse' });
    }, 700);
  }

  /* ---- Keyboard: → / Space / Enter forward, ← back ---- */
  function answer(label: string, next: Stage) {
    setAnswers((a) => [...a, label]);
    customer(label, () => go(next));
  }
  function forward() {
    if (thinking) return;
    const r = redo.current.pop();
    if (r) {
      undo.current.push(snap());
      restore(r);
      return;
    }
    switch (stage) {
      case 'lock': return openFromNotification();
      case 'pulse': return customer('Show me what I could do', () => go('understand'));
      case 'understand': return customer('Set up my OKI', () => go('adjust'));
      case 'adjust': return customer('Continue', () => go('q1'));
      case 'q1': return answer('3 to 10 years', 'q2');
      case 'q2': return answer('Wait it out', 'q3');
      case 'q3': return answer('Yes, for more than a year', 'offer');
      case 'offer': return customer('Open and invest', () => go('done'));
    }
  }
  function back() {
    if (thinking) return;
    const u = undo.current.pop();
    if (!u) return;
    redo.current.push(snap());
    restore(u);
  }
  const keys = useRef({ forward, back });
  keys.current = { forward, back };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
        keys.current.forward();
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        keys.current.back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const live = turns.filter((t) => t.who === 'mo').at(-1)?.id;
  const yearly = Math.min(OKI_LIMIT, lump + monthly * 12) * RETURN * BELKA;
  const full = OKI_LIMIT * RETURN * BELKA;

  function advisor() {
    customer('Talk to an advisor', () => go('advisor'));
  }

  function render(t: Turn): ReactNode {
    const stale = t.id !== live;
    switch (t.stage) {
      case 'pulse':
        return (
          <>
            <div className="bubble-advisor">
              Your bonus just landed: <b>{pln(ANNA.bonus)}</b>. Before it disappears into everyday
              spending, here is where you stand.
            </div>
            <div className="card">
              <h2>{pln(ABOVE)} is sitting above your buffer.</h2>
              <p className="lede">
                Your buffer stays untouched: <span className="marker">three months of costs</span>,
                kept for anything unexpected.
              </p>
              <dl className="terms">
                <div className="terms-row"><dt>Salary account</dt><dd>{pln(ANNA.balance)}</dd></div>
                <div className="terms-row"><dt>Buffer, 3 months of costs</dt><dd>−{pln(ANNA.buffer)}</dd></div>
                <div className="terms-row emphasis"><dt>Above your buffer</dt><dd>{pln(ABOVE)}</dd></div>
              </dl>
              <div className="ok-chart">
                <p className="ok-chart-t">Left over each month</p>
                <div className="ok-bars">
                  {ANNA.leftover.map((v, i) => (
                    <span key={i} className={i === 5 ? 'hi' : ''} style={{ height: `${Math.max(8, (v / 14500) * 100)}%` }} />
                  ))}
                </div>
                <div className="ok-months">
                  {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>
            {!stale && (
              <div className="suggestions">
                <button className="suggestion" onClick={() => customer('Show me what I could do', () => go('understand'))}>
                  <span className="arrow">→</span>Show me what I could do
                </button>
                <button className="suggestion" onClick={() => customer('Not now', () => push({ who: 'mo', text: 'No problem. I will remind you before OKI opens on 1 January.' }))}>
                  <span className="arrow">→</span>Not now
                </button>
              </div>
            )}
          </>
        );
      case 'understand':
        return (
          <>
            <div className="bubble-advisor">
              You are already an investor: <b>{pln(ANNA.external)} a month</b> goes to an external
              platform. From 1 January, OKI lets up to {pln(OKI_LIMIT)} grow free of the 19% Belka tax.
            </div>
            <div className="card">
              <h2>Your month, read from your accounts.</h2>
              <dl className="terms">
                <div className="terms-row"><dt>Income after tax</dt><dd>{pln(ANNA.income)}</dd></div>
                <div className="terms-row"><dt>Fixed costs</dt><dd>−{pln(ANNA.fixed)}</dd></div>
                <div className="terms-row"><dt>Everyday spending</dt><dd>−{pln(ANNA.consumption)}</dd></div>
                <div className="terms-row"><dt>Investing elsewhere</dt><dd>−{pln(ANNA.external)}</dd></div>
                <div className="terms-row emphasis"><dt>Still left each month</dt><dd>{pln(SPARE)}</dd></div>
              </dl>
              <ul className="assumptions">
                <li>Room for {pln(2000)} more a month, and still {pln(SPARE - 2000)} to spare.</li>
                <li>Categorised from 13 months of transactions.</li>
              </ul>
            </div>
            {!stale && (
              <div className="suggestions">
                <button className="suggestion" onClick={() => customer('Set up my OKI', () => go('adjust'))}>
                  <span className="arrow">→</span>Set up my OKI
                </button>
                <button className="suggestion" onClick={advisor}><span className="arrow">→</span>Talk to an advisor</button>
              </div>
            )}
          </>
        );
      case 'adjust':
        return (
          <div className="card">
            <h2>Your OKI, your numbers.</h2>
            <p className="lede">Choose what moves now, and what moves every payday.</p>
            <Pills label="Move now" value={lump} set={setLump} disabled={stale} options={[[0, 'Nothing'], [30000, pln(30000)], [ABOVE, pln(ABOVE)]]} />
            <Pills label="Every payday" value={monthly} set={setMonthly} disabled={stale} options={[[1500, pln(1500)], [2000, pln(2000)], [2500, pln(2500)]]} />
            {monthly > SPARE - 500 && <p className="ok-warn">This leaves {pln(SPARE - monthly)} spare each month.</p>}
            <div className="adj-preview">
              <div className="adj-preview-text">
                <span className="adj-preview-label">Belka tax saved per year</span>
                <span className="adj-preview-sub">At 6% a year · {pln(full)} once OKI is full</span>
              </div>
              <span className="adj-preview-value">≈ {pln(yearly)}</span>
            </div>
            {!stale && (
              <div className="actions">
                <button className="btn btn-primary" onClick={() => customer('Continue', () => go('q1'))}>Continue</button>
                <button className="btn btn-secondary" onClick={advisor}>Talk to an advisor</button>
              </div>
            )}
          </div>
        );
      case 'q1':
      case 'q2':
      case 'q3': {
        const q = QUESTIONS[t.stage];
        return (
          <>
            {t.stage === 'q1' && <div className="bubble-advisor">Three quick questions, so the investment fits you.</div>}
            <div className="card">
              <p className="ok-step">Suitability · {t.stage.slice(1)} of 3</p>
              <h2 className="question-headline">{q.h}</h2>
              {q.body && <p className="lede">{q.body}</p>}
              <div className="choices">
                {q.o.map(([label, detail]) => (
                  <button key={label} className="choice" disabled={stale} onClick={() => answer(label, q.next)}>
                    <span className="choice-label">{label}</span>
                    {detail && <span className="choice-detail">{detail}</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      }
      case 'offer':
        return (
          <>
            <div className="bubble-advisor">That gives you a <b>balanced</b> profile. Here is your OKI, ready to open.</div>
            <div className="card">
              <h2>Your OKI, ready to open.</h2>
              <p className="lede">
                Tax-free from 2 January, and about <span className="marker">{pln(yearly)} a year</span> kept from Belka tax.
              </p>
              <dl className="terms">
                <div className="terms-row"><dt>Account</dt><dd>OKI, tax-free</dd></div>
                <div className="terms-row"><dt>Moves on 2 January</dt><dd>{pln(lump)}</dd></div>
                <div className="terms-row"><dt>Every payday</dt><dd>{pln(monthly)}</dd></div>
                <div className="terms-row"><dt>Portfolio</dt><dd>Balanced</dd></div>
                <div className="terms-row emphasis"><dt>Tax saved per year</dt><dd>≈ {pln(yearly)}</dd></div>
              </dl>
              <ul className="assumptions">
                <li>6% a year is an example, not a promise. Investments can fall in value.</li>
                <li>Key information document and fees attached before you sign.</li>
              </ul>
              <p className="binding">Suitability checked today · {answers.length} answers saved</p>
              {!stale && (
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => customer('Open and invest', () => go('done'))}>Open and invest</button>
                  <button className="btn btn-secondary" onClick={advisor}>Talk to an advisor</button>
                </div>
              )}
            </div>
          </>
        );
      case 'done':
        return (
          <>
            <div className="card ok-done">
              <p className="ok-check">✓</p>
              <h2>Done. Your OKI is open.</h2>
              <ul className="ok-list">
                <li>OKI account opened in your name</li>
                <li>{pln(lump)} invested from 2 January</li>
                <li>{pln(monthly)} moves every payday</li>
                <li>Confirmation and documents in your inbox</li>
              </ul>
            </div>
            {!stale && (
              <div className="suggestions">
                <button className="suggestion" onClick={advisor}><span className="arrow">→</span>Talk to an advisor</button>
                <button className="suggestion" onClick={restart}><span className="arrow">→</span>Start the demo again</button>
              </div>
            )}
          </>
        );
      case 'advisor':
        return (
          <>
            <div className="bubble-advisor">
              Booked. <b>Marta</b>, your investment advisor, calls you tomorrow at 10:00. She sees
              exactly what you have seen here, so you will not have to start over.
            </div>
            {!stale && (
              <div className="suggestions">
                <button className="suggestion" onClick={restart}><span className="arrow">→</span>Start the demo again</button>
              </div>
            )}
          </>
        );
      default:
        return t.text ? <div className="bubble-advisor">{t.text}</div> : null;
    }
  }

  const lastId = turns.at(-1)?.id;

  return (
    <div className="ok-wrap">

      <PhoneFrame>
        {stage === 'lock' ? (
          <div className="ok-lock">
            <p className="ok-lock-date">Tuesday 15 December</p>
            <p className="ok-lock-time">9:41</p>
            <button className="ok-notif" onClick={openFromNotification}>
              <span className="ok-notif-app"><i />YOUR BANK<em>now</em></span>
              <span className="ok-notif-t">Your bonus just landed</span>
              <span className="ok-notif-b">Want it to work tax-free from January? Tap to see your options.</span>
            </button>
            <p className="ok-lock-hint">Tap the notification</p>
          </div>
        ) : (
          <>
            <header className="header">
              <h1>Mo</h1>
              <span className="grounding">Accounts read 07:14</span>
            </header>
            <div className="transcript">
              {turns.map((t) =>
                t.who === 'me' ? (
                  <div className="bubble-customer" key={t.id} ref={t.id === lastId ? lastRef : undefined}>{t.text}</div>
                ) : (
                  <div className="turn" key={t.id} ref={t.id === lastId ? lastRef : undefined}>{render(t)}</div>
                ),
              )}
              {thinking && <div className="thinking"><i /><i /><i /></div>}
              <div ref={endRef} />
            </div>
            <form className="composer" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Type it like you'd say it" aria-label="Message the advisor" disabled />
              <button className="send" type="submit" disabled>Send</button>
            </form>
          </>
        )}
      </PhoneFrame>
    </div>
  );
}

function Pills({ label, value, set, options, disabled }: {
  label: string; value: number; set: (v: number) => void; options: [number, string][]; disabled: boolean;
}) {
  return (
    <div className="adj-field">
      <div className="adj-head"><span className="adj-label">{label}</span></div>
      <div className="adj-pills">
        {options.map(([v, l]) => (
          <button key={v} type="button" className={`adj-pill ${v === value ? 'on' : ''}`} disabled={disabled} onClick={() => set(v)}>{l}</button>
        ))}
      </div>
    </div>
  );
}

const QUESTIONS: Record<'q1' | 'q2' | 'q3', { h: string; body?: string; o: [string, string?][]; next: Stage }> = {
  q1: {
    h: 'How long can this money stay invested?',
    o: [['Less than 3 years'], ['3 to 10 years', 'Most people choose this'], ['More than 10 years']],
    next: 'q2',
  },
  q2: {
    h: 'If it fell 15% in a month, what would you do?',
    o: [['Sell, to stop the loss'], ['Wait it out'], ['Invest a little more']],
    next: 'q3',
  },
  q3: {
    h: 'You invest every month already. Is that right?',
    body: 'We can see PLN 1,500 going to an investment platform each month.',
    o: [['Yes, for more than a year'], ['Yes, I started recently'], ['No, that is something else']],
    next: 'offer',
  },
};
