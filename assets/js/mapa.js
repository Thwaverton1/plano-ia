let _mapaInit = false;
let _selNode = null;
const MAPA_THEME_STORAGE_KEY = 'plano.mapaTheme.v1';

const MAPA_THEME_PALETTES = {
  dark: {
    canvas: '#0d1117',
    grid: 'rgba(255,255,255,0.03)',
    dotPrimary: 'rgba(255,255,255,0.22)',
    dotSecondary: 'rgba(255,255,255,0.14)',
    guide: 'rgba(255,255,255,0.07)',
    layerLabel: '#4f5763',
  },
  light: {
    canvas: '#f3f6fb',
    grid: 'rgba(24,33,43,0.06)',
    dotPrimary: 'rgba(24,33,43,0.10)',
    dotSecondary: 'rgba(24,33,43,0.07)',
    guide: 'rgba(24,33,43,0.10)',
    layerLabel: '#708096',
  },
};

const _mapCtx = {
  root: null,
  cvs: null,
  svg: null,
  world: null,
  viewport: { w: 0, h: 0 },
  bounds: null,
  cam: {
    scale: 1,
    tx: 0,
    ty: 0,
    minScale: 0.12,
    maxScale: 2.8,
  },
  nodeById: new Map(),
  layerMap: new Map(),
  adjacency: new Map(),
  nodeGroupById: new Map(),
  nodeCircleById: new Map(),
  nodePulseById: new Map(),
  nodeBaseRadiusById: new Map(),
  baseStrokeById: new Map(),
  edgeRecords: [],
  categoryDefs: [],
  categorySets: new Map(),
  activeCategory: 'all',
  searchQuery: '',
  searchResults: [],
  searchSuggestOpen: false,
  activeSuggestionIndex: -1,
  suppressClickUntil: 0,
  resizeObs: null,
  theme: 'dark',
  immersive: false,
  panelOpen: false,
};

function _clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function _mkSvg(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function _normalizeSearchText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function _escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _normalizeMapTheme(value) {
  return value === 'light' ? 'light' : 'dark';
}

function _loadMapTheme() {
  try {
    return _normalizeMapTheme(window.localStorage.getItem(MAPA_THEME_STORAGE_KEY));
  } catch (err) {
    return 'dark';
  }
}

function _saveMapTheme(theme) {
  try {
    window.localStorage.setItem(MAPA_THEME_STORAGE_KEY, _normalizeMapTheme(theme));
  } catch (err) {
    console.warn('Falha ao salvar o tema do mapa neural.', err);
  }
}

function _getMapThemePalette() {
  return MAPA_THEME_PALETTES[_mapCtx.theme] || MAPA_THEME_PALETTES.dark;
}

function _syncMapThemeButtons() {
  if (!_mapCtx.root) return;
  _mapCtx.root.querySelectorAll('[data-mapa-theme]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mapaTheme === _mapCtx.theme);
  });
}

function _applyMapTheme(theme, { persist = true, redraw = false } = {}) {
  _mapCtx.theme = _normalizeMapTheme(theme);

  if (_mapCtx.root) {
    _mapCtx.root.dataset.theme = _mapCtx.theme;
  }

  _syncMapThemeButtons();

  if (persist) {
    _saveMapTheme(_mapCtx.theme);
  }

  if (redraw && _mapCtx.svg) {
    _drawScene();
    if (_selNode) {
      const node = _mapCtx.nodeById.get(_selNode);
      if (node) {
        _renderMapaPanel(node);
      }
    }
  }
}

function _renderEmptyMapaPanel() {
  const pnl = document.getElementById('mapa-pnl');
  if (!pnl) return;

  pnl.innerHTML = `
    <div class="mapa-pnl-empty">
      <div style="font-size:38px">🧠</div>
      <div style="font-size:12px;line-height:1.6">Clique em qualquer nó<br>para ver detalhes,<br>materiais e comandos</div>
    </div>
  `;
}

function _syncMapUiState() {
  if (!_mapCtx.root) return;

  const hasSelection = Boolean(_selNode);
  const showPanel = _mapCtx.immersive ? (_mapCtx.panelOpen && hasSelection) : true;

  _mapCtx.root.classList.toggle('is-immersive', _mapCtx.immersive);
  _mapCtx.root.classList.toggle('is-panel-open', showPanel);
  _mapCtx.root.classList.toggle('has-selection', hasSelection);
  document.body.classList.toggle('mapa-immersive', _mapCtx.immersive);

  _mapCtx.root.querySelectorAll('[data-mapa-action="toggle-panel"]').forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.disabled = !hasSelection;
    button.textContent = _mapCtx.immersive && showPanel ? 'Ocultar detalhes' : 'Detalhes';
    button.setAttribute('aria-pressed', _mapCtx.immersive && showPanel ? 'true' : 'false');
  });

  _mapCtx.root.querySelectorAll('[data-mapa-action="toggle-immersive"]').forEach((button) => {
    button.textContent = _mapCtx.immersive ? 'Fechar expansão' : 'Expandir mapa';
    button.setAttribute('aria-pressed', _mapCtx.immersive ? 'true' : 'false');
  });
}

function _refreshMapViewport() {
  if (!_mapCtx.cvs || !_mapCtx.svg) return;
  _updateViewport();
  _applyCam();
}

