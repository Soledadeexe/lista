/**
 * LISTA DE COMPRAS INTELIGENTE - SUPERMERCADO
 * Sincronização em Tempo Real, Modo Escuro, Ocultar Header na Rolagem
 * e Divisão Automática por Usuário (Cada item é pego por 1 única pessoa)
 */

// ============================================================================
// DADOS INICIAIS BASEADOS EM Lista.txt (WhatsApp Claudia Lopes)
// ============================================================================
const DEFAULT_ITEMS = [
  // 🥬 Hortifrúti
  { id: 'item_1', name: 'Alho', sector: 'hortifruti', quantity: 1, unit: 'un', price: 0, checked: false, pickedBy: null },
  { id: 'item_2', name: 'Cebolinha verde', sector: 'hortifruti', quantity: 1, unit: 'maço', price: 0, checked: false, pickedBy: null },
  { id: 'item_3', name: 'Limão', sector: 'hortifruti', quantity: 1, unit: 'kg', price: 0, checked: false, pickedBy: null },
  { id: 'item_4', name: 'Tomate', sector: 'hortifruti', quantity: 1, unit: 'kg', price: 0, checked: false, pickedBy: null },

  // 🥖 Padaria
  { id: 'item_5', name: 'Pão', sector: 'padaria', quantity: 1, unit: 'pct', price: 0, checked: false, pickedBy: null },

  // 🧀 Frios e Laticínios
  { id: 'item_6', name: 'Margarina', sector: 'frios', quantity: 1, unit: 'pote', price: 0, checked: false, pickedBy: null },
  { id: 'item_7', name: 'Mussarela', sector: 'frios', quantity: 1, unit: 'bandeja', price: 0, checked: false, pickedBy: null },
  { id: 'item_8', name: 'Requeijão', sector: 'frios', quantity: 1, unit: 'copo', price: 0, checked: false, pickedBy: null },

  // 🥫 Mercearia & Despensa
  { id: 'item_9', name: 'Açúcar demerara', sector: 'mercearia', quantity: 1, unit: 'kg', price: 0, checked: false, pickedBy: null },
  { id: 'item_10', name: 'Azeite', sector: 'mercearia', quantity: 1, unit: 'un', price: 0, checked: false, pickedBy: null },
  { id: 'item_11', name: 'Chocolate em pó', sector: 'mercearia', quantity: 1, unit: 'lata', price: 0, checked: false, pickedBy: null },
  { id: 'item_12', name: 'Farelo de aveia', sector: 'mercearia', quantity: 1, unit: 'pct', price: 0, checked: false, pickedBy: null },
  { id: 'item_13', name: 'Feijão', sector: 'mercearia', quantity: 1, unit: 'kg', price: 0, checked: false, pickedBy: null },
  { id: 'item_14', name: 'Fubá', sector: 'mercearia', quantity: 1, unit: 'pct', price: 0, checked: false, pickedBy: null },
  { id: 'item_15', name: 'Nescau', sector: 'mercearia', quantity: 1, unit: 'lata', price: 0, checked: false, pickedBy: null },
  { id: 'item_16', name: 'Sal', sector: 'mercearia', quantity: 1, unit: 'kg', price: 0, checked: false, pickedBy: null },
  { id: 'item_17', name: 'Vinagre', sector: 'mercearia', quantity: 1, unit: 'frasco', price: 0, checked: false, pickedBy: null },

  // 🧹 Limpeza
  { id: 'item_18', name: 'Água sanitária', sector: 'limpeza', quantity: 1, unit: 'un', price: 0, checked: false, pickedBy: null },
  { id: 'item_19', name: 'Amaciante', sector: 'limpeza', quantity: 1, unit: 'un', price: 0, checked: false, pickedBy: null },
  { id: 'item_20', name: 'Detergente', sector: 'limpeza', quantity: 1, unit: 'un', price: 0, checked: false, pickedBy: null },

  // 📦 Utilidades e Descartáveis
  { id: 'item_21', name: 'Papel manteiga', sector: 'utilidades', quantity: 1, unit: 'rolo', price: 0, checked: false, pickedBy: null },
  { id: 'item_22', name: 'Saco de lixo para pia', sector: 'utilidades', quantity: 1, unit: 'pct', price: 0, checked: false, pickedBy: null },
  { id: 'item_23', name: 'Saco de Lixo', sector: 'utilidades', quantity: 1, unit: 'pct', price: 0, checked: false, pickedBy: null }
];

