/* ===== STATE ===== */
let currentType = 'expense';
let myChart = null;
const API_BASE = '/api';

/* ===== CUSTOM CURSOR ===== */
function initCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    let mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
    });

    function animRing() {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animRing);
    }
    animRing();

    document.addEventListener('mousedown', () => {
        dot.style.transform = 'translate(-50%,-50%) scale(2)';
        ring.style.transform = 'translate(-50%,-50%) scale(0.6)';
    });
    document.addEventListener('mouseup', () => {
        dot.style.transform = 'translate(-50%,-50%) scale(1)';
        ring.style.transform = 'translate(-50%,-50%) scale(1)';
    });

    document.addEventListener('mouseover', e => {
        if (e.target.matches('button, a, input, select, .delete, .reset-icon')) {
            ring.style.transform = 'translate(-50%,-50%) scale(1.8)';
            ring.style.borderColor = 'rgba(0,212,255,0.8)';
        }
    });
    document.addEventListener('mouseout', e => {
        if (e.target.matches('button, a, input, select, .delete, .reset-icon')) {
            ring.style.transform = 'translate(-50%,-50%) scale(1)';
            ring.style.borderColor = 'rgba(0,212,255,0.5)';
        }
    });
}

/* ===== STARS ===== */
function createStars() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function getSize() {
        return {
            w: window.innerWidth,
            h: Math.max(window.innerHeight, document.documentElement.scrollHeight)
        };
    }

    let { w: W, h: H } = getSize();
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    function makeStar() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.4 + 0.3,
            speed: Math.random() * 0.012 + 0.003,
            opacity: Math.random() * 0.6 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinkleDir: Math.random() > 0.5 ? 1 : -1
        };
    }

    const stars = Array.from({ length: 200 }, makeStar);

    // On resize: fully redistribute stars across new dimensions
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const s = getSize();
            W = s.w; H = s.h;
            canvas.width = W;
            canvas.height = H;
            // Redistribute all stars randomly in new viewport - no pileup
            stars.forEach((star, i) => {
                star.x = Math.random() * W;
                star.y = Math.random() * H;
            });
        }, 100);
    });

    function animate() {
        ctx.clearRect(0, 0, W, H);
        stars.forEach(s => {
            s.opacity += s.twinkleSpeed * s.twinkleDir;
            if (s.opacity > 0.9 || s.opacity < 0.1) s.twinkleDir *= -1;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
            ctx.fill();
            s.y += s.speed;
            if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
        });
        requestAnimationFrame(animate);
    }
    animate();
}

/* ===== TOAST ===== */
function showToast(msg, type = 'info', duration = 3000) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// FIX 3: Toast-based confirm replaces blocking browser confirm()
function showConfirm(msg, onConfirm) {
    const container = document.getElementById('toastContainer');
    if (!container) { if (confirm(msg)) onConfirm(); return; }
    const toast = document.createElement('div');
    toast.className = 'toast warning';
    toast.style.cssText = 'flex-direction:column;align-items:flex-start;gap:10px;';
    toast.innerHTML = `
        <span style="display:flex;gap:8px;align-items:center;">⚠️ <span>${msg}</span></span>
        <div style="display:flex;gap:8px;width:100%;">
            <button id="confirmYes" style="flex:1;padding:7px;border-radius:8px;border:none;
                background:rgba(239,68,68,0.85);color:white;font-weight:700;cursor:pointer;
                font-family:'Space Grotesk',sans-serif;font-size:0.82rem;">Yes, delete</button>
            <button id="confirmNo" style="flex:1;padding:7px;border-radius:8px;
                border:1px solid rgba(255,255,255,0.15);background:transparent;color:#ccc;
                font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-size:0.82rem;">Cancel</button>
        </div>`;
    container.appendChild(toast);
    const remove = () => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); };
    toast.querySelector('#confirmYes').addEventListener('click', () => { remove(); onConfirm(); });
    toast.querySelector('#confirmNo').addEventListener('click', remove);
}

