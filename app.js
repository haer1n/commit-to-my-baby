/* =========================================================
   treino do meu bebe - app.js
   HTML + CSS + JS puro
   salvo em localStorage.
========================================================= */

/* ---------- frases ---------- */

const FRASES_MOTIVACIONAIS = [
  "oiiii eu te amo mtmtmt!",
  "vc eh perfeito pra mim meu amorzinho <3",
  "eu te admiro dms bebe",
  "mwa mwa mwaa mwaa mwaaa",
  "eu admiro mt seu esforco e a pessoa que vc eh :D",
  "eu to mt orgulhosa de vc viu",
  "vc eh mt lindo e mt inteligente",
  "vc eh mt especial pra mim",
  "vc eh mt importante pra mim",
  "vc eh mt fofo e mt carinhoso",
];

const FRASES_DESCANSO = [
  "descansa bem nenem",
  "toma bastante aguinha viu",
  "eu te amo muito mais sabia",
  "vou fazer jantinha e chazinho pra vc descansar <3",
  "descansa mt mt mt meu amorzinho",
];

/* ---------- gatinho do dia ---------- */

const GATINHOS = [
  "cats/happy.jpg",
  "cats/happy3.jpg",
  "cats/happy4.jpg",
  "cats/happy6.jpg",
  "cats/happy7.jpg",
  "cats/neutral.jpg",
  "cats/neutral2.jpg",
  "cats/neutral3.jpg",
  "cats/neutral4.jpg",
  "cats/neutral5.jpg",
  "cats/neutral7.jpg",
  "cats/sad.jpg",
  "cats/sad3.jpg",
  "cats/sad5.jpg",
];

/* ---------- dias da semana ---------- */

const DIAS = [
  { id: "segunda", label: "segunda" },
  { id: "terca", label: "terça" },
  { id: "quarta", label: "quarta" },
  { id: "quinta", label: "quinta" },
  { id: "sexta", label: "sexta" },
  { id: "sabado", label: "sábado" },
  { id: "domingo", label: "domingo" }
];

/* ---------- storage helpers ---------- */

const STORAGE_KEYS = {
  exercises: "mt_exercises",
  dayPlans: "mt_dayPlans",
  history: "mt_history",
  log: "mt_log"
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- seed ---------- */

function seedIfEmpty() {
  let exercises = load(STORAGE_KEYS.exercises, null);
  let dayPlans = load(STORAGE_KEYS.dayPlans, null);

  if (!exercises) {
    const supinoId = uid();
    exercises = [
      { id: supinoId, name: "supino reto", muscleGroup: "peito", notes: "" }
    ];
    save(STORAGE_KEYS.exercises, exercises);

    dayPlans = {};
    DIAS.forEach((d) => (dayPlans[d.id] = []));
    dayPlans["segunda"] = [
      {
        exerciseId: supinoId,
        sets: [
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
          { reps: 8, weight: 62.5 }
        ]
      }
    ];
    save(STORAGE_KEYS.dayPlans, dayPlans);
  }

  if (!load(STORAGE_KEYS.history, null)) save(STORAGE_KEYS.history, {});
  if (!load(STORAGE_KEYS.log, null)) save(STORAGE_KEYS.log, {});
}

/* ---------- data helpers ---------- */

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function isoToBR(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function seedDoDia() {
  return dayOfYear(new Date());
}

function fraseDoDia() {
  const idx = seedDoDia() % FRASES_MOTIVACIONAIS.length;
  return FRASES_MOTIVACIONAIS[idx];
}

function gatoDoDia() {
  const idx = seedDoDia() % GATINHOS.length;
  return GATINHOS[idx];
}

function fraseDescansoAleatoria() {
  return FRASES_DESCANSO[Math.floor(Math.random() * FRASES_DESCANSO.length)];
}

/* ---------- streak ---------- */

function isoAddDays(iso, delta) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

function computeStreak() {
  const log = load(STORAGE_KEYS.log, {});
  const today = todayISO();

// encontrar a data mais recente com registro, aceitando no máximo 1 dia de gap
  // (hoje sem registro ainda é ok, contanto que ontem tenha)
  let lastDate = null;
  if (log[today]) {
    lastDate = today;
  } else {
    const ontem = isoAddDays(today, -1);
    if (log[ontem]) lastDate = ontem;
  }

  if (!lastDate) return { count: 0, flame: false };

  // se o último registro foi anteontem ou antes, a streak quebrou
  const gap = (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
  if (gap > 1) return { count: 0, flame: false };

  // contar dias consecutivos para trás a partir de lastDate
  let count = 0;
  let d = lastDate;
  while (log[d]) {
    count++;
    d = isoAddDays(d, -1);
  }

  const flame = log[lastDate].type === "workout";
  return { count, flame };
}

/* ---------- router ---------- */

function getRoute() {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return { page: "home" };
  const parts = hash.split("/");
  if (parts[0] === "dia") return { page: "dia", diaId: parts[1] };
  if (parts[0] === "biblioteca") return { page: "biblioteca" };
  if (parts[0] === "exercicio") return { page: "exercicio", exerciseId: parts[1] };
  return { page: "home" };
}

function navigate(hash) {
  window.location.hash = hash;
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();
  render();
});

/* ---------- toast ---------- */

let toastTimeout = null;
function showToast(msg) {
  let el = document.querySelector(".toast");
  if (el) el.remove();
  el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.remove(), 2600);
}

/* ---------- gatinho do dia (modal) ---------- */

function openGatoDoDiaModal() {
  const gato = gatoDoDia();

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop cat-modal-backdrop";

  const sheet = document.createElement("div");
  sheet.className = "cat-modal-sheet";
  sheet.innerHTML = `
    <p class="modal-title cat-modal-title">gatinho do dia <3</p>
    <div class="cat-image-wrap">
      <img src="${gato}" class="cat-image" alt="gatinho do dia">
    </div>
    <button class="btn-primary cat-close-btn">fechar</button>
  `;
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);

  // dispara a animação (fade-in do fundo, depois do gatinho) só na abertura
  requestAnimationFrame(() => backdrop.classList.add("show"));

  const close = () => backdrop.remove();
  sheet.querySelector(".cat-close-btn").addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
}

