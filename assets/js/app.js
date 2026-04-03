// Mantem as abas desacopladas do index.html:
// cada seção fica em um arquivo independente dentro de /sections.
const MAIN_SECTION_IDS = [
  'visao',
  'fase1',
  'fase2',
  'fase3',
  'rotina',
  'pomodo',
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
const APP_ASSET_VERSION = '20260403-ux6';
const ULTRA_TRACKER_STORAGE_KEY = 'plano.ultraTracker.v1';
const DAILY_PLANNER_STORAGE_KEY = 'plano.dailyPlanner.v1';
const POMODO_STORAGE_KEY = 'plano.pomodo.v1';
const DAILY_PLANNER_MAX_FILE_BYTES = 1500000;
const PLANNER_STATUS_ORDER = ['backlog', 'pending', 'progress', 'review', 'done'];
const POMODO_DURATION_OPTIONS = [25, 45, 60, 90];
const POMODO_DEFAULT_DURATION_MINUTES = 25;
const POMODO_TIMER_STATES = ['idle', 'running', 'paused', 'complete'];
const APP_SECTION_SYNC = {};
const SECTION_GROUPS = [
  {
    id: 'guia',
    kicker: 'Base do plano',
    title: 'Guia principal',
    description: 'Visão geral, recursos e marcos no mesmo fluxo para reduzir troca de contexto.',
    stats: ['3 blocos reunidos', 'ponto de partida', 'revisão rápida'],
    mode: 'stack',
    sections: [
      { id: 'visao', label: 'Visão geral' },
      { id: 'recursos', label: 'Recursos' },
      { id: 'marcos', label: 'Marcos' },
    ],
  },
  {
    id: 'plano',
    kicker: 'Linha do tempo',
    title: 'Plano em fases',
    description: 'As três fases do roadmap agora ficam em uma área única, com troca direta por etapa.',
    stats: ['3 fases', '24 meses', 'ordem sequencial'],
    mode: 'tabs',
    sections: [
      { id: 'fase1', label: 'Fase 1' },
      { id: 'fase2', label: 'Fase 2' },
      { id: 'fase3', label: 'Fase 3' },
    ],
  },
  {
    id: 'execucao',
    kicker: 'Operação diária',
    title: 'Workspace de execução',
    description: 'Rotina, pomodo, tracker e painel de dados reunidos no mesmo espaço para evitar navegação dispersa.',
    stats: ['rotina + foco + tracker + dados', 'salvo no navegador', 'menos cliques'],
    mode: 'tabs',
    sections: [
      { id: 'rotina', label: 'Rotina' },
      { id: 'pomodo', label: 'Pomodo' },
      { id: 'ultra-aprendizado', label: 'Ultra-aprendizado' },
      { id: 'painel', label: 'Painel' },
    ],
  },
  {
    id: 'trilhas',
    kicker: 'Especializações',
    title: 'Hub de trilhas',
    description: 'Todas as especializações ficam em uma única área para comparar caminhos sem abrir várias páginas.',
    stats: ['6 trilhas', 'comparação rápida', 'escolha por foco'],
    mode: 'tabs',
    sections: [
      { id: 'visao-comp', label: 'Visão Computacional' },
      { id: 'robotica', label: 'Robótica' },
      { id: 'drone', label: 'Drone' },
      { id: 'automacao', label: 'Automação' },
      { id: 'rl', label: 'Reforço' },
      { id: 'treinamento', label: 'Treinamento' },
    ],
  },
];
const SECTION_GROUP_BY_ID = Object.fromEntries(SECTION_GROUPS.map((group) => [group.id, group]));
const SECTION_TO_GROUP = SECTION_GROUPS.reduce((acc, group) => {
  group.sections.forEach((section) => {
    acc[section.id] = group.id;
  });
  return acc;
}, {});
const GROUP_ACTIVE_PANELS = Object.fromEntries(
  SECTION_GROUPS.map((group) => [group.id, group.sections[0]?.id || ''])
);

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

function getSectionGroup(id) {
  return SECTION_GROUP_BY_ID[id] || null;
}

function resolveTopLevelSectionId(id) {
  return SECTION_TO_GROUP[id] || id;
}

function getActiveGroupPanelId(groupId) {
  const group = getSectionGroup(groupId);
  if (!group) {
    return null;
  }
  return GROUP_ACTIVE_PANELS[groupId] || group.sections[0]?.id || null;
}

function renderSectionGroupShell(group) {
  const statsHtml = group.stats?.length
    ? `
      <div class="page-intro-stats">
        ${group.stats.map((item) => `<div class="page-intro-stat">${item}</div>`).join('')}
      </div>
    `
    : '';

  const controlsHtml = group.mode === 'stack'
    ? `
      <div class="group-jump-row" role="navigation" aria-label="${group.title}">
        ${group.sections.map((section) => `
          <button
            class="group-jump-link"
            type="button"
            data-group-parent="${group.id}"
            data-group-jump="${section.id}"
          >
            ${section.label}
          </button>
        `).join('')}
      </div>
    `
    : `
      <div class="group-tab-row" role="tablist" aria-label="${group.title}">
        ${group.sections.map((section, index) => `
          <button
            class="group-tab${index === 0 ? ' is-active' : ''}"
            type="button"
            role="tab"
            aria-selected="${index === 0 ? 'true' : 'false'}"
            data-group-parent="${group.id}"
            data-group-tab="${section.id}"
          >
            ${section.label}
          </button>
        `).join('')}
      </div>
    `;

  return `
    <div class="page-intro">
      <div>
        <div class="page-intro-kicker">${group.kicker}</div>
        <h2 class="page-intro-title">${group.title}</h2>
        <p class="page-intro-sub">${group.description}</p>
      </div>
      ${statsHtml}
    </div>
    ${controlsHtml}
    <div class="group-body${group.mode === 'stack' ? ' group-body-stack' : ''}" data-group-body="${group.id}"></div>
  `;
}

function buildSectionGroups() {
  const mainRoot = document.getElementById('sections-main');
  if (!mainRoot) {
    return;
  }

  const sectionById = new Map(
    Array.from(mainRoot.children)
      .filter((child) => child.classList?.contains('section'))
      .map((child) => [child.id, child])
  );

  mainRoot.innerHTML = '';

  SECTION_GROUPS.forEach((group) => {
    const groupSection = document.createElement('section');
    groupSection.id = group.id;
    groupSection.className = 'section page-shell';
    groupSection.dataset.groupRoot = group.id;
    groupSection.innerHTML = renderSectionGroupShell(group);

    const body = groupSection.querySelector(`[data-group-body="${group.id}"]`);
    if (!body) {
      return;
    }

    group.sections.forEach((entry, index) => {
      const section = sectionById.get(entry.id);
      if (!section) {
        return;
      }

      section.classList.remove('section', 'active');
      section.classList.add('group-panel');

      const wrap = document.createElement('div');
      wrap.className = 'group-panel-wrap';
      wrap.dataset.groupPanel = entry.id;
      if (group.mode === 'stack' || index === 0) {
        wrap.classList.add('is-active');
      }

      wrap.appendChild(section);
      body.appendChild(wrap);
    });

    mainRoot.appendChild(groupSection);
  });
}

function activateGroupPanel(groupId, panelId, options = {}) {
  const group = getSectionGroup(groupId);
  if (!group) {
    return;
  }

  const validPanelId = group.sections.some((section) => section.id === panelId)
    ? panelId
    : getActiveGroupPanelId(groupId);

  if (!validPanelId) {
    return;
  }

  GROUP_ACTIVE_PANELS[groupId] = validPanelId;

  const root = document.getElementById(groupId);
  if (!root) {
    return;
  }

  root.querySelectorAll('[data-group-panel]').forEach((panel) => {
    const isActive = group.mode === 'stack' || panel.dataset.groupPanel === validPanelId;
    panel.classList.toggle('is-active', isActive);
  });

  root.querySelectorAll('[data-group-tab]').forEach((tab) => {
    const isActive = tab.dataset.groupTab === validPanelId;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (options.updateHash && window.location.hash !== `#${validPanelId}`) {
    window.history.replaceState(null, '', `#${validPanelId}`);
  }

  if (options.refresh !== false) {
    refreshSection(validPanelId);
  }

  if (options.scrollIntoView) {
    const target = root.querySelector(`[data-group-panel="${validPanelId}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initSectionGroupInteractions() {
  const mainRoot = document.getElementById('sections-main');
  if (!mainRoot || mainRoot.dataset.groupEventsBound === 'true') {
    return;
  }

  mainRoot.dataset.groupEventsBound = 'true';
  mainRoot.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-group-tab]');
    if (tab) {
      event.preventDefault();
      const groupId = tab.dataset.groupParent;
      const panelId = tab.dataset.groupTab;
      if (!groupId || !panelId) {
        return;
      }

      if (!document.getElementById(groupId)?.classList.contains('active')) {
        show(groupId, getTabBySection(groupId), {
          hashId: panelId,
          skipScroll: true,
          childPanelId: panelId,
        });
        return;
      }

      activateGroupPanel(groupId, panelId, { updateHash: true, refresh: true });
      return;
    }

    const jump = event.target.closest('[data-group-jump]');
    if (!jump) {
      return;
    }

    event.preventDefault();
    const groupId = jump.dataset.groupParent;
    const panelId = jump.dataset.groupJump;
    if (!groupId || !panelId) {
      return;
    }

    if (!document.getElementById(groupId)?.classList.contains('active')) {
      show(groupId, getTabBySection(groupId), {
        hashId: panelId,
        skipScroll: true,
        childPanelId: panelId,
      });
      window.requestAnimationFrame(() => {
        activateGroupPanel(groupId, panelId, {
          updateHash: false,
          refresh: false,
          scrollIntoView: true,
        });
      });
      return;
    }

    activateGroupPanel(groupId, panelId, {
      updateHash: true,
      refresh: true,
      scrollIntoView: true,
    });
  });
}

function initActionMenus() {
  if (document.body.dataset.actionMenusBound === 'true') {
    return;
  }

  document.body.dataset.actionMenusBound = 'true';
  document.addEventListener('click', (event) => {
    const currentMenu = event.target.closest('.action-menu');

    document.querySelectorAll('.action-menu[open]').forEach((menu) => {
      if (menu !== currentMenu) {
        menu.removeAttribute('open');
      }
    });

    if (!event.target.closest('.action-menu-list button')) {
      return;
    }

    const parentMenu = event.target.closest('.action-menu');
    window.requestAnimationFrame(() => {
      parentMenu?.removeAttribute('open');
    });
  });
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
  refreshSection('pomodo');
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

function getPomodoDefaultTimer(durationMinutes = POMODO_DEFAULT_DURATION_MINUTES) {
  const safeMinutes = POMODO_DURATION_OPTIONS.includes(durationMinutes)
    ? durationMinutes
    : POMODO_DEFAULT_DURATION_MINUTES;

  return {
    status: 'idle',
    durationSeconds: safeMinutes * 60,
    elapsedSeconds: 0,
    lastStartedAt: null,
  };
}

function getPomodoDefaultState() {
  return {
    selectedMinutes: POMODO_DEFAULT_DURATION_MINUTES,
    history: {},
    timer: getPomodoDefaultTimer(),
  };
}

function normalizePomodoHistoryEntry(entry) {
  return {
    id: typeof entry?.id === 'string' ? entry.id : createPlannerId('pmd'),
    startedAt: typeof entry?.startedAt === 'string' ? entry.startedAt : '',
    endedAt: typeof entry?.endedAt === 'string' ? entry.endedAt : '',
    seconds: Math.max(0, Math.round(Number(entry?.seconds) || 0)),
    durationSeconds: Math.max(
      60,
      Math.round(Number(entry?.durationSeconds) || (POMODO_DEFAULT_DURATION_MINUTES * 60))
    ),
  };
}

function normalizePomodoTimer(candidate, fallbackMinutes = POMODO_DEFAULT_DURATION_MINUTES) {
  const durationSeconds = Number.isFinite(candidate?.durationSeconds)
    ? Math.max(60, Math.round(candidate.durationSeconds))
    : fallbackMinutes * 60;
  const elapsedSeconds = Number.isFinite(candidate?.elapsedSeconds)
    ? Math.max(0, Math.min(durationSeconds, Math.round(candidate.elapsedSeconds)))
    : 0;
  const status = POMODO_TIMER_STATES.includes(candidate?.status) ? candidate.status : 'idle';
  const lastStartedAt = Number.isFinite(candidate?.lastStartedAt) ? candidate.lastStartedAt : null;

  return {
    status: status === 'running' && !lastStartedAt ? 'paused' : status,
    durationSeconds,
    elapsedSeconds,
    lastStartedAt,
  };
}

function normalizePomodoState(candidate) {
  const fallbackMinutes = POMODO_DURATION_OPTIONS.includes(candidate?.selectedMinutes)
    ? candidate.selectedMinutes
    : POMODO_DEFAULT_DURATION_MINUTES;
  const timer = normalizePomodoTimer(candidate?.timer, fallbackMinutes);
  const timerMinutes = Math.round(timer.durationSeconds / 60);
  const selectedMinutes = POMODO_DURATION_OPTIONS.includes(timerMinutes) ? timerMinutes : fallbackMinutes;
  const history = {};

  if (candidate?.history && typeof candidate.history === 'object') {
    Object.entries(candidate.history).forEach(([date, entries]) => {
      if (!Array.isArray(entries)) {
        return;
      }

      history[date] = entries
        .map(normalizePomodoHistoryEntry)
        .filter((entry) => entry.seconds > 0);
    });
  }

  return {
    selectedMinutes,
    history,
    timer,
  };
}

function loadPomodoState() {
  try {
    const raw = window.localStorage.getItem(POMODO_STORAGE_KEY);
    if (!raw) {
      return getPomodoDefaultState();
    }
    return normalizePomodoState(JSON.parse(raw));
  } catch (err) {
    console.warn('Falha ao carregar o pomodo.', err);
    return getPomodoDefaultState();
  }
}

function savePomodoState(state, quiet = false) {
  try {
    window.localStorage.setItem(POMODO_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Falha ao salvar o pomodo.', err);
    if (!quiet) {
      showToast('Nao foi possivel salvar o pomodo.', 'error');
    }
    return false;
  }
}

function padPomodoNumber(value) {
  return String(Math.max(0, Math.floor(Number(value) || 0))).padStart(2, '0');
}

function getIsoDateFromLocalDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    date.getFullYear(),
    padPomodoNumber(date.getMonth() + 1),
    padPomodoNumber(date.getDate()),
  ].join('-');
}

function getIsoDateFromMs(ms) {
  return getIsoDateFromLocalDate(new Date(ms));
}

function getStartOfIsoDateMs(isoDate) {
  const [year = '', month = '', day = ''] = String(isoDate || '').split('-');
  if (!year || !month || !day) {
    return Date.now();
  }

  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0).getTime();
}

function formatPomodoRangeTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return `${padPomodoNumber(date.getHours())}:${padPomodoNumber(date.getMinutes())}`;
}

function formatPomodoDigital(seconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${padPomodoNumber(minutes)}:${padPomodoNumber(secs)}`;
}

function formatPomodoDuration(seconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalSeconds > 0 && totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  if (hours > 0) {
    return `${hours}h ${padPomodoNumber(minutes)}m`;
  }

  return `${totalMinutes}m`;
}

function getPomodoEntriesForDate(state, isoDate = getTodayIsoDate()) {
  return Array.isArray(state.history?.[isoDate]) ? state.history[isoDate] : [];
}

function getPomodoCommittedTodaySeconds(state, isoDate = getTodayIsoDate()) {
  return getPomodoEntriesForDate(state, isoDate).reduce((sum, entry) => sum + entry.seconds, 0);
}

function getPomodoLiveSliceSeconds(state, nowMs = Date.now(), isoDate = getTodayIsoDate()) {
  const timer = state.timer;
  if (timer.status !== 'running' || !Number.isFinite(timer.lastStartedAt)) {
    return 0;
  }

  const remainingSeconds = Math.max(0, timer.durationSeconds - timer.elapsedSeconds);
  if (!remainingSeconds) {
    return 0;
  }

  const effectiveStart = getIsoDateFromMs(timer.lastStartedAt) === isoDate
    ? timer.lastStartedAt
    : getStartOfIsoDateMs(isoDate);

  if (effectiveStart > nowMs) {
    return 0;
  }

  return Math.min(remainingSeconds, Math.max(0, Math.floor((nowMs - effectiveStart) / 1000)));
}

function getPomodoTodayTotalSeconds(state, isoDate = getTodayIsoDate(), nowMs = Date.now()) {
  return getPomodoCommittedTodaySeconds(state, isoDate) + getPomodoLiveSliceSeconds(state, nowMs, isoDate);
}

function getPomodoLiveElapsedSeconds(state, nowMs = Date.now()) {
  const timer = state.timer;
  const elapsedSeconds = Math.max(0, Number(timer.elapsedSeconds) || 0);

  if (timer.status !== 'running' || !Number.isFinite(timer.lastStartedAt)) {
    return Math.min(timer.durationSeconds, elapsedSeconds);
  }

  const liveDelta = Math.max(0, Math.floor((nowMs - timer.lastStartedAt) / 1000));
  return Math.min(timer.durationSeconds, elapsedSeconds + liveDelta);
}

function addPomodoHistoryEntry(state, startMs, endMs, seconds, durationSeconds) {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || seconds <= 0) {
    return;
  }

  const dayKey = getIsoDateFromMs(endMs);
  if (!dayKey) {
    return;
  }

  if (!Array.isArray(state.history[dayKey])) {
    state.history[dayKey] = [];
  }

  state.history[dayKey].unshift({
    id: createPlannerId('pmd'),
    startedAt: new Date(startMs).toISOString(),
    endedAt: new Date(endMs).toISOString(),
    seconds,
    durationSeconds,
  });
}

function commitPomodoRunningSlice(state, nowMs = Date.now()) {
  const timer = state.timer;
  if (timer.status !== 'running' || !Number.isFinite(timer.lastStartedAt)) {
    return 0;
  }

  const remainingSeconds = Math.max(0, timer.durationSeconds - timer.elapsedSeconds);
  const rawSliceSeconds = Math.max(0, Math.floor((nowMs - timer.lastStartedAt) / 1000));
  const sliceSeconds = Math.min(remainingSeconds, rawSliceSeconds);
  const endMs = timer.lastStartedAt + (sliceSeconds * 1000);

  if (sliceSeconds > 0) {
    addPomodoHistoryEntry(state, timer.lastStartedAt, endMs, sliceSeconds, timer.durationSeconds);
  }

  timer.elapsedSeconds = Math.min(timer.durationSeconds, timer.elapsedSeconds + sliceSeconds);
  timer.lastStartedAt = null;
  return sliceSeconds;
}

function completePomodoIfNeeded(state, nowMs = Date.now()) {
  const timer = state.timer;
  if (timer.status !== 'running') {
    return false;
  }

  if (getPomodoLiveElapsedSeconds(state, nowMs) < timer.durationSeconds) {
    return false;
  }

  commitPomodoRunningSlice(state, nowMs);
  timer.elapsedSeconds = timer.durationSeconds;
  timer.status = 'complete';
  return true;
}

function getPomodoStatusText(status) {
  if (status === 'running') return 'Foco em andamento';
  if (status === 'paused') return 'Foco pausado';
  if (status === 'complete') return 'Bloco concluido';
  return 'Pronto para iniciar';
}

function getPomodoPrimaryLabel(status) {
  if (status === 'running') return 'Pausar';
  if (status === 'paused') return 'Retomar';
  if (status === 'complete') return 'Novo foco';
  return 'Iniciar foco';
}

function getPomodoNoteText(status) {
  if (status === 'running') {
    return 'O total de hoje ja considera o bloco atual. Pause quando precisar respirar ou trocar de contexto.';
  }
  if (status === 'paused') {
    return 'O tempo estudado ate aqui ja entrou no historico. Voce pode retomar de onde parou ou reiniciar.';
  }
  if (status === 'complete') {
    return 'Bloco concluido e salvo no historico do dia. Use "Novo foco" para iniciar outro ciclo.';
  }
  return 'Escolha a duracao e use o relogio como ancora visual. O historico do dia fica em um clique.';
}

function renderPomodo(root, state, uiState) {
  const now = new Date();
  const nowMs = now.getTime();

  if (completePomodoIfNeeded(state, nowMs)) {
    savePomodoState(state, true);
    refreshSection('painel');
    showToast('Bloco de foco concluido.', 'success');
  }

  const timer = state.timer;
  const elapsedSeconds = getPomodoLiveElapsedSeconds(state, nowMs);
  const remainingSeconds = Math.max(0, timer.durationSeconds - elapsedSeconds);
  const progress = timer.durationSeconds ? elapsedSeconds / timer.durationSeconds : 0;
  const todayKey = getTodayIsoDate();
  const todayEntries = getPomodoEntriesForDate(state, todayKey);
  const liveSliceSeconds = getPomodoLiveSliceSeconds(state, nowMs, todayKey);
  const todayTotalSeconds = getPomodoTodayTotalSeconds(state, todayKey, nowMs);
  const todaySessions = todayEntries.length + (liveSliceSeconds > 0 ? 1 : 0);
  const progressValue = String(Math.max(0, Math.min(1, progress)).toFixed(4));

  const analog = root.querySelector('[data-pomodo-analog]');
  if (analog) {
    analog.style.setProperty('--pomodo-progress', progressValue);
  }

  const hourHand = root.querySelector('[data-pomodo-hand="hour"]');
  const minuteHand = root.querySelector('[data-pomodo-hand="minute"]');
  const secondHand = root.querySelector('[data-pomodo-hand="second"]');
  const seconds = now.getSeconds() + (now.getMilliseconds() / 1000);
  const minutes = now.getMinutes() + (seconds / 60);
  const hours = (now.getHours() % 12) + (minutes / 60);

  if (hourHand) {
    hourHand.style.transform = `translateX(-50%) rotate(${(hours / 12) * 360}deg)`;
  }
  if (minuteHand) {
    minuteHand.style.transform = `translateX(-50%) rotate(${(minutes / 60) * 360}deg)`;
  }
  if (secondHand) {
    secondHand.style.transform = `translateX(-50%) rotate(${(seconds / 60) * 360}deg)`;
  }

  const remainingEl = root.querySelector('[data-pomodo-remaining]');
  if (remainingEl) remainingEl.textContent = formatPomodoDigital(remainingSeconds);

  const statusEl = root.querySelector('[data-pomodo-status]');
  if (statusEl) statusEl.textContent = getPomodoStatusText(timer.status);

  const totalEl = root.querySelector('[data-pomodo-total]');
  if (totalEl) totalEl.textContent = formatPomodoDuration(todayTotalSeconds);

  const sessionsEl = root.querySelector('[data-pomodo-sessions]');
  if (sessionsEl) sessionsEl.textContent = String(todaySessions);

  const durationEl = root.querySelector('[data-pomodo-duration]');
  if (durationEl) {
    durationEl.value = String(state.selectedMinutes);
    durationEl.disabled = timer.status === 'running';
  }

  const toggleEl = root.querySelector('[data-pomodo-toggle]');
  if (toggleEl) toggleEl.textContent = getPomodoPrimaryLabel(timer.status);

  const resetEl = root.querySelector('[data-pomodo-reset]');
  if (resetEl) resetEl.hidden = timer.status !== 'paused';

  const noteEl = root.querySelector('[data-pomodo-note]');
  if (noteEl) noteEl.textContent = getPomodoNoteText(timer.status);

  const historyButton = root.querySelector('[data-pomodo-history-toggle]');
  if (historyButton) {
    historyButton.textContent = uiState.historyOpen ? 'Ocultar historico' : 'Historico do dia';
  }

  const historyPanel = root.querySelector('[data-pomodo-history]');
  if (historyPanel) {
    historyPanel.hidden = !uiState.historyOpen;
  }

  const historySummary = root.querySelector('[data-pomodo-history-summary]');
  if (historySummary) {
    historySummary.textContent = `${formatPomodoDuration(todayTotalSeconds)} estudados hoje em ${todaySessions} bloco${todaySessions === 1 ? '' : 's'}.`;
  }

  const historyDate = root.querySelector('[data-pomodo-history-date]');
  if (historyDate) {
    historyDate.textContent = formatPlannerDate(todayKey);
  }

  const historyList = root.querySelector('[data-pomodo-history-list]');
  if (!historyList) {
    return;
  }

  const liveRange = timer.status === 'running' && Number.isFinite(timer.lastStartedAt)
    ? `${formatPomodoRangeTime(timer.lastStartedAt)} - agora`
    : '';
  const historyItems = [];

  if (liveSliceSeconds > 0 && liveRange) {
    historyItems.push({
      isLive: true,
      range: liveRange,
      meta: 'Bloco em andamento',
      seconds: liveSliceSeconds,
    });
  }

  todayEntries.forEach((entry) => {
    historyItems.push({
      isLive: false,
      range: `${formatPomodoRangeTime(entry.startedAt)} - ${formatPomodoRangeTime(entry.endedAt)}`,
      meta: entry.seconds >= entry.durationSeconds ? 'Bloco concluido' : 'Bloco parcial',
      seconds: entry.seconds,
    });
  });

  if (!historyItems.length) {
    historyList.innerHTML = '<div class="pomodo-history-empty">Nenhum bloco registrado hoje.</div>';
    return;
  }

  historyList.innerHTML = historyItems.map((item) => `
    <div class="pomodo-history-item${item.isLive ? ' is-live' : ''}">
      <span class="pomodo-history-dot"></span>
      <div>
        <div class="pomodo-history-time">${item.range}</div>
        <div class="pomodo-history-meta">${item.meta}</div>
      </div>
      <div class="pomodo-history-pill">${formatPomodoDuration(item.seconds)}</div>
    </div>
  `).join('');
}

function initPomodo() {
  const root = document.getElementById('pomodo-app');
  if (!root || root.dataset.pomodoBound === 'true') {
    return;
  }

  root.dataset.pomodoBound = 'true';

  let state = loadPomodoState();
  const uiState = {
    historyOpen: false,
    tickId: null,
  };

  const render = () => renderPomodo(root, state, uiState);
  const syncPomodoFromStorage = () => {
    state = loadPomodoState();
    render();
  };

  root.addEventListener('click', (event) => {
    const toggleButton = event.target.closest('[data-pomodo-toggle]');
    if (toggleButton) {
      const nowMs = Date.now();

      if (state.timer.status === 'running') {
        commitPomodoRunningSlice(state, nowMs);
        state.timer.status = state.timer.elapsedSeconds >= state.timer.durationSeconds ? 'complete' : 'paused';
        savePomodoState(state);
        render();
        refreshSection('painel');
        return;
      }

      if (state.timer.status === 'complete') {
        state.timer = getPomodoDefaultTimer(state.selectedMinutes);
      }

      state.timer.status = 'running';
      state.timer.lastStartedAt = nowMs;
      savePomodoState(state, true);
      render();
      return;
    }

    const resetButton = event.target.closest('[data-pomodo-reset]');
    if (resetButton) {
      state.timer = getPomodoDefaultTimer(state.selectedMinutes);
      savePomodoState(state);
      render();
      return;
    }

    const historyButton = event.target.closest('[data-pomodo-history-toggle]');
    if (historyButton) {
      uiState.historyOpen = !uiState.historyOpen;
      render();
    }
  });

  root.addEventListener('change', (event) => {
    if (!event.target.matches('[data-pomodo-duration]')) {
      return;
    }

    const nextMinutes = Number(event.target.value);
    if (!POMODO_DURATION_OPTIONS.includes(nextMinutes)) {
      event.target.value = String(state.selectedMinutes);
      return;
    }

    if (state.timer.status === 'running') {
      event.target.value = String(state.selectedMinutes);
      showToast('Pause o foco antes de trocar a duracao.', 'error');
      return;
    }

    const shouldNotifyReset = state.timer.status === 'paused' || state.timer.status === 'complete';
    state.selectedMinutes = nextMinutes;
    state.timer = getPomodoDefaultTimer(nextMinutes);
    savePomodoState(state);
    render();

    if (shouldNotifyReset) {
      showToast('Duracao atualizada e cronometro reiniciado.', 'neutral');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      render();
    }
  });

  uiState.tickId = window.setInterval(render, 250);
  APP_SECTION_SYNC.pomodo = syncPomodoFromStorage;
  syncPomodoFromStorage();
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
    const pomodoState = loadPomodoState();
    const dayKeys = getPlannerDayKeys(plannerState);
    const totals = getPlannerTotals(plannerState);
    const snapshot = {
      ultraTracker: trackerState,
      dailyPlanner: plannerState,
      pomodo: pomodoState,
    };

    if (uiState.dataset === 'planner' && (!uiState.selectedDay || !plannerState.days[uiState.selectedDay])) {
      uiState.selectedDay = dayKeys[0] || '';
    }

    root.querySelectorAll('[data-panel-stat]').forEach((el) => {
      const key = el.dataset.panelStat;
      if (key === 'collections') el.textContent = '3';
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
    } else if (uiState.dataset === 'pomodo') {
      payload = pomodoState;
      exportName = 'pomodo-db.json';

      if (editorTitle) editorTitle.textContent = 'Pomodo';
      if (editorSub) editorSub.textContent = 'Timer e historico de estudo salvos neste navegador.';
      if (editorLabel) editorLabel.textContent = 'JSON do pomodo';
      if (deleteButton) {
        deleteButton.textContent = 'Limpar pomodo';
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
        pomodo: loadPomodoState(),
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
        } else if (uiState.dataset === 'pomodo') {
          savePomodoState(normalizePomodoState(parsed));
          showToast('Pomodo salvo pelo painel.', 'success');
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
      } else if (uiState.dataset === 'pomodo') {
        savePomodoState(getPomodoDefaultState());
        showToast('Pomodo removido do banco local.', 'neutral');
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
      window.localStorage.removeItem(POMODO_STORAGE_KEY);
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
      const pomodoState = normalizePomodoState(parsed?.pomodo);
      saveUltraTrackerState(trackerState);
      saveDailyPlannerState(plannerState);
      savePomodoState(pomodoState);
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

function show(id, tabEl, options = {}) {
  const topLevelId = resolveTopLevelSectionId(id);
  const section = document.getElementById(topLevelId);
  if (!section) {
    return;
  }

  const group = getSectionGroup(topLevelId);
  const requestedChildId = group?.sections.some((entry) => entry.id === id) ? id : null;
  const explicitChildId = group?.sections.some((entry) => entry.id === options.childPanelId)
    ? options.childPanelId
    : null;
  const childPanelId = group
    ? (explicitChildId || requestedChildId || getActiveGroupPanelId(topLevelId))
    : null;
  const hashId = options.hashId
    || requestedChildId
    || (group && id === topLevelId ? topLevelId : childPanelId)
    || topLevelId;

  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));

  section.classList.add('active');

  const tab = tabEl || getTabBySection(topLevelId);
  if (tab) {
    tab.classList.add('active');
  }

  if (window.location.hash !== `#${hashId}`) {
    window.history.replaceState(null, '', `#${hashId}`);
  }

  document.body.classList.toggle('mapa-mode', topLevelId === 'mapa');
  if (topLevelId !== 'mapa' && typeof window.exitMapaImmersive === 'function') {
    window.exitMapaImmersive();
  }

  if (group) {
    activateGroupPanel(topLevelId, childPanelId, { updateHash: false, refresh: true });
  } else {
    refreshSection(topLevelId);
  }

  if (topLevelId === 'mapa') {
    setTimeout(initMapa, 30);
  } else if (!options.skipScroll) {
    window.scrollTo(0, 0);
  }

  if (group && options.scrollToChild) {
    activateGroupPanel(topLevelId, childPanelId, {
      updateHash: false,
      refresh: false,
      scrollIntoView: true,
    });
  }
}

function renderLoadError(message) {
  const mainRoot = document.getElementById('sections-main');
  if (!mainRoot) {
    return;
  }

  mainRoot.innerHTML = `
    <div class="section active" id="guia">
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
    buildSectionGroups();
    initSectionGroupInteractions();
    initActionMenus();
    initUltraTracker();
    initDailyPlanner();
    initPomodo();
    initDataPanel();

    const hashId = window.location.hash.replace('#', '').trim();
    const requestedId = hashId || 'guia';
    const initialId = resolveTopLevelSectionId(requestedId);
    const fallbackId = document.getElementById(initialId) ? initialId : 'guia';
    const initialGroup = getSectionGroup(fallbackId);

    show(fallbackId, getTabBySection(fallbackId), {
      hashId: SECTION_TO_GROUP[hashId] ? hashId : undefined,
      childPanelId: SECTION_TO_GROUP[hashId] ? hashId : undefined,
      skipScroll: initialGroup?.mode === 'stack' && Boolean(SECTION_TO_GROUP[hashId]),
      scrollToChild: initialGroup?.mode === 'stack' && Boolean(SECTION_TO_GROUP[hashId]),
    });
  } catch (err) {
    console.error(err);
    renderLoadError(err.message);
  }
}

window.show = show;
document.addEventListener('DOMContentLoaded', boot);