/* ===== RIPPLE ===== */
function addRipple(btn, clientX, clientY) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;
        left:${clientX - rect.left - size/2}px;top:${clientY - rect.top - size/2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
}

/* ===== PARTICLE BURST ===== */
function burst(x, y, color = '#00d4ff') {
    for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = (i / 10) * 360;
        const dist = 40 + Math.random() * 40;
        p.style.cssText = `left:${x}px;top:${y}px;background:${color};
            --tx:${Math.cos(angle*Math.PI/180)*dist}px;--ty:${Math.sin(angle*Math.PI/180)*dist}px;`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

/* ===== SECTION NAVIGATION ===== */
function scrollTo(id, linkEl) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80; // account for sticky section nav
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    if (linkEl) setActiveSnav(linkEl);
    return false;
}

function setActiveSnav(el) {
    if (!el) return;
    document.querySelectorAll('.snav-item, .bottom-nav a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
}

// Highlight section nav on scroll
window.addEventListener('scroll', function () {
    const sections = ['sec-summary','sec-add','sec-transactions','sec-chart'];
    const offset = 120;
    let current = sections[0];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
    });
    document.querySelectorAll('.snav-item').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
}, { passive: true });

/* ===== MONTHLY FILTER ===== */
function applyFilter() {
    const from = document.getElementById('filterFrom')?.value;
    const to   = document.getElementById('filterTo')?.value;
    const type = document.getElementById('filterType')?.value || 'all';

    if (!from && !to && type === 'all') {
        showToast('Please set at least one filter', 'info');
        return;
    }
    renderMonthly(from || null, to || null, type);
}

function clearFilter() {
    const from = document.getElementById('filterFrom');
    const to   = document.getElementById('filterTo');
    const type = document.getElementById('filterType');
    if (from) from.value = '';
    if (to)   to.value   = '';
    if (type) type.value = 'all';
    const summary = document.getElementById('filterSummary');
    if (summary) summary.style.display = 'none';
    renderMonthly(null, null, 'all');
}

/* ===== API ===== */
async function fetchTransactions() {
    try {
        const res = await fetch(`${API_BASE}/transactions`);
        if (!res.ok) throw new Error();
        return await res.json();
    } catch { return []; }
}

async function fetchSummary() {
    try {
        const res = await fetch(`${API_BASE}/summary`);
        if (!res.ok) throw new Error();
        return await res.json();
    } catch { return { total_expense: 0, category_breakdown: {} }; }
}

/* ===== TYPE TOGGLE ===== */
function setType(type) {
    currentType = type;
    const expBtn = document.getElementById('btn-expense');
    const incBtn = document.getElementById('btn-income');
    if (!expBtn || !incBtn) return;
    expBtn.className = 'type-btn' + (type === 'expense' ? ' active-expense' : '');
    incBtn.className = 'type-btn' + (type === 'income' ? ' active-income' : '');
}