/* ---------- confirmação genérica (modal) ---------- */

function openConfirmModal(title, message, confirmLabel, onConfirm) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  const sheet = document.createElement("div");
  sheet.className = "modal-sheet";
  sheet.innerHTML = `
    <p class="modal-title">${title}</p>
    <p style="color:var(--muted);font-size:14px;margin:0 0 18px 0;line-height:1.5;">${message}</p>
    <div class="modal-actions">
      <button class="btn-secondary" id="confirm-cancel">cancelar</button>
      <button class="btn-primary" id="confirm-ok" style="background:#e0455f;">${confirmLabel}</button>
    </div>
  `;
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);

  sheet.querySelector("#confirm-cancel").addEventListener("click", () => backdrop.remove());
  sheet.querySelector("#confirm-ok").addEventListener("click", () => {
    backdrop.remove();
    onConfirm();
  });
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
}

/* ---------- render root ---------- */

function render() {
  const route = getRoute();
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (route.page === "home") app.appendChild(renderHome());
  else if (route.page === "dia") app.appendChild(renderDia(route.diaId));
  else if (route.page === "biblioteca") app.appendChild(renderBiblioteca());
  else if (route.page === "exercicio") app.appendChild(renderExercicio(route.exerciseId));
  else app.appendChild(renderHome());
}

/* ---------- home ---------- */

