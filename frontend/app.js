/**
 * Credit Risk Prediction — Frontend Logic
 * Connects to Flask API at http://localhost:8000
 */

const API_BASE = 'http://localhost:8000';

// ── Field definitions ────────────────────────────────────────────────────────

const FIELDS = {
  checking_account: {
    label: 'Checking Account',
    type: 'select',
    options: ['no_account', 'negative', '0_to_200', 'above_200'],
    labels: ['No Account', 'Negative Balance', '0 – 200 ₹', 'Above 200 ₹'],
  },
  duration_months: { label: 'Duration (months)', type: 'number', min: 1, max: 120, placeholder: 'e.g. 24' },
  credit_history: {
    label: 'Credit History',
    type: 'select',
    options: ['no_credits', 'all_paid', 'existing_paid', 'delayed_previously', 'critical'],
    labels: ['No Credits Taken', 'All Credits Paid', 'Existing Credits Paid', 'Delayed Previously', 'Critical Account'],
  },
  purpose: {
    label: 'Loan Purpose',
    type: 'select',
    options: ['car', 'furniture', 'radio_tv', 'domestic_appliances', 'repairs', 'education', 'retraining', 'business', 'other'],
    labels: ['Car', 'Furniture / Equipment', 'Radio / TV', 'Domestic Appliances', 'Repairs', 'Education', 'Retraining', 'Business', 'Other'],
  },
  credit_amount: { label: 'Credit Amount (₹)', type: 'number', min: 100, max: 100000, placeholder: 'e.g. 5000' },
  savings_account: {
    label: 'Savings Account',
    type: 'select',
    options: ['no_savings', 'below_100', '100_to_500', '500_to_1000', 'above_1000'],
    labels: ['No Savings', 'Below 100 ₹', '100 – 500 ₹', '500 – 1000 ₹', 'Above 1000 ₹'],
  },
  employment_since: {
    label: 'Employment Since',
    type: 'select',
    options: ['unemployed', 'below_1yr', '1_to_4yr', '4_to_7yr', 'above_7yr'],
    labels: ['Unemployed', 'Less than 1 Year', '1 – 4 Years', '4 – 7 Years', 'Above 7 Years'],
  },
  installment_rate: { label: 'Installment Rate (%)', type: 'number', min: 1, max: 4, placeholder: '1–4' },
  personal_status: {
    label: 'Personal Status',
    type: 'select',
    options: ['male_single', 'male_married', 'male_divorced', 'female_divorced', 'female_single'],
    labels: ['Male – Single', 'Male – Married/Widowed', 'Male – Divorced', 'Female – Divorced/Separated', 'Female – Single/Married'],
  },
  other_debtors: {
    label: 'Other Debtors / Guarantors',
    type: 'select',
    options: ['none', 'co_applicant', 'guarantor'],
    labels: ['None', 'Co-Applicant', 'Guarantor'],
  },
  residence_since: { label: 'Residence Since (yrs)', type: 'number', min: 1, max: 4, placeholder: '1–4' },
  property: {
    label: 'Property',
    type: 'select',
    options: ['real_estate', 'savings_insurance', 'car_other', 'no_property'],
    labels: ['Real Estate', 'Savings / Insurance', 'Car or Other', 'No Property'],
  },
  age_years: { label: 'Age (years)', type: 'number', min: 18, max: 100, placeholder: 'e.g. 35' },
  other_installments: {
    label: 'Other Installment Plans',
    type: 'select',
    options: ['none', 'bank', 'stores'],
    labels: ['None', 'Bank', 'Stores'],
  },
  housing: {
    label: 'Housing',
    type: 'select',
    options: ['own', 'free', 'rent'],
    labels: ['Own', 'Free / Provided', 'Rent'],
  },
  existing_credits: { label: 'Existing Credits at Bank', type: 'number', min: 1, max: 4, placeholder: '1–4' },
  job: {
    label: 'Job Category',
    type: 'select',
    options: ['unskilled_nonresident', 'unskilled_resident', 'skilled', 'highly_qualified'],
    labels: ['Unskilled – Non-Resident', 'Unskilled – Resident', 'Skilled Employee', 'Highly Qualified / Management'],
  },
  num_dependents: { label: 'Number of Dependents', type: 'number', min: 1, max: 2, placeholder: '1–2' },
  telephone: {
    label: 'Telephone',
    type: 'select',
    options: ['none', 'yes'],
    labels: ['None / Not Registered', 'Yes – Registered'],
  },
  foreign_worker: {
    label: 'Foreign Worker',
    type: 'select',
    options: ['yes', 'no'],
    labels: ['Yes', 'No'],
  },
};

