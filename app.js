/* ================================================
   MetroFix – app.js
   Offline Metro Fault Reporting & Tracking System
   ================================================ */

'use strict';

// ── Constants ──────────────────────────────────────────────────
const STORAGE_KEY  = 'metrofix_faults';
const DEMO_FLAG    = 'metrofix_demo_seeded';
const ROSTER_KEY   = 'metrofix_roster';

// ── Authentication ─────────────────────────────────────────────
const ACCOUNTS = {
  'admin.metro': { name: 'Metro Admin', role: 'Administrator', station: 'All' },
  'manager.central': { name: 'Central Manager', role: 'Station Manager', station: 'Central Station' },
  'engineer.central': { name: 'Central Engineer', role: 'Maintenance Engineer', station: 'Central Station' },
  'technician.central': { name: 'Central Technician', role: 'Field Technician', station: 'Central Station' },
  'staff.central': { name: 'Central Staff', role: 'Station Staff', station: 'Central Station' },
  'manager.north': { name: 'North Manager', role: 'Station Manager', station: 'North Terminal' }
};
const DEMO_PASSWORD = 'MetroDemo26!';
let currentUser = null;

// ── Demo / seed data ───────────────────────────────────────────
const DEMO_FAULTS = [
  {
    id: 'MFX-D00001', isDemo: true,
    station: 'Central Station', assetCategory: 'Escalator',
    assetId: 'ESC-01A', severity: 'Critical', status: 'In Progress',
    reporter: '[DEMO] Ramesh Kumar',
    description: 'Escalator to Platform 2 is completely stopped. Steps not moving, emergency stop pressed. Affects peak-hour passenger flow. Barrier placed.',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    assignedTo: 'technician.central',
    notes: 'Investigating motor issue.'
  },
  {
    id: 'MFX-D00002', isDemo: true,
    station: 'North Terminal', assetCategory: 'Ticket Machine',
    assetId: 'TM-04B', severity: 'High', status: 'In Progress',
    reporter: '[DEMO] Priya Nair',
    description: 'Ticket machine displaying error code E-07, card reader not accepting any cards. Cash-only workaround in place. Engineer en route.',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: 'MFX-D00003', isDemo: true,
    station: 'South Gate', assetCategory: 'Elevator / Lift',
    assetId: 'LFT-02', severity: 'Critical', status: 'Open',
    reporter: '[DEMO] Suresh Mehta',
    description: 'Lift between concourse and platform level out of service. Doors opening but car not moving. Affects wheelchair users and passengers with luggage.',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString()
  },
  {
    id: 'MFX-D00004', isDemo: true,
    station: 'East Junction', assetCategory: 'Lighting',
    assetId: 'LGT-P3-07', severity: 'Medium', status: 'Open',
    reporter: '[DEMO] Anjali Singh',
    description: 'Three overhead fluorescent tubes flickering on Platform 3. Strobe effect may cause distress to passengers with photosensitive conditions.',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString()
  },
  {
    id: 'MFX-D00005', isDemo: true,
    station: 'West Depot', assetCategory: 'HVAC / Ventilation',
    assetId: 'HVAC-D1', severity: 'High', status: 'In Progress',
    reporter: '[DEMO] Deepak Rao',
    description: 'Cooling unit for depot control room has failed. Room temperature rising. Servers risk overheating if unresolved within 2 hours.',
    timestamp: new Date(Date.now() - 18 * 3600000).toISOString()
  },
  {
    id: 'MFX-D00006', isDemo: true,
    station: 'Airport Line', assetCategory: 'Platform Screen Door',
    assetId: 'PSD-06-C', severity: 'Critical', status: 'Resolved',
    reporter: '[DEMO] Meena Iyer',
    description: 'Platform screen door panel C jammed partially open. Train service suspended on this platform. Resolved by manual override and repair team.',
    timestamp: new Date(Date.now() - 26 * 3600000).toISOString()
  },
  {
    id: 'MFX-D00007', isDemo: true,
    station: 'City Square', assetCategory: 'CCTV / Security',
    assetId: 'CCTV-CS-11', severity: 'Medium', status: 'Resolved',
    reporter: '[DEMO] Vikas Sharma',
    description: 'Camera 11 at City Square main entrance offline since 08:00. Feed replaced with adjacent camera. Unit replaced and back online.',
    timestamp: new Date(Date.now() - 36 * 3600000).toISOString()
  },
  {
    id: 'MFX-D00008', isDemo: true,
    station: 'Harbour Bridge', assetCategory: 'Signage / Display',
    assetId: 'DSP-HB-03', severity: 'Low', status: 'Open',
    reporter: '[DEMO] Lakshmi Venkat',
    description: 'Passenger information display at Harbour Bridge entrance showing incorrect line times. Content server may need a restart.',
    timestamp: new Date(Date.now() - 40 * 3600000).toISOString()
  },
  {
    id: 'MFX-D00009', isDemo: true,
    station: 'Tech Park', assetCategory: 'Fire Safety Equipment',
    assetId: 'FSE-TP-02', severity: 'High', status: 'Open',
    reporter: '[DEMO] Arjun Bose',
    description: 'Fire suppression sprinkler head in equipment room 2 leaking water drip. Risk of electrical damage to nearby control panels. Bucket placed.',
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: 'MFX-D00010', isDemo: true,
    station: 'University Hub', assetCategory: 'Power / Electrical',
    assetId: 'PWR-UH-MAIN', severity: 'Critical', status: 'Resolved',
    reporter: '[DEMO] Kavitha Reddy',
    description: 'Main distribution board tripped causing partial power outage on lower concourse. Backup supply activated. Board repaired and fully restored.',
    timestamp: new Date(Date.now() - 72 * 3600000).toISOString()
  }
];

