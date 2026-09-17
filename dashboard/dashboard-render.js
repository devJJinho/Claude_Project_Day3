// backlog.json 대시보드 — 렌더링 전용. dashboard-core.js의 state를 읽기만 하고,
// 모든 텍스트는 textContent로만 넣는다(innerHTML에 사용자 데이터를 절대 넣지 않음 — HTML로
// 해석되지 않고 항상 순수 텍스트로 표시됨).

const $ = (id) => document.getElementById(id);

function fmtTime(date) {
  if (!date) return "";
  return date.toLocaleString("ko-KR");
}

function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function el(tag, opts = {}) {
  const e = document.createElement(tag);
  if (opts.text != null) e.textContent = opts.text;
  if (opts.className) e.className = opts.className;
  if (opts.onclick) e.addEventListener("click", opts.onclick);
  return e;
}

function renderHeader() {
  const box = $("file-info");
  clear(box);
  if (!state.fileName) {
    box.appendChild(el("span", { text: "아직 파일을 선택하지 않았습니다." }));
    return;
  }
  box.appendChild(el("div", { text: `파일: ${state.fileName}` }));
  box.appendChild(el("div", { text: `불러온 시각: ${fmtTime(state.loadedAt)}` }));
  if (state.hash) box.appendChild(el("div", { className: "muted", text: `${state.hashAlgo}: ${state.hash}` }));
}

function renderMessages() {
  const box = $("messages");
  clear(box);

  if (state.parseError) {
    box.appendChild(
      el("div", { className: "banner error", text: `JSON을 읽을 수 없습니다: ${state.parseError} — 올바른 backlog.json 파일인지 확인하세요.` })
    );
    return;
  }
  if (state.structureError) {
    box.appendChild(el("div", { className: "banner error", text: `구조 오류: ${state.structureError}` }));
    return;
  }
  if (!state.fileName) return;

  if (state.tasks.length === 0) {
    box.appendChild(el("div", { className: "banner warn", text: "이 백로그에는 작업(tasks)이 없습니다." }));
  }
  if (state.refErrors.length > 0) {
    const banner = el("div", { className: "banner error" });
    banner.appendChild(el("div", { text: `참조 무결성 오류 ${state.refErrors.length}건 (조용히 무시하지 않고 표시합니다):` }));
    const ul = el("ul");
    for (const msg of state.refErrors) ul.appendChild(el("li", { text: msg }));
    banner.appendChild(ul);
    box.appendChild(banner);
  }
  const unknown = state.tasks.filter((t) => !KNOWN_STATUS.has(t.status));
  if (unknown.length > 0) {
    box.appendChild(
      el("div", {
        className: "banner warn",
        text: `알 수 없는 status 값을 가진 태스크 ${unknown.length}건: ${unknown.map((t) => `${t.id}(${JSON.stringify(t.status)})`).join(", ")}`,
      })
    );
  }
}

function renderStats() {
  const box = $("stats");
  clear(box);
  if (!state.fileName || state.parseError || state.structureError) return;

  const stats = computeStats(state.tasks);
  box.appendChild(el("div", { text: `전체 항목 수(부모+하위 모두 포함): ${stats.total}` }));
  box.appendChild(el("div", { text: `실제 세부 실행 작업 수(그룹/부모 역할 제외): ${stats.leafTaskCount}` }));
  if (stats.groupTaskCount > 0) {
    box.appendChild(el("div", { text: `그룹(부모) 역할 작업 수: ${stats.groupTaskCount}` }));
  }
  const statusLine = el("div", { className: "status-counts" });
  for (const [s, n] of stats.byStatus) {
    statusLine.appendChild(el("span", { className: "pill", text: `${s}: ${n}` }));
  }
  box.appendChild(statusLine);
}

function statusCssClass(status) {
  return KNOWN_STATUS.has(status) ? status : "unknown";
}

