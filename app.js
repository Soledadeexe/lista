/**
 * LISTA DE COMPRAS INTELIGENTE - SUPERMERCADO
 * Sincronização em Tempo Real (Firebase + BroadcastChannel) & Divisão de Gastos
 * Itens importados de Lista.txt
 */

// ============================================================================
// DADOS INICIAIS BASEADOS EM Lista.txt (WhatsApp Claudia Lopes)
// ============================================================================
const DEFAULT_ITEMS = [
  // 🥬 Hortifrúti
  { id: 'item_1', name: 'Alho', sector: 'hortifruti', quantity: 1, unit: 'un', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_2', name: 'Cebolinha verde', sector: 'hortifruti', quantity: 1, unit: 'maço', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_3', name: 'Limão', sector: 'hortifruti', quantity: 1, unit: 'kg', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_4', name: 'Tomate', sector: 'hortifruti', quantity: 1, unit: 'kg', price: 0, checked: false, assignedTo: 'shared' },

  // 🥖 Padaria
  { id: 'item_5', name: 'Pão', sector: 'padaria', quantity: 1, unit: 'pct', price: 0, checked: false, assignedTo: 'shared' },

  // 🧀 Frios e Laticínios
  { id: 'item_6', name: 'Margarina', sector: 'frios', quantity: 1, unit: 'pote', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_7', name: 'Mussarela', sector: 'frios', quantity: 1, unit: 'bandeja', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_8', name: 'Requeijão', sector: 'frios', quantity: 1, unit: 'copo', price: 0, checked: false, assignedTo: 'shared' },

  // 🥫 Mercearia & Despensa
  { id: 'item_9', name: 'Açúcar demerara', sector: 'mercearia', quantity: 1, unit: 'kg', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_10', name: 'Azeite', sector: 'mercearia', quantity: 1, unit: 'un', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_11', name: 'Chocolate em pó', sector: 'mercearia', quantity: 1, unit: 'lata', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_12', name: 'Farelo de aveia', sector: 'mercearia', quantity: 1, unit: 'pct', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_13', name: 'Feijão', sector: 'mercearia', quantity: 1, unit: 'kg', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_14', name: 'Fubá', sector: 'mercearia', quantity: 1, unit: 'pct', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_15', name: 'Nescau', sector: 'mercearia', quantity: 1, unit: 'lata', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_16', name: 'Sal', sector: 'mercearia', quantity: 1, unit: 'kg', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_17', name: 'Vinagre', sector: 'mercearia', quantity: 1, unit: 'frasco', price: 0, checked: false, assignedTo: 'shared' },

  // 🧹 Limpeza
  { id: 'item_18', name: 'Água sanitária', sector: 'limpeza', quantity: 1, unit: 'un', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_19', name: 'Amaciante', sector: 'limpeza', quantity: 1, unit: 'un', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_20', name: 'Detergente', sector: 'limpeza', quantity: 1, unit: 'un', price: 0, checked: false, assignedTo: 'shared' },

  // 📦 Utilidades e Descartáveis
  { id: 'item_21', name: 'Papel manteiga', sector: 'utilidades', quantity: 1, unit: 'rolo', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_22', name: 'Saco de lixo para pia', sector: 'utilidades', quantity: 1, unit: 'pct', price: 0, checked: false, assignedTo: 'shared' },
  { id: 'item_23', name: 'Saco de Lixo', sector: 'utilidades', quantity: 1, unit: 'pct', price: 0, checked: false, assignedTo: 'shared' }
];

const SECTOR_INFO = {
  hortifruti: { name: 'Hortifrúti', icon: '🥬', color: '#10b981' },
  padaria: { name: 'Padaria & Pães', icon: '🥖', color: '#f59e0b' },
  frios: { name: 'Laticínios & Frios', icon: '🧀', color: '#eab308' },
  mercearia: { name: 'Mercearia & Despensa', icon: '🥫', color: '#6366f1' },
  limpeza: { name: 'Limpeza', icon: '🧹', color: '#06b6d4' },
  utilidades: { name: 'Utilidades & Descartáveis', icon: '📦', color: '#8b5cf6' }
};

// ============================================================================
// ESTADO GLOBAL DA APLICAÇÃO
// ============================================================================
let state = {
  user1: 'Lucas',
  user2: 'Claudia',
  currentUserId: 'user1',
  splitMode: 'equal', // 'equal' (50/50) ou 'proportional' (por item)
  calcScope: 'checkedOnly', // 'checkedOnly' ou 'allItems'
  roomId: 'compras-hoje',
  items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
  collapsedSectors: {},
  filterSector: 'all',
  filterPendingOnly: false,
  searchQuery: ''
};

// Flags de sincronização
let isRemoteUpdating = false;
let debounceTimer = null;
let broadcastChannel = null;
let firebaseApp = null;
let firebaseDbRef = null;

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initBroadcastChannel();
  loadLocalState();
  checkUrlSyncParams();
  initFirebaseFromStorage();
  setupEventListeners();
  renderApp();
});

