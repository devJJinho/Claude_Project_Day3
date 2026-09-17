// backlog.json 대시보드 — 태스크 상세 패널 렌더링(요구사항 4의 전체 필드).
// dashboard-render.js의 el/clear/$ 헬퍼를 그대로 쓴다(같은 전역 스코프의 classic script).
// 모든 값은 textContent로만 넣는다 — innerHTML에 사용자 데이터를 넣지 않는다.

function fieldRow(container, label, value, { alwaysShow = true, placeholder = "정보 없음" } = {}) {
  const hasValue = value !== undefined && value !== null && value !== "";
  if (!hasValue && !alwaysShow) return;
  const row = el("div", { className: "field-row" });
  row.appendChild(el("span", { className: "field-label", text: label }));
  row.appendChild(el("span", { className: "field-value", text: hasValue ? String(value) : placeholder }));
  container.appendChild(row);
}

function renderLog(container, log) {
  const row = el("div", { className: "field-row" });
  row.appendChild(el("span", { className: "field-label", text: "log" }));
  if (log == null) {
    row.appendChild(el("span", { className: "field-value", text: "정보 없음" }));
    container.appendChild(row);
    return;
  }
  if (!Array.isArray(log)) {
    row.appendChild(el("span", { className: "field-value", text: `${String(log)} (배열이 아님)` }));
    container.appendChild(row);
    return;
  }
  container.appendChild(row);
  const list = el("ul", { className: "log-list" });
  if (log.length === 0) list.appendChild(el("li", { text: "(빈 배열)" }));
  for (const entry of log) {
    if (entry !== null && typeof entry === "object" && !Array.isArray(entry)) {
      const li = el("li");
      for (const [k, v] of Object.entries(entry)) {
        li.appendChild(el("div", { text: `${k}: ${v === null || v === undefined ? "정보 없음" : String(v)}` }));
      }
      list.appendChild(li);
    } else {
      list.appendChild(el("li", { text: String(entry) }));
    }
  }
  container.appendChild(list);
}

// oxlint-disable-next-line no-unused-vars -- classic script(모듈 아님): dashboard-render.js에서 사용
function renderDetail(task) {
  const box = $("task-detail");
  clear(box);
  box.appendChild(el("h3", { text: `${task.id ?? "(id 없음)"} — ${task.title ?? "(제목 없음)"}` }));

  fieldRow(box, "category", task.category, { placeholder: "미지정" });
  fieldRow(box, "source_section", task.source_section);
  fieldRow(box, "status", task.status, { placeholder: "미지정" });
  fieldRow(box, "summary", task.summary);
  fieldRow(box, "done_when", task.done_when);
  fieldRow(box, "note", task.note);

  const depsIds = Array.isArray(task.deps) ? task.deps : [];
  const depsRow = el("div", { className: "field-row" });
  depsRow.appendChild(el("span", { className: "field-label", text: "deps" }));
  if (depsIds.length === 0) {
    depsRow.appendChild(el("span", { className: "field-value", text: "없음" }));
  } else {
    const wrap = el("span", { className: "field-value" });
    depsIds.forEach((depId, i) => {
      const known = state.tasks.some((t) => t.id === depId);
      const link = el("a", { text: depId + (known ? "" : " (존재하지 않음)"), className: known ? "dep-link" : "dep-link broken" });
      link.href = "#";
      if (known) {
        link.addEventListener("click", (ev) => {
          ev.preventDefault();
          const target = state.tasks.find((t) => t.id === depId);
          if (target) renderDetail(target);
        });
      }
      wrap.appendChild(link);
      if (i < depsIds.length - 1) wrap.appendChild(document.createTextNode(", "));
    });
    depsRow.appendChild(wrap);
  }
  box.appendChild(depsRow);

  if (task.parent != null) {
    const known = state.tasks.some((t) => t.id === task.parent);
    fieldRow(box, "parent", known ? task.parent : `${task.parent} (존재하지 않음)`);
  } else {
    fieldRow(box, "parent", null, { placeholder: "미지정" });
  }

  if (task.doc != null) {
    fieldRow(box, "doc", `${task.doc} (자동으로 열지 않습니다 — 텍스트로만 표시)`);
  } else {
    fieldRow(box, "doc", null);
  }
  fieldRow(box, "where", task.where);
  fieldRow(box, "est_min", task.est_min, { placeholder: "미지정" });
  if (task.gate != null) {
    fieldRow(box, "gate", `${JSON.stringify(task.gate)} (표시만 하며 실행하지 않습니다)`);
  } else {
    fieldRow(box, "gate", null);
  }
  fieldRow(box, "owner", task.owner, { placeholder: "미지정" });
  fieldRow(box, "claimed_at", task.claimed_at);
  fieldRow(box, "updated_at", task.updated_at);

  // done_at / evidence: 요구사항 5 — 실제로 있을 때만 행 자체를 표시(없으면 행을 만들지 않음)
  fieldRow(box, "done_at", task.done_at, { alwaysShow: false });
  fieldRow(box, "evidence", task.evidence, { alwaysShow: false });

  renderLog(box, task.log);

  const idPattern = /^[A-Za-z0-9_-]+$/;
  if (typeof task.id === "string" && idPattern.test(task.id)) {
    const link = el("a", { text: `문서 열기: ../docs/backlog/${task.id}.md (있을 때만 열림)` });
    link.href = `../docs/backlog/${task.id}.md`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "doc-link";
    box.appendChild(link);
  }
}
