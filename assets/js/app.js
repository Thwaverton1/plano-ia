// Mantem as abas desacopladas do index.html:
// cada seção fica em um arquivo independente dentro de /sections.
const MAIN_SECTION_IDS = [
  'visao',
  'fase1',
  'fase2',
  'fase3',
  'rotina',
  'ultra-aprendizado',
  'painel',
  'recursos',
  'marcos',
  'visao-comp',
  'robotica',
  'drone',
  'automacao',
  'rl',
  'treinamento',
];

const EXTRA_SECTION_IDS = ['mapa'];
const APP_ASSET_VERSION = '20260401-15';
const ULTRA_TRACKER_STORAGE_KEY = 'plano.ultraTracker.v1';
const DAILY_PLANNER_STORAGE_KEY = 'plano.dailyPlanner.v1';
const DAILY_PLANNER_MAX_FILE_BYTES = 1500000;
const PLANNER_STATUS_ORDER = ['backlog', 'pending', 'progress', 'review', 'done'];
const APP_SECTION_SYNC = {};

async function loadSectionHtml(id) {
  const resp = await fetch(`sections/${id}.html?v=${APP_ASSET_VERSION}`);
  if (!resp.ok) {
    throw new Error(`Falha ao carregar seção "${id}" (${resp.status})`);
  }
  return resp.text();
}

async function loadSections() {
  const mainRoot = document.getElementById('sections-main');
  const extraRoot = document.getElementById('sections-extra');
  if (!mainRoot || !extraRoot) {
    throw new Error('Containers de seções não encontrados.');
  }

  const mainHtml = await Promise.all(MAIN_SECTION_IDS.map(loadSectionHtml));
  mainRoot.innerHTML = mainHtml.join('\n');

  const extraHtml = await Promise.all(EXTRA_SECTION_IDS.map(loadSectionHtml));
  extraRoot.innerHTML = extraHtml.join('\n');
}

function ensureToastRoot() {
  let root = document.getElementById('app-toast-root');
  if (root) {
    return root;
  }

  root = document.createElement('div');
  root.id = 'app-toast-root';
  root.className = 'app-toast-root';
  document.body.appendChild(root);
  return root;
}

function showToast(message, tone = 'neutral') {
  const root = ensureToastRoot();
  const toast = document.createElement('div');
  toast.className = `app-toast app-toast-${tone}`;
  toast.textContent = message;
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 180);
  }, 2400);
}

function refreshSection(sectionId) {
  const sync = APP_SECTION_SYNC[sectionId];
  if (typeof sync === 'function') {
    sync();
  }
}

function refreshDataViews() {
  refreshSection('ultra-aprendizado');
  refreshSection('rotina');
  refreshSection('painel');
}

const ULTRA_TRACKER_BASE_TRACKS = [
  'Visão Computacional',
  'Robótica',
  'Drone',
  'Automação',
  'Aprendizado por Reforço',
  'Treinamento de Modelos',
];

function createUltraTrackerItem(id, text) {
  return {
    id,
    text,
    done: false,
  };
}

function getUltraTrackerDefaultWeeks() {
  return [
    {
      id: 'week-1',
      title: 'Mapa + baseline',
      items: [
        createUltraTrackerItem('w1-define-skill', 'Definir a habilidade em linguagem concreta'),
        createUltraTrackerItem('w1-select-sources', 'Escolher 3 referências fortes'),
        createUltraTrackerItem('w1-run-baseline', 'Executar um baseline simples'),
        createUltraTrackerItem('w1-map-gaps', 'Mapear as principais lacunas'),
      ],
    },
    {
      id: 'week-2',
      title: 'Prática direta',
      items: [
        createUltraTrackerItem('w2-build-core', 'Construir a tarefa central da sprint'),
        createUltraTrackerItem('w2-apply-theory', 'Aplicar a teoria imediatamente no projeto'),
        createUltraTrackerItem('w2-log-errors', 'Registrar erros, hipóteses e correções'),
        createUltraTrackerItem('w2-functional-v1', 'Chegar a uma versão funcional'),
      ],
    },
    {
      id: 'week-3',
      title: 'Repetição + retorno',
      items: [
        createUltraTrackerItem('w3-isolate-bottlenecks', 'Isolar os gargalos mais caros'),
        createUltraTrackerItem('w3-deliberate-drills', 'Fazer drills deliberados'),
        createUltraTrackerItem('w3-measure', 'Medir contra baseline, benchmark ou checklist'),
        createUltraTrackerItem('w3-feedback', 'Buscar feedback externo ou comparação forte'),
      ],
    },
    {
      id: 'week-4',
      title: 'Integração + prova',
      items: [
        createUltraTrackerItem('w4-refactor', 'Refatorar e documentar o projeto'),
        createUltraTrackerItem('w4-experiment', 'Executar um experimento fora do tutorial'),
        createUltraTrackerItem('w4-publish', 'Publicar demo, repositório, vídeo ou post'),
        createUltraTrackerItem('w4-retrospective', 'Escrever uma retrospectiva curta'),
      ],
    },
  ].map((week) => ({
    ...week,
    items: week.items.map((item) => ({ ...item })),
  }));
}

function createUltraTrackerFields(seed = {}) {
  return {
    sprintFocus: typeof seed?.sprintFocus === 'string' ? seed.sprintFocus : '',
    track: typeof seed?.track === 'string' ? seed.track : '',
    artifact: typeof seed?.artifact === 'string' ? seed.artifact : '',
    sprintStart: typeof seed?.sprintStart === 'string' ? seed.sprintStart : '',
  };
}

function normalizeUltraTrackerItem(item, fallbackId, legacyChecks = {}) {
  const id = typeof item?.id === 'string' ? item.id : fallbackId || createPlannerId('trk');
  const text = typeof item?.text === 'string'
    ? item.text
    : (typeof item?.label === 'string' ? item.label : 'Novo item');
  const done = typeof item?.done === 'boolean' ? item.done : Boolean(legacyChecks[id]);
  return { id, text, done };
}

function normalizeUltraTrackerWeek(week, index, legacyChecks = {}) {
  const defaultWeek = getUltraTrackerDefaultWeeks()[index] || null;
  const itemsSource = Array.isArray(week?.items)
    ? week.items
    : (defaultWeek?.items || []);

  return {
    id: typeof week?.id === 'string' ? week.id : (defaultWeek?.id || `week-${index + 1}`),
    title: typeof week?.title === 'string' ? week.title : (defaultWeek?.title || `Semana ${index + 1}`),
    items: itemsSource.map((item, itemIndex) => {
      const fallbackId = defaultWeek?.items?.[itemIndex]?.id || `week-${index + 1}-item-${itemIndex + 1}`;
      return normalizeUltraTrackerItem(item, fallbackId, legacyChecks);
    }),
  };
}

function normalizeUltraTrackerSprint(candidate, index = 0, legacyChecks = {}) {
  const weeksSource = Array.isArray(candidate?.weeks) ? candidate.weeks : [];
  return {
    id: typeof candidate?.id === 'string' ? candidate.id : createPlannerId(`uts${index + 1}`),
    fields: createUltraTrackerFields(candidate?.fields || candidate),
    weeks: getUltraTrackerDefaultWeeks().map((week, weekIndex) => (
      normalizeUltraTrackerWeek(weeksSource[weekIndex] ?? week, weekIndex, legacyChecks)
    )),
  };
}

function createUltraTrackerSprint(seed = {}) {
  return normalizeUltraTrackerSprint(seed);
}

function getUltraTrackerDefaultState() {
  const sprint = createUltraTrackerSprint();
  return {
    sprints: [sprint],
    activeSprintId: sprint.id,
    filterTrack: 'all',
  };
}

function normalizeUltraTrackerState(candidate) {
  const explicitSprints = Array.isArray(candidate?.sprints);
  let sprints = [];

  if (explicitSprints) {
    sprints = candidate.sprints.map((sprint, index) => normalizeUltraTrackerSprint(sprint, index));
  } else if (candidate && (candidate.fields || candidate.weeks || candidate.checks)) {
    sprints = [normalizeUltraTrackerSprint(candidate, 0, candidate.checks || {})];
  } else {
    sprints = getUltraTrackerDefaultState().sprints;
  }

  const activeSprintId = typeof candidate?.activeSprintId === 'string' ? candidate.activeSprintId : (sprints[0]?.id || '');
  const filterTrack = typeof candidate?.filterTrack === 'string' ? candidate.filterTrack : 'all';

  return {
    sprints,
    activeSprintId: sprints.some((sprint) => sprint.id === activeSprintId) ? activeSprintId : (sprints[0]?.id || ''),
    filterTrack,
  };
}

function loadUltraTrackerState() {
  try {
    const raw = window.localStorage.getItem(ULTRA_TRACKER_STORAGE_KEY);
    if (!raw) {
      return getUltraTrackerDefaultState();
    }
    return normalizeUltraTrackerState(JSON.parse(raw));
  } catch (err) {
    console.warn('Falha ao carregar o tracker de ultra-aprendizado.', err);
    return getUltraTrackerDefaultState();
  }
}