// ============================================================================
// PERSISTÊNCIA & CARREGAMENTO LOCAL
// ============================================================================
function loadLocalState() {
  // Preferência de tamanho de fonte para smartphone
  const isLargeText = localStorage.getItem('mercado_large_text') === 'true';
  if (isLargeText) {
    document.body.classList.add('large-text');
    const fontBtn = document.getElementById('btnFontToggle');
    if (fontBtn) fontBtn.innerHTML = '<span>A-</span>';
  }

  const savedState = localStorage.getItem('mercado_lista_state');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      state.user1 = parsed.user1 || 'Lucas';
      state.user2 = parsed.user2 || 'Claudia';
      state.currentUserId = parsed.currentUserId || 'user1';
      state.splitMode = parsed.splitMode || 'equal';
      state.calcScope = parsed.calcScope || 'checkedOnly';
      state.roomId = parsed.roomId || 'compras-hoje';
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        state.items = parsed.items;
      }
    } catch (e) {
      console.error('Erro ao ler estado do localStorage:', e);
    }
  }
}

function saveLocalState() {
  const toSave = {
    user1: state.user1,
    user2: state.user2,
    currentUserId: state.currentUserId,
    splitMode: state.splitMode,
    calcScope: state.calcScope,
    roomId: state.roomId,
    items: state.items
  };
  localStorage.setItem('mercado_lista_state', JSON.stringify(toSave));
}

// ============================================================================
// SINCRONIZAÇÃO EM TEMPO REAL: BROADCAST CHANNEL & FIREBASE
// ============================================================================

// BroadcastChannel para sincronizar abas no mesmo navegador instantaneamente (sem setup)
function initBroadcastChannel() {
  if ('BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel('mercado_sync_channel');
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATE') {
          handleIncomingState(event.data.payload);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel não suportado neste navegador:', e);
    }
  }
}

function broadcastLocalUpdate() {
  if (isRemoteUpdating) return;
  saveLocalState();

  const payload = {
    items: state.items,
    user1: state.user1,
    user2: state.user2,
    splitMode: state.splitMode,
    calcScope: state.calcScope,
    timestamp: Date.now()
  };

  // Broadcast local para abas irmãs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'STATE_UPDATE', payload });
  }

  // Enviar para o Firebase se conectado
  if (firebaseDbRef) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      firebaseDbRef.set(payload).catch(err => {
        console.error('Erro ao enviar dados para o Firebase:', err);
      });
    }, 250);
  }
}

function handleIncomingState(incoming) {
  if (!incoming) return;
  isRemoteUpdating = true;

  if (Array.isArray(incoming.items)) {
    state.items = incoming.items;
  }
  if (incoming.user1) state.user1 = incoming.user1;
  if (incoming.user2) state.user2 = incoming.user2;
  if (incoming.splitMode) state.splitMode = incoming.splitMode;
  if (incoming.calcScope) state.calcScope = incoming.calcScope;

  saveLocalState();
  renderApp();
  showToast('🔄 Lista atualizada em tempo real!');
  isRemoteUpdating = false;
}