function renderHome() {
  const wrap = document.createElement("div");

  const phraseCard = document.createElement("div");
  phraseCard.className = "phrase-card";
  phraseCard.textContent = fraseDoDia();
  phraseCard.addEventListener("click", () => openGatoDoDiaModal());
  wrap.appendChild(phraseCard);

  const { count, flame } = computeStreak();
  const streakCard = document.createElement("div");
  streakCard.className = "streak-card";
  streakCard.innerHTML = `
    <div class="streak-left">
      <svg class="streak-star ${flame ? "active" : ""}" viewBox="0 0 24 24" width="30" height="30">
        <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.9-6.1-3.7-6.1 3.7 1.5-6.9-5.2-4.7 6.9-.7z" fill="currentColor"/>
      </svg>
      <div>
        <div class="streak-number">${count} ${count === 1 ? "dia" : "dias"} seguidos</div>
        <div class="streak-label">${flame ? "ebaaaa" : "descanso de hoje"}</div>
      </div>
    </div>
    <button class="rest-btn" id="btn-rest">descanso</button>
  `;
  wrap.appendChild(streakCard);

  streakCard.querySelector("#btn-rest").addEventListener("click", () => {
    const log = load(STORAGE_KEYS.log, {});
    const today = todayISO();
    if (log[today] && log[today].type === "workout") {
      showToast("vc já treinou hoje!");
      return;
    }
    log[today] = { type: "rest" };
    save(STORAGE_KEYS.log, log);
    showToast(fraseDescansoAleatoria());
    render();
  });

  const label = document.createElement("div");
  label.className = "section-label";
  label.textContent = "treinos da semana";
  wrap.appendChild(label);

  const log = load(STORAGE_KEYS.log, {});
  const today = todayISO();
  const todayLog = log[today];

  const grid = document.createElement("div");
  grid.className = "day-grid";
  DIAS.forEach((d) => {
    const btn = document.createElement("button");
    const dayPlans = load(STORAGE_KEYS.dayPlans, {});
    const qtd = (dayPlans[d.id] || []).length;
    btn.className = "day-btn";
    if (todayLog && todayLog.type === "workout" && todayLog.day === d.id) btn.classList.add("done");
    btn.innerHTML = `${d.label}<span class="sub">${qtd} exercício${qtd === 1 ? "" : "s"}</span>`;
    btn.addEventListener("click", () => navigate(`#dia/${d.id}`));
    grid.appendChild(btn);
  });
  wrap.appendChild(grid);

  const libBtn = document.createElement("button");
  libBtn.className = "library-btn";
  libBtn.textContent = "biblioteca de exercícios";
  libBtn.addEventListener("click", () => navigate("#biblioteca"));
  wrap.appendChild(libBtn);

  return wrap;
}

/* ---------- dia (treino) ---------- */

function renderDia(diaId) {
  const dia = DIAS.find((d) => d.id === diaId);
  const wrap = document.createElement("div");

  const topBar = document.createElement("div");
  topBar.className = "top-bar";
  topBar.innerHTML = `<button class="back-btn">←</button><h1 class="page-title">${dia.label}</h1>`;
  topBar.querySelector(".back-btn").addEventListener("click", () => navigate("#"));
  wrap.appendChild(topBar);

  const dayPlans = load(STORAGE_KEYS.dayPlans, {});
  const exercises = load(STORAGE_KEYS.exercises, []);
  let plan = dayPlans[diaId] || [];

  if (plan.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-msg";
    empty.textContent = "nenhum exercício adicionado ainda pra esse dia.";
    wrap.appendChild(empty);
  }

  plan.forEach((item, planIndex) => {
    const ex = exercises.find((e) => e.id === item.exerciseId);
    if (!ex) return;
    wrap.appendChild(renderExerciseCard(ex, item, diaId, planIndex));
  });

  const addBtn = document.createElement("button");
  addBtn.className = "add-exercise-btn";
  addBtn.textContent = "+ adicionar exercício";
  addBtn.addEventListener("click", () => openAddExerciseModal(diaId));
  wrap.appendChild(addBtn);

  if (plan.length > 0) {
    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "salvar treino de hoje";
    saveBtn.addEventListener("click", () => saveDiaTreino(diaId));
    wrap.appendChild(saveBtn);
  }

  return wrap;
}