function _setMapImmersive(next) {
  const target = Boolean(next);
  if (_mapCtx.immersive === target) return;

  _mapCtx.immersive = target;
  _mapCtx.panelOpen = false;
  _syncMapUiState();

  window.requestAnimationFrame(() => {
    _refreshMapViewport();
  });
}

function _setPanelOpen(next) {
  _mapCtx.panelOpen = Boolean(next) && Boolean(_selNode);
  _syncMapUiState();
}

function _clearSelectedNode() {
  _selNode = null;
  _applyHighlights();
  _setPanelOpen(false);
  _renderEmptyMapaPanel();
}

function _truncateText(value, max = 96) {
  if (!value || value.length <= max) return value || '';
  return `${value.slice(0, max - 1).trim()}…`;
}

function _buildCategorySets() {
  _mapCtx.categoryDefs = [{ id: 'all', label: 'Tudo', color: '#8b949e' }];
  _mapCtx.categorySets.clear();

  const groups = window.MAP_CATEGORY_GROUPS || {};
  Object.entries(groups).forEach(([id, def]) => {
    _mapCtx.categoryDefs.push({
      id,
      label: def.label || id,
      color: def.color || '#58a6ff',
    });
    _mapCtx.categorySets.set(id, new Set(def.ids || []));
  });
}

function _getActiveCategoryDef() {
  return _mapCtx.categoryDefs.find((item) => item.id === _mapCtx.activeCategory) || _mapCtx.categoryDefs[0];
}

function _getActiveCategorySet() {
  if (_mapCtx.activeCategory === 'all') return null;
  return _mapCtx.categorySets.get(_mapCtx.activeCategory) || null;
}

function _getNodeCategories(node) {
  return _mapCtx.categoryDefs.filter((cat) => cat.id !== 'all' && (_mapCtx.categorySets.get(cat.id) || new Set()).has(node.id));
}

function _getNodeSearchBlob(node) {
  if (node._searchBlob) return node._searchBlob;

  const text = [
    node.id,
    node.lbl.replace(/\n/g, ' '),
    node.desc,
    ...(node.topics || []),
    ...(node.quickNotes || []),
    ...(node.practice || []),
    ...(node.projects || []),
    ...((node.lnks || []).map((item) => item.t)),
    ...((node.lessons || []).map((item) => item.t)),
    ...((node.articles || []).map((item) => item.t)),
  ].join(' ');

  node._searchBlob = _normalizeSearchText(text);
  return node._searchBlob;
}

function _searchNodes(rawQuery) {
  const query = _normalizeSearchText(rawQuery);
  if (!query) return [];
  const categorySet = _getActiveCategorySet();

  return MN
    .filter((node) => !categorySet || categorySet.has(node.id))
    .map((node) => {
      const label = _normalizeSearchText(node.lbl.replace(/\n/g, ' '));
      const id = _normalizeSearchText(node.id);
      const desc = _normalizeSearchText(node.desc);
      const blob = _getNodeSearchBlob(node);

      let score = Number.POSITIVE_INFINITY;
      if (label === query || id === query) score = 0;
      else if (label.startsWith(query) || id.startsWith(query)) score = 1;
      else if (label.split(/\s+/).some((word) => word.startsWith(query))) score = 2;
      else if (label.includes(query) || id.includes(query)) score = 3;
      else if (desc.includes(query)) score = 4;
      else if (blob.includes(query)) score = 5;

      return { node, score, label };
    })
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score || a.node.ly - b.node.ly || a.label.localeCompare(b.label))
    .map((item) => item.node);
}

function _getVisibleSearchResults(limit = 8) {
  return _mapCtx.searchResults.slice(0, limit);
}

function _rebuildMaps() {
  _mapCtx.nodeById.clear();
  _mapCtx.layerMap.clear();
  _mapCtx.adjacency.clear();

  MN.forEach((n) => {
    _mapCtx.nodeById.set(n.id, n);
    if (!_mapCtx.layerMap.has(n.ly)) {
      _mapCtx.layerMap.set(n.ly, []);
    }
    _mapCtx.layerMap.get(n.ly).push(n);
    _mapCtx.adjacency.set(n.id, new Set());
  });

  ME.forEach(([a, b]) => {
    if (!_mapCtx.nodeById.has(a) || !_mapCtx.nodeById.has(b)) {
      return;
    }
    _mapCtx.adjacency.get(a).add(b);
    _mapCtx.adjacency.get(b).add(a);
  });
}

function _computeLayout() {
  const layers = [..._mapCtx.layerMap.keys()].sort((a, b) => a - b);
  const layerGap = 440;
  const rowGap = 165;
  const jitter = 30;

  layers.forEach((ly) => {
    const group = _mapCtx.layerMap.get(ly);
    const startY = -((group.length - 1) * rowGap) / 2;

    group.forEach((n, idx) => {
      const zig = (idx % 2 === 0 ? -1 : 1) * jitter;
      n.x = ly * layerGap;
      n.y = Math.round(startY + idx * rowGap + zig);
    });
  });

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  MN.forEach((n) => {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  });

  _mapCtx.bounds = {
    minX: minX - 260,
    maxX: maxX + 300,
    minY: minY - 300,
    maxY: maxY + 320,
  };
}

function _getLayerName(layer) {
  const names = window.MAP_LAYER_NAMES || [];
  return names[layer] || `Fase ${layer}`;
}