/* ===== ADD TRANSACTION ===== */
// FIX 4: Pass event directly from onclick, no window.event (deprecated & Firefox broken)
async function addTransaction(e) {
    const btn = document.getElementById('submitBtn');
    if (btn && e) addRipple(btn, e.clientX, e.clientY);

    const name = document.getElementById('name')?.value.trim();
    const amountStr = document.getElementById('amount')?.value;
    const date = document.getElementById('date')?.value;
    const category = document.getElementById('category')?.value;

    if (!name || !amountStr || !date || !category) {
        showToast('Please fill in all fields', 'error');
        shakeCard();
        return;
    }
    // Validate date format (YYYY-MM-DD required by backend)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        showToast('Please select a valid date', 'error');
        return;
    }
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        showToast('Enter a valid positive amount', 'error');
        return;
    }

    if (btn) { btn.textContent = 'Adding…'; btn.classList.add('loading'); }

    try {
        const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, amount, date, category, type: currentType })
        });

        if (res.ok) {
            const bRect = btn?.getBoundingClientRect();
            if (bRect) burst(bRect.left + bRect.width/2, bRect.top + bRect.height/2,
                currentType === 'income' ? '#10b981' : '#00d4ff');
            showToast(`${currentType === 'income' ? 'Income' : 'Expense'} added! ₹${amount.toFixed(2)}`, 'success');
            // Track this session's transactions so they can be removed on exit
            const result = await res.clone().json().catch(()=>null) || await res.json().catch(()=>({id:null}));
            if (result && result.id) {
                const sessionIds = JSON.parse(sessionStorage.getItem('et_session_txns') || '[]');
                sessionIds.push(result.id);
                sessionStorage.setItem('et_session_txns', JSON.stringify(sessionIds));
            }
            document.getElementById('name').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            await loadAllData();
        } else {
            showToast('Failed to add transaction', 'error');
        }
    } catch {
        showToast('Cannot connect to server. Is Flask running?', 'error');
    } finally {
        if (btn) { btn.textContent = 'Add Transaction'; btn.classList.remove('loading'); }
    }
}

function shakeCard() {
    const card = document.getElementById('submitBtn')?.closest('.card');
    if (!card) return;
    card.style.transition = 'transform 0.08s ease';
    [-8, 8, -5, 5, 0].forEach((x, i) =>
        setTimeout(() => { card.style.transform = `translateX(${x}px)`; }, i * 80)
    );
    setTimeout(() => { card.style.transition = ''; }, 500);
}

/* ===== DELETE ===== */
async function deleteTransaction(id, el) {
    showConfirm('Delete this transaction?', async () => {
        const txn = el?.closest('.transaction');
        if (txn) { txn.style.transition = 'all 0.3s ease'; txn.style.opacity = '0'; txn.style.transform = 'translateX(40px)'; }
        try {
            await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
            showToast('Transaction deleted', 'info');
            setTimeout(() => loadAllData(), 300);
        } catch {
            showToast('Delete failed', 'error');
            if (txn) { txn.style.opacity = '1'; txn.style.transform = ''; }
        }
    });
}

/* ===== RESET ===== */
async function resetData() {
    showConfirm('Reset ALL data? This cannot be undone!', async () => {
        try {
            const transactions = await fetchTransactions();
            await Promise.all(transactions.map(t =>
                fetch(`${API_BASE}/transactions/${t.id}`, { method: 'DELETE' })
            ));
            showToast('All data cleared', 'info');
            // Reset chart wrap back to canvas in case it was replaced by empty state
            const wrap = document.querySelector('.chart-wrap');
            if (wrap && !document.getElementById('chart')) {
                wrap.innerHTML = '<canvas id="chart"></canvas>';
            }
            await loadAllData();
        } catch { showToast('Reset failed', 'error'); }
    });
}

/* ===== ANIMATED COUNTER ===== */
function animateCount(el, target) {
    if (!el) return;
    const start = parseFloat(el.textContent.replace(/,/g, '')) || 0;
    const diff = target - start;
    const startTime = performance.now();
    function step(now) {
        const t = Math.min((now - startTime) / 600, 1);
        el.textContent = (start + diff * (1 - Math.pow(1 - t, 3))).toFixed(2);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(2);
    }
    requestAnimationFrame(step);
}

