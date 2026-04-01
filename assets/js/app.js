// Mantem as abas desacopladas do index.html:
// cada seção fica em um arquivo independente dentro de /sections.
const MAIN_SECTION_IDS = [
  'visao',
  'fase1',
  'fase2',
  'fase3',
  'rotina',
  'ultra-aprendizado',
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
const APP_ASSET_VERSION = '20260401-2';
const ULTRA_TRACKER_STORAGE_KEY = 'plano.ultraTracker.v1';

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

function getUltraTrackerDefaultState() {
  return { fields: {}, checks: {} };
}

function loadUltraTrackerState() {
  try {
    const raw = window.localStorage.getItem(ULTRA_TRACKER_STORAGE_KEY);
    if (!raw) {
      return getUltraTrackerDefaultState();
    }

    const parsed = JSON.parse(raw);
    return {
      fields: parsed && typeof parsed.fields === 'object' ? parsed.fields : {},
      checks: parsed && typeof parsed.checks === 'object' ? parsed.checks : {},
    };
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

function normalizeUltraTrackerState(candidate) {
  return {
    fields: candidate && typeof candidate.fields === 'object' ? candidate.fields : {},
    checks: candidate && typeof candidate.checks === 'object' ? candidate.checks : {},
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

function renderUltraTracker(root, state) {
  const checkEls = Array.from(root.querySelectorAll('[data-tracker-check]'));
  const totalTasks = checkEls.length;
  const completedTasks = checkEls.filter((el) => Boolean(state.checks[el.dataset.trackerCheck])).length;
  const sprintPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const sprintCountEl = root.querySelector('[data-tracker-sprint-count]');
  const sprintPercentEl = root.querySelector('[data-tracker-sprint-percent]');
  const sprintFillEl = root.querySelector('[data-tracker-sprint-fill]');
  if (sprintCountEl) sprintCountEl.textContent = `${completedTasks}/${totalTasks} tarefas`;
  if (sprintPercentEl) sprintPercentEl.textContent = `${sprintPercent}%`;
  if (sprintFillEl) sprintFillEl.style.width = `${sprintPercent}%`;

  const schedule = getTrackerSchedule(state.fields.sprintStart);
  const weekStats = {};

  root.querySelectorAll('[data-tracker-week]').forEach((weekCard) => {
    const weekNumber = Number(weekCard.dataset.trackerWeek);
    const weekChecks = Array.from(weekCard.querySelectorAll('[data-tracker-check]'));
    const weekTotal = weekChecks.length;
    const weekDone = weekChecks.filter((el) => Boolean(state.checks[el.dataset.trackerCheck])).length;
    const weekPercent = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;
    const isCurrent = schedule.activeWeek === weekNumber;
    const isComplete = weekDone === weekTotal;

    weekStats[weekNumber] = { total: weekTotal, done: weekDone, percent: weekPercent };

    weekCard.classList.toggle('is-current', isCurrent);
    weekCard.classList.toggle('is-complete', isComplete);

    const countEl = weekCard.querySelector(`[data-tracker-week-count="${weekNumber}"]`);
    const fillEl = weekCard.querySelector(`[data-tracker-week-fill="${weekNumber}"]`);
    const statusEl = weekCard.querySelector(`[data-tracker-week-status="${weekNumber}"]`);

    if (countEl) countEl.textContent = `${weekDone}/${weekTotal}`;
    if (fillEl) fillEl.style.width = `${weekPercent}%`;

    if (statusEl) {
      let status = 'Pendente';
      if (isComplete) {
        status = 'Semana concluida';
      } else if (isCurrent) {
        status = 'Semana atual';
      } else if (schedule.activeWeek && weekNumber < schedule.activeWeek) {
        status = 'Semana anterior';
      } else if (schedule.activeWeek && weekNumber > schedule.activeWeek) {
        status = 'Proxima semana';
      }
      statusEl.textContent = status;
    }
  });

  const activeWeek = schedule.activeWeek;
  const activeWeekStats = activeWeek ? weekStats[activeWeek] : null;
  const activeWeekLabelEl = root.querySelector('[data-tracker-active-week-label]');
  const activeWeekCountEl = root.querySelector('[data-tracker-active-week-count]');
  const activeWeekStatusEl = root.querySelector('[data-tracker-active-week-status]');
  const activeWeekFillEl = root.querySelector('[data-tracker-active-week-fill]');

  if (activeWeekLabelEl) {
    activeWeekLabelEl.textContent = activeWeek ? `Semana ${activeWeek}` : 'Defina a data';
  }
  if (activeWeekCountEl) {
    activeWeekCountEl.textContent = activeWeekStats
      ? `${activeWeekStats.done}/${activeWeekStats.total} tarefas`
      : '0/4 tarefas';
  }
  if (activeWeekStatusEl) {
    activeWeekStatusEl.textContent = schedule.status;
  }
  if (activeWeekFillEl) {
    activeWeekFillEl.style.width = `${activeWeekStats ? activeWeekStats.percent : 0}%`;
  }
}

function initUltraTracker() {
  const root = document.getElementById('ultra-tracker');
  if (!root) {
    return;
  }

  let state = loadUltraTrackerState();
  const fieldEls = Array.from(root.querySelectorAll('[data-tracker-field]'));
  const checkEls = Array.from(root.querySelectorAll('[data-tracker-check]'));

  fieldEls.forEach((el) => {
    const key = el.dataset.trackerField;
    if (typeof state.fields[key] === 'string') {
      el.value = state.fields[key];
    }

    el.addEventListener('input', () => {
      state.fields[key] = el.value;
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
    });
  });

  checkEls.forEach((el) => {
    const key = el.dataset.trackerCheck;
    el.checked = Boolean(state.checks[key]);

    el.addEventListener('change', () => {
      state.checks[key] = el.checked;
      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
    });
  });

  const resetButton = root.querySelector('[data-tracker-reset]');
  const exportButton = root.querySelector('[data-tracker-export]');
  const importTriggerButton = root.querySelector('[data-tracker-import-trigger]');
  const importFileInput = root.querySelector('[data-tracker-import-file]');

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const normalized = normalizeUltraTrackerState(state);
      const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const focus = normalized.fields.sprintFocus || 'sprint';
      const safeFocus = focus.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sprint';

      link.href = url;
      link.download = `ultra-tracker-${safeFocus}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
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
        state = normalizeUltraTrackerState(parsed);

        fieldEls.forEach((el) => {
          const key = el.dataset.trackerField;
          el.value = typeof state.fields[key] === 'string' ? state.fields[key] : '';
        });
        checkEls.forEach((el) => {
          const key = el.dataset.trackerCheck;
          el.checked = Boolean(state.checks[key]);
        });

        saveUltraTrackerState(state);
        renderUltraTracker(root, state);
      } catch (err) {
        window.alert('Arquivo invalido. Importe um JSON exportado pelo tracker.');
        console.warn('Falha ao importar o tracker de ultra-aprendizado.', err);
      } finally {
        importFileInput.value = '';
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (!window.confirm('Limpar todos os campos e marcacoes desta sprint?')) {
        return;
      }

      state = getUltraTrackerDefaultState();
      fieldEls.forEach((el) => {
        el.value = '';
      });
      checkEls.forEach((el) => {
        el.checked = false;
      });

      saveUltraTrackerState(state);
      renderUltraTracker(root, state);
    });
  }

  renderUltraTracker(root, state);
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