const PREDICTIVE_HISTORY_FAULTS = [
  {
    "id": "MFX-HIST-E0", "isDemo": true, "station": "Central Station",
    "assetCategory": "Escalator", "assetId": "ESC-01A", "severity": "Critical",
    "status": "Resolved", "reporter": "[SYNTHETIC] Auto Gen",
    "description": "Synthetic historical fault for predictive model.",
    "timestamp": new Date(Date.now() - 14 * 24 * 3600000).toISOString()
  },
  {
    "id": "MFX-HIST-E1", "isDemo": true, "station": "Central Station",
    "assetCategory": "Escalator", "assetId": "ESC-01A", "severity": "Critical",
    "status": "Resolved", "reporter": "[SYNTHETIC] Auto Gen",
    "description": "Synthetic historical fault for predictive model.",
    "timestamp": new Date(Date.now() - 6 * 24 * 3600000).toISOString()
  },
  {
    "id": "MFX-HIST-E2", "isDemo": true, "station": "Central Station",
    "assetCategory": "Escalator", "assetId": "ESC-01A", "severity": "High",
    "status": "Resolved", "reporter": "[SYNTHETIC] Auto Gen",
    "description": "Synthetic historical fault for predictive model.",
    "timestamp": new Date(Date.now() - 9 * 24 * 3600000).toISOString()
  },
  {
    "id": "MFX-HIST-T0", "isDemo": true, "station": "North Terminal",
    "assetCategory": "Ticket Machine", "assetId": "TM-04B", "severity": "High",
    "status": "Resolved", "reporter": "[SYNTHETIC] Auto Gen",
    "description": "Synthetic historical fault for predictive model.",
    "timestamp": new Date(Date.now() - 19 * 24 * 3600000).toISOString()
  },
  {
    "id": "MFX-HIST-T1", "isDemo": true, "station": "North Terminal",
    "assetCategory": "Ticket Machine", "assetId": "TM-04B", "severity": "Medium",
    "status": "Resolved", "reporter": "[SYNTHETIC] Auto Gen",
    "description": "Synthetic historical fault for predictive model.",
    "timestamp": new Date(Date.now() - 29 * 24 * 3600000).toISOString()
  },
  {
    "id": "MFX-HIST-L0", "isDemo": true, "station": "South Gate",
    "assetCategory": "Elevator / Lift", "assetId": "LFT-02", "severity": "High",
    "status": "Resolved", "reporter": "[SYNTHETIC] Auto Gen",
    "description": "Synthetic historical fault for predictive model.",
    "timestamp": new Date(Date.now() - 13 * 24 * 3600000).toISOString()
  },
  {
    "id": "MFX-HIST-L1", "isDemo": true, "station": "South Gate",
    "assetCategory": "Elevator / Lift", "assetId": "LFT-02", "severity": "High",
    "status": "Resolved", "reporter": "[SYNTHETIC] Auto Gen",
    "description": "Synthetic historical fault for predictive model.",
    "timestamp": new Date(Date.now() - 27 * 24 * 3600000).toISOString()
  }
];

// ── Utility: localStorage helpers ──────────────────────────────
function loadFaults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveFaults(faults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(faults));
}

// ── Utility: unique ID ─────────────────────────────────────────
function generateId() {
  const existing = loadFaults().map(f => f.id);
  let id;
  let attempts = 0;
  do {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase().padStart(6, '0');
    id = 'MFX-' + rand;
    attempts++;
  } while (existing.includes(id) && attempts < 100);
  return id;
}

// ── Utility: format date ───────────────────────────────────────
function fmtDate(isoString) {
  const d = new Date(isoString);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Utility: badge HTML ────────────────────────────────────────
function severityBadge(sev) {
  const map = { Critical:'critical', High:'high', Medium:'medium', Low:'low' };
  return `<span class="badge badge-${map[sev] || 'low'}">${sev || '—'}</span>`;
}
function statusBadge(st) {
  const map = { 'Open':'open', 'In Progress':'inprogress', 'Pending Verification':'high', 'Resolved':'resolved' };
  return `<span class="badge badge-${map[st] || 'open'}">${st || '—'}</span>`;
}

// ── Authentication Logic ───────────────────────────────────────
function checkAuth() {
  const session = localStorage.getItem('metrofix_session');
  if (session && ACCOUNTS[session]) {
    currentUser = { id: session, ...ACCOUNTS[session] };
    document.body.classList.remove('unauthenticated');
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = `${currentUser.role} — ${currentUser.station}`;
    
    document.getElementById('userRole').textContent = `${currentUser.role} — ${currentUser.station}`;
    
    // UI role restrictions
    document.getElementById('nav-settings').style.display = (currentUser.role === 'Administrator') ? 'flex' : 'none';
    
    // Show predictive and night shift for relevant roles
    const canSeePredictive = ['Administrator', 'Station Manager', 'Maintenance Engineer'].includes(currentUser.role);
    document.getElementById('nav-predictive').style.display = canSeePredictive ? 'flex' : 'none';
    document.getElementById('nav-nightshift').style.display = 'flex'; // Technicians see their shift, others see overview

    if (currentView === 'login') {
      switchView('dashboard');
    } else {
      switchView(currentView);
    }
  } else {
    currentUser = null;
    document.body.classList.add('unauthenticated');
    document.getElementById('userInfo').classList.add('hidden');
    switchView('login');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const uid = document.getElementById('loginStaffId').value.trim();
  const pwd = document.getElementById('loginPassword').value;
  const fb = document.getElementById('loginFeedback');
  
  if (ACCOUNTS[uid] && pwd === DEMO_PASSWORD) {
    localStorage.setItem('metrofix_session', uid);
    fb.classList.add('hidden');
    checkAuth();
  } else {
    fb.textContent = 'Invalid Staff ID or Password.';
    fb.className = 'feedback-box error';
    fb.classList.remove('hidden');
  }
}

function handleLogout() {
  localStorage.removeItem('metrofix_session');
  document.getElementById('loginForm').reset();
  checkAuth();
}

function canViewFault(f) {
  if (currentUser.role === 'Administrator') return true;
  if (currentUser.station !== 'All' && f.station !== currentUser.station) return false;
  if (currentUser.role === 'Field Technician') return f.assignedTo === currentUser.id;
  return true;
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => { t.remove(); }, duration);
}

// ── Navigation ─────────────────────────────────────────────────
let currentView = 'dashboard';
function switchView(viewId) {
  if (!currentUser && viewId !== 'login') {
    viewId = 'login';
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });
  const view = document.getElementById('view-' + viewId);
  const btn  = document.getElementById('nav-' + viewId);
  if (view) view.classList.add('active');
  if (btn)  { btn.classList.add('active'); btn.setAttribute('aria-current', 'page'); }
  currentView = viewId;

  if (currentUser) {
    if (viewId === 'dashboard') refreshDashboard();
    if (viewId === 'manage')    renderManageTable();
    if (viewId === 'settings')  renderStorageInfo();
    if (viewId === 'predictive') renderPredictiveMaintenance();
    if (viewId === 'nightshift') renderNightShiftRoster();
  }
}