/* ===== HELPERS ===== */
function getCatBadge(cat) {
    const icons = { Food: '🍛', Travel: '✈️', Bills: '💡', Shopping: '🛍️', Others: '📦' };
    return `<span class="cat-badge">${icons[cat] || '•'} ${cat}</span>`;
}

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ===== LOAD ALL DATA ===== */
async function loadAllData() {
    const [transactions, summary] = await Promise.all([fetchTransactions(), fetchSummary()]);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    animateCount(document.getElementById('expenseNum'), summary.total_expense);
    animateCount(document.getElementById('incomeNum'), totalIncome);

    const listEl = document.getElementById('list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (transactions.length === 0) {
        listEl.innerHTML = `<div class="empty-state">
            <div class="empty-icon">💸</div>
            <p>No transactions yet.</p>
            <small style="color:var(--text-secondary);font-size:0.8rem;">Add one above to get started!</small>
        </div>`;
        updateChart({});
        return;
    }

    transactions.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = `transaction type-${t.type}`;
        div.style.animationDelay = `${i * 0.04}s`;
        div.innerHTML = `
            <div class="txn-left">
                <span class="txn-name">${escHtml(t.name)}</span>
                <span class="txn-meta">${getCatBadge(t.category)}<span>${t.date}</span></span>
            </div>
            <div class="txn-right">
                <span class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '−'}₹${t.amount.toFixed(2)}</span>
                <span class="delete" onclick="deleteTransaction(${t.id}, this)" title="Delete">×</span>
            </div>`;
        listEl.appendChild(div);
    });

    updateChart(summary.category_breakdown);
}

/* ===== CHART ===== */
function updateChart(categoryData) {
    // Recreate canvas if it was replaced by the empty-state div
    let wrap = document.querySelector('.chart-wrap');
    if (!wrap) return;
    if (!document.getElementById('chart')) {
        wrap.innerHTML = '<canvas id="chart"></canvas>';
    }
    const ctx = document.getElementById('chart');
    if (!ctx) return;
    if (myChart) { myChart.destroy(); myChart = null; }
    const keys = Object.keys(categoryData);
    const vals = Object.values(categoryData);

    if (keys.length === 0) {
        // Show clean empty state — no ghost ring
        const wrap = ctx.parentElement;
        wrap.innerHTML = `<div class="empty-state" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div class="empty-icon">📊</div>
            <p style="margin-top:8px;">No expense data yet.</p>
            <small style="color:var(--text-secondary);font-size:0.8rem;">Add an expense to see the breakdown.</small>
        </div>`;
        return;
    }

    const palette = ['#00d4ff','#7c3aed','#f59e0b','#10b981','#ec4899','#3b82f6','#ef4444'];
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: keys,
            datasets: [{
                data: vals,
                backgroundColor: palette.map(c => c + 'bb'),
                borderColor: palette.map(c => c + 'ff'),
                borderWidth: 3,
                hoverBackgroundColor: palette.map(c => c + 'ee'),
                hoverBorderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '62%',
            animation: { animateRotate: true, animateScale: true, duration: 800, easing: 'easeOutQuart' },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e8ff', padding: 20,
                        font: { family: 'Space Grotesk', weight: '600', size: 13 },
                        usePointStyle: true, pointStyle: 'circle',
                        boxWidth: 10
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(5,8,16,0.95)',
                    borderColor: 'rgba(0,212,255,0.4)', borderWidth: 1,
                    titleFont: { family: 'Syne', size: 14, weight: '700' },
                    bodyFont: { family: 'Space Grotesk', size: 13 },
                    padding: 12,
                    callbacks: { label: ctx => ` ₹${ctx.parsed.toFixed(2)}` }
                }
            }
        }
    });
}