// ── Section definitions (grouping) ──────────────────────────────────────────

const SECTIONS = [
  {
    icon: '💳',
    title: 'Financial Profile',
    cols: 2,
    fields: ['checking_account', 'savings_account', 'credit_amount', 'credit_history'],
  },
  {
    icon: '📋',
    title: 'Loan Details',
    cols: 2,
    fields: ['purpose', 'duration_months', 'installment_rate', 'other_installments'],
  },
  {
    icon: '💼',
    title: 'Employment',
    cols: 2,
    fields: ['employment_since', 'job', 'existing_credits', 'residence_since'],
  },
  {
    icon: '👤',
    title: 'Personal Information',
    cols: 2,
    fields: ['personal_status', 'age_years', 'num_dependents', 'foreign_worker', 'telephone'],
  },
  {
    icon: '🏠',
    title: 'Property, Housing & Liabilities',
    cols: 2,
    fields: ['property', 'housing', 'other_debtors'],
  },
];

// ── DOM refs ─────────────────────────────────────────────────────────────────

const form         = document.getElementById('applicantForm');
const submitBtn    = document.getElementById('submitBtn');
const errorBanner  = document.getElementById('errorBanner');
const errorMsg     = document.getElementById('errorMsg');
const emptyState   = document.getElementById('emptyState');
const resultCont   = document.getElementById('resultContent');
const verdictBadge = document.getElementById('verdictBadge');
const gaugePct     = document.getElementById('gaugePercent');
const riskPill     = document.getElementById('riskPill');
const goodBar      = document.getElementById('goodBar');
const badBar       = document.getElementById('badBar');
const goodVal      = document.getElementById('goodVal');
const badVal       = document.getElementById('badVal');
const healthDot    = document.getElementById('healthDot');
const healthText   = document.getElementById('healthText');
const statPred     = document.getElementById('statPrediction');
const statRisk     = document.getElementById('statRisk');
const progressBar  = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// ── Progress Tracker ─────────────────────────────────────────────────────────

const TOTAL_FIELDS = Object.keys(FIELDS).length;

function updateProgress() {
  let filled = 0;
  Object.keys(FIELDS).forEach(key => {
    const el = document.getElementById(key);
    if (el && el.value.trim() !== '' && el.value !== null) filled++;
  });
  const pct = Math.round((filled / TOTAL_FIELDS) * 100);
  if (progressBar)  progressBar.style.width = pct + '%';
  if (progressText) progressText.textContent = `${filled} / ${TOTAL_FIELDS} fields`;
}

// ── Build Form ───────────────────────────────────────────────────────────────

function buildForm() {
  const formBody = document.getElementById('formBody');

  SECTIONS.forEach((section, si) => {
    const sec = document.createElement('div');
    sec.className = 'form-section';
    sec.style.animationDelay = `${0.1 + si * 0.06}s`;

    // Section header
    sec.innerHTML = `<div class="section-label"><span>${section.icon} ${section.title}</span></div>`;

    // Grid
    const grid = document.createElement('div');
    grid.className = `form-grid${section.cols === 3 ? ' cols-3' : ''}`;

    section.fields.forEach(key => {
      const f = FIELDS[key];
      if (!f) return;
      const group = document.createElement('div');
      group.className = 'field-group';
      group.id = `group-${key}`;

      if (f.type === 'select') {
        group.innerHTML = `
          <label for="${key}">${f.label}</label>
          <select id="${key}" name="${key}">
            <option value="" disabled selected>Select…</option>
            ${f.options.map((o, i) => `<option value="${o}">${f.labels[i]}</option>`).join('')}
          </select>
          <span class="field-error">Please select an option</span>
        `;
      } else {
        group.innerHTML = `
          <label for="${key}">${f.label}</label>
          <input type="number" id="${key}" name="${key}"
            min="${f.min}" max="${f.max}" placeholder="${f.placeholder}" />
          <span class="field-error">Enter a value between ${f.min}–${f.max}</span>
        `;
      }
      grid.appendChild(group);
    });

    sec.appendChild(grid);
    formBody.appendChild(sec);
  });
}