// ── Dashboard ──────────────────────────────────────────────────
function refreshDashboard() {
  let faults = loadFaults();
  if (currentUser) faults = faults.filter(canViewFault);
  
  const total    = faults.length;
  const open     = faults.filter(f => f.status === 'Open').length;
  const critical = faults.filter(f => f.severity === 'Critical').length;
  const resolved = faults.filter(f => f.status === 'Resolved').length;

  document.getElementById('statTotalNum').textContent    = total;
  document.getElementById('statOpenNum').textContent     = open;
  document.getElementById('statCriticalNum').textContent = critical;
  document.getElementById('statResolvedNum').textContent = resolved;

  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  document.getElementById('lastUpdated').textContent = `Updated ${now}`;

  // Recent table – last 8 sorted newest first
  const recent = [...faults].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
  const tbody  = document.getElementById('recentFaultsBody');
  if (recent.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No faults recorded yet. Click "+ Quick Report" to add one.</td></tr>';
    return;
  }
  tbody.innerHTML = recent.map(f => `
    <tr>
      <td><code style="font-size:.82rem">${f.id}</code>${f.isDemo ? '<span class="demo-tag">DEMO</span>' : ''}</td>
      <td>${esc(f.station)}</td>
      <td>${esc(f.assetCategory)}<br><small style="color:var(--gray-400)">${esc(f.assetId)}</small></td>
      <td>${severityBadge(f.severity)}</td>
      <td>${statusBadge(f.status)}</td>
      <td title="${fmtDate(f.timestamp)}">${timeAgo(f.timestamp)}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="openModal('${f.id}')">View</button></td>
    </tr>
  `).join('');
}