const SECTOR_INFO = {
  hortifruti: { name: 'Hortifrúti', icon: '🥬', color: '#10b981' },
  padaria: { name: 'Padaria & Pães', icon: '🥖', color: '#f59e0b' },
  frios: { name: 'Laticínios & Frios', icon: '🧀', color: '#eab308' },
  mercearia: { name: 'Mercearia & Despensa', icon: '🥫', color: '#6366f1' },
  limpeza: { name: 'Limpeza', icon: '🧹', color: '#06b6d4' },
  utilidades: { name: 'Utilidades & Descartáveis', icon: '📦', color: '#8b5cf6' }
};

// ID único desta aba/sessão para evitar que digitações locais causem loop de re-renderização
const localClientSessionId = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

// ============================================================================
// ESTADO GLOBAL DA APLICAÇÃO
// ============================================================================
let state = {
  user1: 'Lucas',
  user2: 'Claudia',
  currentUserId: 'user1',
  splitMode: 'equal', // 'equal' (50/50 com acerto) ou 'byItem' (cada um paga o que pegou)
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
  initTheme();
  initBroadcastChannel();
  loadLocalState();
  checkUrlSyncParams();
  initFirebaseFromStorage();
  setupEventListeners();
  setupScrollHeaderHide();
  renderApp();
});

// ============================================================================
// MODO ESCURO (DARK MODE)
// ============================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('mercado_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('mercado_theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
  showToast(isDark ? '🌙 Modo Escuro ativado' : '☀️ Modo Claro ativado');
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
  }
}

// ============================================================================
// OCULTAR HEADER SUAVEMENTE NA ROLAGEM (MOBILE FRIENDLY)
// ============================================================================
function setupScrollHeaderHide() {
  let lastScrollY = window.scrollY;
  const threshold = 15;
  const header = document.getElementById('topHeader');

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Se estiver digitando em um input, mantém visível para não desorientar
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    if (currentScrollY > lastScrollY + threshold && currentScrollY > 100) {
      // Rolando para baixo: oculta o cabeçalho para focar nos itens
      header.classList.add('header-hidden');
    } else if (currentScrollY < lastScrollY - threshold) {
      // Rolando para cima: revela novamente
      header.classList.remove('header-hidden');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });
}

// ============================================================================
// PERSISTÊNCIA & CARREGAMENTO LOCAL
// ============================================================================
function loadLocalState() {
  // Preferência de tamanho de fonte
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
    roomId: state.roomId,
    items: state.items
  };
  localStorage.setItem('mercado_lista_state', JSON.stringify(toSave));
}

// ============================================================================
// SINCRONIZAÇÃO EM TEMPO REAL: BROADCAST CHANNEL & FIREBASE
// ============================================================================
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
      console.warn('BroadcastChannel não suportado:', e);
    }
  }
}

function broadcastLocalUpdate() {
  if (isRemoteUpdating) return;
  saveLocalState();

  const payload = {
    senderId: localClientSessionId,
    items: state.items,
    user1: state.user1,
    user2: state.user2,
    splitMode: state.splitMode,
    timestamp: Date.now()
  };

  // Broadcast local para outras abas no mesmo computador
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'STATE_UPDATE', payload });
  }

  // Enviar para o Firebase se conectado
  if (firebaseDbRef) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      firebaseDbRef.set(payload).catch(err => {
        console.error('Erro ao salvar no Firebase:', err);
      });
    }, 280);
  }
}

