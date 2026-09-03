/**
 * The overlay panel injected into TikTok and YouTube Studio.
 *
 * ── WHY IT LOOKS LIKE THIS ───────────────────────────────────────────────────
 *
 * It does NOT try to parse the host page's own DOM for captions. Both sites
 * change their markup without notice, and a scraper keyed to their class names
 * is broken code with a delayed fuse — it would appear to work, then start
 * silently scoring the wrong text.
 *
 * Instead the panel has its own textarea: paste or type the caption you're
 * working on. That is honest about what the extension knows, survives every
 * redesign, and still puts the score where you're already working. Reading the
 * caption automatically can come later, per-platform, once each one has a
 * selector stable enough to be worth maintaining.
 *
 * Everything is namespaced under `nxp-` and rendered in a shadow root so the
 * host page's CSS cannot restyle it and ours cannot leak out.
 */

const HOST_ID = "nxp-root";
if (!document.getElementById(HOST_ID)) {
  injectPanel();
}

function send(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

function injectPanel() {
  const host = document.createElement("div");
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .wrap {
        position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .toggle {
        border: 0; border-radius: 999px; padding: 10px 16px; cursor: pointer;
        background: #0a63f4; color: #fff; font-size: 13px; font-weight: 600;
        box-shadow: 0 6px 20px rgba(0,0,0,.35);
      }
      .panel {
        width: 320px; max-height: 70vh; overflow-y: auto; display: none;
        background: #020817; color: #f5f5f5; border: 1px solid rgba(255,255,255,.12);
        border-radius: 16px; padding: 14px; box-shadow: 0 12px 40px rgba(0,0,0,.5);
      }
      .panel.open { display: block; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      h2 { margin: 0; font-size: 14px; font-weight: 700; }
      .x { background: none; border: 0; color: #a3a3a3; cursor: pointer; font-size: 16px; }
      textarea {
        width: 100%; box-sizing: border-box; margin-top: 10px; min-height: 84px;
        background: rgba(255,255,255,.05); color: #f5f5f5; font-size: 13px;
        border: 1px solid rgba(255,255,255,.15); border-radius: 10px; padding: 8px;
        resize: vertical; font-family: inherit;
      }
      .btns { display: flex; gap: 8px; margin-top: 10px; }
      button.act {
        flex: 1; border: 0; border-radius: 10px; padding: 8px; cursor: pointer;
        font-size: 12px; font-weight: 600;
      }
      .primary { background: #0a63f4; color: #fff; }
      .ghost { background: rgba(255,255,255,.08); color: #f5f5f5; }
      button:disabled { opacity: .5; cursor: default; }
      .score { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
      .num { font-size: 30px; font-weight: 800; line-height: 1; }
      .band { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
      .msg { margin-top: 10px; font-size: 12px; color: #fbbf24; }
      .sum { margin-top: 6px; font-size: 12px; color: #cbd5e1; }
      ul { margin: 8px 0 0; padding-left: 16px; }
      li { font-size: 12px; color: #cbd5e1; margin-bottom: 4px; }
      .tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .tag {
        background: rgba(255,255,255,.1); border-radius: 999px;
        padding: 3px 8px; font-size: 11px; color: #cbd5e1;
      }
      .lbl { margin-top: 12px; font-size: 10px; text-transform: uppercase;
             letter-spacing: .06em; color: #94a3b8; }
      .bal { font-size: 11px; color: #64748b; margin-top: 10px; }
    </style>
    <div class="wrap">
      <button class="toggle" id="t">NexusPly</button>
      <div class="panel" id="p">
        <div class="row">
          <h2>Check this post</h2>
          <button class="x" id="close">&times;</button>
        </div>
        <textarea id="ta" placeholder="Paste your caption here…"></textarea>
        <div class="btns">
          <button class="act primary" id="score">Score</button>
          <button class="act ghost" id="tags">Hashtags</button>
        </div>
        <div id="out"></div>
        <div class="bal" id="bal"></div>
      </div>
    </div>
  `;

  document.documentElement.appendChild(host);

  const $ = (id) => shadow.getElementById(id);
  const panel = $("p");
  const out = $("out");

  $("t").onclick = () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) void refreshBalance();
  };
  $("close").onclick = () => panel.classList.remove("open");

  async function refreshBalance() {
    const r = await send({ type: "balance" });
    $("bal").textContent =
      typeof r?.balance === "number" ? `${r.balance} credits left` : "";
  }

  function bandFor(score) {
    if (score >= 80) return { label: "Great", color: "#34d399" };
    if (score >= 60) return { label: "Good", color: "#73b4ff" };
    if (score >= 40) return { label: "Fair", color: "#fbbf24" };
    return { label: "Needs work", color: "#f87171" };
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  }

  async function run(kind) {
    const content = $("ta").value;
    if (content.trim().length < 10) {
      out.innerHTML = `<div class="msg">Write a bit more first.</div>`;
      return;
    }
    $("score").disabled = true;
    $("tags").disabled = true;
    out.innerHTML = `<div class="msg">Working…</div>`;

    const r = await send({ type: kind, content });

    $("score").disabled = false;
    $("tags").disabled = false;

    if (!r || r.ok === false) {
      out.innerHTML = `<div class="msg">${esc(r?.error ?? "Something went wrong.")}</div>`;
      return;
    }

    if (kind === "score") {
      const b = bandFor(r.score);
      out.innerHTML = `
        <div class="score">
          <div class="num" style="color:${b.color}">${r.score}</div>
          <div class="band" style="color:${b.color}">${b.label}</div>
        </div>
        ${r.summary ? `<div class="sum">${esc(r.summary)}</div>` : ""}
        ${
          r.fixes?.length
            ? `<div class="lbl">What to change</div><ul>${r.fixes
                .map((f) => `<li>${esc(f)}</li>`)
                .join("")}</ul>`
            : ""
        }`;
    } else {
      out.innerHTML = `
        <div class="lbl">Suggested hashtags</div>
        <div class="tags">${(r.hashtags ?? [])
          .map((h) => `<span class="tag">${esc(h)}</span>`)
          .join("")}</div>
        ${
          r.keywords?.length
            ? `<div class="lbl">People search for</div><div class="sum">${esc(
                r.keywords.join(" · "),
              )}</div>`
            : ""
        }`;
    }
    void refreshBalance();
  }

  $("score").onclick = () => void run("score");
  $("tags").onclick = () => void run("hashtags");
}