// ── Manage Faults Table ────────────────────────────────────────
function renderManageTable() {
  let faults   = loadFaults();
  if (currentUser) faults = faults.filter(canViewFault);
  
  const query    = document.getElementById('searchInput').value.toLowerCase().trim();
  const stFilter = document.getElementById('filterStatus').value;
  const svFilter = document.getElementById('filterSeverity').value;

  let filtered = faults;
  if (query) {
    filtered = filtered.filter(f =>
      f.id.toLowerCase().includes(query) ||
      f.station.toLowerCase().includes(query) ||
      f.assetId.toLowerCase().includes(query) ||
      f.assetCategory.toLowerCase().includes(query) ||
      f.description.toLowerCase().includes(query) ||
      f.reporter.toLowerCase().includes(query)
    );
  }
  if (stFilter) filtered = filtered.filter(f => f.status === stFilter);
  if (svFilter) filtered = filtered.filter(f => f.severity === svFilter);

  // Sort: critical open first, then newest
  filtered.sort((a, b) => {
    const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const stOrder  = { Open: 0, 'In Progress': 1, Resolved: 2 };
    if (stOrder[a.status] !== stOrder[b.status]) return stOrder[a.status] - stOrder[b.status];
    if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const count = document.getElementById('filterCount');
  count.textContent = filtered.length === faults.length
    ? `Showing all ${faults.length} fault${faults.length !== 1 ? 's' : ''}`
    : `Showing ${filtered.length} of ${faults.length} faults`;

  const tbody = document.getElementById('manageFaultsBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="9">No faults match your search / filter criteria.</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(f => `
    <tr>
      <td><code style="font-size:.8rem">${f.id}</code>${f.isDemo ? '<span class="demo-tag">DEMO</span>' : ''}</td>
      <td>${esc(f.station)}</td>
      <td>${esc(f.assetCategory)}</td>
      <td><code style="font-size:.8rem">${esc(f.assetId)}</code></td>
      <td>${severityBadge(f.severity)}</td>
      <td>${statusBadge(f.status)}</td>
      <td>${esc(f.reporter)}</td>
      <td title="${fmtDate(f.timestamp)}">${timeAgo(f.timestamp)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-sm" onclick="openModal('${f.id}')">View / Edit</button>
      </td>
    </tr>
  `).join('');
}

// ── Predictive Maintenance (PS-02) ──────────────────────────────
function calculateRiskScores() {
  const faults = loadFaults();
  const assetMap = {};
  
  // Group faults by asset
  faults.forEach(f => {
    const key = f.station + '|' + f.assetCategory + '|' + f.assetId;
    if (!assetMap[key]) assetMap[key] = { id: f.assetId, category: f.assetCategory, station: f.station, faults: [] };
    assetMap[key].faults.push(f);
  });

  const risks = [];
  for (let key in assetMap) {
    const asset = assetMap[key];
    asset.faults.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let score = 0;
    let reasons = [];
    
    if (asset.faults.length === 0) continue;

    // Frequency
    score += asset.faults.length * 15;
    reasons.push(`${asset.faults.length} past faults`);
    
    // Severity
    const criticals = asset.faults.filter(f => f.severity === 'Critical').length;
    const highs = asset.faults.filter(f => f.severity === 'High').length;
    
    if (criticals > 0) {
      score += criticals * 25;
      reasons.push(`${criticals} critical failures`);
    }
    if (highs > 0) {
      score += highs * 15;
      reasons.push(`${highs} high-sev faults`);
    }
    
    // Recency (time since last fault)
    const lastFault = asset.faults[0];
    const daysSince = (Date.now() - new Date(lastFault.timestamp).getTime()) / (1000 * 3600 * 24);
    
    if (daysSince < 7) {
      score += 30;
      reasons.push('Recent failure (< 7d)');
    } else if (daysSince < 30) {
      score += 15;
      reasons.push('Recent failure (< 30d)');
    }
    
    score = Math.min(100, Math.max(0, score));
    
    let band = 'Low Risk';
    if (score >= 70) band = 'High Risk';
    else if (score >= 40) band = 'Medium Risk';

    risks.push({
      assetId: asset.id,
      category: asset.category,
      station: asset.station,
      score: score,
      band: band,
      reasons: reasons,
      pastFaults: asset.faults.length,
      lastFaultDate: lastFault.timestamp
    });
  }
  
  return risks.sort((a, b) => b.score - a.score);
}

function renderPredictiveMaintenance() {
  let risks = calculateRiskScores();
  
  if (currentUser && currentUser.station !== 'All') {
    risks = risks.filter(r => r.station === currentUser.station);
  }
  
  // Update filter dropdowns if empty
  const stSelect = document.getElementById('filterPredStation');
  const catSelect = document.getElementById('filterPredCategory');
  if (stSelect.options.length <= 1) {
    const stations = [...new Set(risks.map(r => r.station))].sort();
    stations.forEach(s => stSelect.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`);
  }
  if (catSelect.options.length <= 1) {
    const cats = [...new Set(risks.map(r => r.category))].sort();
    cats.forEach(c => catSelect.innerHTML += `<option value="${esc(c)}">${esc(c)}</option>`);
  }
  
  const stFilter = stSelect.value;
  const catFilter = catSelect.value;
  const riskFilter = document.getElementById('filterPredRisk').value;
  
  if (stFilter) risks = risks.filter(r => r.station === stFilter);
  if (catFilter) risks = risks.filter(r => r.category === catFilter);
  if (riskFilter) risks = risks.filter(r => r.band === riskFilter + ' Risk');
  
  const tbody = document.getElementById('predictiveBody');
  if (risks.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No asset risk data matches your criteria.</td></tr>';
    return;
  }
  
  tbody.innerHTML = risks.map(r => {
    let color = 'var(--green-500)';
    if (r.band === 'High Risk') color = 'var(--red-500)';
    if (r.band === 'Medium Risk') color = 'var(--orange-500)';
    
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="font-size:1.1rem; font-weight:700; color:${color}">${r.score}</div>
            <div style="font-size:0.75rem; color:var(--gray-500);">${r.band}</div>
          </div>
        </td>
        <td><code style="font-size:.8rem">${esc(r.assetId)}</code></td>
        <td>${esc(r.category)}</td>
        <td>${esc(r.station)}</td>
        <td>${r.pastFaults}</td>
        <td title="${fmtDate(r.lastFaultDate)}">${timeAgo(r.lastFaultDate)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="showRiskDetails('${esc(r.assetId)}')">View Reason</button></td>
      </tr>
    `;
  }).join('');
}

function showRiskDetails(assetId) {
  const risks = calculateRiskScores();
  const r = risks.find(x => x.assetId === assetId);
  if (!r) return;
  alert(`Risk Explanation for ${assetId}:\n\n- ${r.reasons.join('\n- ')}`);
}

function generateNightShiftRoster() {
  const risks = calculateRiskScores();
  const availableTasks = [];
  
  risks.filter(r => r.score >= 40).forEach(r => {
    let duration = 60; // default 60 min
    let action = 'Preventive Inspection';
    if (r.category === 'Escalator' || r.category === 'Elevator / Lift') {
      duration = 120;
      action = 'Deep Motor & Sensor Diagnostics';
    } else if (r.category === 'Ticket Machine') {
      duration = 45;
      action = 'Card Reader & Dispenser Calibration';
    }
    
    availableTasks.push({
      id: 'TSK-' + generateId().split('-')[1],
      assetId: r.assetId,
      station: r.station,
      riskBand: r.band,
      score: r.score,
      action: action,
      duration: duration,
      assignedTo: '',
      status: 'Planned'
    });
  });
  
  // Auto-assign logic based on shift capacity (e.g., 480 mins per tech = 8 hours)
  const shiftMins = 480;
  const techs = {
    'technician.central': { minsUsed: 0, station: 'Central Station' }
  };
  
  availableTasks.forEach(t => {
    // Attempt assignment
    for (let techId in techs) {
      if (techs[techId].station === t.station || techs[techId].station === 'All') {
        if (techs[techId].minsUsed + t.duration <= shiftMins) {
          t.assignedTo = techId;
          t.status = 'Assigned';
          techs[techId].minsUsed += t.duration;
          break;
        }
      }
    }
  });
  
  localStorage.setItem(ROSTER_KEY, JSON.stringify(availableTasks));
  showToast('Night shift roster generated and assigned.', 'success');
  if (currentView === 'nightshift') renderNightShiftRoster();
}

function loadRoster() {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e) {
    return [];
  }
}
function saveRoster(roster) {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

function renderNightShiftRoster() {
  let roster = loadRoster();
  
  if (currentUser && currentUser.role === 'Field Technician') {
    roster = roster.filter(t => t.assignedTo === currentUser.id);
  } else if (currentUser && currentUser.station !== 'All') {
    roster = roster.filter(t => t.station === currentUser.station);
  }
  
  const tbody = document.getElementById('rosterBody');
  if (roster.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="9">No roster items found. Generate a roster first.</td></tr>';
    return;
  }
  
  tbody.innerHTML = roster.map((t, idx) => {
    const bandColor = t.riskBand === 'High Risk' ? 'var(--red-500)' : (t.riskBand === 'Medium Risk' ? 'var(--orange-500)' : 'var(--green-500)');
    let actionsHtml = '';
    
    if (currentUser.role === 'Field Technician') {
      if (t.status === 'Assigned' || t.status === 'Planned') {
        actionsHtml = `<button class="btn btn-sm btn-primary" onclick="updateTaskStatus('${t.id}', 'In Progress')">Start Work</button>`;
      } else if (t.status === 'In Progress') {
        actionsHtml = `<button class="btn btn-sm" style="background:var(--green-500); color:white" onclick="updateTaskStatus('${t.id}', 'Completed')">Complete</button>
                       <button class="btn btn-sm btn-ghost" onclick="updateTaskStatus('${t.id}', 'Deferred')">Defer</button>`;
      } else {
        actionsHtml = `<span style="font-size:0.8rem; color:var(--gray-500)">No actions</span>`;
      }
    } else {
      actionsHtml = `<button class="btn btn-sm btn-ghost" onclick="openAssignModal('${t.id}')">Manage Assignment</button>`;
    }
    
    return `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><code style="font-size:.8rem">${esc(t.assetId)}</code></td>
        <td>${esc(t.station)}</td>
        <td style="color:${bandColor}; font-weight:600">${t.riskBand}</td>
        <td>${esc(t.action)}</td>
        <td>${t.duration}m</td>
        <td>${t.assignedTo ? esc(t.assignedTo) : '<span style="color:var(--gray-400)">Unassigned</span>'}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${actionsHtml}</td>
      </tr>
    `;
  }).join('');
}

function updateTaskStatus(taskId, newStatus) {
  const roster = loadRoster();
  const idx = roster.findIndex(t => t.id === taskId);
  if (idx > -1) {
    roster[idx].status = newStatus;
    saveRoster(roster);
    showToast(`Task ${taskId} marked as ${newStatus}.`, 'success');
    renderNightShiftRoster();
  }
}

function openAssignModal(taskId) {
  const roster = loadRoster();
  const task = roster.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('modalTitle').textContent = `Assign Technician: ${task.id}`;

  const techs = Object.keys(ACCOUNTS).filter(k => ACCOUNTS[k].role === 'Field Technician');
  let selectHtml = `<select id="modalAssignTechSelect" class="form-input" style="margin-top: 8px;">
    <option value="">-- Unassigned --</option>
  `;
  techs.forEach(uid => {
    // Only show techs matching the station or 'All' (which doesn't usually apply to techs, but let's filter)
    const t = ACCOUNTS[uid];
    if (t.station === task.station || t.station === 'All') {
      const selected = (task.assignedTo === uid) ? 'selected' : '';
      selectHtml += `<option value="${uid}" ${selected}>${t.name} (${uid})</option>`;
    }
  });
  selectHtml += `</select>`;

  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom: 12px;">
      <strong>Asset:</strong> ${esc(task.assetId)} (${esc(task.station)})<br>
      <strong>Action:</strong> ${esc(task.action)} (${task.duration}m)
    </div>
    <div class="form-group">
      <label class="form-label" for="modalAssignTechSelect">Assign To</label>
      ${selectHtml}
    </div>
    <p id="modalAssignWarning" style="color:var(--orange-500); font-size:0.8rem; margin-top:8px; display:none;">
      Warning: This exceeds the 8-hour shift capacity.
    </p>
  `;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" id="modalCancelBtn">Cancel</button>
    <button class="btn btn-primary" id="modalSaveAssignBtn" data-id="${esc(task.id)}">Save Assignment</button>
  `;

  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);

  // Capacity validation on change
  const selectEl = document.getElementById('modalAssignTechSelect');
  selectEl.addEventListener('change', () => {
    const techId = selectEl.value;
    const warning = document.getElementById('modalAssignWarning');
    if (!techId) {
      warning.style.display = 'none';
      return;
    }
    // Calculate current assigned minutes for this tech in this roster
    const currentMins = roster
      .filter(t => t.assignedTo === techId && t.id !== task.id)
      .reduce((sum, t) => sum + t.duration, 0);
    
    if (currentMins + task.duration > 480) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  });
  // Trigger validation immediately
  selectEl.dispatchEvent(new Event('change'));

  document.getElementById('modalSaveAssignBtn').addEventListener('click', () => {
    const newTech = document.getElementById('modalAssignTechSelect').value;
    const idx = roster.findIndex(t => t.id === taskId);
    if (idx > -1) {
      roster[idx].assignedTo = newTech;
      if (newTech) {
        if (roster[idx].status === 'Planned') roster[idx].status = 'Assigned';
      } else {
        if (roster[idx].status === 'Assigned') roster[idx].status = 'Planned';
      }
      saveRoster(roster);
      showToast('Assignment updated successfully.', 'success');
      renderNightShiftRoster();
    }
    closeModal();
  });

  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('modalClose').focus();
}

// ── XSS-safe escape ────────────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Modal ──────────────────────────────────────────────────────
function openModal(faultId) {
  const faults = loadFaults();
  const fault  = faults.find(f => f.id === faultId);
  if (!fault) { showToast('Fault not found.', 'error'); return; }

  document.getElementById('modalTitle').textContent = fault.id + (fault.isDemo ? ' [DEMO]' : '');

  let editSection = '';
  if (currentUser && currentUser.role !== 'Station Staff') {
    let statusOptions = '';
    if (currentUser.role === 'Station Manager' || currentUser.role === 'Administrator') {
      statusOptions = `
        <option value="Open" ${fault.status === 'Open' ? 'selected' : ''}>Open</option>
        <option value="In Progress" ${fault.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option value="Pending Verification" ${fault.status === 'Pending Verification' ? 'selected' : ''}>Pending Verification</option>
        <option value="Resolved" ${fault.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
      `;
    } else if (currentUser.role === 'Maintenance Engineer') {
      statusOptions = `
        <option value="Open" ${fault.status === 'Open' ? 'selected' : ''}>Open</option>
        <option value="In Progress" ${fault.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option value="Pending Verification" ${fault.status === 'Pending Verification' ? 'selected' : ''}>Pending Verification</option>
      `;
    } else if (currentUser.role === 'Field Technician') {
      statusOptions = `
        <option value="${fault.status}" selected style="display:none">${fault.status}</option>
        <option value="In Progress">In Progress</option>
        <option value="Pending Verification">Submit for Verification (Pending)</option>
      `;
    }

    let techSelect = '';
    if (currentUser.role === 'Maintenance Engineer' || currentUser.role === 'Administrator') {
      techSelect = `
        <div style="margin-top:12px;">
          <label for="modalAssignTech" style="display:block;margin-bottom:4px;font-size:0.85rem;font-weight:600;color:var(--gray-600)">Assign Technician:</label>
          <select id="modalAssignTech" class="form-input" style="width:100%">
            <option value="">-- Unassigned --</option>
            <option value="technician.central" ${fault.assignedTo === 'technician.central' ? 'selected' : ''}>Central Tech (technician.central)</option>
          </select>
        </div>
      `;
    }

    let notesField = `
      <div style="margin-top:12px;">
        <label for="modalNotes" style="display:block;margin-bottom:4px;font-size:0.85rem;font-weight:600;color:var(--gray-600)">Work/Technical Notes:</label>
        <textarea id="modalNotes" class="form-input form-textarea" rows="2" style="width:100%">${esc(fault.notes || '')}</textarea>
      </div>
    `;

    editSection = `
      <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--gray-200);">
      <div style="background:var(--gray-50); padding:16px; border-radius:8px; border:1px solid var(--gray-200);">
        <h3 style="margin-top:0; margin-bottom:12px; font-size:1rem; color:var(--navy-900);">Update Record</h3>
        <div>
          <label for="modalStatusSelect" style="display:block;margin-bottom:4px;font-size:0.85rem;font-weight:600;color:var(--gray-600)">Update Status:</label>
          <select class="form-input" id="modalStatusSelect" style="width:100%">
            ${statusOptions}
          </select>
        </div>
        ${techSelect}
        ${notesField}
      </div>
    `;
  }

  document.getElementById('modalBody').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">Station</span>
        <span class="detail-value">${esc(fault.station)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Asset Category</span>
        <span class="detail-value">${esc(fault.assetCategory)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Asset Identifier</span>
        <span class="detail-value"><code>${esc(fault.assetId)}</code></span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Severity</span>
        <span class="detail-value">${severityBadge(fault.severity)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Current Status</span>
        <span class="detail-value">${statusBadge(fault.status)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Reporter</span>
        <span class="detail-value">${esc(fault.reporter)}</span>
      </div>
      <div class="detail-item detail-full">
        <span class="detail-label">Reported</span>
        <span class="detail-value">${fmtDate(fault.timestamp)}</span>
      </div>
      <div class="detail-item detail-full">
        <span class="detail-label">Description</span>
        <div class="detail-description">${esc(fault.description)}</div>
      </div>
      ${fault.assignedTo ? `
      <div class="detail-item detail-full" style="background:#e0f2fe; padding:8px; border-radius:4px;">
        <span class="detail-label" style="color:#0369a1;">Assigned To</span>
        <span class="detail-value" style="color:#0c4a6e; font-weight:600;">${esc(fault.assignedTo)}</span>
      </div>` : ''}
      ${fault.notes ? `
      <div class="detail-item detail-full">
        <span class="detail-label">Work Notes</span>
        <div class="detail-description" style="background:var(--gray-100);">${esc(fault.notes)}</div>
      </div>` : ''}
    </div>
    ${editSection}
  `;

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-ghost" id="modalCancelBtn">Cancel</button>
    ${editSection ? `<button class="btn btn-primary" id="modalSaveBtn" data-id="${esc(fault.id)}">Save Changes</button>` : ''}
  `;

  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  const saveBtn = document.getElementById('modalSaveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const newStatus = document.getElementById('modalStatusSelect').value;
      const newNotes = document.getElementById('modalNotes') ? document.getElementById('modalNotes').value.trim() : fault.notes;
      const newAssign = document.getElementById('modalAssignTech') ? document.getElementById('modalAssignTech').value : fault.assignedTo;
      updateFaultRecord(fault.id, newStatus, newNotes, newAssign);
    });
  }

  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('modalClose').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

function updateFaultRecord(faultId, newStatus, newNotes, newAssign) {
  const faults = loadFaults();
  const idx    = faults.findIndex(f => f.id === faultId);
  if (idx === -1) { showToast('Fault not found.', 'error'); return; }
  
  if (newStatus === 'Submit for Verification (Pending)') newStatus = 'Pending Verification';

  faults[idx].status = newStatus;
  faults[idx].notes = newNotes;
  faults[idx].assignedTo = newAssign;
  saveFaults(faults);
  closeModal();
  showToast(`Fault ${faultId} updated successfully.`, 'success');
  refreshDashboard();
  if (currentView === 'manage') renderManageTable();
}

// ── Report Fault form ──────────────────────────────────────────
let previewId = '';

function freshPreviewId() {
  previewId = generateId();
  document.getElementById('previewId').textContent = previewId;
}

function validateForm() {
  const fields = ['stationName', 'assetCategory', 'assetId', 'severity', 'reporterName', 'description'];
  let valid = true;
  fields.forEach(name => {
    const el  = document.getElementById(name);
    const err = document.getElementById('err-' + name);
    el.classList.remove('input-error');
    err.textContent = '';
    if (!el.value.trim()) {
      el.classList.add('input-error');
      err.textContent = 'This field is required.';
      valid = false;
    }
  });
  return valid;
}

function clearFormErrors() {
  ['stationName','assetCategory','assetId','severity','reporterName','description'].forEach(name => {
    const el  = document.getElementById(name);
    const err = document.getElementById('err-' + name);
    if (el) el.classList.remove('input-error');
    if (err) err.textContent = '';
  });
}

function clearForm() {
  document.getElementById('faultForm').reset();
  clearFormErrors();
  document.getElementById('descCharCount').textContent = '0 / 500';
  const fb = document.getElementById('reportFeedback');
  fb.className = 'feedback-box hidden';
  fb.textContent = '';
  freshPreviewId();
}

function handleFormSubmit(e) {
  e.preventDefault();
  const fb = document.getElementById('reportFeedback');

  if (!validateForm()) {
    fb.className = 'feedback-box error';
    fb.textContent = 'Please fill in all required fields before submitting.';
    return;
  }

  const fault = {
    id:            previewId,
    isDemo:        false,
    station:       document.getElementById('stationName').value.trim(),
    assetCategory: document.getElementById('assetCategory').value.trim(),
    assetId:       document.getElementById('assetId').value.trim(),
    severity:      document.getElementById('severity').value,
    status:        'Open',
    reporter:      document.getElementById('reporterName').value.trim(),
    description:   document.getElementById('description').value.trim(),
    timestamp:     new Date().toISOString()
  };

  // Duplicate guard (shouldn't happen but safety net)
  const existing = loadFaults();
  if (existing.find(f => f.id === fault.id)) {
    fb.className = 'feedback-box error';
    fb.textContent = 'ID collision detected. Please try again.';
    freshPreviewId();
    return;
  }

  existing.push(fault);
  saveFaults(existing);

  fb.className = 'feedback-box success';
  fb.textContent = `✓ Fault ${fault.id} reported successfully at ${fmtDate(fault.timestamp)}.`;

  showToast(`Fault ${fault.id} saved.`, 'success');
  clearForm();
  refreshDashboard();
}

// ── Seed / clear demo data ─────────────────────────────────────
function seedDemoData(force = false) {
  const faults   = loadFaults();
  const existing = new Set(faults.map(f => f.id));
  const toAdd    = DEMO_FAULTS.filter(d => !existing.has(d.id));

  if (toAdd.length === 0 && !force) {
    showToast('Demo data is already loaded.', 'info');
    return;
  }

  // If force=true (Restore), remove old demos and re-add
  const nonDemo = faults.filter(f => !f.isDemo);
  const allDemos = [...DEMO_FAULTS, ...PREDICTIVE_HISTORY_FAULTS];
  saveFaults([...nonDemo, ...allDemos]);
  showToast(`${allDemos.length} demo records loaded.`, 'success');
  refreshDashboard();
  if (currentView === 'manage') renderManageTable();
  renderStorageInfo();
}

function clearDemoData() {
  const faults    = loadFaults();
  const nonDemo   = faults.filter(f => !f.isDemo);
  const removed   = faults.length - nonDemo.length;
  saveFaults(nonDemo);
  showToast(`${removed} demo record${removed !== 1 ? 's' : ''} removed. Your reports are untouched.`, 'info');
  refreshDashboard();
  if (currentView === 'manage') renderManageTable();
  renderStorageInfo();
}

function nukeAll() {
  const faults = loadFaults();
  if (faults.length === 0) { showToast('No records to delete.', 'info'); return; }
  if (!window.confirm(`Delete ALL ${faults.length} fault records? This cannot be undone.`)) return;
  saveFaults([]);
  showToast('All records deleted.', 'error');
  refreshDashboard();
  if (currentView === 'manage') renderManageTable();
  renderStorageInfo();
}

function exportData() {
  const faults = loadFaults();
  if (faults.length === 0) { showToast('No data to export.', 'info'); return; }
  const blob = new Blob([JSON.stringify(faults, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `metrofix_export_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Exported ${faults.length} records.`, 'success');
}

// ── Storage info ───────────────────────────────────────────────
function renderStorageInfo() {
  const faults = loadFaults();
  const raw    = localStorage.getItem(STORAGE_KEY) || '';
  const bytes  = new Blob([raw]).size;
  const kb     = (bytes / 1024).toFixed(2);
  const demos  = faults.filter(f => f.isDemo).length;
  const user   = faults.length - demos;

  /* Service worker status — detected asynchronously */
  let swStatus = 'Not supported by this browser';
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration('./').then(reg => {
      const el = document.getElementById('swStatusLine');
      if (!el) return;
      if (reg && reg.active) {
        el.innerHTML = '<strong>Offline cache:</strong> ✅ Active (app works offline)';
      } else if (reg) {
        el.innerHTML = '<strong>Offline cache:</strong> ⏳ Registering…';
      } else {
        el.innerHTML = '<strong>Offline cache:</strong> ⚠️ Not yet registered (reload page)';
      }
    });
    swStatus = 'Checking…';
  }

  document.getElementById('storageInfo').innerHTML = `
    <strong>Total faults:</strong> ${faults.length}<br>
    <strong>Your reports:</strong> ${user}<br>
    <strong>Demo records:</strong> ${demos}<br>
    <strong>Storage used:</strong> ${kb} KB<br>
    <strong>Storage key:</strong> <code>${STORAGE_KEY}</code><br>
    <span id="swStatusLine"><strong>Offline cache:</strong> ${swStatus}</span>
  `;
}


// ── Offline banner + sidebar dot ─────────────────────────────
function updateOnlineStatus() {
  const dot    = document.getElementById('offlineIndicator');
  const label  = document.getElementById('offlineLabel');
  const banner = document.getElementById('offlineBanner');
  const online = navigator.onLine;

  /* Sidebar status dot */
  if (online) {
    dot.classList.remove('offline');
    label.textContent = 'Online';
  } else {
    dot.classList.add('offline');
    label.textContent = 'Offline';
  }

  /* Full-width offline banner */
  if (online) {
    banner.classList.add('hidden');
    document.body.classList.remove('has-banner');
  } else {
    banner.classList.remove('hidden');
    document.body.classList.add('has-banner');
  }
}

// ── Service Worker registration ────────────────────────────────
//
// REQUIREMENT: Service Workers only work from:
//   • http://localhost (any port)     ← use python -m http.server
//   • https://                        ← production / GitHub Pages
// They do NOT work from file:// — never double-click index.html.
//
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        console.info('[MetroFix SW] Registered. Scope:', registration.scope);

        /* Listen for a waiting SW (new version downloaded) */
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            /* A new SW is waiting — prompt user to refresh */
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              const updateBanner = document.getElementById('updateBanner');
              if (updateBanner) {
                updateBanner.classList.remove('hidden');
                document.body.classList.add('has-banner');
              }
            }
          });
        });
      })
      .catch(err => {
        /* SW registration failure is non-fatal;
           the app still works — localStorage is independent */
        console.warn('[MetroFix SW] Registration failed:', err);
      });

    /* Wire up the "Reload to update" button */
    const btnUpdate = document.getElementById('btnUpdateSW');
    if (btnUpdate) {
      btnUpdate.addEventListener('click', () => window.location.reload());
    }
  });
}

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Seed demo on first load only
  if (!localStorage.getItem(DEMO_FLAG)) {
    seedDemoData(true);
    localStorage.setItem(DEMO_FLAG, '1');
  }

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Dashboard quick actions
  document.getElementById('btnQuickReport').addEventListener('click', () => switchView('report'));
  document.getElementById('btnViewAll').addEventListener('click',    () => switchView('manage'));

  // Report form
  const form = document.getElementById('faultForm');
  form.addEventListener('submit', handleFormSubmit);
  document.getElementById('btnClearForm').addEventListener('click', clearForm);

  // Character count
  document.getElementById('description').addEventListener('input', function () {
    document.getElementById('descCharCount').textContent = `${this.value.length} / 500`;
  });

  // Manage – search & filter
  ['searchInput', 'filterStatus', 'filterSeverity'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderManageTable);
  });
  document.getElementById('btnClearFilters').addEventListener('click', () => {
    document.getElementById('searchInput').value    = '';
    document.getElementById('filterStatus').value   = '';
    document.getElementById('filterSeverity').value = '';
    renderManageTable();
  });

  // Settings
  document.getElementById('btnSeedDemo').addEventListener('click', () => seedDemoData(true));
  document.getElementById('btnClearDemo').addEventListener('click', clearDemoData);
  document.getElementById('btnNukeAll').addEventListener('click',   nukeAll);
  document.getElementById('btnExport').addEventListener('click',    exportData);

  // Modal close
  document.getElementById('modalClose').addEventListener('click',   closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Online/offline indicator
  updateOnlineStatus();
  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Auth wiring
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('btnSignOut').addEventListener('click', handleLogout);

  // Predictive Maintenance events
  ['filterPredStation', 'filterPredCategory', 'filterPredRisk'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderPredictiveMaintenance);
  });
  document.getElementById('btnGenerateRoster').addEventListener('click', generateNightShiftRoster);
  document.getElementById('btnExportRoster').addEventListener('click', () => {
    const roster = loadRoster();
    if (roster.length === 0) { showToast('No roster to export.', 'info'); return; }
    const blob = new Blob([JSON.stringify(roster, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `metrofix_roster_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${roster.length} roster tasks.`, 'success');
  });

  // Initial render
  freshPreviewId();
  checkAuth();
});