function _drawScene() {
  const svg = _mapCtx.svg;
  const theme = _getMapThemePalette();
  svg.innerHTML = '';
  _mapCtx.edgeRecords = [];
  _mapCtx.nodeGroupById.clear();
  _mapCtx.nodeCircleById.clear();
  _mapCtx.nodePulseById.clear();
  _mapCtx.nodeBaseRadiusById.clear();
  _mapCtx.baseStrokeById.clear();

  const defs = _mkSvg('defs');

  const glow = _mkSvg('filter');
  glow.id = 'map-glow';
  glow.innerHTML = '<feGaussianBlur stdDeviation="3.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>';
  defs.appendChild(glow);

  const dotPattern = _mkSvg('pattern');
  dotPattern.id = 'space-dots';
  dotPattern.setAttribute('width', '110');
  dotPattern.setAttribute('height', '110');
  dotPattern.setAttribute('patternUnits', 'userSpaceOnUse');
  const dotA = _mkSvg('circle');
  dotA.setAttribute('cx', '3');
  dotA.setAttribute('cy', '4');
  dotA.setAttribute('r', '1.2');
  dotA.setAttribute('fill', theme.dotPrimary);
  const dotB = _mkSvg('circle');
  dotB.setAttribute('cx', '67');
  dotB.setAttribute('cy', '58');
  dotB.setAttribute('r', '0.9');
  dotB.setAttribute('fill', theme.dotSecondary);
  dotPattern.appendChild(dotA);
  dotPattern.appendChild(dotB);
  defs.appendChild(dotPattern);

  const guidePattern = _mkSvg('pattern');
  guidePattern.id = 'space-grid';
  guidePattern.setAttribute('width', '140');
  guidePattern.setAttribute('height', '140');
  guidePattern.setAttribute('patternUnits', 'userSpaceOnUse');
  const gl = _mkSvg('path');
  gl.setAttribute('d', 'M 140 0 L 0 0 0 140');
  gl.setAttribute('fill', 'none');
  gl.setAttribute('stroke', theme.grid);
  gl.setAttribute('stroke-width', '1');
  guidePattern.appendChild(gl);
  defs.appendChild(guidePattern);

  svg.appendChild(defs);

  const world = _mkSvg('g');
  world.id = 'neural-world';
  _mapCtx.world = world;

  const rangeX = _mapCtx.bounds.maxX - _mapCtx.bounds.minX;
  const rangeY = _mapCtx.bounds.maxY - _mapCtx.bounds.minY;
  const bgPad = 9000;

  const bg = _mkSvg('rect');
  bg.setAttribute('x', _mapCtx.bounds.minX - bgPad);
  bg.setAttribute('y', _mapCtx.bounds.minY - bgPad);
  bg.setAttribute('width', rangeX + bgPad * 2);
  bg.setAttribute('height', rangeY + bgPad * 2);
  bg.setAttribute('fill', theme.canvas);
  world.appendChild(bg);

  const grid = _mkSvg('rect');
  grid.setAttribute('x', _mapCtx.bounds.minX - bgPad);
  grid.setAttribute('y', _mapCtx.bounds.minY - bgPad);
  grid.setAttribute('width', rangeX + bgPad * 2);
  grid.setAttribute('height', rangeY + bgPad * 2);
  grid.setAttribute('fill', 'url(#space-grid)');
  world.appendChild(grid);

  const dots = _mkSvg('rect');
  dots.setAttribute('x', _mapCtx.bounds.minX - bgPad);
  dots.setAttribute('y', _mapCtx.bounds.minY - bgPad);
  dots.setAttribute('width', rangeX + bgPad * 2);
  dots.setAttribute('height', rangeY + bgPad * 2);
  dots.setAttribute('fill', 'url(#space-dots)');
  dots.setAttribute('opacity', '0.55');
  world.appendChild(dots);

  const layers = [..._mapCtx.layerMap.keys()].sort((a, b) => a - b);
  layers.forEach((ly) => {
    const group = _mapCtx.layerMap.get(ly);
    if (!group || group.length === 0) return;

    const x = group[0].x;
    const line = _mkSvg('line');
    line.setAttribute('x1', x);
    line.setAttribute('x2', x);
    line.setAttribute('y1', _mapCtx.bounds.minY - 90);
    line.setAttribute('y2', _mapCtx.bounds.maxY + 90);
    line.setAttribute('stroke', theme.guide);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '5,9');
    world.appendChild(line);

    const txt = _mkSvg('text');
    txt.setAttribute('x', x);
    txt.setAttribute('y', _mapCtx.bounds.maxY + 145);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('fill', theme.layerLabel);
    txt.setAttribute('font-size', '12');
    txt.setAttribute('font-weight', '700');
    txt.setAttribute('font-family', '-apple-system,BlinkMacSystemFont,sans-serif');
    txt.setAttribute('letter-spacing', '0.9');
    txt.textContent = _getLayerName(ly).toUpperCase();
    world.appendChild(txt);
  });

  const edgeLayer = _mkSvg('g');
  edgeLayer.id = 'ne-layer';
  world.appendChild(edgeLayer);

  ME.forEach(([a, b]) => {
    const na = _mapCtx.nodeById.get(a);
    const nb = _mapCtx.nodeById.get(b);
    if (!na || !nb) return;

    const dx = nb.x - na.x;
    const bend = Math.max(120, Math.abs(dx) * 0.35);
    const c1x = na.x + bend;
    const c2x = nb.x - bend;

    const p = _mkSvg('path');
    p.setAttribute('d', `M${na.x},${na.y} C${c1x},${na.y} ${c2x},${nb.y} ${nb.x},${nb.y}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', `${na.c}35`);
    p.setAttribute('stroke-width', '1.45');
    p.setAttribute('class', `ne ea-${a} ea-${b}`);
    p.setAttribute('vector-effect', 'non-scaling-stroke');
    p.dataset.base = `${na.c}35`;
    edgeLayer.appendChild(p);
    _mapCtx.edgeRecords.push({ a, b, el: p });
  });

  const nodeLayer = _mkSvg('g');
  nodeLayer.id = 'nn-layer';
  world.appendChild(nodeLayer);

  MN.forEach((n) => {
    const g = _mkSvg('g');
    g.setAttribute('class', 'nn');
    g.dataset.id = n.id;
    g.style.cursor = 'pointer';

    const layerDensity = (_mapCtx.layerMap.get(n.ly) || []).length;
    const baseRadius = n.ly === 0 ? 44 : 31;
    const radiusPenalty = Math.min(10, Math.floor(layerDensity / 8));
    const r = Math.max(18, baseRadius - radiusPenalty);

    const pulse = _mkSvg('circle');
    pulse.setAttribute('cx', n.x);
    pulse.setAttribute('cy', n.y);
    pulse.setAttribute('r', r + 11);
    pulse.setAttribute('fill', `${n.c}15`);
    pulse.setAttribute('class', 'npls');
    g.appendChild(pulse);

    const circ = _mkSvg('circle');
    circ.setAttribute('cx', n.x);
    circ.setAttribute('cy', n.y);
    circ.setAttribute('r', r);
    circ.setAttribute('fill', n.bg);
    circ.setAttribute('stroke', n.c);
    circ.setAttribute('stroke-width', '1.6');
    circ.setAttribute('filter', 'url(#map-glow)');
    circ.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(circ);

    _mapCtx.nodeGroupById.set(n.id, g);
    _mapCtx.nodeCircleById.set(n.id, circ);
    _mapCtx.nodePulseById.set(n.id, pulse);
    _mapCtx.nodeBaseRadiusById.set(n.id, r);
    _mapCtx.baseStrokeById.set(n.id, '1.6');

    const lines = n.lbl.split('\n');
    const lh = 11.8;
    const totalH = lines.length * lh;
    lines.forEach((ln, i) => {
      const t = _mkSvg('text');
      t.setAttribute('x', n.x);
      t.setAttribute('y', n.y - totalH / 2 + i * lh + lh * 0.82);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', n.c);
      t.setAttribute('font-size', n.ly === 0 ? '10.4' : '8.3');
      t.setAttribute('font-weight', '800');
      t.setAttribute('font-family', '-apple-system,BlinkMacSystemFont,sans-serif');
      t.setAttribute('letter-spacing', '0.45');
      t.setAttribute('pointer-events', 'none');
      t.textContent = ln;
      g.appendChild(t);
    });

    g.addEventListener('click', () => {
      if (Date.now() < _mapCtx.suppressClickUntil) return;
      _selectNode(n.id);
    });

    g.addEventListener('mouseenter', () => {
      if (_selNode !== n.id) {
        pulse.setAttribute('r', r + 18);
      }
    });

    g.addEventListener('mouseleave', () => {
      if (_selNode !== n.id) {
        _applyHighlights();
      }
    });

    nodeLayer.appendChild(g);
  });

  svg.appendChild(world);

  svg.addEventListener('click', (e) => {
    if (Date.now() < _mapCtx.suppressClickUntil) return;
    const nodeGroup = typeof e.target.closest === 'function' ? e.target.closest('.nn') : null;
    if (!nodeGroup) {
      _clearSelectedNode();
    }
  });

  _applyHighlights();
}

function _renderCategoryFilters() {
  const row = document.getElementById('mapa-filter-row');
  if (!row) return;

  row.innerHTML = _mapCtx.categoryDefs.map((cat) => (
    `<button class="mapa-filter-chip${cat.id === _mapCtx.activeCategory ? ' is-active' : ''}" data-id="${cat.id}" type="button">${_escapeHtml(cat.label)}</button>`
  )).join('');

  row.querySelectorAll('.mapa-filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      _mapCtx.activeCategory = btn.dataset.id || 'all';
      _renderCategoryFilters();
      _runSearch(_mapCtx.searchQuery);
    });
  });
}

function _renderSearchSuggestions() {
  const box = document.getElementById('mapa-search-suggest');
  if (!box) return;

  const query = _normalizeSearchText(_mapCtx.searchQuery);
  if (!query || !_mapCtx.searchSuggestOpen) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }

  const items = _getVisibleSearchResults();
  if (!items.length) {
    box.hidden = false;
    box.innerHTML = '<div class="mapa-search-item-empty">Nenhum nó encontrado para essa busca.</div>';
    return;
  }

  box.hidden = false;
  box.innerHTML = items.map((node, idx) => {
    const cats = _getNodeCategories(node).slice(0, 3);
    const badges = [
      `<span class="mapa-pill mapa-pill-layer">${_escapeHtml(_getLayerName(node.ly))}</span>`,
      ...cats.map((cat) => `<span class="mapa-pill" style="border-color:${cat.color}55;color:${cat.color}">${_escapeHtml(cat.label)}</span>`),
    ].join('');

    return `<button class="mapa-search-item${idx === _mapCtx.activeSuggestionIndex ? ' is-active' : ''}" data-id="${node.id}" data-idx="${idx}" type="button">
      <span class="mapa-search-item-main">
        <span class="mapa-search-item-title">${_escapeHtml(_formatNodeLabel(node.lbl))}</span>
        <span class="mapa-search-item-desc">${_escapeHtml(_truncateText(node.desc, 108))}</span>
      </span>
      <span class="mapa-search-item-badges">${badges}</span>
    </button>`;
  }).join('');

  box.querySelectorAll('.mapa-search-item').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    btn.addEventListener('click', () => {
      _chooseSearchResult(btn.dataset.id);
    });
  });
}

function _chooseSearchResult(nodeId) {
  const node = _mapCtx.nodeById.get(nodeId);
  const search = document.getElementById('mapa-search');
  if (!node) return;

  if (search) {
    search.value = _formatNodeLabel(node.lbl);
  }

  _runSearch(_formatNodeLabel(node.lbl));
  _selectNode(node.id);
  _focusNode(node.id);
  _mapCtx.searchSuggestOpen = false;
  _renderSearchSuggestions();
}

function _moveSuggestionCursor(step) {
  const items = _getVisibleSearchResults();
  if (!items.length) return;

  if (_mapCtx.activeSuggestionIndex < 0) {
    _mapCtx.activeSuggestionIndex = 0;
  } else {
    _mapCtx.activeSuggestionIndex = (_mapCtx.activeSuggestionIndex + step + items.length) % items.length;
  }

  _renderSearchSuggestions();
}

function _applyHighlights() {
  const searchActive = Boolean(_normalizeSearchText(_mapCtx.searchQuery));
  const categorySet = _getActiveCategorySet();
  const categoryActive = Boolean(categorySet);
  const matchedIds = new Set(_mapCtx.searchResults.map((node) => node.id));
  const primaryMatchId = _mapCtx.searchResults[0] ? _mapCtx.searchResults[0].id : null;

  _mapCtx.nodeGroupById.forEach((group, id) => {
    const node = _mapCtx.nodeById.get(id);
    const circle = _mapCtx.nodeCircleById.get(id);
    const pulse = _mapCtx.nodePulseById.get(id);
    const baseStroke = _mapCtx.baseStrokeById.get(id) || '1.6';
    const baseRadius = _mapCtx.nodeBaseRadiusById.get(id) || 31;
    const isSelected = _selNode === id;
    const isMatch = matchedIds.has(id);
    const isPrimary = primaryMatchId === id;
    const inCategory = !categoryActive || categorySet.has(id);

    let opacity = '1';
    if (searchActive) {
      opacity = isSelected || isMatch ? '1' : inCategory ? '0.18' : '0.08';
    } else if (categoryActive) {
      opacity = isSelected || inCategory ? '1' : '0.12';
    }

    if (group) {
      group.style.opacity = opacity;
    }

    if (circle && node) {
      circle.setAttribute('stroke', node.c);
      circle.setAttribute(
        'stroke-width',
        isSelected ? '3.3' : isPrimary ? '3.0' : isMatch ? '2.35' : baseStroke
      );
    }

    if (pulse) {
      pulse.setAttribute(
        'r',
        String(baseRadius + (isSelected ? 18 : isPrimary ? 16 : isMatch ? 14 : 11))
      );
      pulse.setAttribute('opacity', opacity);
    }
  });

  _mapCtx.edgeRecords.forEach(({ a, b, el }) => {
    const base = el.dataset.base || 'rgba(255,255,255,0.2)';
    const touchesSelected = _selNode && (a === _selNode || b === _selNode);
    const inCategoryA = !categoryActive || categorySet.has(a);
    const inCategoryB = !categoryActive || categorySet.has(b);
    const bothMatch = searchActive && matchedIds.has(a) && matchedIds.has(b);
    const oneMatch = searchActive && (matchedIds.has(a) || matchedIds.has(b));

    if (touchesSelected) {
      const selNode = _mapCtx.nodeById.get(_selNode);
      el.setAttribute('stroke', `${selNode.c}cc`);
      el.setAttribute('stroke-width', '2.35');
      el.style.opacity = '1';
      return;
    }

    if (!searchActive && categoryActive) {
      if (inCategoryA && inCategoryB) {
        el.setAttribute('stroke', base);
        el.setAttribute('stroke-width', '1.65');
        el.style.opacity = '0.52';
        return;
      }

      if (inCategoryA || inCategoryB) {
        el.setAttribute('stroke', base);
        el.setAttribute('stroke-width', '1.2');
        el.style.opacity = '0.16';
        return;
      }

      el.setAttribute('stroke', base);
      el.setAttribute('stroke-width', '1.0');
      el.style.opacity = '0.04';
      return;
    }

    if (bothMatch) {
      el.setAttribute('stroke', '#f2cc60cc');
      el.setAttribute('stroke-width', '2.0');
      el.style.opacity = '1';
      return;
    }

    if (oneMatch) {
      el.setAttribute('stroke', base);
      el.setAttribute('stroke-width', '1.7');
      el.style.opacity = '0.58';
      return;
    }

    el.setAttribute('stroke', base);
    el.setAttribute('stroke-width', searchActive ? '1.15' : '1.45');
    el.style.opacity = searchActive ? '0.12' : '0.82';
  });
}

function _focusNode(nodeId, minScale = 0.56) {
  const node = _mapCtx.nodeById.get(nodeId);
  if (!node) return;

  _mapCtx.cam.scale = _clamp(
    Math.max(_mapCtx.cam.scale, minScale),
    _mapCtx.cam.minScale,
    _mapCtx.cam.maxScale
  );
  _mapCtx.cam.tx = _mapCtx.viewport.w * 0.5 - node.x * _mapCtx.cam.scale;
  _mapCtx.cam.ty = _mapCtx.viewport.h * 0.5 - node.y * _mapCtx.cam.scale;
  _applyCam();
}

function _updateSearchMeta() {
  const meta = document.getElementById('mapa-search-meta');
  if (!meta) return;

  const query = _normalizeSearchText(_mapCtx.searchQuery);
  const activeCategory = _getActiveCategoryDef();
  const categorySet = _getActiveCategorySet();
  if (!query) {
    if (categorySet) {
      meta.textContent = `Filtro ativo: ${activeCategory.label} · ${categorySet.size} nós em destaque.`;
      return;
    }
    meta.textContent = 'Digite para destacar nós. Enter centraliza o primeiro resultado.';
    return;
  }

  if (!_mapCtx.searchResults.length) {
    meta.textContent = categorySet
      ? `Nenhum nó encontrado em ${activeCategory.label}.`
      : 'Nenhum nó encontrado para essa busca.';
    return;
  }

  const first = _formatNodeLabel(_mapCtx.searchResults[0].lbl);
  const count = _mapCtx.searchResults.length;
  const scope = categorySet ? ` em ${activeCategory.label}` : '';
  meta.textContent = `${count} ${count === 1 ? 'nó encontrado' : 'nós encontrados'}${scope} · Enter seleciona "${first}"`;
}

function _runSearch(rawQuery) {
  _mapCtx.searchQuery = rawQuery || '';
  _mapCtx.searchResults = _searchNodes(_mapCtx.searchQuery);
  _mapCtx.activeSuggestionIndex = _getVisibleSearchResults().length ? 0 : -1;
  _applyHighlights();
  _updateSearchMeta();
  _renderSearchSuggestions();
}

function _selectNode(nodeId) {
  const n = _mapCtx.nodeById.get(nodeId);
  if (!n) return;

  _selNode = nodeId;
  _applyHighlights();
  _renderMapaPanel(n);
  _setPanelOpen(true);
}

function _updateStats() {
  const statsEl = document.getElementById('mapa-stats');
  if (!statsEl) return;
  statsEl.textContent = `${MN.length} nós · ${ME.length} sinapses`;
}

function _updateZoomLabel() {
  const el = document.getElementById('mapa-zoom-value');
  if (!el) return;
  el.textContent = `${Math.round(_mapCtx.cam.scale * 100)}%`;
}

function _applyCam() {
  const { scale, tx, ty } = _mapCtx.cam;
  if (!_mapCtx.world) return;
  _mapCtx.world.setAttribute(
    'transform',
    `matrix(${scale.toFixed(4)} 0 0 ${scale.toFixed(4)} ${tx.toFixed(2)} ${ty.toFixed(2)})`
  );
  _updateZoomLabel();
}

function _updateViewport() {
  const w = Math.max(_mapCtx.cvs.clientWidth || 0, 320);
  const h = Math.max(_mapCtx.cvs.clientHeight || 0, 260);
  _mapCtx.viewport = { w, h };

  _mapCtx.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  _mapCtx.svg.setAttribute('width', String(w));
  _mapCtx.svg.setAttribute('height', String(h));
}

function _zoomAt(sx, sy, factor) {
  const cam = _mapCtx.cam;
  const nextScale = _clamp(cam.scale * factor, cam.minScale, cam.maxScale);
  if (nextScale === cam.scale) return;

  const wx = (sx - cam.tx) / cam.scale;
  const wy = (sy - cam.ty) / cam.scale;

  cam.scale = nextScale;
  cam.tx = sx - wx * cam.scale;
  cam.ty = sy - wy * cam.scale;

  _applyCam();
}

function _fitMap() {
  const { minX, maxX, minY, maxY } = _mapCtx.bounds;
  const { w, h } = _mapCtx.viewport;

  const bw = maxX - minX;
  const bh = maxY - minY;
  const pad = 140;

  const scale = _clamp(Math.min((w - pad) / bw, (h - pad) / bh), _mapCtx.cam.minScale, 0.95);
  _mapCtx.cam.scale = scale;
  _mapCtx.cam.tx = w / 2 - ((minX + maxX) / 2) * scale;
  _mapCtx.cam.ty = h / 2 - ((minY + maxY) / 2) * scale;

  _applyCam();
}

function _focusRoot() {
  const root = _mapCtx.nodeById.get('root');
  if (!root) {
    _fitMap();
    return;
  }
  const { w, h } = _mapCtx.viewport;
  _mapCtx.cam.scale = 0.52;
  _mapCtx.cam.tx = w * 0.22 - root.x * _mapCtx.cam.scale;
  _mapCtx.cam.ty = h * 0.5 - root.y * _mapCtx.cam.scale;
  _applyCam();
}

function _bindPointerPanZoom() {
  let drag = null;

  _mapCtx.cvs.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = _mapCtx.svg.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = Math.exp(-e.deltaY * 0.00125);
    _zoomAt(sx, sy, factor);
  }, { passive: false });

  _mapCtx.cvs.addEventListener('dblclick', (e) => {
    const rect = _mapCtx.svg.getBoundingClientRect();
    _zoomAt(e.clientX - rect.left, e.clientY - rect.top, 1.25);
  });

  _mapCtx.cvs.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;

    drag = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      tx: _mapCtx.cam.tx,
      ty: _mapCtx.cam.ty,
      moved: false,
    };
  });

  _mapCtx.cvs.addEventListener('pointermove', (e) => {
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 4) {
      drag.moved = true;
      _mapCtx.cvs.classList.add('is-dragging');
      _mapCtx.cvs.setPointerCapture(e.pointerId);
    }

    if (!drag.moved) return;

    _mapCtx.cam.tx = drag.tx + dx;
    _mapCtx.cam.ty = drag.ty + dy;
    _applyCam();
  });

  function finishDrag(e) {
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.moved) {
      _mapCtx.suppressClickUntil = Date.now() + 120;
    }
    drag = null;
    _mapCtx.cvs.classList.remove('is-dragging');
    if (_mapCtx.cvs.hasPointerCapture(e.pointerId)) {
      _mapCtx.cvs.releasePointerCapture(e.pointerId);
    }
  }

  _mapCtx.cvs.addEventListener('pointerup', finishDrag);
  _mapCtx.cvs.addEventListener('pointercancel', finishDrag);
}

function _wireToolbar() {
  const themeButtons = _mapCtx.root ? Array.from(_mapCtx.root.querySelectorAll('[data-mapa-theme]')) : [];
  const search = document.getElementById('mapa-search');
  const clearSearch = document.getElementById('mapa-search-clear');
  const searchWrap = _mapCtx.root ? _mapCtx.root.querySelector('.mapa-search') : null;

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextTheme = button.dataset.mapaTheme || 'dark';
      if (nextTheme === _mapCtx.theme) return;
      _applyMapTheme(nextTheme, { persist: true, redraw: true });
    });
  });

  if (_mapCtx.root) {
    _mapCtx.root.querySelectorAll('[data-mapa-action="zoom-in"]').forEach((button) => {
      button.addEventListener('click', () => {
        _zoomAt(_mapCtx.viewport.w * 0.5, _mapCtx.viewport.h * 0.5, 1.17);
      });
    });

    _mapCtx.root.querySelectorAll('[data-mapa-action="zoom-out"]').forEach((button) => {
      button.addEventListener('click', () => {
        _zoomAt(_mapCtx.viewport.w * 0.5, _mapCtx.viewport.h * 0.5, 0.85);
      });
    });

    _mapCtx.root.querySelectorAll('[data-mapa-action="focus-root"]').forEach((button) => {
      button.addEventListener('click', () => {
        _focusRoot();
      });
    });

    _mapCtx.root.querySelectorAll('[data-mapa-action="fit"]').forEach((button) => {
      button.addEventListener('click', () => {
        _fitMap();
      });
    });

    _mapCtx.root.querySelectorAll('[data-mapa-action="toggle-immersive"]').forEach((button) => {
      button.addEventListener('click', () => {
        _setMapImmersive(!_mapCtx.immersive);
      });
    });

    _mapCtx.root.querySelectorAll('[data-mapa-action="exit-immersive"]').forEach((button) => {
      button.addEventListener('click', () => {
        _setMapImmersive(false);
      });
    });

    _mapCtx.root.querySelectorAll('[data-mapa-action="toggle-panel"]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!_selNode) return;
        _setPanelOpen(!_mapCtx.panelOpen);
      });
    });

    _mapCtx.root.addEventListener('click', (e) => {
      const closePanelButton = e.target.closest('[data-mapa-action="close-panel"]');
      if (closePanelButton) {
        _setPanelOpen(false);
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _mapCtx.immersive) {
      _setMapImmersive(false);
    }
  });

  if (search) {
    search.addEventListener('focus', () => {
      if (_normalizeSearchText(search.value)) {
        _mapCtx.searchSuggestOpen = true;
        _renderSearchSuggestions();
      }
    });

    search.addEventListener('input', () => {
      _mapCtx.searchSuggestOpen = Boolean(_normalizeSearchText(search.value));
      _runSearch(search.value);
    });

    search.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _mapCtx.searchSuggestOpen = true;
        _moveSuggestionCursor(1);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        _mapCtx.searchSuggestOpen = true;
        _moveSuggestionCursor(-1);
        return;
      }

      if (e.key === 'Enter') {
        const items = _getVisibleSearchResults();
        const first = items[_mapCtx.activeSuggestionIndex] || items[0];
        if (!first) return;
        e.preventDefault();
        _chooseSearchResult(first.id);
      }

      if (e.key === 'Escape') {
        search.value = '';
        _mapCtx.searchSuggestOpen = false;
        _runSearch('');
        search.blur();
      }
    });
  }

  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      if (search) {
        search.value = '';
        search.focus();
      }
      _mapCtx.searchSuggestOpen = false;
      _runSearch('');
    });
  }

  if (searchWrap) {
    document.addEventListener('pointerdown', (e) => {
      if (!searchWrap.contains(e.target)) {
        _mapCtx.searchSuggestOpen = false;
        _renderSearchSuggestions();
      }
    });
  }
}

function _observeResize() {
  if (_mapCtx.resizeObs) return;

  _mapCtx.resizeObs = new ResizeObserver(() => {
    const prev = { ..._mapCtx.viewport };
    _updateViewport();

    if (!prev.w || !prev.h) {
      _applyCam();
      return;
    }

    const cx = prev.w * 0.5;
    const cy = prev.h * 0.5;
    const worldX = (cx - _mapCtx.cam.tx) / _mapCtx.cam.scale;
    const worldY = (cy - _mapCtx.cam.ty) / _mapCtx.cam.scale;

    _mapCtx.cam.tx = _mapCtx.viewport.w * 0.5 - worldX * _mapCtx.cam.scale;
    _mapCtx.cam.ty = _mapCtx.viewport.h * 0.5 - worldY * _mapCtx.cam.scale;

    _applyCam();
  });

  _mapCtx.resizeObs.observe(_mapCtx.cvs);
}

function initMapa() {
  if (_mapaInit) return;

  _mapCtx.root = document.getElementById('mapa');
  _mapCtx.cvs = document.getElementById('mapa-cvs');
  _mapCtx.svg = document.getElementById('neural-svg');

  if (!_mapCtx.root || !_mapCtx.cvs || !_mapCtx.svg || !Array.isArray(MN) || !Array.isArray(ME)) {
    return;
  }

  _mapaInit = true;
  _applyMapTheme(_loadMapTheme(), { persist: false, redraw: false });

  _rebuildMaps();
  _buildCategorySets();
  _computeLayout();
  _updateViewport();
  _drawScene();
  _renderCategoryFilters();
  _bindPointerPanZoom();
  _wireToolbar();
  _observeResize();

  _updateStats();
  _renderEmptyMapaPanel();
  _syncMapUiState();
  _focusRoot();
  _runSearch('');
}

window.exitMapaImmersive = function exitMapaImmersive() {
  _setMapImmersive(false);
};

function _formatNodeLabel(label) {
  return label.replace(/\n/g, ' ');
}

function _renderLinkSection(title, items) {
  if (!items || !items.length) return '';

  let h = `<div class="mapa-sec">${title}</div>`;
  items.forEach((item) => {
    h += `<a class="mapa-lnk" href="${item.u}" target="_blank" rel="noopener"><span class="li">${item.i}</span><span>${item.t}</span></a>`;
  });
  return h;
}

function _renderListSection(title, items, icon, extraClass = '') {
  if (!items || !items.length) return '';

  let h = `<div class="mapa-sec">${title}</div><ul class="mapa-list ${extraClass}">`;
  items.forEach((item) => {
    h += `<li><span class="mapa-list-icon">${icon}</span><span>${item}</span></li>`;
  });
  h += '</ul>';
  return h;
}

function _renderTopicSection(title, items) {
  if (!items || !items.length) return '';

  let h = `<div class="mapa-sec">${title}</div><div class="mapa-topic-row">`;
  items.forEach((item) => {
    h += `<span class="mapa-chip mapa-chip-topic">${item}</span>`;
  });
  h += '</div>';
  return h;
}

function _renderMapaPanel(n) {
  const pnl = document.getElementById('mapa-pnl');
  if (!pnl) return;

  const neighbors = [...(_mapCtx.adjacency.get(n.id) || [])]
    .map((id) => _mapCtx.nodeById.get(id))
    .filter(Boolean)
    .sort((a, b) => a.ly - b.ly)
    .slice(0, 12);

  const hasStructuredContent = [
    n.topics,
    n.quickNotes,
    n.lnks,
    n.lessons,
    n.articles,
    n.practice,
    n.projects,
    n.cmds,
  ].some((items) => items && items.length);

  const closeButton = _mapCtx.immersive
    ? '<button class="mapa-panel-close" type="button" data-mapa-action="close-panel">Fechar</button>'
    : '';

  let h = `<div class="mapa-pnl-inner">
    <div class="mapa-panel-head">
      <div class="mapa-panel-main">
        <h3>${_formatNodeLabel(n.lbl)}</h3>
        <span class="mapa-badge" style="background:${n.bg};color:${n.c}">${_getLayerName(n.ly)}</span>
      </div>
      ${closeButton}
    </div>
    <p class="mapa-pdesc">${n.desc}</p>
    <div class="mapa-sec">🔗 Sinapses conectadas</div>
    <p class="mapa-pdesc" style="margin-bottom:6px">${(_mapCtx.adjacency.get(n.id) || []).size} conexões diretas</p>`;

  if (neighbors.length) {
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">';
    neighbors.forEach((nb) => {
      h += `<span class="mapa-chip" style="border-color:${nb.c}55;color:${nb.c};background:${nb.bg}">${_formatNodeLabel(nb.lbl)}</span>`;
    });
    h += '</div>';
  }

  h += _renderTopicSection('Tópicos-Chave', n.topics);
  h += _renderListSection('Resumo Rápido', n.quickNotes, '=');
  h += _renderLinkSection('Materiais', n.lnks);
  h += _renderLinkSection('Vídeos e Aulas', n.lessons);
  h += _renderLinkSection('Artigos', n.articles);
  h += _renderListSection('Prática', n.practice, '>');
  h += _renderListSection('Projetos', n.projects, '#');

  if (n.cmds && n.cmds.length) {
    h += '<div class="mapa-sec">Comandos e Snippets</div><div class="mapa-cmds">';
    n.cmds.forEach((c) => {
      h += `<div class="mapa-cmd">${c}</div>`;
    });
    h += '</div>';
  }

  if (!hasStructuredContent) {
    h += '<div class="mapa-sec">🚧 Conteúdo</div>';
    h += '<p class="mapa-pdesc">Este nó ainda não recebeu conteúdo detalhado.</p>';
  }

  h += '</div>';
  pnl.innerHTML = h;
}
