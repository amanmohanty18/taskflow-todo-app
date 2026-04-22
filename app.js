let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentFilter = 'all';

const taskList    = document.getElementById('task-list');
const taskInput   = document.getElementById('task-input');
const taskCount   = document.getElementById('task-count');
const progressBar = document.getElementById('progress-bar');
const progressPct = document.getElementById('progress-pct');

/* ── Custom Dropdown ─────────────────────────────────── */
let selectedPriority = 'normal';
const dropdown   = document.getElementById('priority-dropdown');
const trigger    = document.getElementById('select-trigger');
const selectLabel = document.getElementById('select-label');
const options    = document.querySelectorAll('.select-option');

trigger.addEventListener('click', e => {
  e.stopPropagation();
  dropdown.classList.toggle('open');
});

document.addEventListener('click', () => dropdown.classList.remove('open'));

options.forEach(opt => {
  opt.addEventListener('click', () => {
    selectedPriority = opt.dataset.value;
    selectLabel.textContent = opt.textContent.trim();
    options.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    dropdown.classList.remove('open');
  });
});

/* ── Persistence ─────────────────────────────────────── */
function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

/* ── Helpers ─────────────────────────────────────────── */
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getFiltered() {
  if (currentFilter === 'active')    return tasks.filter(t => !t.done);
  if (currentFilter === 'completed') return tasks.filter(t => t.done);
  return tasks;
}

function priorityLabel(p) {
  const map = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
  return map[p] || '';
}

/* ── Render ──────────────────────────────────────────── */
function render() {
  const filtered = getFiltered();
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    const msgs = {
      all:       ['✦', 'No tasks yet — add one above!'],
      active:    ['🎉', 'All tasks completed!'],
      completed: ['📋', 'No completed tasks yet.'],
    };
    const [icon, text] = msgs[currentFilter];
    taskList.innerHTML = `
      <li class="empty-state">
        <span class="empty-icon">${icon}</span>
        <p>${text}</p>
      </li>`;
  } else {
    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' completed' : '');
      li.dataset.id = task.id;
      li.innerHTML = `
        <input type="checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}" aria-label="Mark complete" />
        <div class="task-body">
          <span class="task-text">${escapeHtml(task.text)}</span>
          ${task.priority !== 'normal'
            ? `<span class="priority-badge badge-${task.priority}">${priorityLabel(task.priority)}</span>`
            : ''}
        </div>
        <button class="delete-btn" data-id="${task.id}" title="Delete task" aria-label="Delete task">✕</button>
      `;
      taskList.appendChild(li);
    });
  }

  updateStats();
}

function updateStats() {
  const total    = tasks.length;
  const done     = tasks.filter(t => t.done).length;
  const active   = total - done;
  const pct      = total === 0 ? 0 : Math.round((done / total) * 100);

  taskCount.textContent = `${active} task${active !== 1 ? 's' : ''} left`;
  progressBar.style.width = pct + '%';
  progressPct.textContent = pct + '%';
}

/* ── Add Task ────────────────────────────────────────── */
document.getElementById('task-form').addEventListener('submit', e => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.unshift({ id: Date.now(), text, done: false, priority: selectedPriority });
  save();
  render();
  taskInput.value = '';
  selectedPriority = 'normal';
  selectLabel.textContent = 'Normal';
  options.forEach(o => o.classList.remove('selected'));
  taskInput.focus();
});

/* ── Toggle / Delete ─────────────────────────────────── */
taskList.addEventListener('change', e => {
  if (e.target.type !== 'checkbox') return;
  const task = tasks.find(t => t.id === Number(e.target.dataset.id));
  if (task) { task.done = e.target.checked; save(); render(); }
});

taskList.addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.style.transition = 'opacity 0.2s, transform 0.2s';
    li.style.opacity = '0';
    li.style.transform = 'translateX(20px)';
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      save();
      render();
    }, 200);
  }
});

/* ── Filters ─────────────────────────────────────────── */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    render();
  });
});

/* ── Clear Completed ─────────────────────────────────── */
document.getElementById('clear-completed').addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done);
  save();
  render();
});

/* ── Dark / Light Mode ───────────────────────────────── */
const themeToggle = document.getElementById('theme-toggle');
const savedTheme  = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
}

/* ── Init ────────────────────────────────────────────── */
render();