// ── Gauge (Canvas Arc) ───────────────────────────────────────────────────────

let gaugeAnim = null;
let currentGaugeVal = 0;

function drawGauge(percent, color) {
  const canvas = document.getElementById('gaugeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2 + 10;
  const r = W / 2 - 18;
  const startAngle = Math.PI * 0.75;
  const endAngle   = Math.PI * 2.25;
  const fillAngle  = startAngle + (endAngle - startAngle) * (percent / 100);

  ctx.clearRect(0, 0, W, H);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Fill gradient
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#4f8ef7');
  grad.addColorStop(1, color || '#9b59f5');

  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, fillAngle);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center dot
  const dotX = cx + r * Math.cos(fillAngle);
  const dotY = cy + r * Math.sin(fillAngle);
  ctx.beginPath();
  ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

function animateGauge(targetPct, color) {
  cancelAnimationFrame(gaugeAnim);
  const start = currentGaugeVal;
  const duration = 900;
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = start + (targetPct - start) * ease;
    currentGaugeVal = val;
    drawGauge(val, color);
    gaugePct.textContent = Math.round(val) + '%';
    if (t < 1) gaugeAnim = requestAnimationFrame(step);
  }

  gaugeAnim = requestAnimationFrame(step);
}

// ── Health Check ─────────────────────────────────────────────────────────────

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (data.model_loaded) {
      healthDot.className = 'health-dot ok';
      healthText.textContent = 'API connected — model ready';
    } else {
      healthDot.className = 'health-dot error';
      healthText.textContent = 'API connected — model not loaded';
    }
  } catch {
    healthDot.className = 'health-dot error';
    healthText.textContent = 'Cannot reach API on localhost:8000';
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

function validate() {
  let valid = true;

  Object.keys(FIELDS).forEach(key => {
    const el = document.getElementById(key);
    const group = document.getElementById(`group-${key}`);
    if (!el || !group) return;

    const val = el.value.trim();
    let ok = val !== '' && val !== null;

    if (ok && FIELDS[key].type === 'number') {
      const num = parseFloat(val);
      ok = !isNaN(num) && num >= FIELDS[key].min && num <= FIELDS[key].max;
    }

    group.classList.toggle('error', !ok);
    if (!ok) valid = false;
  });

  return valid;
}

// ── Show Error ────────────────────────────────────────────────────────────────

function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.classList.add('visible');
}

function clearError() {
  errorBanner.classList.remove('visible');
}

// ── Render Results ────────────────────────────────────────────────────────────

