const USERNAME = "maTTvey-web";
const DISPLAY_NAME = "Matvey";

export const command = `curl -s -L -A "Mozilla/5.0" "https://github.com/users/${USERNAME}/contributions"`;

export const refreshFrequency = 1000 * 60 * 30; // обновление раз в 30 минут

export const className = `
  left: 24px;
  bottom: 120px;
  font-family: -apple-system, "SF Pro Text", sans-serif;
  color: white;
`;

const COLORS = ["rgba(255,255,255,0.09)", "#6b4fa3", "#9b6fd6", "#e08fbf", "#ffb27a"];
const MONTHS = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
const CELL = 10;
const GAP = 3;

const STORAGE_KEY = "github-graph-pos";

const setPos = (node, x, y) => {
  node.style.left = x + "px";
  node.style.top = y + "px";
  node.style.bottom = "auto";
};

const restore = (el) => {
  if (!el || !el.parentElement) return;
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (p) setPos(el.parentElement, p.x, p.y);
  } catch (e) {}
};

const startDrag = (e) => {
  const node = e.currentTarget.parentElement;
  const rect = node.getBoundingClientRect();
  const dx = e.clientX - rect.left;
  const dy = e.clientY - rect.top;
  const move = (ev) => setPos(node, ev.clientX - dx, ev.clientY - dy);
  const up = () => {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ x: parseFloat(node.style.left), y: parseFloat(node.style.top) })
      );
    } catch (err) {}
  };
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
  e.preventDefault();
};

const parse = (html) => {
  const tags = html.match(/<td[^>]*ContributionCalendar-day[^>]*>/g) || [];
  const days = tags
    .map((t) => {
      const d = /data-date="([^"]+)"/.exec(t);
      const l = /data-level="(\d)"/.exec(t);
      return d ? { date: d[1], level: l ? Number(l[1]) : 0 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const weeks = [];
  let cur = [];
  days.forEach((day) => {
    const dow = new Date(day.date + "T00:00:00Z").getUTCDay();
    if (dow === 0 && cur.length) {
      weeks.push(cur);
      cur = [];
    }
    cur.push({ ...day, dow });
  });
  if (cur.length) weeks.push(cur);

  const m = /([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/.exec(html);
  return { weeks, total: m ? m[1] : "0" };
};

export const render = ({ output }) => {
  const box = {
    padding: "16px 18px",
    borderRadius: 20,
    background: "rgba(25, 18, 50, 0.38)",
    backdropFilter: "blur(24px) saturate(160%)",
    WebkitBackdropFilter: "blur(24px) saturate(160%)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
    cursor: "grab",
    userSelect: "none",
  };

  if (!output || !output.includes("ContributionCalendar")) {
    return (
      <div style={box} ref={restore} onMouseDown={startDrag}>
        Немає даних. Перевір нік у файлі віджета.
      </div>
    );
  }

  const { weeks, total } = parse(output);

  const labels = [];
  let lastMonth = -1;
  let lastCol = -10;
  weeks.forEach((w, i) => {
    const month = new Date(w[0].date + "T00:00:00Z").getUTCMonth();
    if (month !== lastMonth && i - lastCol >= 3) {
      labels.push({ col: i + 1, text: MONTHS[month] });
      lastCol = i;
    }
    lastMonth = month;
  });

  const grid = {
    display: "grid",
    gridTemplateColumns: `repeat(${weeks.length}, ${CELL}px)`,
    gridTemplateRows: `repeat(7, ${CELL}px)`,
    gap: GAP,
  };

  return (
    <div style={box} ref={restore} onMouseDown={startDrag}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, opacity: 0.95 }}>
        {DISPLAY_NAME} · {total} внесків за останній рік
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${weeks.length}, ${CELL}px)`,
          gap: GAP,
          fontSize: 10,
          opacity: 0.7,
          marginBottom: 5,
          height: 12,
        }}
      >
        {labels.map((l) => (
          <span key={l.col} style={{ gridColumn: l.col, whiteSpace: "nowrap" }}>
            {l.text}
          </span>
        ))}
      </div>

      <div style={grid}>
        {weeks.map((w, i) =>
          w.map((d) => (
            <div
              key={d.date}
              title={d.date}
              style={{
                gridColumn: i + 1,
                gridRow: d.dow + 1,
                width: CELL,
                height: CELL,
                borderRadius: 3,
                background: COLORS[d.level] || COLORS[0],
              }}
            />
          ))
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4,
          marginTop: 10,
          fontSize: 10,
          opacity: 0.75,
        }}
      >
        <span style={{ marginRight: 2 }}>Менше</span>
        {COLORS.map((c, i) => (
          <div key={i} style={{ width: CELL, height: CELL, borderRadius: 3, background: c }} />
        ))}
        <span style={{ marginLeft: 2 }}>Більше</span>
      </div>
    </div>
  );
};
