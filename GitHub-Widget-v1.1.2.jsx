// GitHub Contribution Graph Widget for Übersicht
// Configure your GitHub username and display name below.
// Install in: ~/Library/Application Support/Übersicht/widgets/

const USERNAME = "maTTvey-web";
const DISPLAY_NAME = "Matvey";

export const command = `curl -s -L -f --max-time 20 -A "Mozilla/5.0" -H "Accept-Language: en-US,en;q=0.9" "https://github.com/users/${USERNAME}/contributions"`;
export const refreshFrequency = 1000 * 60 * 30;

export const className = `
  left: 24px;
  bottom: 120px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  color: white;
`;

const STORAGE_KEY = "github-graph-settings-v1";
const POSITION_KEY = "github-graph-pos";
const CACHE_KEY = "github-graph-cache-v1";
const DEFAULT_SETTINGS = { language: "en", palette: "purple", cell: 10, opacity: 38 };
const PALETTES = {
  purple: ["rgba(255,255,255,0.09)", "#6b4fa3", "#9b6fd6", "#e08fbf", "#ffb27a"],
  green: ["rgba(255,255,255,0.09)", "#0e4429", "#006d32", "#26a641", "#39d353"],
  blue: ["rgba(255,255,255,0.09)", "#0e2f55", "#155ca8", "#3289e6", "#75c7ff"],
  orange: ["rgba(255,255,255,0.09)", "#57250d", "#a94316", "#e87528", "#ffc06b"],
  pink: ["rgba(255,255,255,0.09)", "#70264d", "#b83e78", "#ed6da8", "#ffb6d5"],
  mono: ["rgba(255,255,255,0.09)", "#484848", "#777777", "#aaaaaa", "#eeeeee"],
};
const TEXT = {
  en: { contributions: "contributions in the last year", less: "Less", more: "More", settings: "Settings", language: "Language", palette: "Cell colors", size: "Cell size", opacity: "Background opacity", close: "Done", error: "No data found. Check the username in the widget file.", system: "System" },
  uk: { contributions: "внесків за останній рік", less: "Менше", more: "Більше", settings: "Налаштування", language: "Мова", palette: "Колір клітинок", size: "Розмір клітинок", opacity: "Прозорість фону", close: "Готово", error: "Немає даних. Перевір нік у файлі віджета.", system: "Системна" },
};

const readSettings = () => {
  try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")) }; }
  catch (e) { return { ...DEFAULT_SETTINGS }; }
};
const saveSettings = (s) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {} };

const setPos = (node, x, y) => {
  node.style.left = x + "px";
  node.style.top = y + "px";
  node.style.bottom = "auto";
};
const restore = (el) => {
  if (!el || !el.parentElement) return;
  try {
    const p = JSON.parse(localStorage.getItem(POSITION_KEY) || "null");
    if (p) setPos(el.parentElement, p.x, p.y);
  } catch (e) {}
};
const startDrag = (e) => {
  if (e.target.closest("button, select, input, label")) return;
  const node = e.currentTarget.parentElement;
  const rect = node.getBoundingClientRect();
  const dx = e.clientX - rect.left;
  const dy = e.clientY - rect.top;
  const move = (ev) => setPos(node, ev.clientX - dx, ev.clientY - dy);
  const up = () => {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
    try { localStorage.setItem(POSITION_KEY, JSON.stringify({ x: parseFloat(node.style.left), y: parseFloat(node.style.top) })); } catch (err) {}
  };
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
  e.preventDefault();
};