function renderResult(result) {
  const { prediction, probability_good_credit, probability_bad_credit, risk_level, approved, shap_contributions } = result;

  // Verdict badge
  verdictBadge.className = `verdict-badge ${approved ? 'approved' : 'declined'}`;
  verdictBadge.innerHTML = `
    <span class="verdict-icon">${approved ? '✓' : '✕'}</span>
    <span>${approved ? 'APPROVED' : 'DECLINED'}</span>
    <span class="verdict-sub">${prediction.replace('_', ' ')}</span>
  `;

  // Gauge
  const gaugeColor = approved
    ? (risk_level === 'low' ? '#22d98c' : '#f7b84f')
    : '#f75f5f';
  animateGauge(Math.round(probability_good_credit * 100), gaugeColor);

  // Risk pill
  riskPill.className = `risk-pill ${risk_level}`;
  const riskEmoji = { low: '🟢', medium: '🟡', high: '🔴' };
  riskPill.innerHTML = `<span class="risk-dot"></span>${riskEmoji[risk_level] || ''} ${risk_level.toUpperCase()} RISK`;

  // Probability bars — animate with a tiny delay
  setTimeout(() => {
    goodBar.style.width = `${Math.round(probability_good_credit * 100)}%`;
    badBar.style.width  = `${Math.round(probability_bad_credit  * 100)}%`;
  }, 100);

  goodVal.textContent = `${(probability_good_credit * 100).toFixed(1)}%`;
  badVal.textContent  = `${(probability_bad_credit  * 100).toFixed(1)}%`;

  // Stats
  statPred.textContent = prediction.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  statRisk.textContent = risk_level.charAt(0).toUpperCase() + risk_level.slice(1);

  // SHAP contributions
  renderShap(shap_contributions || []);

  // Show result
  emptyState.classList.add('hidden');
  resultCont.classList.add('visible');
}

// ── SHAP Explanation Chart ───────────────────────────────────────────────────