function handleIncomingState(incoming) {
  if (!incoming) return;

  // Se foi disparado por este mesmo cliente, ignora para não fechar teclado ou perder cursor
  if (incoming.senderId && incoming.senderId === localClientSessionId) {
    return;
  }

  isRemoteUpdating = true;

  if (Array.isArray(incoming.items)) {
    state.items = incoming.items;
  }
  if (incoming.user1) state.user1 = incoming.user1;
  if (incoming.user2) state.user2 = incoming.user2;
  if (incoming.splitMode) state.splitMode = incoming.splitMode;

  saveLocalState();
  renderApp();
  showToast('🔄 Lista atualizada em tempo real!');
  isRemoteUpdating = false;
}

// Conexão com Firebase Realtime Database
function initFirebase(config, roomId) {
  if (!window.firebase) {
    alert('Biblioteca do Firebase ainda não carregada. Verifique sua conexão.');
    return false;
  }

  try {
    if (firebaseApp) {
      if (firebaseDbRef) firebaseDbRef.off();
    } else {
      firebaseApp = firebase.initializeApp(config);
    }

    const db = firebase.database();
    state.roomId = roomId || state.roomId || 'compras-hoje';
    firebaseDbRef = db.ref('mercado_lists/' + state.roomId);

    updateSyncStatusUI('connecting', 'Conectando...');

    firebaseDbRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        handleIncomingState(data);
      } else {
        broadcastLocalUpdate();
      }
      updateSyncStatusUI('synced', `🟢 Sincronizado (${state.roomId})`);
    }, (error) => {
      console.error('Erro no Firebase:', error);
      updateSyncStatusUI('local', 'Erro no Firebase');
    });

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

// Configuração padrão do Firebase gerada para o projeto ListaCompras
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBKJg7bA06TLacsWZaXOLbAdx91iLLWoDo",
  authDomain: "listacompras-fc673.firebaseapp.com",
  projectId: "listacompras-fc673",
  databaseURL: "https://listacompras-fc673-default-rtdb.firebaseio.com",
  storageBucket: "listacompras-fc673.firebasestorage.app",
  messagingSenderId: "975454855992",
  appId: "1:975454855992:web:ccb02aacd0d99304c5d7cd",
  measurementId: "G-HNDF97ZRZT"
};

function initFirebaseFromStorage() {
  const savedConfig = localStorage.getItem('mercado_firebase_config');
  const savedRoom = localStorage.getItem('mercado_firebase_room') || state.roomId;
  
  try {
    const configToUse = savedConfig ? JSON.parse(savedConfig) : DEFAULT_FIREBASE_CONFIG;
    const txtField = document.getElementById('txtFirebaseConfig');
    if (txtField) txtField.value = JSON.stringify(configToUse, null, 2);
    const roomField = document.getElementById('inputRoomId');
    if (roomField) roomField.value = savedRoom;

    initFirebase(configToUse, savedRoom);
  } catch (e) {
    console.warn('Erro ao inicializar Firebase padrão:', e);
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
        
        // Se a pessoa abriu o link compartilhado pelo parceiro, ativa como user2 por padrão
        if (syncData.targetUser) {
          state.currentUserId = syncData.targetUser;
        } else {
          state.currentUserId = 'user2';
        }
        
        initFirebase(syncData.firebaseConfig, state.roomId);
        showToast(`🎉 Conectado! Marcando como ${state.currentUserId === 'user2' ? state.user2 : state.user1}`);
      }

      history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      console.error('Erro ao ler URL de sincronização:', e);
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
        user2: state.user2,
        targetUser: state.currentUserId === 'user1' ? 'user2' : 'user1'
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(syncData))));
      return `${baseUrl}#sync=${encoded}`;
    } catch (e) {
      console.error('Erro ao gerar URL:', e);
    }
  }

  return baseUrl;
}

