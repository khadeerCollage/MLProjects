// ===== NEXUS AI - Main Application =====


// State
const state = { taskType: 'analysis', history: [], kpis: { tasks: 0, risks: 0, time: 0, decisions: 0 } };

// DOM refs
const $ = id => document.getElementById(id);

// ===== NAVIGATION =====
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    $('view-' + tab.dataset.view).classList.add('active');
  });
});

// ===== TASK TYPE SELECTOR =====
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.taskType = btn.dataset.type;
  });
});

// ===== CHARACTER COUNT =====
$('mission-input').addEventListener('input', e => {
  $('char-count').textContent = e.target.value.length + ' chars';
});

// ===== FILE UPLOAD =====
$('btn-upload').addEventListener('click', () => $('file-upload').click());
$('file-upload').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { $('mission-input').value = ev.target.result; $('char-count').textContent = ev.target.result.length + ' chars'; showToast('File loaded: ' + file.name, 'success'); };
  reader.readAsText(file);
});

// ===== SAMPLE DATA =====
$('btn-sample').addEventListener('click', () => {
  if (typeof SampleData === 'undefined') { showToast('Engine loading, try again...', 'error'); return; }
  $('mission-input').value = SampleData[state.taskType];
  $('char-count').textContent = SampleData[state.taskType].length + ' chars';
  showToast('Sample data loaded for ' + state.taskType, 'success');
});

// ===== EXECUTE AGENT =====
$('btn-execute').addEventListener('click', async () => {
  const input = $('mission-input').value.trim();
  if (!input) { showToast('Please provide input data', 'error'); return; }

  setAgentStatus('working', 'Analyzing with Gemini...');
  $('btn-execute').disabled = true;
  $('output-area').innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';

  let result;
  try {
    const res = await fetch('http://localhost:8000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, type: state.taskType })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'API Error');
    }
    result = await res.json();
  } catch (err) {
    showToast(err.message || 'Make sure FastAPI backend is running', 'error');
    setAgentStatus('error', 'Error');
    $('btn-execute').disabled = false;
    $('output-area').innerHTML = '<div class="empty-state"><h3>Backend Error</h3><p>Could not connect to the real LLM. Make sure FastAPI is running on port 8000.</p></div>';
    return;
  }

  await renderOutput(result);
  
  $('btn-execute').disabled = false;
  $('output-actions').style.display = 'flex';
  setAgentStatus('done', 'Complete');
  
  state.kpis.tasks++;
  state.kpis.time += Math.floor(Math.random() * 15) + 10;
  if (result.risks) state.kpis.risks += result.risks.length;
  if (result.type === 'decision') state.kpis.decisions++;
  updateDashboard(result);
  state.history.push({ type: state.taskType, time: new Date().toLocaleTimeString(), title: input.substring(0, 50) + '...' });
  setTimeout(() => setAgentStatus('idle', 'Idle'), 3000);
});