/* ===== MONTHLY VIEW ===== */
async function renderMonthly(fromDate, toDate, typeFilter) {
    fromDate   = fromDate   || null;
    toDate     = toDate     || null;
    typeFilter = typeFilter || 'all';

    let transactions = await fetchTransactions();
    const container  = document.getElementById('monthlyList');
    if (!container) return;
    container.innerHTML = '';

    // Apply filters
    if (fromDate)          transactions = transactions.filter(t => t.date >= fromDate);
    if (toDate)            transactions = transactions.filter(t => t.date <= toDate);
    if (typeFilter !== 'all') transactions = transactions.filter(t => t.type === typeFilter);

    // Show filter summary bar
    const summaryEl = document.getElementById('filterSummary');
    if (summaryEl) {
        const isFiltered = fromDate || toDate || typeFilter !== 'all';
        if (isFiltered) {
            const totalExp = transactions.filter(t => t.type==='expense').reduce((s,t)=>s+t.amount,0);
            const totalInc = transactions.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0);
            summaryEl.style.display = 'flex';
            summaryEl.innerHTML =
                `<span>📌 Showing <strong>${transactions.length}</strong> transaction${transactions.length!==1?'s':''}</span>` +
                (fromDate||toDate ? `<span>📆 ${fromDate||'start'} → ${toDate||'today'}</span>` : '') +
                (totalExp > 0 ? `<span style="color:var(--expense)">−₹${totalExp.toFixed(2)}</span>` : '') +
                (totalInc > 0 ? `<span style="color:var(--income)">+₹${totalInc.toFixed(2)}</span>` : '');
        } else {
            summaryEl.style.display = 'none';
        }
    }

    const grouped = {};
    transactions.forEach(t => { if (!grouped[t.date]) grouped[t.date] = []; grouped[t.date].push(t); });

    const dates = Object.keys(grouped).sort().reverse();
    if (dates.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p>No transactions found.</p></div>`;
        return;
    }

    dates.forEach((date, gi) => {
        const txns = grouped[date];
        const expTotal = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const incTotal = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        let totalLabel = '';
        if (expTotal > 0) totalLabel += `<span style="color:var(--expense)">−₹${expTotal.toFixed(2)}</span>`;
        if (expTotal > 0 && incTotal > 0) totalLabel += `<span style="margin:0 5px;opacity:0.4">·</span>`;
        if (incTotal > 0) totalLabel += `<span style="color:var(--income)">+₹${incTotal.toFixed(2)}</span>`;

        const group = document.createElement('div');
        group.className = 'monthly-group';
        group.style.animationDelay = `${gi * 0.07}s`;

        let inner = `<div class="monthly-date-header">
            <h4>${formatDate(date)}</h4>
            <span class="date-total">${totalLabel}</span>
        </div>`;

        txns.forEach(t => {
            inner += `<div class="transaction type-${t.type}" style="margin-bottom:8px;">
                <div class="txn-left">
                    <span class="txn-name">${escHtml(t.name)}</span>
                    <span class="txn-meta">${getCatBadge(t.category)}
                        <span style="font-size:0.7rem;padding:1px 7px;border-radius:20px;font-weight:700;
                            background:${t.type==='income'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.12)'};
                            color:${t.type==='income'?'var(--income)':'var(--expense)'};">
                            ${t.type==='income'?'💰 Income':'💸 Expense'}
                        </span>
                    </span>
                </div>
                <span class="txn-amount ${t.type}" style="color:${t.type==='income'?'var(--income)':'var(--expense)'};">
                    ${t.type==='income'?'+':'−'}₹${t.amount.toFixed(2)}
                </span>
            </div>`;
        });

        group.innerHTML = inner;
        container.appendChild(group);
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ===== CLEAR SESSION TRANSACTIONS ON EXIT ===== */
window.addEventListener('beforeunload', function () {
    const ids = JSON.parse(sessionStorage.getItem('et_session_txns') || '[]');
    if (ids.length === 0) return;
    // Use sendBeacon for reliable fire-and-forget on page unload
    ids.forEach(id => {
        navigator.sendBeacon ? 
            navigator.sendBeacon(`${API_BASE}/transactions/${id}/delete`) :
            fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE', keepalive: true });
    });
    sessionStorage.removeItem('et_session_txns');
});

/* ===== INIT ===== */
window.onload = () => {
    initCursor();
    createStars();
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (document.getElementById('list')) loadAllData();
    if (document.getElementById('monthlyList')) renderMonthly(null, null, 'all');
};