function renderExerciseCard(ex, item, diaId, planIndex) {
  const card = document.createElement("div");
  card.className = "exercise-card";

  const header = document.createElement("div");
  header.className = "exercise-header";
  header.innerHTML = `
    <div>
      <p class="exercise-name">${ex.name}</p>
      <span class="exercise-muscle">${ex.muscleGroup || ""}</span>
    </div>
    <button class="remove-x">remover</button>
  `;
  header.querySelector(".remove-x").addEventListener("click", () => {
    const dayPlans = load(STORAGE_KEYS.dayPlans, {});
    dayPlans[diaId].splice(planIndex, 1);
    save(STORAGE_KEYS.dayPlans, dayPlans);
    render();
  });
  card.appendChild(header);

  const table = document.createElement("table");
  table.className = "set-table";
  table.innerHTML = `<tr><th>Série</th><th>Reps</th><th>Carga</th></tr>`;

  item.sets.forEach((set, setIndex) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${setIndex + 1}</td>
      <td><input type="number" class="reps-input" value="${set.reps}" min="0"></td>
      <td>
        <div class="weight-cell">
          <button class="round-btn minus">−</button>
          <span class="weight-value">${formatKg(set.weight)}</span>
          <button class="round-btn plus">+</button>
        </div>
      </td>
    `;
    const repsInput = tr.querySelector(".reps-input");
    repsInput.addEventListener("input", () => {
      set.reps = parseInt(repsInput.value, 10) || 0;
      persistPlanSets(diaId, planIndex, item.sets);
    });

    const weightSpan = tr.querySelector(".weight-value");
    tr.querySelector(".plus").addEventListener("click", () => {
      set.weight = Math.round((set.weight + 2.5) * 10) / 10;
      weightSpan.textContent = formatKg(set.weight);
      persistPlanSets(diaId, planIndex, item.sets);
    });
    tr.querySelector(".minus").addEventListener("click", () => {
      set.weight = Math.max(0, Math.round((set.weight - 2.5) * 10) / 10);
      weightSpan.textContent = formatKg(set.weight);
      persistPlanSets(diaId, planIndex, item.sets);
    });

    table.appendChild(tr);
  });

  card.appendChild(table);

  const addSetBtn = document.createElement("button");
  addSetBtn.className = "add-set-btn";
  addSetBtn.textContent = "+ add série";
  addSetBtn.addEventListener("click", () => {
    const last = item.sets[item.sets.length - 1] || { reps: 10, weight: 0 };
    item.sets.push({ reps: last.reps, weight: last.weight });
    persistPlanSets(diaId, planIndex, item.sets);
    render();
  });
  card.appendChild(addSetBtn);

  return card;
}

function formatKg(v) {
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}

function persistPlanSets(diaId, planIndex, sets) {
  const dayPlans = load(STORAGE_KEYS.dayPlans, {});
  dayPlans[diaId][planIndex].sets = sets;
  save(STORAGE_KEYS.dayPlans, dayPlans);
}

function saveDiaTreino(diaId) {
  const dayPlans = load(STORAGE_KEYS.dayPlans, {});
  const history = load(STORAGE_KEYS.history, {});
  const plan = dayPlans[diaId] || [];
  const today = todayISO();

  plan.forEach((item) => {
    if (!history[item.exerciseId]) history[item.exerciseId] = [];
    const lastWeight = item.sets.length ? item.sets[item.sets.length - 1].weight : 0;
    history[item.exerciseId].push({
      date: today,
      weight: lastWeight,
      reps: item.sets.map((s) => s.reps)
    });
  });
  save(STORAGE_KEYS.history, history);

  const log = load(STORAGE_KEYS.log, {});
  log[today] = { type: "workout", day: diaId };
  save(STORAGE_KEYS.log, log);

  showToast("treino salvo! mt bem bebê");
  navigate("#");
}

/* ---------- add exercício ao dia (modal) ---------- */

function openAddExerciseModal(diaId) {
  const exercises = load(STORAGE_KEYS.exercises, []);

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  const sheet = document.createElement("div");
  sheet.className = "modal-sheet";
  sheet.innerHTML = `<p class="modal-title">add exercício</p>`;

  exercises.forEach((ex) => {
    const opt = document.createElement("button");
    opt.className = "pick-option";
    opt.textContent = `${ex.name}${ex.muscleGroup ? " · " + ex.muscleGroup : ""}`;
    opt.addEventListener("click", () => {
      addExerciseToDay(diaId, ex.id);
      backdrop.remove();
      render();
    });
    sheet.appendChild(opt);
  });

  const newBtn = document.createElement("button");
  newBtn.className = "pick-option";
  newBtn.style.color = "#7a7d85";
  newBtn.style.fontWeight = "800";
  newBtn.textContent = "+ criar novo exercício";
  newBtn.addEventListener("click", () => {
    backdrop.remove();
    openNewExerciseModal((newEx) => addExerciseToDay(diaId, newEx.id));
  });
  sheet.appendChild(newBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn-secondary";
  cancelBtn.style.width = "100%";
  cancelBtn.style.marginTop = "10px";
  cancelBtn.textContent = "cancelar";
  cancelBtn.addEventListener("click", () => backdrop.remove());
  sheet.appendChild(cancelBtn);

  backdrop.appendChild(sheet);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
}

function addExerciseToDay(diaId, exerciseId) {
  const dayPlans = load(STORAGE_KEYS.dayPlans, {});
  if (!dayPlans[diaId]) dayPlans[diaId] = [];
  dayPlans[diaId].push({
    exerciseId,
    sets: [
      { reps: 10, weight: 0 },
      { reps: 10, weight: 0 },
      { reps: 10, weight: 0 }
    ]
  });
  save(STORAGE_KEYS.dayPlans, dayPlans);
  render();
}

function openNewExerciseModal(onCreate) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  const sheet = document.createElement("div");
  sheet.className = "modal-sheet";
  sheet.innerHTML = `
    <p class="modal-title">novo exercício</p>
    <div class="field">
      <label>nome</label>
      <input type="text" id="f-name" placeholder="ex: supino reto">
    </div>
    <div class="field">
      <label>grupo muscular</label>
      <input type="text" id="f-muscle" placeholder="ex: peito">
    </div>
    <div class="field">
      <label>observações</label>
      <textarea id="f-notes" placeholder="ex: cuidado com o ombro"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="f-cancel">Cancelar</button>
      <button class="btn-primary" id="f-save">Criar</button>
    </div>
  `;
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);

  sheet.querySelector("#f-cancel").addEventListener("click", () => backdrop.remove());
  sheet.querySelector("#f-save").addEventListener("click", () => {
    const name = sheet.querySelector("#f-name").value.trim();
    if (!name) {
      showToast("dá um nomezinho pro exercício :D");
      return;
    }
    const muscleGroup = sheet.querySelector("#f-muscle").value.trim();
    const notes = sheet.querySelector("#f-notes").value.trim();
    const exercises = load(STORAGE_KEYS.exercises, []);
    const newEx = { id: uid(), name, muscleGroup, notes };
    exercises.push(newEx);
    save(STORAGE_KEYS.exercises, exercises);
    backdrop.remove();
    onCreate(newEx);
  });
}

/* ---------- excluir exercício da biblioteca ---------- */

function countUsosExercicio(exerciseId) {
  const dayPlans = load(STORAGE_KEYS.dayPlans, {});
  let count = 0;
  Object.values(dayPlans).forEach((plan) => {
    (plan || []).forEach((item) => {
      if (item.exerciseId === exerciseId) count++;
    });
  });
  return count;
}

function deleteExercicioDaBiblioteca(exerciseId) {
  // remove definitivamente da biblioteca
  const exercises = load(STORAGE_KEYS.exercises, []).filter((e) => e.id !== exerciseId);
  save(STORAGE_KEYS.exercises, exercises);

  // remove as referências desse exercício em todos os treinos/semana
  const dayPlans = load(STORAGE_KEYS.dayPlans, {});
  Object.keys(dayPlans).forEach((diaId) => {
    dayPlans[diaId] = (dayPlans[diaId] || []).filter((item) => item.exerciseId !== exerciseId);
  });
  save(STORAGE_KEYS.dayPlans, dayPlans);

  // remove o histórico associado, já que o exercício não existe mais
  const history = load(STORAGE_KEYS.history, {});
  delete history[exerciseId];
  save(STORAGE_KEYS.history, history);
}

function confirmarExclusaoExercicio(ex, onDeleted) {
  const usos = countUsosExercicio(ex.id);
  const aviso =
    usos > 0
      ? `esse exercício está em ${usos} treino${usos === 1 ? "" : "s"} da semana. ao excluir, ele será removido de lá também. `
      : "";
  openConfirmModal(
    "excluir exercício?",
    `${aviso}tem certeza que quer excluir "${ex.name}" da biblioteca? essa ação não pode ser desfeita.`,
    "excluir",
    () => {
      deleteExercicioDaBiblioteca(ex.id);
      showToast("exercício excluído da biblioteca");
      onDeleted();
    }
  );
}

/* ---------- biblioteca ---------- */

function renderBiblioteca() {
  const wrap = document.createElement("div");

  const topBar = document.createElement("div");
  topBar.className = "top-bar";
  topBar.innerHTML = `<button class="back-btn">←</button><h1 class="page-title">biblioteca</h1>`;
  topBar.querySelector(".back-btn").addEventListener("click", () => navigate("#"));
  wrap.appendChild(topBar);

  const exercises = load(STORAGE_KEYS.exercises, []);

  if (exercises.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-msg";
    empty.textContent = "nenhum exercício cadastrado ainda.";
    wrap.appendChild(empty);
  }

  exercises.forEach((ex) => {
    const item = document.createElement("div");
    item.className = "exercise-list-item";

    const openBtn = document.createElement("button");
    openBtn.className = "exercise-list-open";
    openBtn.innerHTML = `
      <div style="text-align:left">
        <div class="exercise-list-name">${ex.name}</div>
        <div class="exercise-list-muscle">${ex.muscleGroup || "Sem grupo definido"}</div>
      </div>
    `;
    openBtn.addEventListener("click", () => navigate(`#exercicio/${ex.id}`));
    item.appendChild(openBtn);

    const actions = document.createElement("div");
    actions.className = "exercise-list-actions";

    const delBtn = document.createElement("button");
    delBtn.className = "exercise-list-delete";
    delBtn.setAttribute("aria-label", "excluir exercício");
    delBtn.textContent = "🗑";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmarExclusaoExercicio(ex, () => render());
    });
    actions.appendChild(delBtn);

    const chevron = document.createElement("span");
    chevron.textContent = "›";
    chevron.style.color = "var(--muted)";
    actions.appendChild(chevron);

    item.appendChild(actions);
    wrap.appendChild(item);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "add-exercise-btn";
  addBtn.textContent = "+ novo exercício";
  addBtn.addEventListener("click", () => {
    openNewExerciseModal(() => render());
  });
  wrap.appendChild(addBtn);

  return wrap;
}