// Conexão com Firebase Realtime Database
function initFirebase(config, roomId) {
  if (!window.firebase) {
    alert('Biblioteca do Firebase ainda não carregada. Verifique sua conexão de internet.');
    return false;
  }

  try {
    if (firebaseApp) {
      // Se já existia uma instância, remove o listener anterior
      if (firebaseDbRef) firebaseDbRef.off();
    } else {
      firebaseApp = firebase.initializeApp(config);
    }

    const db = firebase.database();
    state.roomId = roomId || state.roomId || 'compras-hoje';
    firebaseDbRef = db.ref('mercado_lists/' + state.roomId);

    // Atualiza status na tela
    updateSyncStatusUI('connecting', 'Conectando...');

    // Listener em tempo real
    firebaseDbRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        handleIncomingState(data);
      } else {
        // Se a sala ainda não tem dados no Firebase, envia os locais
        broadcastLocalUpdate();
      }
      updateSyncStatusUI('synced', `🟢 Sincronizado (${state.roomId})`);
    }, (error) => {
      console.error('Erro de permissão no Firebase:', error);
      updateSyncStatusUI('local', 'Erro no Firebase (Verifique regras)');
      showToast('⚠️ Erro no Firebase: certifique-se de usar Modo de Teste');
    });

    // Salvar configuração válida
    localStorage.setItem('mercado_firebase_config', JSON.stringify(config));
    localStorage.setItem('mercado_firebase_room', state.roomId);
    return true;
  } catch (e) {
    console.error('Falha ao inicializar Firebase:', e);
    alert('Erro ao conectar ao Firebase: ' + e.message);
    updateSyncStatusUI('local', 'Modo Local');
    return false;
  }
}

function initFirebaseFromStorage() {
  const savedConfig = localStorage.getItem('mercado_firebase_config');
  const savedRoom = localStorage.getItem('mercado_firebase_room') || state.roomId;
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      document.getElementById('txtFirebaseConfig').value = JSON.stringify(parsedConfig, null, 2);
      document.getElementById('inputRoomId').value = savedRoom;
      initFirebase(parsedConfig, savedRoom);
    } catch (e) {
      console.warn('Configuração salva do Firebase inválida:', e);
    }
  }
}

function updateSyncStatusUI(type, label) {
  const badge = document.getElementById('btnSyncStatus');
  const text = document.getElementById('syncStatusText');
  badge.className = 'status-badge ' + type;
  text.textContent = label;

  const btnDisconnect = document.getElementById('btnDisconnectFirebase');
  if (type === 'synced') {
    btnDisconnect.classList.remove('hidden');
  } else if (type === 'local') {
    btnDisconnect.classList.add('hidden');
  }
}

// Sincronização via link URL hash (#sync=...)
function checkUrlSyncParams() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#sync=')) {
    try {
      const encoded = hash.replace('#sync=', '');
      const decodedStr = decodeURIComponent(escape(atob(encoded)));
      const syncData = JSON.parse(decodedStr);

      if (syncData.firebaseConfig) {
        state.roomId = syncData.roomId || 'compras-hoje';
        if (syncData.user1) state.user1 = syncData.user1;
        if (syncData.user2) state.user2 = syncData.user2;
        
        // Se a pessoa abriu o link do Lucas, ela provavelmente é a Claudia (user2)
        state.currentUserId = 'user2';
        
        initFirebase(syncData.firebaseConfig, state.roomId);
        showToast('🎉 Conectado à lista compartilhada!');
      }

      // Limpa o hash da URL para ficar limpo
      history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      console.error('Erro ao ler parâmetros de sincronização da URL:', e);
    }
  }
}

function generateShareUrl() {
  const baseUrl = window.location.origin + window.location.pathname;
  const savedConfig = localStorage.getItem('mercado_firebase_config');

  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      const syncData = {
        firebaseConfig: config,
        roomId: state.roomId,
        user1: state.user1,
        user2: state.user2
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(syncData))));
      return `${baseUrl}#sync=${encoded}`;
    } catch (e) {
      console.error('Erro ao gerar URL com credenciais:', e);
    }
  }

  // Fallback se não configurou Firebase: link direto da página
  return baseUrl;
}