function saveUltraTrackerState(state) {
  try {
    window.localStorage.setItem(ULTRA_TRACKER_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Falha ao salvar o tracker de ultra-aprendizado.', err);
  }
}

function getUltraTrackerClearedSprint(sprint) {
  return {
    ...sprint,
    fields: createUltraTrackerFields(),
    weeks: sprint.weeks.map((week) => ({
      ...week,
      items: week.items.map((item) => ({ ...item, done: false })),
    })),
  };
}

function getUltraTrackerBaseSprint(sprint) {
  return {
    ...sprint,
    weeks: getUltraTrackerDefaultWeeks(),
  };
}

function normalizeUltraTrackerTrack(track) {
  return String(track || '').trim().replace(/\s+/g, ' ');
}

function getUltraTrackerTrackKey(track) {
  const normalized = normalizeUltraTrackerTrack(track);
  return normalized || '__empty__';
}

function getUltraTrackerTrackLabel(track) {
  const normalized = normalizeUltraTrackerTrack(track);
  return normalized || 'Sem trilha';
}

function getUltraTrackerFilterOptions(state) {
  const counts = new Map();

  state.sprints.forEach((sprint) => {
    const key = getUltraTrackerTrackKey(sprint.fields.track);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  if (state.filterTrack !== 'all' && !counts.has(state.filterTrack)) {
    counts.set(state.filterTrack, 0);
  }

  return [
    { value: 'all', label: 'Todas', count: state.sprints.length },
    ...Array.from(counts.entries())
      .map(([value, count]) => ({
        value,
        label: value === '__empty__' ? 'Sem trilha' : value,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
  ];
}

function sprintMatchesUltraTrackerFilter(sprint, filterTrack) {
  if (filterTrack === 'all') {
    return true;
  }
  return getUltraTrackerTrackKey(sprint.fields.track) === filterTrack;
}

function getFilteredUltraTrackerSprints(state) {
  return state.sprints.filter((sprint) => sprintMatchesUltraTrackerFilter(sprint, state.filterTrack));
}

function findUltraTrackerSprint(state, sprintId) {
  return state.sprints.find((sprint) => sprint.id === sprintId) || null;
}

function getActiveUltraTrackerSprint(state) {
  const filteredSprints = getFilteredUltraTrackerSprints(state);
  const selectedSprint = findUltraTrackerSprint(state, state.activeSprintId);
  if (selectedSprint && filteredSprints.some((sprint) => sprint.id === selectedSprint.id)) {
    return selectedSprint;
  }
  return filteredSprints[0] || null;
}

function syncUltraTrackerActiveSprint(state) {
  const activeSprint = getActiveUltraTrackerSprint(state);
  state.activeSprintId = activeSprint ? activeSprint.id : '';
  return activeSprint;
}

function findUltraTrackerWeek(sprint, weekId) {
  if (!sprint) {
    return null;
  }
  return sprint.weeks.find((week) => week.id === weekId) || null;
}

function parseTrackerItemKey(key) {
  const [weekId, itemId] = String(key || '').split('::');
  return { weekId, itemId };
}

function findUltraTrackerItem(sprint, weekId, itemId) {
  const week = findUltraTrackerWeek(sprint, weekId);
  if (!week) {
    return { week: null, item: null };
  }

  const item = week.items.find((entry) => entry.id === itemId) || null;
  return { week, item };
}

function getUltraTrackerSprintProgress(sprint) {
  const total = sprint.weeks.reduce((sum, week) => sum + week.items.length, 0);
  const done = sprint.weeks.reduce(
    (sum, week) => sum + week.items.filter((item) => item.done).length,
    0,
  );
  return {
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

function parseTrackerDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTrackerSchedule(startValue) {
  const startDate = parseTrackerDate(startValue);
  if (!startDate) {
    return { activeWeek: null, status: 'Sem data de inicio' };
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.floor((todayStart - startDate) / 86400000);

  if (diffDays < 0) {
    return { activeWeek: 1, status: `Comeca em ${Math.abs(diffDays)} dia(s)` };
  }

  const activeWeek = Math.floor(diffDays / 7) + 1;
  if (activeWeek > 4) {
    return { activeWeek: 4, status: 'Sprint passou da 4a semana' };
  }

  return { activeWeek, status: `Semana ${activeWeek} em andamento` };
}

function renderUltraTrackerTrashIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2z"></path>
      <path d="M7 8h10l-1 11H8L7 8z"></path>
      <path d="M10 11v5"></path>
      <path d="M14 11v5"></path>
    </svg>
  `;
}

function getTrackerWeekTone(index) {
  return ['purple', 'teal', 'amber', 'coral'][index] || 'purple';
}

function getTrackerWeekStatusLabel(weekNumber, schedule, weekDone, weekTotal) {
  if (weekTotal > 0 && weekDone === weekTotal) {
    return 'Concluída';
  }
  if (schedule.activeWeek === weekNumber) {
    return 'Atual';
  }
  return 'Pendente';
}

function renderUltraTracker(root, state, focusItemKey = '') {
  const activeSprint = syncUltraTrackerActiveSprint(state);

  const filteredSprints = getFilteredUltraTrackerSprints(state);
  const progress = activeSprint ? getUltraTrackerSprintProgress(activeSprint) : { total: 0, done: 0, percent: 0 };
  const schedule = getTrackerSchedule(activeSprint?.fields?.sprintStart);
  const datalist = root.querySelector('#ultra-track-list');
  const allTracks = Array.from(new Set([
    ...ULTRA_TRACKER_BASE_TRACKS,
    ...state.sprints
      .map((sprint) => normalizeUltraTrackerTrack(sprint.fields.track))
      .filter(Boolean),
  ])).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  if (datalist) {
    datalist.innerHTML = allTracks.map((track) => `<option value="${escapeHtml(track)}"></option>`).join('');
  }

  root.querySelectorAll('[data-tracker-field]').forEach((input) => {
    const key = input.dataset.trackerField;
    input.value = activeSprint ? (activeSprint.fields[key] || '') : '';
    input.disabled = !activeSprint;
  });

  const filterList = root.querySelector('[data-tracker-filter-list]');
  if (filterList) {
    filterList.innerHTML = getUltraTrackerFilterOptions(state)
      .map((option) => `
        <button
          class="tracker-filter-chip ${state.filterTrack === option.value ? 'is-active' : ''}"
          type="button"
          data-tracker-filter="${escapeHtml(option.value)}"
        >
          <span>${escapeHtml(option.label)}</span>
          <span class="tracker-filter-chip-count">${option.count}</span>
        </button>
      `)
      .join('');
  }

  const filterMeta = root.querySelector('[data-tracker-filter-meta]');
  if (filterMeta) {
    filterMeta.textContent = filteredSprints.length
      ? `${filteredSprints.length} sprint(s) visível(is).`
      : 'Nenhuma sprint nesta trilha.';
  }

  const sprintList = root.querySelector('[data-tracker-sprint-list]');
  if (sprintList) {
    const sprintCards = filteredSprints
      .map((sprint) => {
        const sprintProgress = getUltraTrackerSprintProgress(sprint);
        const isActive = activeSprint && sprint.id === activeSprint.id;
        const sprintTitle = normalizeUltraTrackerTrack(sprint.fields.sprintFocus) || 'Nova sprint';
        const sprintTrack = getUltraTrackerTrackLabel(sprint.fields.track);
        const sprintStart = sprint.fields.sprintStart ? formatPlannerDate(sprint.fields.sprintStart) : 'Sem data';
        return `
          <div class="tracker-sprint-card ${isActive ? 'is-active' : ''}">
            <button class="tracker-sprint-main" type="button" data-tracker-select-sprint="${escapeHtml(sprint.id)}">
              <span class="tracker-sprint-track">${escapeHtml(sprintTrack)}</span>
              <strong class="tracker-sprint-title">${escapeHtml(sprintTitle)}</strong>
              <span class="tracker-sprint-meta">${sprintProgress.done}/${sprintProgress.total} · ${sprintProgress.percent}% · ${escapeHtml(sprintStart)}</span>
            </button>
            <button
              class="tracker-icon-btn"
              type="button"
              data-tracker-delete-sprint="${escapeHtml(sprint.id)}"
              aria-label="Excluir sprint"
              title="Excluir sprint"
            >
              ${renderUltraTrackerTrashIcon()}
            </button>
          </div>
        `;
      })
      .join('');

    const addSprintCard = `
      <div class="tracker-sprint-card tracker-sprint-add">
        <button class="tracker-sprint-add-btn" type="button" data-tracker-add-sprint>
          <span class="tracker-sprint-add-icon">+</span>
          <strong>Nova sprint</strong>
          <span>Crie outro ciclo de 4 semanas</span>
        </button>
      </div>
    `;

    sprintList.innerHTML = filteredSprints.length
      ? `${sprintCards}${addSprintCard}`
      : `
        <div class="tracker-empty-state">
          <div class="tracker-empty-title">Nenhuma sprint nesta trilha</div>
          <div class="tracker-empty-sub">Crie uma sprint nova para começar esse ciclo de 4 semanas.</div>
        </div>
        ${addSprintCard}
      `;
  }

  const sprintCountEl = root.querySelector('[data-tracker-sprint-count]');
  const sprintPercentEl = root.querySelector('[data-tracker-sprint-percent]');
  const sprintFillEl = root.querySelector('[data-tracker-sprint-fill]');
  if (sprintCountEl) sprintCountEl.textContent = `${progress.done}/${progress.total} tarefas`;
  if (sprintPercentEl) sprintPercentEl.textContent = `${progress.percent}%`;
  if (sprintFillEl) sprintFillEl.style.width = `${progress.percent}%`;

  const activeWeekStats = activeSprint && schedule.activeWeek
    ? (() => {
        const week = activeSprint.weeks[schedule.activeWeek - 1];
        const total = week ? week.items.length : 0;
        const done = week ? week.items.filter((item) => item.done).length : 0;
        const percent = total ? Math.round((done / total) * 100) : 0;
        return { total, done, percent };
      })()
    : null;

  const activeWeekLabelEl = root.querySelector('[data-tracker-active-week-label]');
  const activeWeekCountEl = root.querySelector('[data-tracker-active-week-count]');
  const activeWeekStatusEl = root.querySelector('[data-tracker-active-week-status]');
  const activeWeekFillEl = root.querySelector('[data-tracker-active-week-fill]');
  if (activeWeekLabelEl) {
    activeWeekLabelEl.textContent = activeSprint && schedule.activeWeek ? `Semana ${schedule.activeWeek}` : 'Sem sprint ativa';
  }
  if (activeWeekCountEl) {
    activeWeekCountEl.textContent = activeWeekStats ? `${activeWeekStats.done}/${activeWeekStats.total} tarefas` : '0/0 tarefas';
  }
  if (activeWeekStatusEl) {
    activeWeekStatusEl.textContent = activeSprint ? schedule.status : 'Selecione ou crie uma sprint';
  }
  if (activeWeekFillEl) {
    activeWeekFillEl.style.width = `${activeWeekStats ? activeWeekStats.percent : 0}%`;
  }

  const weeksRoot = root.querySelector('[data-tracker-weeks]');
  if (weeksRoot) {
    weeksRoot.innerHTML = activeSprint
      ? activeSprint.weeks
          .map((week, index) => {
            const weekNumber = index + 1;
            const weekDone = week.items.filter((item) => item.done).length;
            const weekTotal = week.items.length;
            const weekPercent = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;
            const isCurrent = schedule.activeWeek === weekNumber;
            const isComplete = weekTotal > 0 && weekDone === weekTotal;
            const tone = getTrackerWeekTone(index);
            const statusLabel = getTrackerWeekStatusLabel(weekNumber, schedule, weekDone, weekTotal);

            return `
              <div class="tracker-week-card tracker-week-${tone} ${isCurrent ? 'is-current' : ''} ${isComplete ? 'is-complete' : ''}">
                <div class="tracker-week-head">
                  <div class="tracker-week-top">
                    <span class="tracker-week-kicker">Semana ${weekNumber}</span>
                    <span class="tracker-week-count">${weekDone}/${weekTotal}</span>
                  </div>
                  <div class="tracker-week-title-row">
                    <input
                      class="tracker-week-title-input"
                      type="text"
                      data-tracker-week-title="${escapeHtml(week.id)}"
                      value="${escapeHtml(week.title)}"
                      placeholder="Nome da semana"
                    >
                    <button class="tracker-mini-btn" type="button" data-tracker-add-item="${escapeHtml(week.id)}">+ Item</button>
                  </div>
                  <div class="progress-bar tracker-week-progress">
                    <div class="progress-fill tracker-fill tracker-fill-${tone}" style="width:${weekPercent}%"></div>
                  </div>
                  <div class="tracker-week-status-row">
                    <span class="tracker-week-status">${statusLabel}</span>
                    <span class="tracker-week-percent">${weekPercent}%</span>
                  </div>
                </div>
                <div class="tracker-item-list">
                  ${
                    week.items.length
                      ? week.items
                          .map((item) => {
                            const compositeKey = `${week.id}::${item.id}`;
                            return `
                              <div class="tracker-item-row ${item.done ? 'is-done' : ''}">
                                <input
                                  class="tracker-item-check"
                                  type="checkbox"
                                  data-tracker-item-check="${escapeHtml(compositeKey)}"
                                  ${item.done ? 'checked' : ''}
                                >
                                <input
                                  class="tracker-item-input"
                                  type="text"
                                  data-tracker-item-text="${escapeHtml(compositeKey)}"
                                  value="${escapeHtml(item.text)}"
                                  placeholder="Novo item"
                                >
                                <button
                                  class="tracker-icon-btn"
                                  type="button"
                                  data-tracker-delete-item="${escapeHtml(compositeKey)}"
                                  aria-label="Excluir item"
                                  title="Excluir item"
                                >
                                  ${renderUltraTrackerTrashIcon()}
                                </button>
                              </div>
                            `;
                          })
                          .join('')
                      : '<div class="tracker-empty-list">Sem itens nesta semana. Use + Item.</div>'
                  }
                </div>
              </div>
            `;
          })
          .join('')
      : `
        <div class="tracker-empty-state">
          <div class="tracker-empty-title">Nada para mostrar</div>
          <div class="tracker-empty-sub">Crie uma sprint nova ou troque o filtro de trilha.</div>
          <button class="tracker-btn" type="button" data-tracker-add-sprint>Nova sprint</button>
        </div>
      `;
  }

  if (focusItemKey) {
    const focusEl = root.querySelector(`[data-tracker-item-text="${focusItemKey}"]`);
    if (focusEl) {
      focusEl.focus();
      focusEl.select();
    }
  }
}

function initUltraTracker() {
  const root = document.getElementById('ultra-tracker');
  if (!root) {
    return;
  }

  let state = loadUltraTrackerState();
  let pendingFocusItemKey = '';
  const fieldEls = Array.from(root.querySelectorAll('[data-tracker-field]'));
  const syncUltraTrackerFromStorage = () => {
    state = loadUltraTrackerState();
    renderUltraTracker(root, state, pendingFocusItemKey);
    pendingFocusItemKey = '';
  };

  fieldEls.forEach((el) => {
    el.addEventListener('input', () => {
      const activeSprint = getActiveUltraTrackerSprint(state);
      if (!activeSprint) {
        return;
      }

      const key = el.dataset.trackerField;
      activeSprint.fields[key] = el.value;

      if (key === 'track' && state.filterTrack !== 'all') {
        state.filterTrack = getUltraTrackerTrackKey(activeSprint.fields.track);
      }

      syncUltraTrackerActiveSprint(state);
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      refreshSection('painel');
    });
  });

  const resetButton = root.querySelector('[data-tracker-reset]');
  const restoreButton = root.querySelector('[data-tracker-restore]');
  const addSprintButton = root.querySelector('[data-tracker-add-sprint]');
  const exportButton = root.querySelector('[data-tracker-export]');
  const importTriggerButton = root.querySelector('[data-tracker-import-trigger]');
  const importFileInput = root.querySelector('[data-tracker-import-file]');

  root.addEventListener('input', (event) => {
    const activeSprint = getActiveUltraTrackerSprint(state);
    if (!activeSprint) {
      return;
    }

    if (event.target.matches('[data-tracker-week-title]')) {
      const week = findUltraTrackerWeek(activeSprint, event.target.dataset.trackerWeekTitle);
      if (!week) {
        return;
      }
      week.title = event.target.value;
      saveUltraTrackerState(state);
      refreshSection('painel');
      return;
    }

    if (event.target.matches('[data-tracker-item-text]')) {
      const { weekId, itemId } = parseTrackerItemKey(event.target.dataset.trackerItemText);
      const { item } = findUltraTrackerItem(activeSprint, weekId, itemId);
      if (!item) {
        return;
      }
      item.text = event.target.value;
      saveUltraTrackerState(state);
      refreshSection('painel');
    }
  });

  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-tracker-item-check]')) {
      const activeSprint = getActiveUltraTrackerSprint(state);
      if (!activeSprint) {
        return;
      }

      const { weekId, itemId } = parseTrackerItemKey(event.target.dataset.trackerItemCheck);
      const { item } = findUltraTrackerItem(activeSprint, weekId, itemId);
      if (!item) {
        return;
      }

      item.done = event.target.checked;
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      refreshSection('painel');
    }
  });

  root.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-tracker-filter]');
    if (filterButton) {
      state.filterTrack = filterButton.dataset.trackerFilter;
      syncUltraTrackerActiveSprint(state);
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      return;
    }

    const selectSprintButton = event.target.closest('[data-tracker-select-sprint]');
    if (selectSprintButton) {
      state.activeSprintId = selectSprintButton.dataset.trackerSelectSprint;
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      return;
    }

    const createSprint = () => {
      const presetTrack = state.filterTrack !== 'all' && state.filterTrack !== '__empty__' ? state.filterTrack : '';
      const sprint = createUltraTrackerSprint({ fields: { track: presetTrack } });
      state.sprints.unshift(sprint);
      state.activeSprintId = sprint.id;
      if (presetTrack) {
        state.filterTrack = presetTrack;
      }
      syncUltraTrackerActiveSprint(state);
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      refreshSection('painel');
      const focusEl = root.querySelector('[data-tracker-field="sprintFocus"]');
      if (focusEl) {
        focusEl.focus();
        focusEl.select();
      }
      showToast('Nova sprint criada.', 'success');
    };

    if (addSprintButton && event.target.closest('[data-tracker-add-sprint]')) {
      createSprint();
      return;
    }

    const deleteSprintButton = event.target.closest('[data-tracker-delete-sprint]');
    if (deleteSprintButton) {
      const sprintId = deleteSprintButton.dataset.trackerDeleteSprint;
      state.sprints = state.sprints.filter((sprint) => sprint.id !== sprintId);
      syncUltraTrackerActiveSprint(state);
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      refreshSection('painel');
      showToast('Sprint excluída.', 'neutral');
      return;
    }

    const addItemButton = event.target.closest('[data-tracker-add-item]');
    if (addItemButton) {
      const activeSprint = getActiveUltraTrackerSprint(state);
      const week = findUltraTrackerWeek(activeSprint, addItemButton.dataset.trackerAddItem);
      if (!week) {
        return;
      }

      const item = createUltraTrackerItem(createPlannerId('trk'), 'Novo item');
      week.items.push(item);
      pendingFocusItemKey = `${week.id}::${item.id}`;
      saveUltraTrackerState(state);
      renderUltraTracker(root, state, pendingFocusItemKey);
      pendingFocusItemKey = '';
      refreshSection('painel');
      return;
    }

    const deleteItemButton = event.target.closest('[data-tracker-delete-item]');
    if (deleteItemButton) {
      const activeSprint = getActiveUltraTrackerSprint(state);
      const { weekId, itemId } = parseTrackerItemKey(deleteItemButton.dataset.trackerDeleteItem);
      const week = findUltraTrackerWeek(activeSprint, weekId);
      if (!week) {
        return;
      }

      week.items = week.items.filter((item) => item.id !== itemId);
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      refreshSection('painel');
      return;
    }
  });

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const activeSprint = getActiveUltraTrackerSprint(state);
      if (!activeSprint) {
        showToast('Nenhuma sprint para exportar.', 'error');
        return;
      }

      const focus = activeSprint.fields.sprintFocus || 'sprint';
      const safeFocus = focus.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sprint';
      downloadJsonFile(`ultra-tracker-${safeFocus}.json`, {
        fields: activeSprint.fields,
        weeks: activeSprint.weeks,
      });
    });
  }

  if (importTriggerButton && importFileInput) {
    importTriggerButton.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', async () => {
      const [file] = importFileInput.files || [];
      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        if (Array.isArray(parsed?.sprints)) {
          state = normalizeUltraTrackerState(parsed);
        } else {
          const importedSprint = normalizeUltraTrackerSprint(parsed, state.sprints.length, parsed?.checks || {});
          importedSprint.id = createPlannerId('uts');
          state.sprints.unshift(importedSprint);
          state.activeSprintId = importedSprint.id;
          state.filterTrack = normalizeUltraTrackerTrack(importedSprint.fields.track) ? getUltraTrackerTrackKey(importedSprint.fields.track) : 'all';
        }

        syncUltraTrackerActiveSprint(state);
        saveUltraTrackerState(state);
        renderUltraTracker(root, state);
        refreshSection('painel');
        showToast('Sprint importada.', 'success');
      } catch (err) {
        showToast('Arquivo inválido do tracker.', 'error');
        console.warn('Falha ao importar o tracker de ultra-aprendizado.', err);
      } finally {
        importFileInput.value = '';
      }
    });
  }

  if (restoreButton) {
    restoreButton.addEventListener('click', () => {
      const activeSprint = getActiveUltraTrackerSprint(state);
      if (!activeSprint) {
        return;
      }

      const restored = getUltraTrackerBaseSprint(activeSprint);
      const index = state.sprints.findIndex((sprint) => sprint.id === activeSprint.id);
      if (index >= 0) {
        state.sprints[index] = restored;
      }

      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      refreshSection('painel');
      showToast('Modelo base restaurado.', 'neutral');
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      const activeSprint = getActiveUltraTrackerSprint(state);
      if (!activeSprint) {
        return;
      }

      const cleared = getUltraTrackerClearedSprint(activeSprint);
      const index = state.sprints.findIndex((sprint) => sprint.id === activeSprint.id);
      if (index >= 0) {
        state.sprints[index] = cleared;
      }
      state.filterTrack = 'all';
      syncUltraTrackerActiveSprint(state);
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
      refreshSection('painel');
      showToast('Sprint limpa.', 'neutral');
    });
  }

  APP_SECTION_SYNC['ultra-aprendizado'] = syncUltraTrackerFromStorage;
  syncUltraTrackerFromStorage();
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createPlannerId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createPlannerSubtask() {
  return {
    id: createPlannerId('sub'),
    title: 'Nova subtarefa',
    time: '',
    done: false,
    deliveryText: '',
    attachment: null,
  };
}

function createPlannerTask(status = 'pending') {
  return {
    id: createPlannerId('task'),
    title: 'Nova tarefa',
    priority: 'medium',
    status,
    expanded: false,
    done: false,
    subtasks: [],
  };
}

function normalizePlannerAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object' || typeof attachment.dataUrl !== 'string') {
    return null;
  }

  return {
    name: typeof attachment.name === 'string' ? attachment.name : 'anexo',
    type: typeof attachment.type === 'string' ? attachment.type : 'application/octet-stream',
    size: Number.isFinite(attachment.size) ? attachment.size : 0,
    dataUrl: attachment.dataUrl,
  };
}

function normalizePlannerSubtask(subtask) {
  return {
    id: typeof subtask?.id === 'string' ? subtask.id : createPlannerId('sub'),
    title: typeof subtask?.title === 'string' ? subtask.title : 'Nova subtarefa',
    time: typeof subtask?.time === 'string' ? subtask.time : '',
    done: Boolean(subtask?.done),
    deliveryText: typeof subtask?.deliveryText === 'string' ? subtask.deliveryText : '',
    attachment: normalizePlannerAttachment(subtask?.attachment),
  };
}

function normalizePlannerTask(task) {
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks.map(normalizePlannerSubtask) : [];
  return {
    id: typeof task?.id === 'string' ? task.id : createPlannerId('task'),
    title: typeof task?.title === 'string' ? task.title : 'Nova tarefa',
    priority: ['high', 'medium', 'low'].includes(task?.priority) ? task.priority : 'medium',
    status: PLANNER_STATUS_ORDER.includes(task?.status) ? task.status : (task?.done ? 'done' : 'pending'),
    expanded: typeof task?.expanded === 'boolean' ? task.expanded : false,
    done: Boolean(task?.done),
    subtasks,
  };
}

function createPlannerDay(day) {
  const tasks = Array.isArray(day?.tasks) ? day.tasks.map(normalizePlannerTask) : [];
  return { tasks };
}

function getDailyPlannerDefaultState() {
  return {
    selectedDate: getTodayIsoDate(),
    filterStatus: 'all',
    days: {},
  };
}

function normalizeDailyPlannerState(candidate) {
  const selectedDate = typeof candidate?.selectedDate === 'string' ? candidate.selectedDate : getTodayIsoDate();
  const filterStatus = ['all', 'pending', 'done'].includes(candidate?.filterStatus) ? candidate.filterStatus : 'all';
  const days = {};

  if (candidate?.days && typeof candidate.days === 'object') {
    Object.entries(candidate.days).forEach(([date, day]) => {
      days[date] = createPlannerDay(day);
    });
  }

  return { selectedDate, filterStatus, days };
}

function loadDailyPlannerState() {
  try {
    const raw = window.localStorage.getItem(DAILY_PLANNER_STORAGE_KEY);
    if (!raw) {
      return getDailyPlannerDefaultState();
    }
    return normalizeDailyPlannerState(JSON.parse(raw));
  } catch (err) {
    console.warn('Falha ao carregar o planejador diario.', err);
    return getDailyPlannerDefaultState();
  }
}

function saveDailyPlannerState(state, quiet = false) {
  try {
    window.localStorage.setItem(DAILY_PLANNER_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Falha ao salvar o planejador diario.', err);
    if (!quiet) {
      showToast('Nao foi possivel salvar no navegador.', 'error');
    }
    return false;
  }
}

function getPlannerDay(state, date = state.selectedDate) {
  if (!state.days[date]) {
    state.days[date] = createPlannerDay();
  }
  return state.days[date];
}

function findPlannerTask(day, taskId) {
  return day.tasks.find((task) => task.id === taskId) || null;
}

function findPlannerSubtask(day, taskId, subtaskId) {
  const task = findPlannerTask(day, taskId);
  if (!task) {
    return { task: null, subtask: null };
  }

  const subtask = task.subtasks.find((item) => item.id === subtaskId) || null;
  return { task, subtask };
}

function parsePlannerSubtaskKey(key) {
  const [taskId, subtaskId] = String(key || '').split('::');
  return { taskId, subtaskId };
}

function formatPlannerDate(isoDate) {
  const [year = '', month = '', day = ''] = String(isoDate || '').split('-');
  if (!year || !month || !day) {
    return isoDate || '';
  }
  return `${day}/${month}/${year}`;
}

function getPlannerPriorityMeta(priority) {
  const map = {
    high: { label: 'Alta', className: 'planner-priority-high' },
    medium: { label: 'Média', className: 'planner-priority-medium' },
    low: { label: 'Baixa', className: 'planner-priority-low' },
  };
  return map[priority] || map.medium;
}

function getPlannerStatusMeta(status) {
  const map = {
    backlog: { label: 'BACKLOG', className: 'planner-status-backlog' },
    pending: { label: 'PENDENTE', className: 'planner-status-pending' },
    progress: { label: 'EM PROGRESSO', className: 'planner-status-progress' },
    review: { label: 'EM REVISÃO', className: 'planner-status-review' },
    done: { label: 'CONCLUÍDO', className: 'planner-status-done' },
  };
  return map[status] || map.pending;
}

function isPlannerTaskDone(task) {
  return task.status === 'done';
}

function getPlannerFilterCounts(day) {
  return {
    all: day.tasks.length,
    pending: day.tasks.filter((task) => !isPlannerTaskDone(task)).length,
    done: day.tasks.filter((task) => isPlannerTaskDone(task)).length,
  };
}

function getPlannerFilterMeta(filterStatus, counts) {
  const total = counts?.all ?? 0;
  const pending = counts?.pending ?? 0;
  const done = counts?.done ?? 0;
  const map = {
    all: `${total} tarefa(s) neste dia.`,
    pending: `${pending} tarefa(s) pendente(s).`,
    done: `${done} tarefa(s) concluída(s).`,
  };
  return map[filterStatus] || map.all;
}

function shouldShowPlannerSubtask(subtask, filterStatus) {
  if (filterStatus === 'pending') {
    return !subtask.done;
  }
  if (filterStatus === 'done') {
    return subtask.done;
  }
  return true;
}

function shouldShowPlannerTask(task, filterStatus) {
  if (filterStatus === 'pending') {
    return !isPlannerTaskDone(task);
  }
  if (filterStatus === 'done') {
    return isPlannerTaskDone(task);
  }
  return true;
}

function indentMultiline(text, prefix) {
  return String(text || '')
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function buildDailyPlannerReport(state) {
  const day = getPlannerDay(state);
  const taskTotal = day.tasks.length;
  const subtaskTotal = day.tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
  const doneTotal = day.tasks.reduce((sum, task) => sum + task.subtasks.filter((subtask) => subtask.done).length, 0);
  const deliveryTotal = day.tasks.reduce((sum, task) => sum + countPlannerDeliveries(task), 0);
  const lines = [
    `Relatorio do dia - ${formatPlannerDate(state.selectedDate)}`,
    `Tarefas: ${taskTotal} | Subtarefas: ${subtaskTotal} | Concluidas: ${doneTotal} | Entregas: ${deliveryTotal}`,
    '',
  ];

  if (!day.tasks.length) {
    lines.push('Nenhuma tarefa registrada neste dia.');
    return lines.join('\n').trim();
  }

  PLANNER_STATUS_ORDER.forEach((status) => {
    const tasks = day.tasks.filter((task) => task.status === status);
    if (!tasks.length) {
      return;
    }

    const statusMeta = getPlannerStatusMeta(status);
    lines.push(`${statusMeta.label} (${tasks.length})`);

    tasks.forEach((task, taskIndex) => {
      const priority = getPlannerPriorityMeta(task.priority);
      const completedSubtasks = task.subtasks.filter((subtask) => subtask.done).length;
      lines.push(`${taskIndex + 1}. ${task.title} [${priority.label}] - ${completedSubtasks}/${task.subtasks.length} concluidas`);

      task.subtasks.forEach((subtask) => {
        const timePrefix = subtask.time ? `${subtask.time} | ` : '';
        const subtaskStatus = subtask.done ? 'OK' : 'PENDENTE';
        lines.push(`- ${timePrefix}${subtaskStatus} ${subtask.title}`);
        if (subtask.deliveryText.trim()) {
          lines.push(indentMultiline(subtask.deliveryText.trim(), '  Entrega: '));
        }
        if (subtask.attachment) {
          lines.push(`  Arquivo: ${subtask.attachment.name} (${formatBytes(subtask.attachment.size)})`);
        }
      });

      lines.push('');
    });
  });

  return lines.join('\n').trim();
}

function syncDailyPlannerReportBox(root, state) {
  const reportBox = root.querySelector('[data-planner-report-box]');
  const reportTextEl = root.querySelector('[data-planner-report-text]');
  if (!reportBox || !reportTextEl || reportBox.hidden) {
    return;
  }

  reportTextEl.value = buildDailyPlannerReport(state);
}

function getTaskTimeSummary(task) {
  const times = task.subtasks
    .map((subtask) => subtask.time)
    .filter(Boolean)
    .sort();

  if (!times.length) {
    return '—';
  }

  if (times.length === 1) {
    return times[0];
  }

  return `${times[0]} +${times.length - 1}`;
}

function renderPlannerPriorityOptions(selectedValue) {
  return [
    ['high', 'Alta'],
    ['medium', 'Média'],
    ['low', 'Baixa'],
  ]
    .map(([value, label]) => `<option value="${value}" ${selectedValue === value ? 'selected' : ''}>${label}</option>`)
    .join('');
}

function renderPlannerStatusOptions(selectedValue) {
  return PLANNER_STATUS_ORDER
    .map((status) => {
      const meta = getPlannerStatusMeta(status);
      return `<option value="${status}" ${selectedValue === status ? 'selected' : ''}>${meta.label}</option>`;
    })
    .join('');
}

function renderPlannerTrashIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2z"></path>
      <path d="M7 8h10l-1 11H8L7 8z"></path>
      <path d="M10 11v5"></path>
      <path d="M14 11v5"></path>
    </svg>
  `;
}

function countPlannerDeliveries(task) {
  return task.subtasks.filter((subtask) => subtask.deliveryText.trim() || subtask.attachment).length;
}

function syncPlannerTaskDone(task) {
  task.done = task.subtasks.length > 0 && task.subtasks.every((subtask) => subtask.done);
  if (!task.done && task.status === 'done') {
    task.status = task.subtasks.some((subtask) => subtask.done) ? 'review' : 'progress';
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

function renderDailyPlannerStats(root, state) {
  const day = getPlannerDay(state);
  const taskTotal = day.tasks.length;
  const subtaskTotal = day.tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
  const doneTotal = day.tasks.reduce(
    (sum, task) => sum + task.subtasks.filter((subtask) => subtask.done).length,
    0,
  );
  const deliveryTotal = day.tasks.reduce((sum, task) => sum + countPlannerDeliveries(task), 0);

  const taskTotalEl = root.querySelector('[data-planner-task-total]');
  const subtaskTotalEl = root.querySelector('[data-planner-subtask-total]');
  const doneTotalEl = root.querySelector('[data-planner-done-total]');
  const deliveryTotalEl = root.querySelector('[data-planner-delivery-total]');

  if (taskTotalEl) taskTotalEl.textContent = String(taskTotal);
  if (subtaskTotalEl) subtaskTotalEl.textContent = String(subtaskTotal);
  if (doneTotalEl) doneTotalEl.textContent = String(doneTotal);
  if (deliveryTotalEl) deliveryTotalEl.textContent = String(deliveryTotal);
}

function renderDailyPlanner(root, state) {
  const dateInput = root.querySelector('[data-planner-date]');
  if (dateInput) {
    dateInput.value = state.selectedDate;
  }

  const day = getPlannerDay(state);
  const filterCounts = getPlannerFilterCounts(day);

  root.querySelectorAll('[data-planner-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.plannerFilter === state.filterStatus);
    const countEl = button.querySelector('[data-planner-filter-count]');
    if (countEl) {
      countEl.textContent = String(filterCounts[button.dataset.plannerFilter] ?? 0);
    }
  });

  const filterMetaEl = root.querySelector('[data-planner-filter-meta]');
  if (filterMetaEl) {
    filterMetaEl.textContent = getPlannerFilterMeta(state.filterStatus, filterCounts);
  }

  renderDailyPlannerStats(root, state);

  const listRoot = root.querySelector('[data-planner-list]');
  if (!listRoot) {
    return;
  }

  const hasAnyTasks = day.tasks.length > 0;
  root.classList.toggle('is-empty', !hasAnyTasks);

  const toolbar = root.querySelector('.planner-toolbar');
  if (toolbar) {
    toolbar.hidden = !hasAnyTasks;
  }

  if (!hasAnyTasks) {
    listRoot.innerHTML = `
      <div class="planner-empty">
        <div class="planner-empty-title">Nenhuma tarefa criada</div>
        <div class="planner-empty-sub">Comece pelo que precisa ser entregue hoje.</div>
        <button class="planner-btn planner-btn-primary" type="button" data-planner-add-task>Nova tarefa</button>
      </div>
    `;
    syncDailyPlannerReportBox(root, state);
    return;
  }

  const groupHtml = PLANNER_STATUS_ORDER
    .map((status) => {
      const statusMeta = getPlannerStatusMeta(status);
      const tasksInGroup = day.tasks.filter((task) => task.status === status);
      const visibleTasks = tasksInGroup.filter((task) => shouldShowPlannerTask(task, state.filterStatus));

      const shouldRenderGroup = state.filterStatus === 'all'
        ? tasksInGroup.length > 0
        : visibleTasks.length > 0;

      if (!shouldRenderGroup) {
        return '';
      }

      const bodyHtml = visibleTasks
        .map((task) => {
          const completedSubtasks = task.subtasks.filter((subtask) => subtask.done).length;
          const totalSubtasks = task.subtasks.length;
          const deliveryCount = countPlannerDeliveries(task);
          const taskTimeSummary = getTaskTimeSummary(task);

          const detailHtml = task.expanded
            ? `
              <div class="planner-task-detail">
                ${
                  task.subtasks.length
                    ? `
                      <div class="planner-subtask-head-row">
                        <span>Subtarefa</span>
                        <span>Hora</span>
                        <span>Entrega</span>
                        <span>Ações</span>
                      </div>
                      ${task.subtasks
                        .map((subtask) => {
                          const compositeKey = `${task.id}::${subtask.id}`;
                          const attachment = subtask.attachment
                            ? `
                              <a class="planner-file-link" href="${escapeHtml(subtask.attachment.dataUrl)}" download="${escapeHtml(subtask.attachment.name)}">
                                ${escapeHtml(subtask.attachment.name)}
                              </a>
                              <div class="planner-file-meta">${escapeHtml(formatBytes(subtask.attachment.size))}</div>
                            `
                            : '<p class="planner-file-empty">Nenhum arquivo anexado.</p>';
                          const hasDelivery = Boolean(subtask.deliveryText.trim() || subtask.attachment);

                          return `
                            <div class="planner-subtask-row">
                              <div class="planner-subtask-name">
                                <label class="planner-checkline planner-checkline-sub">
                                  <input type="checkbox" data-planner-subtask-toggle="${escapeHtml(compositeKey)}" ${subtask.done ? 'checked' : ''}>
                                  <input class="planner-subtask-input planner-subtask-input-compact" type="text" data-planner-subtask-title="${escapeHtml(compositeKey)}" value="${escapeHtml(subtask.title)}" placeholder="Nome da subtarefa">
                                </label>
                              </div>
                              <div class="planner-subtask-time">
                                <input class="planner-time-input" type="time" data-planner-subtask-time="${escapeHtml(compositeKey)}" value="${escapeHtml(subtask.time)}">
                              </div>
                              <div class="planner-subtask-delivery">
                                <details class="planner-delivery-details" ${hasDelivery ? 'open' : ''}>
                                  <summary>${hasDelivery ? 'Entrega registrada' : 'Abrir entrega'}</summary>
                                  <div class="planner-delivery-stack planner-delivery-stack-compact">
                                    <label class="planner-field">
                                      <span>Mensagem / entrega</span>
                                      <textarea data-planner-subtask-text="${escapeHtml(compositeKey)}" placeholder="O que foi feito, link, resumo ou mensagem de entrega">${escapeHtml(subtask.deliveryText)}</textarea>
                                    </label>
                                    <div class="planner-file-box">
                                      <div class="planner-file-head">
                                        <span class="planner-file-title">Arquivo</span>
                                        <div class="planner-mini-actions">
                                          <button class="planner-mini-btn" type="button" data-planner-attach-file="${escapeHtml(compositeKey)}">Anexar</button>
                                          ${
                                            subtask.attachment
                                              ? `<button class="planner-mini-btn planner-mini-btn-danger" type="button" data-planner-remove-file="${escapeHtml(compositeKey)}">Remover</button>`
                                              : ''
                                          }
                                        </div>
                                      </div>
                                      ${attachment}
                                      <input type="file" hidden data-planner-file-input="${escapeHtml(compositeKey)}">
                                    </div>
                                  </div>
                                </details>
                              </div>
                              <div class="planner-subtask-actions">
                                <button
                                  class="planner-mini-btn planner-mini-btn-danger planner-icon-btn"
                                  type="button"
                                  data-planner-delete-subtask="${escapeHtml(compositeKey)}"
                                  aria-label="Excluir subtarefa"
                                  title="Excluir subtarefa"
                                >
                                  ${renderPlannerTrashIcon()}
                                </button>
                              </div>
                            </div>
                          `;
                        })
                        .join('')}
                    `
                    : '<div class="planner-group-empty">Nenhuma subtarefa criada. Use + Sub.</div>'
                }
              </div>
            `
            : '';

          return `
            <div class="planner-task-shell" data-planner-task-card="${escapeHtml(task.id)}">
              <div class="planner-list-row planner-task-row">
                <div class="planner-col planner-col-name">
                  <button class="planner-expand ${task.expanded ? 'is-open' : ''}" type="button" data-planner-toggle-expand="${escapeHtml(task.id)}" aria-label="Expandir tarefa">${task.expanded ? '▾' : '▸'}</button>
                  <input class="planner-task-input planner-task-input-compact" type="text" data-planner-task-title="${escapeHtml(task.id)}" value="${escapeHtml(task.title)}" placeholder="Nome da tarefa">
                </div>
                <div class="planner-col planner-col-time">${escapeHtml(taskTimeSummary)}</div>
                <div class="planner-col planner-col-priority">
                  <select class="planner-select planner-select-compact" data-planner-task-priority="${escapeHtml(task.id)}">
                    ${renderPlannerPriorityOptions(task.priority)}
                  </select>
                </div>
                <div class="planner-col planner-col-subtasks">${completedSubtasks}/${totalSubtasks}</div>
                <div class="planner-col planner-col-status">
                  <select class="planner-select planner-select-compact" data-planner-task-status="${escapeHtml(task.id)}">
                    ${renderPlannerStatusOptions(task.status)}
                  </select>
                </div>
                <div class="planner-col planner-col-actions">
                  <button class="planner-mini-btn" type="button" data-planner-add-subtask="${escapeHtml(task.id)}">+ Sub</button>
                  <button
                    class="planner-mini-btn planner-mini-btn-danger planner-icon-btn"
                    type="button"
                    data-planner-delete-task="${escapeHtml(task.id)}"
                    aria-label="Excluir tarefa"
                    title="Excluir tarefa"
                  >
                    ${renderPlannerTrashIcon()}
                  </button>
                </div>
              </div>
              <div class="planner-row-meta">${deliveryCount} entrega(s) registradas</div>
              ${detailHtml}
            </div>
          `;
        })
        .join('');

      const groupCount = state.filterStatus === 'all' ? tasksInGroup.length : visibleTasks.length;

      return `
        <div class="planner-group">
          <div class="planner-group-header">
            <div class="planner-group-main">
              <span class="planner-status-pill ${statusMeta.className}">${statusMeta.label}</span>
              <span class="planner-group-count">${groupCount}</span>
            </div>
            <button class="planner-mini-btn" type="button" data-planner-add-task-status="${status}">Adicionar tarefa</button>
          </div>
          <div class="planner-column-head">
            <span>Nome</span>
            <span>Horário</span>
            <span>Prioridade</span>
            <span>Subtarefas</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          ${bodyHtml}
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  if (!groupHtml) {
    listRoot.innerHTML = `
      <div class="planner-empty">
        <div class="planner-empty-title">Nenhuma tarefa visível</div>
        <div class="planner-empty-sub">O filtro atual esconde todas as tarefas deste dia.</div>
        <button class="planner-btn" type="button" data-planner-reset-filter>Mostrar todas</button>
      </div>
    `;
    syncDailyPlannerReportBox(root, state);
    return;
  }

  listRoot.innerHTML = groupHtml;

  syncDailyPlannerReportBox(root, state);
}

function initDailyPlanner() {
  const root = document.getElementById('daily-planner');
  if (!root) {
    return;
  }

  let state = loadDailyPlannerState();
  getPlannerDay(state);
  const syncDailyPlannerFromStorage = () => {
    state = loadDailyPlannerState();
    getPlannerDay(state);
    renderDailyPlanner(root, state);
  };

  root.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-planner-filter]');
    if (filterButton) {
      state.filterStatus = filterButton.dataset.plannerFilter;
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    const resetFilterButton = event.target.closest('[data-planner-reset-filter]');
    if (resetFilterButton) {
      state.filterStatus = 'all';
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    const addTaskButton = event.target.closest('[data-planner-add-task]');
    if (addTaskButton) {
      const day = getPlannerDay(state);
      day.tasks.push(createPlannerTask('pending'));
      if (state.filterStatus === 'done') {
        state.filterStatus = 'all';
      }
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    const addTaskStatusButton = event.target.closest('[data-planner-add-task-status]');
    if (addTaskStatusButton) {
      const day = getPlannerDay(state);
      day.tasks.push(createPlannerTask(addTaskStatusButton.dataset.plannerAddTaskStatus));
      if (state.filterStatus === 'done') {
        state.filterStatus = 'all';
      }
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    const generateReportButton = event.target.closest('[data-planner-generate-report]');
    if (generateReportButton) {
      const reportBox = root.querySelector('[data-planner-report-box]');
      const reportTextEl = root.querySelector('[data-planner-report-text]');
      if (reportBox && reportTextEl) {
        reportTextEl.value = buildDailyPlannerReport(state);
        reportBox.hidden = false;
      }
      return;
    }

    const toggleExpandButton = event.target.closest('[data-planner-toggle-expand]');
    if (toggleExpandButton) {
      const day = getPlannerDay(state);
      const task = findPlannerTask(day, toggleExpandButton.dataset.plannerToggleExpand);
      if (!task) {
        return;
      }
      task.expanded = !task.expanded;
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    const copyReportButton = event.target.closest('[data-planner-copy-report]');
    if (copyReportButton) {
      const reportBox = root.querySelector('[data-planner-report-box]');
      const reportTextEl = root.querySelector('[data-planner-report-text]');
      if (!reportTextEl || !reportBox) {
        return;
      }

      if (reportBox.hidden || !reportTextEl.value.trim()) {
        reportTextEl.value = buildDailyPlannerReport(state);
        reportBox.hidden = false;
      }

      const text = reportTextEl.value;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          reportTextEl.focus();
          reportTextEl.select();
        });
      } else {
        reportTextEl.focus();
        reportTextEl.select();
      }
      return;
    }

    const addSubtaskButton = event.target.closest('[data-planner-add-subtask]');
    if (addSubtaskButton) {
      const day = getPlannerDay(state);
      const task = findPlannerTask(day, addSubtaskButton.dataset.plannerAddSubtask);
      if (!task) {
        return;
      }
      task.subtasks.push(createPlannerSubtask());
      syncPlannerTaskDone(task);
      task.expanded = true;
      if (state.filterStatus === 'done') {
        state.filterStatus = 'all';
      }
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    const deleteTaskButton = event.target.closest('[data-planner-delete-task]');
    if (deleteTaskButton) {
      const taskId = deleteTaskButton.dataset.plannerDeleteTask;
      const day = getPlannerDay(state);
      const task = findPlannerTask(day, taskId);
      if (!task) {
        return;
      }
      day.tasks = day.tasks.filter((item) => item.id !== taskId);
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      refreshSection('painel');
      showToast('Tarefa excluida.', 'neutral');
      return;
    }

    const deleteSubtaskButton = event.target.closest('[data-planner-delete-subtask]');
    if (deleteSubtaskButton) {
      const { taskId, subtaskId } = parsePlannerSubtaskKey(deleteSubtaskButton.dataset.plannerDeleteSubtask);
      const day = getPlannerDay(state);
      const task = findPlannerTask(day, taskId);
      if (!task) {
        return;
      }
      task.subtasks = task.subtasks.filter((item) => item.id !== subtaskId);
      syncPlannerTaskDone(task);
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      refreshSection('painel');
      showToast('Subtarefa excluida.', 'neutral');
      return;
    }

    const attachFileButton = event.target.closest('[data-planner-attach-file]');
    if (attachFileButton) {
      const key = attachFileButton.dataset.plannerAttachFile;
      const fileInput = root.querySelector(`[data-planner-file-input="${key}"]`);
      if (fileInput) {
        fileInput.click();
      }
      return;
    }

    const removeFileButton = event.target.closest('[data-planner-remove-file]');
    if (removeFileButton) {
      const { taskId, subtaskId } = parsePlannerSubtaskKey(removeFileButton.dataset.plannerRemoveFile);
      const day = getPlannerDay(state);
      const { subtask } = findPlannerSubtask(day, taskId, subtaskId);
      if (!subtask) {
        return;
      }
      subtask.attachment = null;
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    const exportButton = event.target.closest('[data-planner-export]');
    if (exportButton) {
      const day = getPlannerDay(state);
      const payload = {
        selectedDate: state.selectedDate,
        day: createPlannerDay(day),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planejador-${state.selectedDate}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }

    const importTriggerButton = event.target.closest('[data-planner-import-trigger]');
    if (importTriggerButton) {
      const importFileInput = root.querySelector('[data-planner-import-file]');
      if (importFileInput) {
        importFileInput.click();
      }
      return;
    }

    const clearDayButton = event.target.closest('[data-planner-clear-day]');
    if (clearDayButton) {
      state.days[state.selectedDate] = createPlannerDay();
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      refreshSection('painel');
      showToast(`Dia ${formatPlannerDate(state.selectedDate)} limpo.`, 'neutral');
    }
  });

  root.addEventListener('input', (event) => {
    const day = getPlannerDay(state);

    if (event.target.matches('[data-planner-task-title]')) {
      const task = findPlannerTask(day, event.target.dataset.plannerTaskTitle);
      if (!task) {
        return;
      }
      task.title = event.target.value;
      saveDailyPlannerState(state, true);
      syncDailyPlannerReportBox(root, state);
      return;
    }

    if (event.target.matches('[data-planner-subtask-title]')) {
      const { taskId, subtaskId } = parsePlannerSubtaskKey(event.target.dataset.plannerSubtaskTitle);
      const { subtask } = findPlannerSubtask(day, taskId, subtaskId);
      if (!subtask) {
        return;
      }
      subtask.title = event.target.value;
      saveDailyPlannerState(state, true);
      syncDailyPlannerReportBox(root, state);
      return;
    }

    if (event.target.matches('[data-planner-subtask-time]')) {
      const { taskId, subtaskId } = parsePlannerSubtaskKey(event.target.dataset.plannerSubtaskTime);
      const { subtask } = findPlannerSubtask(day, taskId, subtaskId);
      if (!subtask) {
        return;
      }
      subtask.time = event.target.value;
      saveDailyPlannerState(state, true);
      syncDailyPlannerReportBox(root, state);
      return;
    }

    if (event.target.matches('[data-planner-subtask-text]')) {
      const { taskId, subtaskId } = parsePlannerSubtaskKey(event.target.dataset.plannerSubtaskText);
      const { subtask } = findPlannerSubtask(day, taskId, subtaskId);
      if (!subtask) {
        return;
      }
      subtask.deliveryText = event.target.value;
      saveDailyPlannerState(state, true);
      renderDailyPlannerStats(root, state);
      syncDailyPlannerReportBox(root, state);
    }
  });

  root.addEventListener('change', async (event) => {
    if (event.target.matches('[data-planner-date]')) {
      state.selectedDate = event.target.value || getTodayIsoDate();
      getPlannerDay(state);
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    const day = getPlannerDay(state);

    if (event.target.matches('[data-planner-task-status]')) {
      const task = findPlannerTask(day, event.target.dataset.plannerTaskStatus);
      if (!task) {
        return;
      }
      task.status = PLANNER_STATUS_ORDER.includes(event.target.value) ? event.target.value : 'pending';
      task.expanded = task.status !== 'done';
      if (task.status === 'done') {
        task.subtasks.forEach((subtask) => {
          subtask.done = true;
        });
        task.done = true;
      } else {
        task.done = false;
      }
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    if (event.target.matches('[data-planner-task-priority]')) {
      const task = findPlannerTask(day, event.target.dataset.plannerTaskPriority);
      if (!task) {
        return;
      }
      task.priority = ['high', 'medium', 'low'].includes(event.target.value) ? event.target.value : 'medium';
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    if (event.target.matches('[data-planner-subtask-toggle]')) {
      const { taskId, subtaskId } = parsePlannerSubtaskKey(event.target.dataset.plannerSubtaskToggle);
      const { task, subtask } = findPlannerSubtask(day, taskId, subtaskId);
      if (!task || !subtask) {
        return;
      }
      subtask.done = event.target.checked;
      syncPlannerTaskDone(task);
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
      return;
    }

    if (event.target.matches('[data-planner-import-file]')) {
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const importedDate = typeof parsed.selectedDate === 'string' ? parsed.selectedDate : getTodayIsoDate();
        state.selectedDate = importedDate;
        state.days[importedDate] = createPlannerDay(parsed.day);
        saveDailyPlannerState(state);
        renderDailyPlanner(root, state);
        refreshSection('painel');
        showToast('Dia importado.', 'success');
      } catch (err) {
        showToast('Arquivo invalido do planejador.', 'error');
        console.warn('Falha ao importar o planejador diario.', err);
      } finally {
        event.target.value = '';
      }
      return;
    }

    if (event.target.matches('[data-planner-file-input]')) {
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }

      if (file.size > DAILY_PLANNER_MAX_FILE_BYTES) {
        showToast(`Arquivo muito grande. Limite: ${formatBytes(DAILY_PLANNER_MAX_FILE_BYTES)}.`, 'error');
        event.target.value = '';
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const { taskId, subtaskId } = parsePlannerSubtaskKey(event.target.dataset.plannerFileInput);
        const { subtask } = findPlannerSubtask(day, taskId, subtaskId);
        if (!subtask) {
          return;
        }
        subtask.attachment = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        };
        if (saveDailyPlannerState(state)) {
          renderDailyPlanner(root, state);
          refreshSection('painel');
          showToast('Arquivo anexado.', 'success');
        }
      } catch (err) {
        showToast('Nao foi possivel anexar o arquivo.', 'error');
        console.warn('Falha ao anexar arquivo ao planejador diario.', err);
      } finally {
        event.target.value = '';
      }
    }
  });

  APP_SECTION_SYNC.rotina = syncDailyPlannerFromStorage;
  syncDailyPlannerFromStorage();
}

function downloadJsonFile(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getPlannerDayKeys(state) {
  return Object.keys(state.days).sort((a, b) => b.localeCompare(a));
}

function getPlannerTotals(state) {
  return getPlannerDayKeys(state).reduce((acc, date) => {
    const day = createPlannerDay(state.days[date]);
    acc.days += 1;
    acc.tasks += day.tasks.length;
    acc.subtasks += day.tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
    return acc;
  }, { days: 0, tasks: 0, subtasks: 0 });
}

function initDataPanel() {
  const root = document.getElementById('data-panel');
  if (!root) {
    return;
  }

  const uiState = {
    dataset: 'tracker',
    selectedDay: '',
  };

  const renderDataPanel = () => {
    const trackerState = loadUltraTrackerState();
    const plannerState = loadDailyPlannerState();
    const dayKeys = getPlannerDayKeys(plannerState);
    const totals = getPlannerTotals(plannerState);
    const snapshot = {
      ultraTracker: trackerState,
      dailyPlanner: plannerState,
    };

    if (uiState.dataset === 'planner' && (!uiState.selectedDay || !plannerState.days[uiState.selectedDay])) {
      uiState.selectedDay = dayKeys[0] || '';
    }

    root.querySelectorAll('[data-panel-stat]').forEach((el) => {
      const key = el.dataset.panelStat;
      if (key === 'collections') el.textContent = '2';
      if (key === 'days') el.textContent = String(totals.days);
      if (key === 'tasks') el.textContent = String(totals.tasks);
      if (key === 'subtasks') el.textContent = String(totals.subtasks);
      if (key === 'size') el.textContent = formatBytes(new Blob([JSON.stringify(snapshot)]).size);
    });

    root.querySelectorAll('[data-panel-dataset]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.panelDataset === uiState.dataset);
    });

    const dayBox = root.querySelector('[data-panel-day-box]');
    const dayList = root.querySelector('[data-panel-day-list]');
    const newDayInput = root.querySelector('[data-panel-new-day-date]');
    if (dayBox) {
      dayBox.hidden = uiState.dataset !== 'planner';
    }

    if (newDayInput && (!newDayInput.value || newDayInput.value === uiState.selectedDay)) {
      newDayInput.value = uiState.selectedDay || plannerState.selectedDate || getTodayIsoDate();
    }

    if (dayList) {
      dayList.innerHTML = dayKeys.length
        ? dayKeys.map((date) => {
            const taskCount = createPlannerDay(plannerState.days[date]).tasks.length;
            return `
              <button
                class="dbpanel-day-btn ${uiState.selectedDay === date ? 'is-active' : ''}"
                type="button"
                data-panel-select-day="${date}"
              >
                <span>${formatPlannerDate(date)}</span>
                <strong>${taskCount}</strong>
              </button>
            `;
          }).join('')
        : '<div class="dbpanel-empty">Nenhum dia salvo ainda.</div>';
    }

    const editorTitle = root.querySelector('[data-panel-editor-title]');
    const editorSub = root.querySelector('[data-panel-editor-sub]');
    const editorLabel = root.querySelector('[data-panel-editor-label]');
    const editor = root.querySelector('[data-panel-editor]');
    const deleteButton = root.querySelector('[data-panel-delete-record]');
    let payload = trackerState;
    let exportName = 'ultra-trackers-db.json';

    if (uiState.dataset === 'tracker') {
      if (editorTitle) editorTitle.textContent = 'Ultra trackers';
      if (editorSub) editorSub.textContent = 'Coleção de sprints do ultra-aprendizado salva neste navegador.';
      if (editorLabel) editorLabel.textContent = 'JSON dos trackers';
      if (deleteButton) {
        deleteButton.textContent = 'Limpar trackers';
        deleteButton.disabled = false;
      }
    } else {
      const selectedDay = uiState.selectedDay;
      const day = selectedDay ? createPlannerDay(plannerState.days[selectedDay]) : createPlannerDay();
      payload = day;
      exportName = selectedDay ? `planejador-${selectedDay}.json` : 'planejador-vazio.json';

      if (editorTitle) editorTitle.textContent = selectedDay ? `Planejador ${formatPlannerDate(selectedDay)}` : 'Planejador diário';
      if (editorSub) {
        editorSub.textContent = selectedDay
          ? 'Edite o registro bruto desse dia. Salvar aqui atualiza a aba Rotina.'
          : 'Crie um novo dia na lateral para começar.';
      }
      if (editorLabel) {
        editorLabel.textContent = selectedDay ? `JSON do dia ${selectedDay}` : 'JSON do planejador';
      }
      if (deleteButton) {
        deleteButton.textContent = 'Excluir dia';
        deleteButton.disabled = !selectedDay;
      }
    }

    if (editor) {
      editor.value = JSON.stringify(payload, null, 2);
    }

    root.dataset.panelExportName = exportName;
  };

  root.addEventListener('click', (event) => {
    const datasetButton = event.target.closest('[data-panel-dataset]');
    if (datasetButton) {
      uiState.dataset = datasetButton.dataset.panelDataset;
      renderDataPanel();
      return;
    }

    const selectDayButton = event.target.closest('[data-panel-select-day]');
    if (selectDayButton) {
      uiState.dataset = 'planner';
      uiState.selectedDay = selectDayButton.dataset.panelSelectDay;
      renderDataPanel();
      return;
    }

    const createDayButton = event.target.closest('[data-panel-create-day]');
    if (createDayButton) {
      const dateInput = root.querySelector('[data-panel-new-day-date]');
      const date = dateInput?.value || getTodayIsoDate();
      const plannerState = loadDailyPlannerState();
      plannerState.days[date] = plannerState.days[date] ? createPlannerDay(plannerState.days[date]) : createPlannerDay();
      plannerState.selectedDate = date;
      saveDailyPlannerState(plannerState);
      uiState.dataset = 'planner';
      uiState.selectedDay = date;
      refreshDataViews();
      showToast(`Dia ${formatPlannerDate(date)} pronto para editar.`, 'success');
      return;
    }

    const exportDbButton = event.target.closest('[data-panel-export-db]');
    if (exportDbButton) {
      downloadJsonFile('plano-banco-local.json', {
        ultraTracker: loadUltraTrackerState(),
        dailyPlanner: loadDailyPlannerState(),
      });
      showToast('Banco exportado.', 'success');
      return;
    }

    const exportRecordButton = event.target.closest('[data-panel-export-record]');
    if (exportRecordButton) {
      const editor = root.querySelector('[data-panel-editor]');
      if (!editor) {
        return;
      }

      try {
        const parsed = JSON.parse(editor.value || '{}');
        downloadJsonFile(root.dataset.panelExportName || 'registro.json', parsed);
        showToast('Registro exportado.', 'success');
      } catch (err) {
        showToast('JSON invalido para exportar.', 'error');
      }
      return;
    }

    const saveRecordButton = event.target.closest('[data-panel-save-record]');
    if (saveRecordButton) {
      const editor = root.querySelector('[data-panel-editor]');
      if (!editor) {
        return;
      }

      try {
        const parsed = JSON.parse(editor.value || '{}');

        if (uiState.dataset === 'tracker') {
          saveUltraTrackerState(normalizeUltraTrackerState(parsed));
          showToast('Trackers salvos pelo painel.', 'success');
        } else {
          const plannerState = loadDailyPlannerState();
          const targetDate = uiState.selectedDay || root.querySelector('[data-panel-new-day-date]')?.value || getTodayIsoDate();
          plannerState.days[targetDate] = createPlannerDay(parsed);
          plannerState.selectedDate = targetDate;
          saveDailyPlannerState(plannerState);
          uiState.selectedDay = targetDate;
          showToast(`Dia ${formatPlannerDate(targetDate)} salvo.`, 'success');
        }

        refreshDataViews();
      } catch (err) {
        showToast('JSON invalido. Corrija antes de salvar.', 'error');
      }
      return;
    }

    const deleteRecordButton = event.target.closest('[data-panel-delete-record]');
    if (deleteRecordButton) {
      if (uiState.dataset === 'tracker') {
        saveUltraTrackerState(getUltraTrackerDefaultState());
        showToast('Tracker removido do banco local.', 'neutral');
      } else if (uiState.selectedDay) {
        const plannerState = loadDailyPlannerState();
        delete plannerState.days[uiState.selectedDay];
        const nextDay = getPlannerDayKeys(plannerState)[0] || '';
        plannerState.selectedDate = nextDay || getTodayIsoDate();
        saveDailyPlannerState(plannerState);
        showToast(`Dia ${formatPlannerDate(uiState.selectedDay)} excluido.`, 'neutral');
        uiState.selectedDay = nextDay;
      }

      refreshDataViews();
      return;
    }

    const importTriggerButton = event.target.closest('[data-panel-import-db-trigger]');
    if (importTriggerButton) {
      const fileInput = root.querySelector('[data-panel-import-db-file]');
      if (fileInput) {
        fileInput.click();
      }
      return;
    }

    const clearDbButton = event.target.closest('[data-panel-clear-db]');
    if (clearDbButton) {
      window.localStorage.removeItem(ULTRA_TRACKER_STORAGE_KEY);
      window.localStorage.removeItem(DAILY_PLANNER_STORAGE_KEY);
      uiState.dataset = 'tracker';
      uiState.selectedDay = '';
      refreshDataViews();
      showToast('Banco local limpo.', 'neutral');
    }
  });

  root.addEventListener('change', async (event) => {
    if (!event.target.matches('[data-panel-import-db-file]')) {
      return;
    }

    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const trackerState = normalizeUltraTrackerState(parsed?.ultraTracker);
      const plannerState = normalizeDailyPlannerState(parsed?.dailyPlanner);
      saveUltraTrackerState(trackerState);
      saveDailyPlannerState(plannerState);
      uiState.dataset = 'planner';
      uiState.selectedDay = getPlannerDayKeys(plannerState)[0] || '';
      refreshDataViews();
      showToast('Banco importado.', 'success');
    } catch (err) {
      showToast('Arquivo invalido para importar o banco.', 'error');
      console.warn('Falha ao importar o banco local.', err);
    } finally {
      event.target.value = '';
    }
  });

  APP_SECTION_SYNC.painel = renderDataPanel;
  renderDataPanel();
}

function getTabBySection(id) {
  return document.querySelector(`.nav-tab[data-section="${id}"]`);
}

function show(id, tabEl) {
  const section = document.getElementById(id);
  if (!section) {
    return;
  }

  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));

  section.classList.add('active');

  const tab = tabEl || getTabBySection(id);
  if (tab) {
    tab.classList.add('active');
  }

  if (window.location.hash !== `#${id}`) {
    window.history.replaceState(null, '', `#${id}`);
  }

  document.body.classList.toggle('mapa-mode', id === 'mapa');
  refreshSection(id);

  if (id === 'mapa') {
    setTimeout(initMapa, 30);
  } else {
    window.scrollTo(0, 0);
  }
}

function renderLoadError(message) {
  const mainRoot = document.getElementById('sections-main');
  if (!mainRoot) {
    return;
  }

  mainRoot.innerHTML = `
    <div class="section active" id="visao">
      <div class="card">
        <h2>Erro ao carregar seções</h2>
        <p>${message}</p>
        <div class="alert alert-amber">
          Se abriu o arquivo com <code>file://</code>, rode um servidor local HTTP (ex.: <code>python3 -m http.server</code>)
          ou publique no GitHub Pages.
        </div>
      </div>
    </div>
  `;
}

async function boot() {
  try {
    await loadSections();
    initUltraTracker();
    initDailyPlanner();
    initDataPanel();

    const hashId = window.location.hash.replace('#', '').trim();
    const initialId = hashId || 'visao';
    const fallbackId = document.getElementById(initialId) ? initialId : 'visao';

    show(fallbackId, getTabBySection(fallbackId));
  } catch (err) {
    console.error(err);
    renderLoadError(err.message);
  }
}

window.show = show;
document.addEventListener('DOMContentLoaded', boot);