// ===== RENDER OUTPUT =====
async function renderOutput(result) {
  const area = $('output-area');
  area.innerHTML = '';

  if (result.type === 'analysis') {
    await addSection(area, '📋 Executive Summary', `<p>${result.summary}</p>`, 200);
    
    let findingsHtml = '<ul>';
    result.findings.forEach(f => {
      const icon = f.impact === 'negative' ? '🔴' : f.impact === 'positive' ? '🟢' : '🔵';
      findingsHtml += `<li>${icon} ${f.text}</li>`;
    });
    findingsHtml += '</ul>';
    await addSection(area, '🔍 Key Findings', findingsHtml, 200);
    
    let risksHtml = '<ul>';
    result.risks.forEach(r => {
      risksHtml += `<li><span class="badge badge-${r.severity.toLowerCase()}">${r.severity}</span> ${r.text}</li>`;
    });
    risksHtml += '</ul>';
    await addSection(area, '⚠️ Risks', risksHtml, 200);
    
    let actionsHtml = '<ol>';
    result.actions.forEach(a => {
      actionsHtml += `<li><strong>${a.text}</strong><br><span style="color:var(--text-dim);font-size:0.8rem;">Owner: ${a.owner} | Deadline: ${a.deadline} | <span class="badge badge-${a.priority.toLowerCase()}">${a.priority}</span></span></li>`;
    });
    actionsHtml += '</ol>';
    await addSection(area, '✅ Recommended Actions', actionsHtml, 200);
  }
  
  else if (result.type === 'communication') {
    await addSection(area, '✉️ Draft Communication', `<pre style="white-space:pre-wrap;font-family:var(--font);font-size:0.88rem;line-height:1.7;">${escHtml(result.draft)}</pre>`, 200);
    await addSection(area, '🎨 Tone Used', `<p><strong>${result.tone}</strong></p><p style="color:var(--text-dim);margin-top:4px;">${result.toneReason}</p>`, 200);
    await addSection(area, '🔄 Alternative Version (' + result.altTone + ')', `<pre style="white-space:pre-wrap;font-family:var(--font);font-size:0.88rem;line-height:1.7;">${escHtml(result.altDraft)}</pre>`, 200);
  }
  
  else if (result.type === 'decision') {
    let optionsHtml = '';
    result.options.forEach((o, i) => {
      optionsHtml += `<div style="margin-bottom:12px;padding:12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border);">`;
      optionsHtml += `<strong style="color:var(--primary);">${o.label}</strong>`;
      optionsHtml += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">`;
      optionsHtml += `<div><span style="color:var(--success);font-size:0.8rem;font-weight:600;">PROS</span><ul>${o.pros.map(p => '<li>' + p + '</li>').join('')}</ul></div>`;
      optionsHtml += `<div><span style="color:var(--danger);font-size:0.8rem;font-weight:600;">CONS</span><ul>${o.cons.map(c => '<li>' + c + '</li>').join('')}</ul></div>`;
      optionsHtml += `</div></div>`;
    });
    await addSection(area, '📊 Options Analysis', optionsHtml, 200);
    await addSection(area, '🏆 Recommendation', `<p style="font-size:1rem;font-weight:600;color:var(--success);">${result.recommendation}</p>`, 200);
    await addSection(area, '💡 Rationale', `<p>${result.rationale}</p>`, 200);
    await addSection(area, '➡️ Next Step', `<p>${result.nextStep}</p>`, 200);
  }
}

async function addSection(parent, title, body, delay) {
  await sleep(delay);
  const section = document.createElement('div');
  section.className = 'output-section';
  section.innerHTML = `<div class="output-section-header">${title}</div><div class="output-section-body">${body}</div>`;
  parent.appendChild(section);
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== WORKFLOW ENGINE =====
$('btn-run-workflow').addEventListener('click', async () => {
  const goal = $('workflow-goal').value.trim();
  if (!goal) { showToast('Please enter a business goal', 'error'); return; }

  let workflowData;
  const log = $('execution-log');
  const tracker = $('progress-tracker');

  try {
    setAgentStatus('working', 'Planning Workflow with Gemini...');
    $('btn-run-workflow').disabled = true;
    log.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    tracker.style.display = 'none';
    
    const res = await fetch('http://localhost:8000/api/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: goal })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'API Error');
    }
    workflowData = await res.json();
  } catch (err) {
    showToast(err.message || 'Make sure FastAPI backend is running', 'error');
    setAgentStatus('error', 'Error');
    $('btn-run-workflow').disabled = false;
    log.innerHTML = '<div class="empty-state"><h3>Backend Error</h3><p>Could not connect to the real LLM workflow engine. Make sure FastAPI is running on port 8000.</p></div>';
    return;
  }

  const steps = workflowData.steps;
  log.innerHTML = '';
  tracker.style.display = 'flex';
  setAgentStatus('working', 'Executing Workflow...');

  // Planning phase
  let planHtml = '<div class="log-entry planning"><div class="log-step">PLANNING PHASE</div><div class="log-action">Gemini decomposed goal into actionable steps:</div><ol style="margin:8px 0 0 20px;color:var(--text-dim);font-size:0.82rem;">';
  steps.forEach((s, i) => { planHtml += `<li style="margin:4px 0;">${s.action}</li>`; });
  planHtml += '</ol></div>';
  log.innerHTML = planHtml;
  await sleep(1500);

  // Execute each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const pct = ((i + 1) / steps.length * 100);
    $('progress-fill').style.width = pct + '%';
    $('progress-text').textContent = `${i + 1} / ${steps.length} steps`;

    // Highlight active tool
    document.querySelectorAll('.tool-card').forEach(tc => tc.classList.remove('active-tool'));
    const toolCard = document.querySelector(`.tool-card[data-tool="${step.tool}"]`);
    if (toolCard) toolCard.classList.add('active-tool');

    const entry = document.createElement('div');
    entry.className = 'log-entry executing';
    entry.innerHTML = `
      <div class="log-step">[STEP ${i + 1}] — ${step.action}</div>
      <div class="log-tool">[TOOL] ${step.tool}("${step.toolInput}")</div>
      <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
    `;
    log.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    await sleep(1500 + Math.random() * 1000);

    entry.className = 'log-entry complete';
    entry.innerHTML = `
      <div class="log-step">[STEP ${i + 1}] — ${step.action}</div>
      <div class="log-tool">[TOOL] ${step.tool}("${step.toolInput}")</div>
      <div class="log-result">[RESULT] ${step.result}</div>
      ${i < steps.length - 1 ? `<div class="log-next">[NEXT] ${steps[i + 1].action}</div>` : ''}
    `;
  }

  // Final output
  document.querySelectorAll('.tool-card').forEach(tc => tc.classList.remove('active-tool'));
  await sleep(800);

  const finalEl = document.createElement('div');
  finalEl.className = 'final-output';
  finalEl.innerHTML = `<h3>✅ FINAL OUTPUT</h3><div class="final-output-content">${escHtml(workflowData.finalOutput)}</div>`;
  log.appendChild(finalEl);
  finalEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Steps summary
  const summaryEl = document.createElement('div');
  summaryEl.className = 'log-entry complete';
  summaryEl.innerHTML = `<div class="log-step">[STEPS TAKEN] ${steps.length} steps completed successfully</div><div class="log-result">${steps.map((s, i) => `Step ${i + 1}: ${s.action} ✓`).join('\n')}</div>`;
  log.appendChild(summaryEl);

  $('btn-run-workflow').disabled = false;
  setAgentStatus('done', 'Workflow Complete');
  state.kpis.tasks += steps.length;
  state.kpis.time += steps.length * 3;
  state.history.push({ type: 'workflow', time: new Date().toLocaleTimeString(), title: goal.substring(0, 50) + '...' });
  updateKPIs();
  showToast('Workflow completed — ' + steps.length + ' steps executed', 'success');
  setTimeout(() => setAgentStatus('idle', 'Idle'), 3000);
});