function renderShap(contributions) {
  const container = document.getElementById('shapContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!contributions.length) {
    container.innerHTML = '<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px 0">No explanation data available</p>';
    return;
  }

  const maxAbs = Math.max(...contributions.map(c => Math.abs(c.value)));

  contributions.forEach((c, i) => {
    const pct = maxAbs > 0 ? (Math.abs(c.value) / maxAbs) * 100 : 0;
    const isPos = c.direction === 'positive';
    const color = isPos ? '#22d98c' : '#f75f5f';
    const sign  = isPos ? '+' : '−';

    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:10px;';
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px;">
        <span style="color:var(--text-secondary);font-weight:500">${c.label}</span>
        <span style="font-weight:700;color:${color};font-family:'Outfit',sans-serif">${sign}${Math.abs(c.value).toFixed(4)}</span>
      </div>
      <div style="height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;">
        <div class="shap-bar" data-width="${pct}" style="height:100%;width:0%;background:${color};border-radius:999px;transition:width ${0.5 + i * 0.08}s cubic-bezier(0.4,0,0.2,1);"></div>
      </div>
    `;
    container.appendChild(row);
  });

  requestAnimationFrame(() => {
    container.querySelectorAll('.shap-bar').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
  });
}

// ── Submit ────────────────────────────────────────────────────────────────────

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  if (!validate()) {
    showError('Please fill in all fields correctly before submitting.');
    return;
  }

  // Build payload
  const payload = {};
  Object.keys(FIELDS).forEach(key => {
    const el = document.getElementById(key);
    if (!el) return;
    const f = FIELDS[key];
    payload[key] = f.type === 'number' ? parseFloat(el.value) : el.value;
  });

  // Loading state
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtn.querySelector('.btn-text').textContent = 'Analyzing…';

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.error || `Server returned ${res.status}`);
    }

    renderResult(json.result);
    saveToHistory(json.result, payload);
  } catch (err) {
    showError(err.message || 'Failed to reach the prediction API. Is Flask running on port 8000?');
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('.btn-text').textContent = 'Run Credit Assessment';
  }
});

// ── Sample fill button ────────────────────────────────────────────────────────

document.getElementById('fillSample').addEventListener('click', () => {
  const sample = {
    checking_account: '0_to_200',
    duration_months:  24,
    credit_history:   'existing_paid',
    purpose:          'car',
    credit_amount:    5000,
    savings_account:  '100_to_500',
    employment_since: '1_to_4yr',
    installment_rate: 3,
    personal_status:  'male_single',
    other_debtors:    'none',
    residence_since:  2,
    property:         'real_estate',
    age_years:        30,
    other_installments: 'none',
    housing:          'own',
    existing_credits: 1,
    job:              'skilled',
    num_dependents:   1,
    telephone:        'none',
    foreign_worker:   'yes',
  };

  Object.entries(sample).forEach(([key, val]) => {
    const el = document.getElementById(key);
    if (el) el.value = val;
    const group = document.getElementById(`group-${key}`);
    if (group) group.classList.remove('error');
  });

  clearError();
  updateProgress();
});

// ── Reset button ──────────────────────────────────────────────────────────────

document.getElementById('resetBtn').addEventListener('click', () => {
  form.reset();
  clearError();
  document.querySelectorAll('.field-group.error').forEach(g => g.classList.remove('error'));
  resultCont.classList.remove('visible');
  emptyState.classList.remove('hidden');
  goodBar.style.width = '0%';
  badBar.style.width  = '0%';
  currentGaugeVal = 0;
  drawGauge(0, '#9b59f5');
  gaugePct.textContent = '0%';
  updateProgress();
});

// ── Init ──────────────────────────────────────────────────────────────────────

buildForm();
drawGauge(0, '#9b59f5');
checkHealth();
updateProgress();
loadHistory();

// Live progress update on any field change
document.getElementById('formBody').addEventListener('input', updateProgress);
document.getElementById('formBody').addEventListener('change', updateProgress);

// ── Prediction History (localStorage) ──────────────────────────────────────────

const HISTORY_KEY = 'creditRiskHistory';
const MAX_HISTORY = 20;

function saveToHistory(result, payload) {
  const history = getHistory();
  const entry = {
    id:          Date.now(),
    timestamp:   new Date().toISOString(),
    approved:    result.approved,
    prediction:  result.prediction,
    risk_level:  result.risk_level,
    prob_good:   result.probability_good_credit,
    // snapshot key fields for display
    age:         payload.age_years,
    amount:      payload.credit_amount,
    duration:    payload.duration_months,
    purpose:     payload.purpose,
  };
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  addHistoryRow(entry, true);
  updateHistoryVisibility();
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function loadHistory() {
  const history = getHistory();
  const tbody = document.getElementById('historyBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  history.forEach(entry => addHistoryRow(entry, false));
  updateHistoryVisibility();
}

function updateHistoryVisibility() {
  const history = getHistory();
  const emptyMsg = document.getElementById('historyEmpty');
  const table    = document.getElementById('historyTable');
  if (!emptyMsg || !table) return;
  if (history.length === 0) {
    emptyMsg.style.display = 'block';
    table.style.display    = 'none';
  } else {
    emptyMsg.style.display = 'none';
    table.style.display    = 'table';
  }
}

function addHistoryRow(entry, prepend) {
  const tbody = document.getElementById('historyBody');
  if (!tbody) return;
  const d     = new Date(entry.timestamp);
  const time  = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date  = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const verdictColor = entry.approved ? '#22d98c' : '#f75f5f';
  const riskColor    = { low: '#22d98c', medium: '#f7b84f', high: '#f75f5f' }[entry.risk_level] || '#8b9cc8';

  const tr = document.createElement('tr');
  tr.style.animation = prepend ? 'fadeInUp 0.35s ease both' : 'none';
  tr.innerHTML = `
    <td style="color:var(--text-muted);white-space:nowrap;">${date}<br><span style="font-size:10px">${time}</span></td>
    <td style="font-weight:700;color:${verdictColor}">${entry.approved ? '✓ Approved' : '✕ Declined'}</td>
    <td><span style="background:${riskColor}22;color:${riskColor};border:1px solid ${riskColor}44;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600">${entry.risk_level.toUpperCase()}</span></td>
    <td style="color:var(--text-primary)">${(entry.prob_good * 100).toFixed(1)}%</td>
    <td style="color:var(--text-secondary)">₹${(entry.amount||0).toLocaleString()}</td>
    <td style="color:var(--text-secondary)">${entry.duration||'—'}mo</td>
    <td style="color:var(--text-secondary);text-transform:capitalize">${(entry.purpose||'—').replace('_',' ')}</td>
  `;

  if (prepend && tbody.firstChild) {
    tbody.insertBefore(tr, tbody.firstChild);
  } else {
    tbody.appendChild(tr);
  }
}

document.getElementById('clearHistory')?.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  const tbody = document.getElementById('historyBody');
  if (tbody) tbody.innerHTML = '';
  updateHistoryVisibility();
});