// ============================================================================
// CÁLCULOS FINANCEIROS E DIVISÃO (1 ITEM = 1 COMPRADOR)
// ============================================================================
function calculateTotals() {
  let totalGeneral = 0;
  let totalUser1 = 0;
  let totalUser2 = 0;
  let countUser1 = 0;
  let countUser2 = 0;
  let checkedCount = 0;

  state.items.forEach(item => {
    if (item.checked) {
      checkedCount++;
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseInt(item.quantity) || 1;
      const subtotal = itemPrice * itemQty;

      totalGeneral += subtotal;

      if (item.pickedBy === 'user2') {
        totalUser2 += subtotal;
        countUser2++;
      } else {
        totalUser1 += subtotal;
        countUser1++;
      }
    }
  });

  return {
    totalGeneral,
    totalUser1,
    totalUser2,
    countUser1,
    countUser2,
    checkedCount,
    totalCount: state.items.length
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
  updateIdentityButtons();
}

function updateIdentityButtons() {
  const btnU1 = document.getElementById('btnIdentifyU1');
  const btnU2 = document.getElementById('btnIdentifyU2');
  const lblU1 = document.getElementById('lblIdentityU1');
  const lblU2 = document.getElementById('lblIdentityU2');

  if (lblU1) lblU1.textContent = state.user1;
  if (lblU2) lblU2.textContent = state.user2;

  if (btnU1 && btnU2) {
    btnU1.classList.toggle('active', state.currentUserId === 'user1');
    btnU2.classList.toggle('active', state.currentUserId === 'user2');
  }
}

function renderSummary() {
  const totals = calculateTotals();

  // Top Card
  document.getElementById('valTotalGeneral').textContent = formatCurrency(totals.totalGeneral);
  document.getElementById('nameDisplayUser1').textContent = state.user1;
  document.getElementById('nameDisplayUser2').textContent = state.user2;
  document.getElementById('avatarUser1').textContent = state.user1.charAt(0).toUpperCase();
  document.getElementById('avatarUser2').textContent = state.user2.charAt(0).toUpperCase();

  document.getElementById('valUser1').textContent = formatCurrency(totals.totalUser1);
  document.getElementById('valUser2').textContent = formatCurrency(totals.totalUser2);

  document.getElementById('subUser1').textContent = `${totals.countUser1} itens pegos`;
  document.getElementById('subUser2').textContent = `${totals.countUser2} itens pegos`;

  // Barra de progresso
  const percent = totals.totalCount > 0 ? (totals.checkedCount / totals.totalCount) * 100 : 0;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressText').textContent = `${totals.checkedCount} de ${totals.totalCount} itens pegos`;

  // Modo de Divisão
  const splitLabel = document.getElementById('splitModeLabel');
  if (state.splitMode === 'equal') {
    splitLabel.textContent = 'Divisão: 50% / 50%';
  } else {
    splitLabel.textContent = 'Divisão: Por Comprador';
  }

  // Barra de Acerto de Contas / Pix
  const settlementEl = document.getElementById('settlementText');
  if (totals.totalGeneral === 0) {
    settlementEl.textContent = 'Marque a quantidade e valor dos itens que pegar.';
  } else if (state.splitMode === 'equal') {
    const half = totals.totalGeneral / 2;
    const diff = totals.totalUser1 - half;

    if (Math.abs(diff) < 0.05) {
      settlementEl.innerHTML = `Divisão 50/50: Valores empatados em <strong>${formatCurrency(half)}</strong> para cada!`;
    } else if (diff > 0) {
      settlementEl.innerHTML = `Divisão 50/50 (${formatCurrency(half)} cada): <strong>${state.user2}</strong> transfere <strong>${formatCurrency(diff)}</strong> via Pix para <strong>${state.user1}</strong>.`;
    } else {
      settlementEl.innerHTML = `Divisão 50/50 (${formatCurrency(half)} cada): <strong>${state.user1}</strong> transfere <strong>${formatCurrency(Math.abs(diff))}</strong> via Pix para <strong>${state.user2}</strong>.`;
    }
  } else {
    settlementEl.innerHTML = `Cada um paga o que pegou: <strong>${state.user1}</strong> (${formatCurrency(totals.totalUser1)}) e <strong>${state.user2}</strong> (${formatCurrency(totals.totalUser2)}).`;
  }

  // Barra Fixa Inferior (Mobile)
  document.getElementById('bottomValTotal').textContent = formatCurrency(totals.totalGeneral);
  document.getElementById('bottomU1Name').textContent = `${state.user1}:`;
  document.getElementById('bottomU2Name').textContent = `${state.user2}:`;
  document.getElementById('bottomValU1').textContent = formatCurrency(totals.totalUser1);
  document.getElementById('bottomValU2').textContent = formatCurrency(totals.totalUser2);
}

function renderItemsList() {
  const container = document.getElementById('itemsContainer');
  
  // Se o usuário estiver interagindo com um input, não reconstrói o DOM para não fechar teclado
  if (document.activeElement && document.activeElement.classList.contains('price-input') || 
      document.activeElement && document.activeElement.classList.contains('qty-input')) {
    return;
  }

  container.innerHTML = '';

  const query = state.searchQuery.toLowerCase().trim();
  let filteredItems = state.items.filter(item => {
    if (query && !item.name.toLowerCase().includes(query)) {
      return false;
    }
    if (state.filterSector !== 'all' && item.sector !== state.filterSector) {
      return false;
    }
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
        <p>Ajuste a busca ou adicione um novo item acima.</p>
      </div>
    `;
    return;
  }

  // Agrupar por setor
  const grouped = {};
  Object.keys(SECTOR_INFO).forEach(secKey => {
    grouped[secKey] = [];
  });

  filteredItems.forEach(item => {
    const secKey = item.sector in SECTOR_INFO ? item.sector : 'mercearia';
    if (!grouped[secKey]) grouped[secKey] = [];
    grouped[secKey].push(item);
  });

  // Renderizar setores
  Object.keys(SECTOR_INFO).forEach(secKey => {
    const secItems = grouped[secKey];
    if (secItems.length === 0) return;

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
  const itemPrice = parseFloat(item.price) || 0;
  const itemQty = parseInt(item.quantity) || 1;
  const itemSubtotal = itemPrice * itemQty;
  const priceVal = item.price > 0 ? Number(item.price).toFixed(2) : '';

  // Badge de quem pegou (os 2 não pegam o mesmo item)
  let pickerBadgeHtml = '';
  if (item.checked) {
    if (item.pickedBy === 'user2') {
      pickerBadgeHtml = `<span class="item-picker-badge u2" data-action="toggle-picker" title="Toque para alternar comprador">👤 ${escapeHtml(state.user2)} pegou</span>`;
    } else {
      pickerBadgeHtml = `<span class="item-picker-badge u1" data-action="toggle-picker" title="Toque para alternar comprador">👤 ${escapeHtml(state.user1)} pegou</span>`;
    }
  } else {
    pickerBadgeHtml = `<span class="item-picker-badge pending" data-action="pick-item" title="Toque para marcar que pegou este item">⏳ Pendente</span>`;
  }

  return `
    <div class="item-row ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
      <!-- Linha Superior: Checkbox + Nome do Item + Quem Pegou + Excluir -->
      <div class="item-header-row">
        <label class="custom-checkbox">
          <input type="checkbox" class="chk-item" ${item.checked ? 'checked' : ''}>
          <span class="checkbox-mark"></span>
        </label>
        
        <div class="item-title-group" data-action="toggle-check">
          <span class="item-name">${escapeHtml(item.name)}</span>
          ${item.unit ? `<span class="item-unit-label">(${escapeHtml(item.unit)})</span>` : ''}
        </div>

        <div class="item-top-actions">
          ${pickerBadgeHtml}
          <button class="item-delete-btn" data-action="delete-item" title="Remover item">&times;</button>
        </div>
      </div>

      <!-- Linha Inferior: Controles de Quantidade, Preço Unitário e Subtotal -->
      <div class="item-controls-row">
        <!-- Stepper de Quantidade -->
        <div class="qty-stepper-box">
          <span class="control-label">Qtd:</span>
          <div class="qty-stepper">
            <button type="button" class="btn-qty-step" data-action="decrease-qty" title="Diminuir quantidade">−</button>
            <input 
              type="number" 
              min="1" 
              max="999" 
              value="${itemQty}" 
              class="qty-input" 
              data-action="change-qty"
              inputmode="numeric"
              title="Quantidade"
            >
            <button type="button" class="btn-qty-step" data-action="increase-qty" title="Aumentar quantidade">+</button>
          </div>
        </div>

        <!-- Campo de Preço Unitário -->
        <div class="price-input-box">
          <span class="control-label">Preço:</span>
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
        </div>

        <!-- Subtotal do Item se Qtd > 1 -->
        <div class="item-subtotal-box ${itemSubtotal > 0 && itemQty > 1 ? '' : 'hidden'}">
          <span class="subtotal-val">${formatCurrency(itemSubtotal)}</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// EVENT LISTENERS & AÇÕES DO USUÁRIO
// ============================================================================
function setupEventListeners() {
  // Alternar Modo Escuro / Claro
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', toggleTheme);
  }

  // Alternar Tamanho da Fonte para Leitura Fácil
  const btnFontToggle = document.getElementById('btnFontToggle');
  if (btnFontToggle) {
    btnFontToggle.addEventListener('click', () => {
      const isNowLarge = document.body.classList.toggle('large-text');
      btnFontToggle.innerHTML = isNowLarge ? '<span>A-</span>' : '<span>A+</span>';
      localStorage.setItem('mercado_large_text', isNowLarge);
      showToast(isNowLarge ? '🔍 Texto ampliado para leitura fácil' : 'Texto padrão');
    });
  }

  // Seleção Rápida de Identidade (Quem está usando este celular)
  document.getElementById('btnIdentifyU1').addEventListener('click', () => {
    state.currentUserId = 'user1';
    updateIdentityButtons();
    saveLocalState();
    showToast(`👤 Celular definido para: ${state.user1}`);
  });

  document.getElementById('btnIdentifyU2').addEventListener('click', () => {
    state.currentUserId = 'user2';
    updateIdentityButtons();
    saveLocalState();
    showToast(`👤 Celular definido para: ${state.user2}`);
  });

  // Toggle Split Mode pelo Pill do topo
  document.getElementById('splitModePill').addEventListener('click', () => {
    state.splitMode = state.splitMode === 'equal' ? 'byItem' : 'equal';
    broadcastLocalUpdate();
    renderSummary();
    showToast(`Modo: ${state.splitMode === 'equal' ? 'Divisão 50% / 50%' : 'Cada um paga o seu'}`);
  });

  // Filtro Só Pendentes
  const btnFilterPending = document.getElementById('btnFilterPending');
  btnFilterPending.addEventListener('click', () => {
    state.filterPendingOnly = !state.filterPendingOnly;
    btnFilterPending.classList.toggle('active', state.filterPendingOnly);
    renderItemsList();
  });

  // Alternar todos os setores
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
      pickedBy: null
    };

    state.items.unshift(newItem);
    nameInput.value = '';
    broadcastLocalUpdate();
    renderApp();
    showToast(`Adicionado: ${name}`);
  });

  // Delegação de Eventos na Lista de Itens
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

    // 2. Diminuir quantidade (-)
    if (e.target.closest('[data-action="decrease-qty"]')) {
      item.quantity = Math.max(1, (parseInt(item.quantity) || 1) - 1);
      if (!item.checked) {
        item.checked = true;
        item.pickedBy = state.currentUserId;
      }
      updateRowControls(itemRow, item);
      broadcastLocalUpdate();
      renderSummary();
      return;
    }

    // 3. Aumentar quantidade (+)
    if (e.target.closest('[data-action="increase-qty"]')) {
      item.quantity = (parseInt(item.quantity) || 1) + 1;
      if (!item.checked) {
        item.checked = true;
        item.pickedBy = state.currentUserId;
      }
      updateRowControls(itemRow, item);
      broadcastLocalUpdate();
      renderSummary();
      return;
    }

    // 4. Alternar/atribuir comprador pelo badge
    if (e.target.closest('[data-action="toggle-picker"]') || e.target.closest('[data-action="pick-item"]')) {
      if (!item.checked) {
        item.checked = true;
        item.pickedBy = state.currentUserId;
      } else {
        // Alterna entre Lucas e Claudia
        item.pickedBy = item.pickedBy === 'user1' ? 'user2' : 'user1';
      }
      vibrateDevice();
      broadcastLocalUpdate();
      renderApp();
      return;
    }

    // 5. Deletar Item
    if (e.target.closest('[data-action="delete-item"]')) {
      if (confirm(`Remover "${item.name}" da lista?`)) {
        state.items = state.items.filter(i => i.id !== itemId);
        broadcastLocalUpdate();
        renderApp();
        showToast(`Removido: ${item.name}`);
      }
      return;
    }

    // 6. Clicar no nome ou área de título para alternar check
    if (e.target.closest('[data-action="toggle-check"]')) {
      item.checked = !item.checked;
      item.pickedBy = item.checked ? state.currentUserId : null;
      vibrateDevice();
      broadcastLocalUpdate();
      renderApp();
      return;
    }
  });

  // Mudança do checkbox nativo
  itemsContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('chk-item')) {
      const itemRow = e.target.closest('.item-row');
      const itemId = itemRow.dataset.itemId;
      const item = state.items.find(i => i.id === itemId);
      if (item) {
        item.checked = e.target.checked;
        item.pickedBy = item.checked ? state.currentUserId : null;
        vibrateDevice();
        broadcastLocalUpdate();
        renderApp();
      }
    }
  });

  // Digitação direta da Quantidade
  itemsContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('qty-input')) {
      const itemRow = e.target.closest('.item-row');
      const itemId = itemRow.dataset.itemId;
      const item = state.items.find(i => i.id === itemId);
      if (item) {
        item.quantity = Math.max(1, parseInt(e.target.value) || 1);
        if (!item.checked) {
          item.checked = true;
          item.pickedBy = state.currentUserId;
        }
        updateRowSubtotal(itemRow, item);
        renderSummary();
        broadcastLocalUpdate();
      }
    }
  });

  // Digitação direta do Preço
  itemsContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('price-input')) {
      const itemRow = e.target.closest('.item-row');
      const itemId = itemRow.dataset.itemId;
      const item = state.items.find(i => i.id === itemId);
      if (item) {
        item.price = parsePriceInput(e.target.value);
        if (!item.checked && item.price > 0) {
          item.checked = true;
          item.pickedBy = state.currentUserId;
          const chk = itemRow.querySelector('.chk-item');
          if (chk) chk.checked = true;
          itemRow.classList.add('checked');
        }
        updateRowSubtotal(itemRow, item);
        renderSummary();
        broadcastLocalUpdate();
      }
    }
  });

  // Formatação ao sair do campo de preço
  itemsContainer.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('price-input')) {
      const itemRow = e.target.closest('.item-row');
      const itemId = itemRow.dataset.itemId;
      const item = state.items.find(i => i.id === itemId);
      if (item && item.price > 0) {
        e.target.value = Number(item.price).toFixed(2);
      }
      renderSummary();
    }
  });

  // Botão Voltar ao Topo
  document.getElementById('btnScrollTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const header = document.getElementById('topHeader');
    if (header) header.classList.remove('header-hidden');
  });

  // Modais
  setupModalEvents();
}