// ===== DASHBOARD UPDATES =====
function updateDashboard(result) {
  updateKPIs();
  if (result && result.type === 'analysis') {
    // Action items
    const list = $('action-items-list');
    list.innerHTML = '';
    if (result.actions) {
      result.actions.forEach(a => {
        list.innerHTML += `<div class="action-item"><div class="action-item-priority"><span class="badge badge-${a.priority.toLowerCase()}">${a.priority}</span></div><div class="action-item-content"><div class="action-item-title">${a.text}</div><div class="action-item-meta">${a.owner} · ${a.deadline}</div></div></div>`;
      });
    }
    // Risk matrix
    const matrix = $('risk-matrix');
    matrix.innerHTML = '';
    if (result.risks) {
      result.risks.forEach(r => {
        matrix.innerHTML += `<div class="risk-item"><div class="risk-item-severity"><span class="badge badge-${r.severity.toLowerCase()}">${r.severity}</span></div><div class="risk-item-text">${r.text}</div></div>`;
      });
    }
  }
  // History
  updateHistory();
}

function updateKPIs() {
  $('kpi-tasks-val').textContent = state.kpis.tasks;
  $('kpi-risks-val').textContent = state.kpis.risks;
  $('kpi-time-val').innerHTML = state.kpis.time + '<small>min</small>';
  $('kpi-decisions-val').textContent = state.kpis.decisions;
}

function updateHistory() {
  const list = $('history-list');
  if (state.history.length === 0) return;
  list.innerHTML = '';
  [...state.history].reverse().forEach(h => {
    list.innerHTML += `<div class="history-item"><span class="history-type">${h.type}</span><span class="history-title">${escHtml(h.title)}</span><span class="history-time">${h.time}</span></div>`;
  });
}

// ===== COPY & DOWNLOAD =====
$('btn-copy').addEventListener('click', () => {
  const text = $('output-area').innerText;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard', 'success'));
});

$('btn-download').addEventListener('click', () => {
  const text = $('output-area').innerText;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nexus-ai-report-' + Date.now() + '.txt';
  a.click();
  showToast('Report downloaded', 'success');
});

// ===== UTILITIES =====
function setAgentStatus(status, text) {
  const dot = document.querySelector('.status-dot');
  const txt = document.querySelector('.status-text');
  dot.className = 'status-dot ' + status;
  txt.textContent = text;
}

function showToast(msg, type) {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || '');
  toast.innerHTML = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