function renderProgress() {
  const wrap = $("progress-wrap");
  clear(wrap);
  if (!state.fileName || state.parseError || state.structureError || state.tasks.length === 0) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;

  const stats = computeStats(state.tasks);
  const bar = el("div", { className: "progress-bar" });
  for (const [status, count] of stats.byStatus) {
    const pct = (count / stats.total) * 100;
    const seg = el("div", { className: `progress-seg status-${statusCssClass(status)}` });
    seg.style.width = `${pct}%`;
    seg.title = `${status}: ${count}개 (${Math.round(pct)}%)`;
    bar.appendChild(seg);
  }
  wrap.appendChild(bar);

  const done = stats.byStatus.get("done") ?? 0;
  const pctDone = stats.total ? Math.round((done / stats.total) * 100) : 0;
  wrap.appendChild(el("div", { className: "progress-label", text: `완료 ${done} / ${stats.total} (${pctDone}%)` }));
}

// oxlint-disable-next-line no-unused-vars -- classic script(모듈 아님): dashboard-core.js에서 사용
function renderRefreshStatus(changed) {
  const el2 = $("refresh-status");
  if (!el2) return;
  const t = state.lastCheckedAt ? state.lastCheckedAt.toLocaleTimeString("ko-KR") : "";
  el2.textContent = changed ? `마지막 확인: ${t} (변경 감지 → 갱신함)` : `마지막 확인: ${t} (변경 없음)`;
}

// oxlint-disable-next-line no-unused-vars -- dashboard-core.js에서 사용
function renderAutoRefreshError(msg) {
  const el2 = $("refresh-status");
  if (el2) el2.textContent = msg;
  const radioOff = $("auto-refresh-off");
  if (radioOff) radioOff.checked = true;
  updateAutoRefreshToggleStyle();
}

function renderFilterOptions() {
  const sel = $("status-filter");
  const current = sel.value || "__all__";
  clear(sel);
  sel.appendChild(el("option", { text: "전체 상태" }));
  sel.firstChild.value = "__all__";
  const statuses = new Set(state.tasks.map((t) => (KNOWN_STATUS.has(t.status) ? t.status : "(알 수 없는 상태)")));
  for (const s of statuses) {
    const opt = el("option", { text: s });
    opt.value = s;
    sel.appendChild(opt);
  }
  sel.value = [...sel.options].some((o) => o.value === current) ? current : "__all__";
}

function renderList() {
  const box = $("task-list");
  clear(box);
  if (!state.fileName || state.parseError || state.structureError || state.tasks.length === 0) return;

  const visible = state.tasks.filter(matchesFilter);
  box.appendChild(el("div", { className: "muted", text: `${visible.length} / ${state.tasks.length}개 표시` }));

  for (const t of visible) {
    const known = KNOWN_STATUS.has(t.status);
    const row = el("div", { className: "task-row" + (known ? "" : " unknown-status") });
    row.appendChild(el("span", { className: "task-id", text: t.id ?? "(id 없음)" }));
    row.appendChild(el("span", { className: "task-status", text: known ? t.status : `${t.status}(알 수 없음)` }));
    row.appendChild(el("span", { className: "task-title", text: t.title ?? "(제목 없음)" }));
    row.addEventListener("click", () => renderDetail(t));
    box.appendChild(row);
  }
}

// oxlint-disable-next-line no-unused-vars -- classic script(모듈 아님): dashboard-core.js/index.html에서 사용
function updateAutoRefreshToggleStyle() {
  const wrap = $("auto-refresh-toggle");
  if (!wrap) return;
  const on = $("auto-refresh-on");
  wrap.classList.toggle("active", !!(on && on.checked));
}

// oxlint-disable-next-line no-unused-vars -- classic script(모듈 아님): dashboard-core.js에서 사용
function renderAll() {
  renderHeader();
  renderMessages();
  renderStats();
  renderProgress();
  renderFilterOptions();
  renderList();
  clear($("task-detail"));
}