// ============================================================================
// CÁLCULOS FINANCEIROS E DIVISÃO
// ============================================================================
function calculateTotals() {
  const targetItems = state.calcScope === 'checkedOnly'
    ? state.items.filter(item => item.checked)
    : state.items;

  let totalGeneral = 0;
  let totalUser1Only = 0;
  let totalUser2Only = 0;
  let totalShared = 0;

  targetItems.forEach(item => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQty = parseInt(item.quantity) || 1;
    const subtotal = itemPrice * itemQty;

    totalGeneral += subtotal;

    if (item.assignedTo === 'user1') {
      totalUser1Only += subtotal;
    } else if (item.assignedTo === 'user2') {
      totalUser2Only += subtotal;
    } else {
      totalShared += subtotal;
    }
  });

  let finalUser1 = 0;
  let finalUser2 = 0;

  if (state.splitMode === 'equal') {
    // Divisão 50% / 50% pura do total geral
    finalUser1 = totalGeneral / 2;
    finalUser2 = totalGeneral / 2;
  } else {
    // Divisão por itens exclusivos + metade dos compartilhados
    finalUser1 = totalUser1Only + (totalShared / 2);
    finalUser2 = totalUser2Only + (totalShared / 2);
  }

  const checkedCount = state.items.filter(i => i.checked).length;
  const totalCount = state.items.length;

  return {
    totalGeneral,
    totalUser1Only,
    totalUser2Only,
    totalShared,
    finalUser1,
    finalUser2,
    checkedCount,
    totalCount
  };
}