// Atualização de elementos da linha sem recriar o DOM
function updateRowControls(itemRow, item) {
  const qtyInput = itemRow.querySelector('.qty-input');
  if (qtyInput) qtyInput.value = item.quantity;
  const chk = itemRow.querySelector('.chk-item');
  if (chk) chk.checked = item.checked;
  itemRow.classList.toggle('checked', item.checked);
  updateRowSubtotal(itemRow, item);
}

function updateRowSubtotal(itemRow, item) {
  const subtotalBox = itemRow.querySelector('.item-subtotal-box');
  const subtotalVal = itemRow.querySelector('.subtotal-val');
  const itemPrice = parseFloat(item.price) || 0;
  const itemQty = parseInt(item.quantity) || 1;
  const total = itemPrice * itemQty;

  if (subtotalBox && subtotalVal) {
    if (total > 0 && itemQty > 1) {
      subtotalVal.textContent = formatCurrency(total);
      subtotalBox.classList.remove('hidden');
    } else {
      subtotalBox.classList.add('hidden');
    }
  }
}

function setupModalEvents() {
  const settingsModal = document.getElementById('settingsModal');
  const shareModal = document.getElementById('shareModal');

  // Abrir configurações
  document.getElementById('btnSettings').addEventListener('click', () => {
    document.getElementById('inputUser1').value = state.user1;
    document.getElementById('inputUser2').value = state.user2;
    settingsModal.classList.add('open');
  });
  document.getElementById('btnSyncStatus').addEventListener('click', () => {
    settingsModal.classList.add('open');
  });
  document.getElementById('btnCloseSettings').addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  // Abrir compartilhamento
  document.getElementById('btnShare').addEventListener('click', () => {
    const url = generateShareUrl();
    const shareInput = document.getElementById('shareLinkInput');
    shareInput.value = url;

    const partnerName = state.currentUserId === 'user1' ? state.user2 : state.user1;
    const whatsappBtn = document.getElementById('btnShareWhatsApp');
    const msg = encodeURIComponent(`🛒 Olá ${partnerName}! Aqui está o link da nossa lista do mercado em tempo real:\n${url}`);
    whatsappBtn.href = `https://api.whatsapp.com/send?text=${msg}`;

    shareModal.classList.add('open');
  });

  document.getElementById('btnCloseShare').addEventListener('click', () => {
    shareModal.classList.remove('open');
  });

  // Copiar link
  document.getElementById('btnCopyShareLink').addEventListener('click', () => {
    const shareInput = document.getElementById('shareLinkInput');
    shareInput.select();
    navigator.clipboard.writeText(shareInput.value).then(() => {
      showToast('📋 Link copiado com sucesso!');
    }).catch(() => {
      showToast('Link selecionado. Copie com Ctrl+C.');
    });
  });

  // Salvar nomes no modal
  document.getElementById('btnSaveSettings').addEventListener('click', () => {
    const u1 = document.getElementById('inputUser1').value.trim();
    const u2 = document.getElementById('inputUser2').value.trim();
    if (u1) state.user1 = u1;
    if (u2) state.user2 = u2;

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
      alert('Cole as credenciais do Firebase no campo indicado.');
      return;
    }

    try {
      let configObj = null;
      if (rawConfig.startsWith('{')) {
        configObj = JSON.parse(rawConfig);
      } else {
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
        alert('Credenciais incompletas. Certifique-se de incluir projectId ou databaseURL.');
        return;
      }

      if (!configObj.databaseURL && configObj.projectId) {
        configObj.databaseURL = `https://${configObj.projectId}-default-rtdb.firebaseio.com`;
      }

      const success = initFirebase(configObj, roomId);
      if (success) {
        showToast('🔥 Conectado com sucesso ao Firebase!');
      }
    } catch (e) {
      alert('Erro no formato das credenciais: ' + e.message);
    }
  });

  // Desconectar Firebase
  document.getElementById('btnDisconnectFirebase').addEventListener('click', () => {
    if (confirm('Deseja desconectar do Firebase e usar apenas o modo local?')) {
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
      state.items.forEach(i => {
        i.checked = false;
        i.pickedBy = null;
      });
      broadcastLocalUpdate();
      renderApp();
      showToast('Todos os itens foram desmarcados');
    }
  });

  // Restaurar lista padrão
  document.getElementById('btnResetDefaultList').addEventListener('click', () => {
    if (confirm('Restaurar a lista original de 23 itens do WhatsApp?')) {
      state.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
      broadcastLocalUpdate();
      renderApp();
      showToast('Lista original restaurada!');
    }
  });

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
  }, 2200);
}

function vibrateDevice() {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(25);
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
