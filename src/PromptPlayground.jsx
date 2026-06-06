import { useState, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────
const BG = "#07090F";
const SRF = "#0D1120";
const CARD = "#121B2E";
const BDR = "#1A2840";
const P = "#7C3AED";
const C = "#0891B2";
const G = "#059669";
const R = "#DC2626";
const TEXT = "#E2E8F0";
const MUT = "#64748B";

// ── API call helper ────────────────────────────────────────────────────────
async function callClaude(userMsg, systemMsg = null, maxTokens = 800) {
  const body = {
    model: "anthropic/claude-sonnet-4-5",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: userMsg }],
  };
  if (systemMsg) body.system = systemMsg;
  const res = await fetch("/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

// ── Shared UI ─────────────────────────────────────────────────────────────
const Spinner = () => (
  <span style={{ display: "inline-block", width: 12, height: 12, border: `2px solid ${P}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
);

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <button onClick={copy} style={{ padding: "2px 10px", borderRadius: 3, border: `1px solid ${BDR}`, background: "transparent", color: copied ? "#34D399" : MUT, fontSize: 9, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>
      {copied ? "COPIED" : "COPY"}
    </button>
  );
};

const Tag = ({ children, color = P }) => (
  <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 3, border: `1px solid ${color}44`, background: `${color}18`, color, fontSize: 9, fontWeight: 700, letterSpacing: 1.2 }}>{children}</span>
);

// ── ════════════════════════════════════════════════════════════════════════
//    TAB 1 — Prompt Patterns Lab
// ══════════════════════════════════════════════════════════════════════════

const SCENARIOS = [
  {
    id: "explain",
    label: "📖 Explain Concept",
    badLabel: "Zero-shot (no context)",
    goodLabel: "Engineered (role + format + rules)",
    bad: "What is RAG?",
    good: `You are a senior software engineer writing documentation for a teammate who knows Python but is new to LLMs.

Explain RAG (Retrieval-Augmented Generation) using this structure:
1. ONE-LINE definition (≤ 20 words)
2. PROBLEM it solves (1-2 sentences)
3. HOW it works (3 numbered steps)
4. WHEN to use RAG vs fine-tuning (1 sentence comparison)
5. Pseudocode skeleton (5-7 lines, Python style)

Rules: Be specific. No marketing language. No "Great question!".`,
  },
  {
    id: "codereview",
    label: "🔍 Code Review",
    badLabel: "Vague ask",
    goodLabel: "Structured JSON output",
    bad: `Review this Python code:

def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return result[0]`,
    good: `You are a senior security engineer reviewing Python for production use.

Code:
\`\`\`python
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return result[0]
\`\`\`

Return ONLY a JSON object — no preamble, no explanation outside the JSON:
{
  "issues": [{"type":"security|reliability|style","severity":"critical|high|medium|low","line":N,"problem":"string","fix":"corrected code"}],
  "overall_risk": "critical|high|medium|low",
  "summary": "one sentence"
}`,
  },
  {
    id: "summarize",
    label: "📝 Summarize",
    badLabel: "Dump and hope",
    goodLabel: "Constrained format + audience",
    bad: `Summarize this: LangChain v0.3 introduces LangGraph for stateful multi-actor applications. Breaking changes to the chains interface. New LCEL for composing chains. 40% reduction in cold-start time. Better streaming support. New memory abstractions.`,
    good: `You are a technical writer for a developer newsletter. Your audience is busy senior engineers who skim.

Summarize this changelog for them:
"LangChain v0.3 introduces LangGraph for stateful multi-actor applications. Breaking changes to the chains interface. New LCEL for composing chains. 40% reduction in cold-start time. Better streaming support. New memory abstractions."

Format (follow exactly):
**TL;DR**: <one sentence, max 18 words>
**What changed**: <3 bullet points, start each with a past-tense verb>
**Migration needed**: yes/no — <one sentence why>
**Priority**: High/Medium/Low

No filler. No "This update...". Start with the TL;DR.`,
  },
];

function PromptLab() {
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [badOut, setBadOut] = useState(null);
  const [goodOut, setGoodOut] = useState(null);
  const [err, setErr] = useState(null);
  const sc = SCENARIOS[idx];

  const runBoth = async () => {
    setRunning(true); setBadOut(null); setGoodOut(null); setErr(null);
    try {
      const [b, g] = await Promise.all([callClaude(sc.bad), callClaude(sc.good)]);
      setBadOut(b); setGoodOut(g);
    } catch (e) { setErr(e.message); }
    setRunning(false);
  };

  const Panel = ({ title, prompt, output, accent, label }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "7px 12px", background: `${accent}22`, border: `1px solid ${accent}44`, borderBottom: "none", borderRadius: "6px 6px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>{title}</span>
        <Tag color={accent}>{label}</Tag>
      </div>
      <div style={{ padding: "10px 12px", background: SRF, border: `1px solid ${accent}33`, borderBottom: "none", minHeight: 90, maxHeight: 140, overflowY: "auto" }}>
        <pre style={{ margin: 0, fontSize: 10, color: MUT, whiteSpace: "pre-wrap", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>{prompt}</pre>
      </div>
      <div style={{ padding: "10px 12px", background: CARD, border: `1px solid ${accent}33`, borderRadius: "0 0 6px 6px", minHeight: 80 }}>
        {running && !output && <div style={{ display: "flex", gap: 6, alignItems: "center", color: MUT, fontSize: 11 }}><Spinner /> Running...</div>}
        {output && <pre style={{ margin: 0, fontSize: 11, color: TEXT, whiteSpace: "pre-wrap", lineHeight: 1.65, fontFamily: "inherit" }}>{output}</pre>}
        {!running && !output && <div style={{ color: MUT, fontSize: 11 }}>Output will appear here</div>}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: MUT, marginBottom: 10 }}>Pick a scenario. Same task, same model. Watch how the prompt changes everything.</div>
        <div style={{ display: "flex", gap: 6 }}>
          {SCENARIOS.map((s, i) => (
            <button key={s.id} onClick={() => { setIdx(i); setBadOut(null); setGoodOut(null); }}
              style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${idx === i ? P : BDR}`, background: idx === i ? `${P}22` : "transparent", color: idx === i ? "#C084FC" : MUT, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: idx === i ? 700 : 400 }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <Panel title="❌ Basic Prompt" prompt={sc.bad} output={badOut} accent={R} label={sc.badLabel} />
        <Panel title="✅ Engineered Prompt" prompt={sc.good} output={goodOut} accent={G} label={sc.goodLabel} />
      </div>

      {err && <div style={{ padding: "8px 12px", borderRadius: 5, background: "#1F0808", border: `1px solid ${R}66`, color: "#FCA5A5", fontSize: 11, marginBottom: 10 }}>API error: {err}</div>}

      <button onClick={runBoth} disabled={running}
        style={{ width: "100%", padding: 10, borderRadius: 6, border: "none", background: running ? SRF : `linear-gradient(135deg, ${P}, ${C})`, color: running ? MUT : TEXT, fontSize: 13, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {running ? "⟳ Calling API × 2..." : "▶ Run Comparison"}
      </button>

      <div style={{ marginTop: 14, padding: "10px 14px", background: SRF, borderRadius: 6, border: `1px solid ${BDR}` }}>
        <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>KEY DIFFERENCES</div>
        {[
          ["Role assignment", "Tell it WHO it is before telling it WHAT to do"],
          ["Format instructions", "Specify the exact output structure — headers, bullets, JSON schema"],
          ["Negative rules", '"No filler phrases" is often more effective than positive instructions'],
          ["Constraints", "Word limits, bullet counts, field names — specificity forces quality"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 10, marginBottom: 5, fontSize: 11 }}>
            <span style={{ color: "#C084FC", minWidth: 120, fontWeight: 600 }}>{k}</span>
            <span style={{ color: TEXT }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ════════════════════════════════════════════════════════════════════════
//    TAB 2 — Structured Output Extractor
// ══════════════════════════════════════════════════════════════════════════

const SCHEMAS = [
  {
    id: "meeting",
    label: "📋 Meeting Notes",
    sample: "Quick sync: Sarah said the API migration is blocked waiting on DevOps to provision the new RDS instance, ETA Friday. James confirmed the frontend refactor is 80% done but found a React 18 breaking change in the routing library. We agreed to push the staging release to next Tuesday. Action items: James to open a GitHub issue for the routing fix by EOD, Sarah to follow up with DevOps by Wednesday, Mark to update the project timeline in Notion.",
    system: `Extract structured data from meeting notes. Return ONLY valid JSON — no markdown fences, no explanation:
{"summary":"string (max 20 words)","attendees_mentioned":["string"],"blockers":[{"owner":"string","description":"string"}],"decisions":["string"],"action_items":[{"owner":"string","task":"string","deadline":"string or null"}]}`,
  },
  {
    id: "bug",
    label: "🐛 Bug Report",
    sample: "App crashes when uploading files over 50MB on mobile web. Reproducible 100% of the time on iOS Safari 17 and Chrome Android. First reported by 3 enterprise customers yesterday. Error says 'Network request failed' but server logs show 413 Payload Too Large. The backend nginx limit is 10MB but the frontend only validates at 100MB. High priority — blocks our enterprise launch next week.",
    system: `Extract a structured bug report. Return ONLY valid JSON — no markdown fences, no explanation:
{"title":"string","severity":"critical|high|medium|low","affected_platforms":["string"],"reproducibility":"always|sometimes|rarely","root_cause":"string","affected_users":"string","priority":"p0|p1|p2|p3","suggested_fix":"string"}`,
  },
  {
    id: "contact",
    label: "👤 Lead / Contact",
    sample: "Reached out to Dr. Amina Okafor, VP of Engineering at PayStack Nigeria, based in Lagos. Email: amina.okafor@paystack.ng. LinkedIn: linkedin.com/in/aminaokafor. 12 years in fintech, previously at Interswitch. Interested in our enterprise API plan, budget around $50k/year. Best time to call: Tuesdays and Thursdays 2–4pm WAT. Her team of 35 engineers is struggling with API rate limiting.",
    system: `Extract CRM contact/lead info. Return ONLY valid JSON — no markdown fences, no explanation:
{"full_name":"string","title":"string","company":"string","location":"string","email":"string or null","linkedin":"string or null","years_experience":"number or null","budget_estimate":"string or null","pain_point":"string","best_contact_time":"string or null","lead_score":"hot|warm|cold"}`,
  },
];

function tryFormatJson(text) {
  try {
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.stringify(JSON.parse(clean), null, 2);
  } catch { return text; }
}

function JsonLine({ line }) {
  const keyMatch = line.match(/^(\s*)"([^"]+)":/);
  const strMatch = line.match(/:\s*"([^"]*)"/);
  const numMatch = line.match(/:\s*(\d+\.?\d*),?$/);
  const nullMatch = line.match(/:\s*(null|true|false),?$/);

  if (keyMatch) {
    const indent = keyMatch[1];
    const key = keyMatch[2];
    const rest = line.slice(keyMatch[0].length);
    return (
      <div style={{ fontFamily: "monospace" }}>
        <span style={{ color: MUT }}>{indent}</span>
        <span style={{ color: "#93C5FD" }}>"{key}"</span>
        <span style={{ color: MUT }}>:</span>
        {strMatch ? <span style={{ color: "#86EFAC" }}>{rest}</span>
          : numMatch ? <span style={{ color: "#FCD34D" }}>{rest}</span>
          : nullMatch ? <span style={{ color: "#F87171" }}>{rest}</span>
          : <span style={{ color: TEXT }}>{rest}</span>}
      </div>
    );
  }
  return <div style={{ fontFamily: "monospace", color: MUT }}>{line}</div>;
}

function StructuredOutput() {
  const [schemaIdx, setSchemaIdx] = useState(0);
  const [text, setText] = useState(SCHEMAS[0].sample);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const schema = SCHEMAS[schemaIdx];

  const extract = async () => {
    setRunning(true); setResult(null); setErr(null);
    try {
      const out = await callClaude(text, schema.system);
      setResult(tryFormatJson(out));
    } catch (e) { setErr(e.message); }
    setRunning(false);
  };

  const jsonLines = result ? result.split("\n") : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Left: Input */}
      <div>
        <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>SCHEMA</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {SCHEMAS.map((s, i) => (
            <button key={s.id} onClick={() => { setSchemaIdx(i); setText(s.sample); setResult(null); }}
              style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${schemaIdx === i ? C : BDR}`, background: schemaIdx === i ? `${C}22` : "transparent", color: schemaIdx === i ? "#67E8F9" : MUT, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>INPUT TEXT</div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={7}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 6, background: SRF, border: `1px solid ${BDR}`, color: TEXT, fontSize: 11, lineHeight: 1.7, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />

        <div style={{ marginTop: 10, padding: "10px 12px", background: SRF, borderRadius: 6, border: `1px solid ${BDR}` }}>
          <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>SYSTEM PROMPT USED</span><CopyBtn text={schema.system} />
          </div>
          <pre style={{ margin: 0, fontSize: 9, color: "#7DD3FC", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.55 }}>{schema.system}</pre>
        </div>

        <button onClick={extract} disabled={running || !text.trim()}
          style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 6, border: "none", background: running ? SRF : `linear-gradient(135deg, ${C}, #0D9488)`, color: running ? MUT : TEXT, fontSize: 13, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {running ? "⟳ Extracting..." : "⬇ Extract to JSON"}
        </button>
      </div>

      {/* Right: Output */}
      <div>
        <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>JSON OUTPUT</span>
          {result && <CopyBtn text={result} />}
        </div>

        <div style={{ padding: "12px 14px", background: "#060C14", border: `1px solid ${result ? C + "55" : BDR}`, borderRadius: 6, minHeight: 280, maxHeight: 440, overflowY: "auto", transition: "border-color .3s" }}>
          {running && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", color: MUT, fontSize: 11 }}>
              <Spinner /> Calling API...
            </div>
          )}
          {result && jsonLines.map((line, i) => <JsonLine key={i} line={line} />)}
          {err && <div style={{ color: "#FCA5A5", fontSize: 11 }}>Error: {err}</div>}
          {!running && !result && !err && (
            <div style={{ color: MUT, fontSize: 11 }}>Structured JSON will appear here</div>
          )}
        </div>

        {result && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: SRF, borderRadius: 6, border: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>HOW TO USE IN CODE</div>
            <pre style={{ margin: 0, fontSize: 9, color: "#93C5FD", fontFamily: "monospace", lineHeight: 1.55 }}>{
`const res = await fetch("/v1/messages", { ... });
const data = await res.json();
// Always wrap in try/catch:
const raw = data.content[0].text;
const parsed = JSON.parse(raw);
// → parsed.${Object.keys(JSON.parse(result))[0]}, etc.`
            }</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ════════════════════════════════════════════════════════════════════════
//    TAB 3 — API Patterns
// ══════════════════════════════════════════════════════════════════════════

const PATTERNS = [
  {
    id: "basic",
    label: "1 · Basic Call",
    tag: "FOUNDATION",
    desc: "The minimal API call. No system prompt, no tools. Use as your baseline.",
    code: `const response = await fetch(
  "https://api.anthropic.com/v1/messages",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        { role: "user", content: "Your prompt here" }
      ]
    })
  }
);

const data = await response.json();
const text = data.content[0].text;`,
    runPrompt: "What is the capital of Nigeria and name one thing it's known for?",
    runSystem: null,
  },
  {
    id: "system",
    label: "2 · System Prompt",
    tag: "BEST PRACTICE",
    desc: "Add a system prompt to set persona, tone, and hard constraints. Separates instruction from user input.",
    code: `body: JSON.stringify({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: \`You are a concise technical assistant.
- Respond in exactly 3 bullet points
- Use technical language
- No greetings or filler phrases\`,
  messages: [
    { role: "user", content: userInput }
  ]
})`,
    runPrompt: "What is a REST API?",
    runSystem: "You are a concise technical assistant. Respond in exactly 3 bullet points. Use technical language. No greetings or filler phrases like 'Great question!'",
  },
  {
    id: "fewshot",
    label: "3 · Few-Shot",
    tag: "PATTERN",
    desc: "Show worked examples before your actual query. Dramatically improves format consistency.",
    code: `messages: [
  // ── Examples (teach the format) ──
  { role: "user",      content: "Classify: App crashes on login" },
  { role: "assistant", content: '{"category":"bug","severity":"critical"}' },
  { role: "user",      content: "Classify: Add dark mode" },
  { role: "assistant", content: '{"category":"feature","severity":"low"}' },
  // ── Actual query ──
  { role: "user", content: "Classify: " + userInput }
]`,
    runPrompt: `Classify this ticket (use the JSON format from prior examples — category: bug|feature|improvement, severity: critical|high|medium|low):

Examples shown:
- "App crashes on login" → {"category":"bug","severity":"critical"}
- "Add dark mode" → {"category":"feature","severity":"low"}

Now classify: "Database queries taking over 8 seconds on the dashboard page"`,
    runSystem: 'You are a ticket classifier. Respond ONLY with compact JSON: {"category":"bug|feature|improvement","severity":"critical|high|medium|low","component":"string"}. No explanation.',
  },
  {
    id: "ctx",
    label: "4 · Context Mgmt",
    tag: "ADVANCED",
    desc: "Pass conversation history to maintain state. Always trim old messages to stay within the context window.",
    code: `// Maintain history in state:
const [history, setHistory] = useState([]);

async function chat(userMsg) {
  const newMsg = { role: "user", content: userMsg };
  const trimmed = history.slice(-10); // keep last 10 turns

  const res = await callAPI({
    messages: [...trimmed, newMsg],
    system: SYSTEM_PROMPT // static, not in history
  });

  const reply = res.content[0].text;
  setHistory(prev => [
    ...prev.slice(-10),   // rolling window
    newMsg,
    { role: "assistant", content: reply }
  ]);
  return reply;
}

// Token estimate (rough):
// 1 token ≈ 4 chars · claude-sonnet-4 context: 200K tokens`,
    runPrompt: "I'm building a REST API in Node.js. What are the 3 most important security headers I should set? Be brief.",
    runSystem: "You are a senior backend engineer. Give concise, production-ready advice. No intro fluff.",
  },
];

function CodeLine({ line }) {
  const colored = line
    .replace(/(\/\/.*$)/g, '<span style="color:#4B5563">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span style="color:#86EFAC">$1</span>')
    .replace(/(`(?:[^`]|\\.)*`)/g, '<span style="color:#86EFAC">$1</span>')
    .replace(/\b(const|let|await|async|function|return|if|new|true|false|null)\b/g, '<span style="color:#C084FC">$1</span>')
    .replace(/\b(JSON|process|fetch|body|model|system|messages|role|content)\b/g, '<span style="color:#93C5FD">$1</span>');
  return (
    <div style={{ fontFamily: "monospace", fontSize: 10, lineHeight: 1.65, color: TEXT }} dangerouslySetInnerHTML={{ __html: colored }} />
  );
}

function APIPatterns() {
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);
  const pat = PATTERNS[idx];

  const runPattern = async () => {
    setRunning(true); setOut(null); setErr(null);
    try {
      const result = await callClaude(pat.runPrompt, pat.runSystem);
      setOut(result);
    } catch (e) { setErr(e.message); }
    setRunning(false);
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: MUT, marginBottom: 12 }}>
        4 patterns every production AI app uses. Click each to see the code and run a live example.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {PATTERNS.map((p, i) => (
          <button key={p.id} onClick={() => { setIdx(i); setOut(null); setErr(null); }}
            style={{ padding: "5px 11px", borderRadius: 5, border: `1px solid ${idx === i ? P : BDR}`, background: idx === i ? `${P}22` : "transparent", color: idx === i ? "#C084FC" : MUT, fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: idx === i ? 700 : 400, whiteSpace: "nowrap" }}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
        <Tag color={P}>{pat.tag}</Tag>
        <span style={{ fontSize: 12, color: TEXT }}>{pat.desc}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14 }}>
        {/* Code */}
        <div>
          <div style={{ padding: "7px 12px", background: CARD, border: `1px solid ${BDR}`, borderBottom: "none", borderRadius: "6px 6px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: MUT, fontWeight: 700, letterSpacing: 1.5 }}>PATTERN CODE</span>
            <CopyBtn text={pat.code} />
          </div>
          <div style={{ padding: "12px 14px", background: "#060C14", border: `1px solid ${BDR}`, borderRadius: "0 0 6px 6px", maxHeight: 320, overflowY: "auto" }}>
            {pat.code.split("\n").map((line, i) => <CodeLine key={i} line={line} />)}
          </div>
        </div>

        {/* Live run */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "10px 12px", background: SRF, border: `1px solid ${BDR}`, borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>DEMO PROMPT</div>
            <div style={{ fontSize: 10, color: TEXT, lineHeight: 1.6, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{pat.runPrompt}</div>
            {pat.runSystem && (
              <>
                <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginTop: 8, marginBottom: 4 }}>SYSTEM</div>
                <div style={{ fontSize: 10, color: "#C084FC", lineHeight: 1.55, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{pat.runSystem}</div>
              </>
            )}
          </div>

          <button onClick={runPattern} disabled={running}
            style={{ padding: 9, borderRadius: 6, border: "none", background: running ? SRF : `linear-gradient(135deg, ${P}, ${C})`, color: running ? MUT : TEXT, fontSize: 12, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {running ? "⟳ Calling API..." : "▶ Run Live"}
          </button>

          <div style={{ flex: 1, padding: "10px 12px", background: CARD, border: `1px solid ${out ? G + "55" : BDR}`, borderRadius: 6, minHeight: 100, maxHeight: 200, overflowY: "auto", transition: "border-color .3s" }}>
            <div style={{ fontSize: 9, color: MUT, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>REAL API RESPONSE</div>
            {running && <div style={{ display: "flex", gap: 6, alignItems: "center", color: MUT, fontSize: 11 }}><Spinner /> Waiting for Claude...</div>}
            {out && <pre style={{ margin: 0, fontSize: 10, color: TEXT, whiteSpace: "pre-wrap", lineHeight: 1.65, fontFamily: "inherit" }}>{out}</pre>}
            {err && <div style={{ color: "#FCA5A5", fontSize: 11 }}>Error: {err}</div>}
            {!running && !out && !err && <div style={{ color: MUT, fontSize: 11 }}>Response appears here</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ════════════════════════════════════════════════════════════════════════
//    MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

const TABS = [
  { label: "🔬 Prompt Patterns", sub: "Why engineering beats guessing" },
  { label: "⬇ Structured Output", sub: "Text in → JSON out" },
  { label: "⌨ API Patterns",     sub: "4 patterns every app needs" },
];

export default function PromptPlayground() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Fira Code', monospace", color: TEXT, padding: "20px 22px", maxWidth: 1000, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover:not(:disabled) { filter: brightness(1.2); }
        textarea:focus, input:focus { outline: 1px solid #4C1D95 !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E2D42; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 9, color: MUT, letterSpacing: 2.5, fontWeight: 700, marginBottom: 6 }}>SESSION B · LIVE DEMO</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: "#67E8F9" }}>Prompt Engineering</span>
          <span style={{ color: "#94A3B8" }}> Playground</span>
        </div>
        <div style={{ fontSize: 10, color: MUT, marginTop: 4 }}>
          Real API calls · Side-by-side comparison · Structured extraction · Copy-paste patterns
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BDR}`, marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              padding: "9px 18px", border: "none", borderBottom: `2px solid ${tab === i ? C : "transparent"}`,
              background: "transparent", color: tab === i ? "#67E8F9" : MUT, fontSize: 12,
              fontWeight: tab === i ? 700 : 400, cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start",
              transition: "all .15s",
            }}>
            <span>{t.label}</span>
            <span style={{ fontSize: 9, color: tab === i ? `${C}99` : MUT, letterSpacing: 0.5 }}>{t.sub}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 0 && <PromptLab />}
      {tab === 1 && <StructuredOutput />}
      {tab === 2 && <APIPatterns />}
    </div>
  );
}