// Parser does not depend on the ContributionCalendar-day class:
// it takes any tag that has a data-date attribute.
const parse = (html) => {
  const tags = html.match(/<[^>]*data-date="[^"]+"[^>]*>/g) || [];
  const days = tags.map((t) => {
    const d = /data-date="([^"]+)"/.exec(t);
    const l = /data-level="(\d)"/.exec(t);
    return d ? { date: d[1], level: l ? Number(l[1]) : 0 } : null;
  }).filter(Boolean).sort((a, b) => (a.date < b.date ? -1 : 1));
  const weeks = [];
  let cur = [];
  days.forEach((day) => {
    const dow = new Date(day.date + "T00:00:00Z").getUTCDay();
    if (dow === 0 && cur.length) { weeks.push(cur); cur = []; }
    cur.push({ ...day, dow });
  });
  if (cur.length) weeks.push(cur);

  const m = /([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i.exec(html);
  let total = m ? m[1] : null;
  if (total === null) {
    let sum = 0;
    for (const x of html.matchAll(/(\d+)\s+contributions?\s+on/g)) sum += Number(x[1]);
    total = String(sum);
  }
  return { weeks, total };
};

export const render = ({ output }) => {
  const settings = readSettings();
  const language = settings.language === "system"
    ? ((navigator.language || "en").toLowerCase().startsWith("uk") ? "uk" : "en")
    : settings.language;
  const t = TEXT[language] || TEXT.en;
  const colors = PALETTES[settings.palette] || PALETTES.purple;
  const cell = Math.max(6, Math.min(14, Number(settings.cell) || 10));
  const gap = Math.max(2, Math.round(cell * 0.3));
  const box = {
    position: "relative", padding: "14px 16px", borderRadius: 20,
    background: `rgba(25, 18, 50, ${Math.max(10, Math.min(90, Number(settings.opacity) || 38)) / 100})`,
    backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)",
    border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
    cursor: "grab", userSelect: "none", minWidth: 260,
  };
  const gearStyle = { border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.08)", color: "white", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, lineHeight: "24px" };
  const settingsStyle = { marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(0,0,0,.28)", border: "1px solid rgba(255,255,255,.12)", cursor: "default" };
  const labelStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 10, fontSize: 11, opacity: .9 };
  const selectStyle = { maxWidth: 130, background: "#25222d", color: "white", border: "1px solid rgba(255,255,255,.2)", borderRadius: 6, padding: "5px 7px", fontSize: 11 };

  const applySetting = (key, value, root) => {
    const next = { ...readSettings(), [key]: value };
    saveSettings(next);
    const nextColors = PALETTES[next.palette] || PALETTES.purple;
    const nextCell = Math.max(6, Math.min(14, Number(next.cell) || 10));
    const nextGap = Math.max(2, Math.round(nextCell * 0.3));
    if (key === "palette") root.querySelectorAll(".gh-cell").forEach((el) => { el.style.background = nextColors[Number(el.dataset.level)] || nextColors[0]; });
    if (key === "cell") {
      root.querySelectorAll(".gh-cell").forEach((el) => { el.style.width = nextCell + "px"; el.style.height = nextCell + "px"; });
      const grid = root.querySelector(".gh-grid");
      if (grid) { const count = Number(grid.dataset.weeks); grid.style.gridTemplateColumns = `repeat(${count}, ${nextCell}px)`; grid.style.gridTemplateRows = `repeat(7, ${nextCell}px)`; grid.style.gap = nextGap + "px"; }
      const monthGrid = root.querySelector(".gh-months");
      if (monthGrid) { monthGrid.style.gridTemplateColumns = `repeat(${Number(monthGrid.dataset.weeks)}, ${nextCell}px)`; monthGrid.style.gap = nextGap + "px"; }
      root.querySelectorAll(".gh-legend-cell").forEach((el) => { el.style.width = nextCell + "px"; el.style.height = nextCell + "px"; });
    }
    if (key === "opacity") root.style.background = `rgba(25, 18, 50, ${Math.max(10, Math.min(90, Number(next.opacity) || 38)) / 100})`;
    if (key === "language") {
      const lang = value === "system" ? ((navigator.language || "en").toLowerCase().startsWith("uk") ? "uk" : "en") : value;
      const tx = TEXT[lang] || TEXT.en;
      const total = root.dataset.total || "0";
      const title = root.querySelector(".gh-title"); if (title) title.textContent = `${DISPLAY_NAME} · ${total} ${tx.contributions}`;
      const less = root.querySelector(".gh-less"); if (less) less.textContent = tx.less;
      const more = root.querySelector(".gh-more"); if (more) more.textContent = tx.more;
      const labels = root.querySelectorAll(".gh-setting-label");
      if (labels[0]) labels[0].textContent = tx.language;
      if (labels[1]) labels[1].textContent = tx.palette;
      if (labels[2]) labels[2].textContent = tx.size;
      if (labels[3]) labels[3].textContent = tx.opacity;
      const done = root.querySelector(".gh-done"); if (done) done.textContent = tx.close;
      const heading = root.querySelector(".gh-settings-heading"); if (heading) heading.textContent = tx.settings;
      root.querySelectorAll(".gh-month-label").forEach((el) => { el.textContent = new Date(Date.UTC(2020, Number(el.dataset.month), 1)).toLocaleString(lang === "uk" ? "uk-UA" : "en-US", { month: "short", timeZone: "UTC" }); });
    }
  };

  // Use fresh data when available, otherwise fall back to the last cached data.
  let data = output ? parse(output) : null;
  if (data && data.weeks.length) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
  } else {
    try { data = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (e) { data = null; }
  }
  if (!data || !data.weeks || !data.weeks.length) {
    return <div style={box} ref={restore} onMouseDown={startDrag}>{t.error}</div>;
  }
  const { weeks, total } = data;

  const labels = [];
  let lastMonth = -1;
  let lastCol = -10;
  weeks.forEach((w, i) => {
    const month = new Date(w[0].date + "T00:00:00Z").getUTCMonth();
    if (month !== lastMonth && i - lastCol >= 3) {
      labels.push({ col: i + 1, text: new Date(Date.UTC(2020, month, 1)).toLocaleString(language === "uk" ? "uk-UA" : "en-US", { month: "short", timeZone: "UTC" }) });
      lastCol = i;
    }
    lastMonth = month;
  });

  return (
    <div style={box} ref={restore} onMouseDown={startDrag} data-total={total}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div className="gh-title" style={{ fontSize: 12, fontWeight: 600, opacity: 0.95 }}>{DISPLAY_NAME} · {total} {t.contributions}</div>
        <button type="button" aria-label={t.settings} title={t.settings} style={gearStyle} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); const panel = e.currentTarget.parentElement.parentElement.querySelector(".gh-settings"); if (panel) panel.style.display = panel.style.display === "none" ? "block" : "none"; }}>⚙</button>
      </div>

      <div className="gh-months" data-weeks={weeks.length} style={{ display: "grid", gridTemplateColumns: `repeat(${weeks.length}, ${cell}px)`, gap, fontSize: 10, opacity: 0.7, marginBottom: 5, height: 12 }}>
        {labels.map((l) => <span className="gh-month-label" data-month={new Date(Date.UTC(2020, new Date(weeks[l.col - 1][0].date + "T00:00:00Z").getUTCMonth(), 1)).getUTCMonth()} key={l.col} style={{ gridColumn: l.col, whiteSpace: "nowrap" }}>{l.text}</span>)}
      </div>

      <div className="gh-grid" data-weeks={weeks.length} style={{ display: "grid", gridTemplateColumns: `repeat(${weeks.length}, ${cell}px)`, gridTemplateRows: `repeat(7, ${cell}px)`, gap }}>
        {weeks.map((w, i) => w.map((d) => (
          <div className="gh-cell" data-level={d.level} key={d.date} title={d.date} style={{ gridColumn: i + 1, gridRow: d.dow + 1, width: cell, height: cell, borderRadius: 3, background: colors[d.level] || colors[0] }} />
        )))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: Math.max(3, gap - 1), marginTop: 10, fontSize: 10, opacity: 0.75 }}>
        <span className="gh-less" style={{ marginRight: 2 }}>{t.less}</span>
        {colors.map((c, i) => <div className="gh-legend-cell" key={i} style={{ width: cell, height: cell, borderRadius: 3, background: c }} />)}
        <span className="gh-more" style={{ marginLeft: 2 }}>{t.more}</span>
      </div>

      <div className="gh-settings" style={{ ...settingsStyle, display: "none" }} onClick={(e) => e.stopPropagation()}>
        <div className="gh-settings-heading" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t.settings}</div>
        <label style={labelStyle}><span className="gh-setting-label">{t.language}</span><select aria-label={t.language} data-setting="language" value={settings.language} style={selectStyle} onChange={(e) => applySetting("language", e.target.value, e.currentTarget.closest(".gh-settings").parentElement)}><option value="en">English</option><option value="uk">Українська</option><option value="system">{t.system}</option></select></label>
        <label style={labelStyle}><span className="gh-setting-label">{t.palette}</span><select aria-label={t.palette} data-setting="palette" value={settings.palette} style={selectStyle} onChange={(e) => applySetting("palette", e.target.value, e.currentTarget.closest(".gh-settings").parentElement)}><option value="purple">Purple sunset</option><option value="green">GitHub green</option><option value="blue">Ocean blue</option><option value="orange">Warm orange</option><option value="pink">Pink</option><option value="mono">Monochrome</option></select></label>
        <label style={labelStyle}><span className="gh-setting-label">{t.size}</span><input aria-label={t.size} type="range" min="6" max="14" value={cell} style={{ width: 100, accentColor: "#b18aff" }} onChange={(e) => applySetting("cell", e.target.value, e.currentTarget.closest(".gh-settings").parentElement)} /></label>
        <label style={labelStyle}><span className="gh-setting-label">{t.opacity}</span><input aria-label={t.opacity} type="range" min="10" max="90" value={settings.opacity} style={{ width: 100, accentColor: "#b18aff" }} onChange={(e) => applySetting("opacity", e.target.value, e.currentTarget.closest(".gh-settings").parentElement)} /></label>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button type="button" className="gh-done" style={{ ...gearStyle, width: "auto", padding: "0 10px", fontSize: 11 }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.currentTarget.closest(".gh-settings").style.display = "none"; }}>{t.close}</button></div>
      </div>
    </div>
  );
};