function formatCurrency(val) {
  return (val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function parsePriceInput(val) {
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = String(val).replace(',', '.').replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

// ============================================================================
// RENDERIZAÇÃO DA INTERFACE
// ============================================================================
function renderApp() {
  renderSummary();
  renderItemsList();
  updateInputsFromState();
}

function renderSummary() {
  const totals = calculateTotals();

  // Top Card
  document.getElementById('valTotalGeneral').textContent = formatCurrency(totals.totalGeneral);
  document.getElementById('nameDisplayUser1').textContent = state.user1;
  document.getElementById('nameDisplayUser2').textContent = state.user2;
  document.getElementById('avatarUser1').textContent = state.user1.charAt(0).toUpperCase();
  document.getElementById('avatarUser2').textContent = state.user2.charAt(0).toUpperCase();

  document.getElementById('valUser1').textContent = formatCurrency(totals.finalUser1);
  document.getElementById('valUser2').textContent = formatCurrency(totals.finalUser2);

  // Subtítulo dos cards
  if (state.splitMode === 'equal') {
    document.getElementById('subUser1').textContent = '50% do total';
    document.getElementById('subUser2').textContent = '50% do total';
    document.getElementById('splitModeLabel').textContent = 'Divisão: 50% / 50%';
  } else {
    document.getElementById('subUser1').textContent = `${formatCurrency(totals.totalUser1Only)} indiv. + 50% comum`;
    document.getElementById('subUser2').textContent = `${formatCurrency(totals.totalUser2Only)} indiv. + 50% comum`;
    document.getElementById('splitModeLabel').textContent = 'Divisão: Por Itens';
  }

  // Barra de progresso
  const percent = totals.totalCount > 0 ? (totals.checkedCount / totals.totalCount) * 100 : 0;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressText').textContent = `${totals.checkedCount} de ${totals.totalCount} itens no carrinho`;

  // Barra de Acerto de Contas / Pix
  const settlementEl = document.getElementById('settlementText');
  if (totals.totalGeneral === 0) {
    settlementEl.textContent = 'Marque os itens e preços para ver o cálculo por pessoa.';
  } else if (state.splitMode === 'equal') {
    settlementEl.innerHTML = `Total de <strong>${formatCurrency(totals.totalGeneral)}</strong>. Cada um paga <strong>${formatCurrency(totals.finalUser1)}</strong> no caixa.`;
  } else {
    settlementEl.innerHTML = `Conta individual: <strong>${state.user1}</strong> (${formatCurrency(totals.finalUser1)}) e <strong>${state.user2}</strong> (${formatCurrency(totals.finalUser2)}).`;
  }

  // Barra Fixa Inferior (Mobile)
  document.getElementById('bottomValTotal').textContent = formatCurrency(totals.totalGeneral);
  document.getElementById('bottomU1Name').textContent = `${state.user1}:`;
  document.getElementById('bottomU2Name').textContent = `${state.user2}:`;
  document.getElementById('bottomValU1').textContent = formatCurrency(totals.finalUser1);
  document.getElementById('bottomValU2').textContent = formatCurrency(totals.finalUser2);
}

function renderItemsList() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';

  // Filtragem
  const query = state.searchQuery.toLowerCase().trim();
  let filteredItems = state.items.filter(item => {
    // Filtro por busca
    if (query && !item.name.toLowerCase().includes(query)) {
      return false;
    }
    // Filtro por setor
    if (state.filterSector !== 'all' && item.sector !== state.filterSector) {
      return false;
    }
    // Filtro só pendentes
    if (state.filterPendingOnly && item.checked) {
      return false;
    }
    return true;
  });

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h3>Nenhum item encontrado</h3>
        <p>Tente ajustar a busca ou adicionar um novo item acima.</p>
      </div>
    `;
    return;
  }

  // Agrupar itens por setor
  const grouped = {};
  Object.keys(SECTOR_INFO).forEach(secKey => {
    grouped[secKey] = [];
  });

  filteredItems.forEach(item => {
    const secKey = item.sector in SECTOR_INFO ? item.sector : 'mercearia';
    if (!grouped[secKey]) grouped[secKey] = [];
    grouped[secKey].push(item);
  });

  // Renderizar cada setor
  Object.keys(SECTOR_INFO).forEach(secKey => {
    const secItems = grouped[secKey];
    if (secItems.length === 0) return; // Não exibe setores vazios no filtro atual

    const secMeta = SECTOR_INFO[secKey];
    const isCollapsed = !!state.collapsedSectors[secKey];
    const checkedInSector = secItems.filter(i => i.checked).length;
    const isAllChecked = checkedInSector === secItems.length;

    const sectorCard = document.createElement('div');
    sectorCard.className = `sector-card ${isCollapsed ? 'collapsed' : ''}`;
    sectorCard.style.setProperty('--sector-color', secMeta.color);

    sectorCard.innerHTML = `
      <div class="sector-header" data-sector-toggle="${secKey}">
        <div class="sector-title-wrap">
          <span class="sector-icon">${secMeta.icon}</span>
          <span class="sector-name">${secMeta.name}</span>
          <span class="sector-badge ${isAllChecked ? 'completed' : ''}">${checkedInSector}/${secItems.length}</span>
        </div>
        <span class="sector-toggle-arrow">▼</span>
      </div>
      <div class="items-list">
        ${secItems.map(item => renderItemRowHtml(item)).join('')}
      </div>
    `;

    container.appendChild(sectorCard);
  });
}

function renderItemRowHtml(item) {
  // Label e classe de atribuição
  let assignLabel = '👥 50/50';
  let assignClass = 'shared';
  if (item.assignedTo === 'user1') {
    assignLabel = `👤 ${state.user1}`;
    assignClass = 'user1';
  } else if (item.assignedTo === 'user2') {
    assignLabel = `👤 ${state.user2}`;
    assignClass = 'user2';
  }

  const priceVal = item.price > 0 ? Number(item.price).toFixed(2) : '';

  return `
    <div class="item-row ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
      <div class="item-left">
        <label class="custom-checkbox">
          <input type="checkbox" class="chk-item" ${item.checked ? 'checked' : ''}>
          <span class="checkbox-mark"></span>
        </label>
        
        <div class="item-details">
          <span class="item-name" title="Clique para marcar">${escapeHtml(item.name)}</span>
          <div class="item-meta">
            <span class="item-qty-tag" data-action="cycle-qty" title="Toque para mudar quantidade">${item.quantity || 1}x</span>
            <span class="assign-pill ${assignClass}" data-action="cycle-assign" title="Toque para alternar quem paga">${assignLabel}</span>
          </div>
        </div>
      </div>

      <div class="item-right">
        <div class="price-input-wrap">
          <span class="price-currency">R$</span>
          <input 
            type="number" 
            step="0.01" 
            min="0" 
            inputmode="decimal"
            placeholder="0,00"
            value="${priceVal}" 
            class="price-input" 
            data-action="change-price"
          >
        </div>
        <button class="item-delete-btn" data-action="delete-item" title="Remover item">&times;</button>
      </div>
    </div>
  `;
}

function updateInputsFromState() {
  document.getElementById('inputUser1').value = state.user1;
  document.getElementById('inputUser2').value = state.user2;
  document.getElementById('radioLabelUser1').textContent = state.user1;
  document.getElementById('radioLabelUser2').textContent = state.user2;

  // Identity radio
  const radios = document.getElementsByName('currentIdentity');
  for (let r of radios) {
    r.checked = (r.value === state.currentUserId);
  }

  // Split mode radio
  const splitRadios = document.getElementsByName('splitSetting');
  for (let r of splitRadios) {
    r.checked = (r.value === state.splitMode);
  }

  // Scope checkbox
  document.getElementById('chkCalcCheckedOnly').checked = (state.calcScope === 'checkedOnly');
}

// ============================================================================
// EVENT LISTENERS & AÇÕES DO USUÁRIO
// ============================================================================
function setupEventListeners() {
  // Alternar Tamanho da Fonte para Leitura Fácil no Smartphone
  const btnFontToggle = document.getElementById('btnFontToggle');
  if (btnFontToggle) {
    btnFontToggle.addEventListener('click', () => {
      const isNowLarge = document.body.classList.toggle('large-text');
      btnFontToggle.innerHTML = isNowLarge ? '<span>A-</span>' : '<span>A+</span>';
      localStorage.setItem('mercado_large_text', isNowLarge);
      showToast(isNowLarge ? '🔍 Texto aumentado para leitura fácil' : 'Texto no tamanho padrão');
    });
  }

  // Toggle Split Mode pelo Pill do topo
  document.getElementById('splitModePill').addEventListener('click', () => {
    state.splitMode = state.splitMode === 'equal' ? 'proportional' : 'equal';
    broadcastLocalUpdate();
    renderApp();
    showToast(`Modo alterado para: ${state.splitMode === 'equal' ? '50% / 50%' : 'Por Itens'}`);
  });

  // Filtro Só Pendentes
  const btnFilterPending = document.getElementById('btnFilterPending');
  btnFilterPending.addEventListener('click', () => {
    state.filterPendingOnly = !state.filterPendingOnly;
    btnFilterPending.classList.toggle('active', state.filterPendingOnly);
    renderItemsList();
  });

  // Alternar todos os setores (expandir/recolher)
  document.getElementById('btnExpandAll').addEventListener('click', () => {
    const allKeys = Object.keys(SECTOR_INFO);
    const hasAnyCollapsed = Object.values(state.collapsedSectors).some(v => v === true);
    allKeys.forEach(k => {
      state.collapsedSectors[k] = !hasAnyCollapsed;
    });
    renderItemsList();
  });

  // Busca rápida de itens
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    btnClearSearch.classList.toggle('hidden', !state.searchQuery);
    renderItemsList();
  });
  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    btnClearSearch.classList.add('hidden');
    renderItemsList();
  });

  // Tabs de Setores
  const sectorTabs = document.getElementById('sectorTabs');
  sectorTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.sector-tab');
    if (!tab) return;
    sectorTabs.querySelectorAll('.sector-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.filterSector = tab.dataset.sector;
    renderItemsList();
  });

  // Formulário de Adicionar Item Rápido
  document.getElementById('quickAddForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newItemName');
    const sectorSelect = document.getElementById('newItemSector');
    const name = nameInput.value.trim();
    if (!name) return;

    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name,
      sector: sectorSelect.value || 'mercearia',
      quantity: 1,
      unit: 'un',
      price: 0,
      checked: false,
      assignedTo: state.currentUserId === 'user2' ? 'user2' : 'shared'
    };

    state.items.unshift(newItem);
    nameInput.value = '';
    broadcastLocalUpdate();
    renderApp();
    showToast(`Adicionado: ${name}`);
  });

  // Delegação de Eventos na Lista de Itens (Check, Preço, Atribuição, Exclusão)
  const itemsContainer = document.getElementById('itemsContainer');
  
  itemsContainer.addEventListener('click', (e) => {
    // 1. Toggle recolher setor
    const sectorHeader = e.target.closest('.sector-header');
    if (sectorHeader && !e.target.closest('.item-row')) {
      const secKey = sectorHeader.dataset.sectorToggle;
      state.collapsedSectors[secKey] = !state.collapsedSectors[secKey];
      renderItemsList();
      return;
    }

    const itemRow = e.target.closest('.item-row');
    if (!itemRow) return;
    const itemId = itemRow.dataset.itemId;
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    // 2. Alternar Atribuição (50/50 -> Lucas -> Claudia)
    const assignPill = e.target.closest('[data-action="cycle-assign"]');
    if (assignPill) {
      if (item.assignedTo === 'shared') item.assignedTo = 'user1';
      else if (item.assignedTo === 'user1') item.assignedTo = 'user2';
      else item.assignedTo = 'shared';

      broadcastLocalUpdate();
      renderApp();
      return;
    }

    // 2.1 Alternar Quantidade rápida (1x -> 2x -> 3x -> 4x -> 5x -> 1x)
    const qtyTag = e.target.closest('[data-action="cycle-qty"]');
    if (qtyTag) {
      item.quantity = ((parseInt(item.quantity) || 1) % 6) + 1;
      broadcastLocalUpdate();
      renderApp();
      showToast(`${item.name}: ${item.quantity}x`);
      return;
    }

    // 3. Deletar Item
    const deleteBtn = e.target.closest('[data-action="delete-item"]');
    if (deleteBtn) {
      if (confirm(`Remover "${item.name}" da lista?`)) {
        state.items = state.items.filter(i => i.id !== itemId);
        broadcastLocalUpdate();
        renderApp();
        showToast(`Removido: ${item.name}`);
      }
      return;
    }

    // 4. Clicar no nome ou área de detalhes para alternar checkbox (ergonomia para celular)
    if (e.target.closest('.item-details') && !e.target.closest('.assign-pill')) {
      item.checked = !item.checked;
      vibrateDevice();
      broadcastLocalUpdate();
      renderApp();
      return;
    }
  });

  // Mudança do checkbox
  itemsContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('chk-item')) {
      const itemRow = e.target.closest('.item-row');
      const itemId = itemRow.dataset.itemId;
      const item = state.items.find(i => i.id === itemId);
      if (item) {
        item.checked = e.target.checked;
        vibrateDevice();
        broadcastLocalUpdate();
        renderApp();
      }
    }
  });

  // Digitação do Preço (com debounce suave para sincronização)
  itemsContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('price-input')) {
      const itemRow = e.target.closest('.item-row');
      const itemId = itemRow.dataset.itemId;
      const item = state.items.find(i => i.id === itemId);
      if (item) {
        item.price = parsePriceInput(e.target.value);
        // Atualiza os totais na hora localmente
        renderSummary();
        // Sincroniza remotamente
        broadcastLocalUpdate();
      }
    }
  });

  // Botão Voltar ao Topo
  document.getElementById('btnScrollTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Modais
  setupModalEvents();
}

function setupModalEvents() {
  const settingsModal = document.getElementById('settingsModal');
  const shareModal = document.getElementById('shareModal');

  // Abrir modal de configurações
  document.getElementById('btnSettings').addEventListener('click', () => {
    settingsModal.classList.add('open');
  });
  document.getElementById('btnSyncStatus').addEventListener('click', () => {
    settingsModal.classList.add('open');
  });
  document.getElementById('btnCloseSettings').addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  // Abrir modal de compartilhamento
  document.getElementById('btnShare').addEventListener('click', () => {
    const url = generateShareUrl();
    const shareInput = document.getElementById('shareLinkInput');
    shareInput.value = url;

    const whatsappBtn = document.getElementById('btnShareWhatsApp');
    const msg = encodeURIComponent(`🛒 Olá! Aqui está nossa lista de compras do supermercado em tempo real:\n${url}`);
    whatsappBtn.href = `https://api.whatsapp.com/send?text=${msg}`;

    shareModal.classList.add('open');
  });

  document.getElementById('btnCloseShare').addEventListener('click', () => {
    shareModal.classList.remove('open');
  });

  // Copiar link de compartilhamento
  document.getElementById('btnCopyShareLink').addEventListener('click', () => {
    const shareInput = document.getElementById('shareLinkInput');
    shareInput.select();
    navigator.clipboard.writeText(shareInput.value).then(() => {
      showToast('📋 Link copiado com sucesso!');
    }).catch(() => {
      showToast('Link selecionado. Pressione Ctrl+C para copiar.');
    });
  });

  // Salvar configurações gerais do modal
  document.getElementById('btnSaveSettings').addEventListener('click', () => {
    const u1 = document.getElementById('inputUser1').value.trim();
    const u2 = document.getElementById('inputUser2').value.trim();
    if (u1) state.user1 = u1;
    if (u2) state.user2 = u2;

    const selectedIdentity = document.querySelector('input[name="currentIdentity"]:checked');
    if (selectedIdentity) state.currentUserId = selectedIdentity.value;

    const selectedSplit = document.querySelector('input[name="splitSetting"]:checked');
    if (selectedSplit) state.splitMode = selectedSplit.value;

    state.calcScope = document.getElementById('chkCalcCheckedOnly').checked ? 'checkedOnly' : 'allItems';

    settingsModal.classList.remove('open');
    broadcastLocalUpdate();
    renderApp();
    showToast('Configurações salvas!');
  });

  // Conectar Firebase
  document.getElementById('btnConnectFirebase').addEventListener('click', () => {
    const rawConfig = document.getElementById('txtFirebaseConfig').value.trim();
    const roomId = document.getElementById('inputRoomId').value.trim() || 'compras-hoje';

    if (!rawConfig) {
      alert('Por favor, cole as credenciais do Firebase (JSON ou bloco de código) no campo indicado.');
      return;
    }

    try {
      let configObj = null;
      // Tenta parsing JSON direto
      if (rawConfig.startsWith('{')) {
        configObj = JSON.parse(rawConfig);
      } else {
        // Tenta extrair pares apiKey, databaseURL, etc. via regex
        const extractField = (name) => {
          const match = rawConfig.match(new RegExp(`${name}["']?\\s*:\\s*["']([^"']+)["']`));
          return match ? match[1] : '';
        };

        configObj = {
          apiKey: extractField('apiKey'),
          authDomain: extractField('authDomain'),
          databaseURL: extractField('databaseURL'),
          projectId: extractField('projectId'),
          storageBucket: extractField('storageBucket'),
          messagingSenderId: extractField('messagingSenderId'),
          appId: extractField('appId')
        };
      }

      if (!configObj || !configObj.databaseURL && !configObj.projectId) {
        alert('Credenciais incompletas. Certifique-se de que o objeto contém databaseURL ou projectId.');
        return;
      }

      // Se não tiver databaseURL mas tiver projectId, monta a URL padrão do Firebase Realtime DB
      if (!configObj.databaseURL && configObj.projectId) {
        configObj.databaseURL = `https://${configObj.projectId}-default-rtdb.firebaseio.com`;
      }

      const success = initFirebase(configObj, roomId);
      if (success) {
        showToast('🔥 Conectado com sucesso ao Firebase!');
      }
    } catch (e) {
      alert('Formato de credencial inválido: ' + e.message);
    }
  });

  // Desconectar Firebase
  document.getElementById('btnDisconnectFirebase').addEventListener('click', () => {
    if (confirm('Deseja desconectar do Firebase e voltar ao modo local?')) {
      if (firebaseDbRef) firebaseDbRef.off();
      firebaseDbRef = null;
      firebaseApp = null;
      localStorage.removeItem('mercado_firebase_config');
      updateSyncStatusUI('local', 'Modo Local');
      showToast('Desconectado do Firebase');
    }
  });

  // Desmarcar todos os itens
  document.getElementById('btnUncheckAll').addEventListener('click', () => {
    if (confirm('Deseja desmarcar todos os itens no carrinho?')) {
      state.items.forEach(i => i.checked = false);
      broadcastLocalUpdate();
      renderApp();
      showToast('Todos os itens foram desmarcados');
    }
  });

  // Restaurar lista original de Lista.txt
  document.getElementById('btnResetDefaultList').addEventListener('click', () => {
    if (confirm('Restaurar a lista original de 23 itens do WhatsApp? Seus preços e itens novos serão redefinidos.')) {
      state.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
      broadcastLocalUpdate();
      renderApp();
      showToast('Lista original restaurada!');
    }
  });

  // Fechar modais ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('open');
    if (e.target === shareModal) shareModal.classList.remove('open');
  });
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

function vibrateDevice() {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(30);
    } catch (e) {}
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