/* ---------- detalhe do exercício ---------- */

function renderExercicio(exerciseId) {
  const exercises = load(STORAGE_KEYS.exercises, []);
  const ex = exercises.find((e) => e.id === exerciseId);
  const wrap = document.createElement("div");

  if (!ex) {
    wrap.innerHTML = `<p class="empty-msg">exercício não encontrado.</p>`;
    return wrap;
  }

  const topBar = document.createElement("div");
  topBar.className = "top-bar";
  topBar.innerHTML = `
    <button class="back-btn">←</button>
    <h1 class="page-title" style="flex:1;">${ex.name}</h1>
    <button class="back-btn" id="btn-del-exercicio" aria-label="excluir exercício">🗑</button>
  `;
  topBar.querySelector(".back-btn").addEventListener("click", () => navigate("#biblioteca"));
  topBar.querySelector("#btn-del-exercicio").addEventListener("click", () => {
    confirmarExclusaoExercicio(ex, () => navigate("#biblioteca"));
  });
  wrap.appendChild(topBar);

  const card = document.createElement("div");
  card.className = "exercise-card";
  card.innerHTML = `
    <div class="field">
      <label>grupo muscular</label>
      <input type="text" id="f-muscle" value="${ex.muscleGroup || ""}">
    </div>
    <div class="field">
      <label>observações</label>
      <textarea id="f-notes">${ex.notes || ""}</textarea>
    </div>
  `;
  wrap.appendChild(card);

  const saveEdits = () => {
    ex.muscleGroup = card.querySelector("#f-muscle").value.trim();
    ex.notes = card.querySelector("#f-notes").value.trim();
    const list = load(STORAGE_KEYS.exercises, []);
    const idx = list.findIndex((e) => e.id === exerciseId);
    list[idx] = ex;
    save(STORAGE_KEYS.exercises, list);
  };
  card.querySelector("#f-muscle").addEventListener("blur", saveEdits);
  card.querySelector("#f-notes").addEventListener("blur", saveEdits);

  const label = document.createElement("div");
  label.className = "section-label";
  label.textContent = "histórico completo";
  wrap.appendChild(label);

  const history = load(STORAGE_KEYS.history, {});
  const entries = (history[exerciseId] || []).slice().reverse();

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-msg";
    empty.textContent = "ainda sem histórico... registre um treino pra começar!";
    wrap.appendChild(empty);
  }

  entries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `
      <span class="history-date">${isoToBR(entry.date)}</span>
      <span class="history-weight">${formatKg(entry.weight)}</span>
      <span class="history-reps">${entry.reps.join("/")}</span>
    `;
    wrap.appendChild(row);
  });

  return wrap;
}
