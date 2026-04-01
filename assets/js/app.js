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
const APP_ASSET_VERSION = '20260401-6';
const ULTRA_TRACKER_STORAGE_KEY = 'plano.ultraTracker.v1';
const DAILY_PLANNER_STORAGE_KEY = 'plano.dailyPlanner.v1';
const DAILY_PLANNER_MAX_FILE_BYTES = 1500000;
const PLANNER_STATUS_ORDER = ['backlog', 'pending', 'progress', 'review', 'done'];

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
    expanded: true,
    done: false,
    subtasks: [createPlannerSubtask()],
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
      window.alert('Nao foi possivel salvar no navegador. Tente anexar um arquivo menor ou exporte e limpe dados antigos.');
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

function getPlannerFilterMeta(filterStatus) {
  const map = {
    all: 'Mostrando todas as subtarefas.',
    pending: 'Mostrando apenas subtarefas pendentes.',
    done: 'Mostrando apenas subtarefas concluídas.',
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

  root.querySelectorAll('[data-planner-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.plannerFilter === state.filterStatus);
  });

  const filterMetaEl = root.querySelector('[data-planner-filter-meta]');
  if (filterMetaEl) {
    filterMetaEl.textContent = getPlannerFilterMeta(state.filterStatus);
  }

  renderDailyPlannerStats(root, state);

  const day = getPlannerDay(state);
  const listRoot = root.querySelector('[data-planner-list]');
  if (!listRoot) {
    return;
  }

  const hasAnyTasks = day.tasks.length > 0;

  listRoot.innerHTML = `
    ${
      hasAnyTasks
        ? ''
        : `
          <div class="planner-empty">
            Nenhuma tarefa criada para este dia ainda. Use <strong>Nova tarefa</strong> ou <strong>Adicionar tarefa</strong> em um status abaixo.
          </div>
        `
    }
    ${PLANNER_STATUS_ORDER
    .map((status) => {
      const statusMeta = getPlannerStatusMeta(status);
      const tasksInGroup = day.tasks.filter((task) => task.status === status);
      const visibleTasks = tasksInGroup
        .map((task) => {
          const visibleSubtasks = task.subtasks.filter((subtask) => shouldShowPlannerSubtask(subtask, state.filterStatus));
          return {
            task,
            visibleSubtasks,
            hiddenCount: task.subtasks.length - visibleSubtasks.length,
          };
        })
        .filter(({ visibleSubtasks }) => visibleSubtasks.length > 0 || state.filterStatus === 'all');

      const bodyHtml = visibleTasks.length
        ? visibleTasks
            .map(({ task, visibleSubtasks, hiddenCount }) => {
              const completedSubtasks = task.subtasks.filter((subtask) => subtask.done).length;
              const totalSubtasks = task.subtasks.length;
              const deliveryCount = countPlannerDeliveries(task);
              const taskTimeSummary = getTaskTimeSummary(task);

              const detailHtml = task.expanded
                ? `
                  <div class="planner-task-detail">
                    ${
                      hiddenCount > 0
                        ? `<div class="planner-detail-note">${hiddenCount} subtarefa(s) ocultas pelo filtro atual.</div>`
                        : ''
                    }
                    <div class="planner-subtask-head-row">
                      <span>Subtarefa</span>
                      <span>Hora</span>
                      <span>Entrega</span>
                      <span>Ações</span>
                    </div>
                    ${
                      visibleSubtasks.length
                        ? visibleSubtasks
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
                                    <button class="planner-mini-btn planner-mini-btn-danger" type="button" data-planner-delete-subtask="${escapeHtml(compositeKey)}">Remover</button>
                                  </div>
                                </div>
                              `;
                            })
                            .join('')
                        : '<div class="planner-group-empty">Nenhuma subtarefa visível com o filtro atual.</div>'
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
                      <button class="planner-mini-btn planner-mini-btn-danger" type="button" data-planner-delete-task="${escapeHtml(task.id)}">Excluir</button>
                    </div>
                  </div>
                  <div class="planner-row-meta">${deliveryCount} entrega(s) registradas</div>
                  ${detailHtml}
                </div>
              `;
            })
            .join('')
        : `<div class="planner-group-empty">${
            state.filterStatus === 'all'
              ? 'Nenhuma tarefa neste status.'
              : 'Nenhuma tarefa visível neste status com o filtro atual.'
          }</div>`;

      return `
        <div class="planner-group">
          <div class="planner-group-header">
            <div class="planner-group-main">
              <span class="planner-status-pill ${statusMeta.className}">${statusMeta.label}</span>
              <span class="planner-group-count">${tasksInGroup.length}</span>
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
    .join('')}
  `;

  syncDailyPlannerReportBox(root, state);
}

function initDailyPlanner() {
  const root = document.getElementById('daily-planner');
  if (!root) {
    return;
  }

  let state = loadDailyPlannerState();
  getPlannerDay(state);

  root.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-planner-filter]');
    if (filterButton) {
      state.filterStatus = filterButton.dataset.plannerFilter;
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
      if (!task || !window.confirm(`Excluir a tarefa "${task.title}" e todas as subtarefas?`)) {
        return;
      }
      day.tasks = day.tasks.filter((item) => item.id !== taskId);
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
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
      if (!window.confirm(`Limpar todas as tarefas do dia ${state.selectedDate}?`)) {
        return;
      }
      state.days[state.selectedDate] = createPlannerDay();
      saveDailyPlannerState(state);
      renderDailyPlanner(root, state);
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
      } catch (err) {
        window.alert('Arquivo invalido. Importe um JSON exportado pelo planejador.');
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
        window.alert(`Arquivo muito grande. Use algo com ate ${formatBytes(DAILY_PLANNER_MAX_FILE_BYTES)}.`);
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
        }
      } catch (err) {
        window.alert('Nao foi possivel anexar o arquivo.');
        console.warn('Falha ao anexar arquivo ao planejador diario.', err);
      } finally {
        event.target.value = '';
      }
    }
  });

  renderDailyPlanner(root, state);
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
    initDailyPlanner();

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
