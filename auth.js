/* ===== AUTH.JS =====
   - Pure IIFE, zero global variable pollution
   - Uses addEventListener('load') NOT window.onload= so it never
     conflicts with script.js's window.onload assignment
   - Auth redirect happens AFTER window load so stars/cursor init first
   ================== */
(function () {

    var UK = 'et_users';
    var SK = 'et_session';

    /* --- storage --- */
    function getUsers() {
        try { return JSON.parse(localStorage.getItem(UK)) || {}; } catch (e) { return {}; }
    }
    function saveUsers(u) { localStorage.setItem(UK, JSON.stringify(u)); }
    function getSession() {
        try { return JSON.parse(sessionStorage.getItem(SK)); } catch (e) { return null; }
    }
    function setSession(u) { sessionStorage.setItem(SK, JSON.stringify(u)); }
    function clearSession() { sessionStorage.removeItem(SK); }

    /* --- gmail validation --- */
    function validGmail(e) {
        return /^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test((e || '').trim());
    }

    /* --- password hash --- */
    function hashPw(pw) {
        var h = 5381;
        for (var i = 0; i < pw.length; i++) {
            h = ((h << 5) + h) ^ pw.charCodeAt(i);
            h = h >>> 0;
        }
        return 'h' + h.toString(36) + pw.length;
    }

    /* --- field errors --- */
    function setErr(id, msg) {
        var el = document.getElementById(id);
        if (el) el.textContent = msg;
    }
    function clearErrs() {
        ['loginEmailErr','loginPasswordErr','signupNameErr',
         'signupEmailErr','signupPasswordErr','signupConfirmErr']
        .forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = '';
        });
    }

    /* --- toast helper (works even before script.js loads) --- */
    function toast(msg, type) {
        if (typeof showToast === 'function') { showToast(msg, type, 2000); return; }
        var c = document.getElementById('toastContainer');
        if (!c) return;
        var t = document.createElement('div');
        t.className = 'toast ' + (type || 'info');
        t.innerHTML = '<span>' + msg + '</span>';
        c.appendChild(t);
        setTimeout(function () {
            t.classList.add('hiding');
            setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
        }, 2000);
    }

    /* --- navigate --- */
    function go(dest) {
        var server = location.protocol === 'http:' || location.protocol === 'https:';
        if (dest === 'dash') {
            window.location.href = server ? '/' : 'index.html';
        } else {
            window.location.href = server ? '/login.html' : 'login.html';
        }
    }

    /* =====================================================
       GLOBALS exposed for HTML onclick attributes
       ===================================================== */

    window.switchPanel = function (to) {
        var lp = document.getElementById('loginPanel');
        var sp = document.getElementById('signupPanel');
        if (!lp || !sp) return;
        clearErrs();
        if (to === 'signup') {
            lp.style.display = 'none';
            sp.style.display = 'block';
            sp.classList.add('panel-enter');
            setTimeout(function () { sp.classList.remove('panel-enter'); }, 400);
        } else {
            sp.style.display = 'none';
            lp.style.display = 'block';
            lp.classList.add('panel-enter');
            setTimeout(function () { lp.classList.remove('panel-enter'); }, 400);
        }
    };

    window.togglePw = function (id, btn) {
        var el = document.getElementById(id);
        if (!el) return;
        el.type = el.type === 'password' ? 'text' : 'password';
        btn.textContent = el.type === 'password' ? '👁' : '🙈';
    };

    window.checkPwStrength = function (pw) {
        var fill = document.getElementById('pwFill');
        var lbl  = document.getElementById('pwLabel');
        if (!fill || !lbl) return;
        if (!pw) {
            fill.className = 'pw-fill';
            fill.style.width = '0';
            lbl.textContent = '';
            lbl.className = 'pw-label';
            return;
        }
        var sc = (pw.length >= 8 ? 1 : 0)
               + (/[A-Z]/.test(pw) ? 1 : 0)
               + (/[0-9]/.test(pw) ? 1 : 0)
               + (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0);
        if (sc <= 1) {
            fill.className = 'pw-fill weak';   lbl.textContent = 'Weak';   lbl.className = 'pw-label weak';
        } else if (sc <= 2) {
            fill.className = 'pw-fill medium'; lbl.textContent = 'Medium'; lbl.className = 'pw-label medium';
        } else {
            fill.className = 'pw-fill strong'; lbl.textContent = 'Strong'; lbl.className = 'pw-label strong';
        }
    };

    window.handleLogin = function (e) {
        if (e) e.preventDefault();
        clearErrs();
        var emailEl = document.getElementById('loginEmail');
        var pwEl    = document.getElementById('loginPassword');
        var email   = emailEl ? emailEl.value.trim().toLowerCase() : '';
        var pw      = pwEl    ? pwEl.value : '';
        var ok = true;
        if (!email)           { setErr('loginEmailErr',    'Enter your Gmail address.'); ok = false; }
        else if (!validGmail(email)) { setErr('loginEmailErr', 'Must end with @gmail.com');  ok = false; }
        if (!pw)              { setErr('loginPasswordErr', 'Enter your password.');      ok = false; }
        if (!ok) return;
        var users = getUsers();
        if (!users[email])                    { setErr('loginEmailErr',    'No account found. Please sign up.'); return; }
        if (users[email].pw !== hashPw(pw))   { setErr('loginPasswordErr', 'Incorrect password.');              return; }
        setSession({ email: email, name: users[email].name });
        toast('Welcome back, ' + users[email].name + '! 👋', 'success');
        setTimeout(function () { go('dash'); }, 900);
    };

    window.handleSignup = function (e) {
        if (e) e.preventDefault();
        clearErrs();
        var nameEl    = document.getElementById('signupName');
        var emailEl   = document.getElementById('signupEmail');
        var pwEl      = document.getElementById('signupPassword');
        var confEl    = document.getElementById('signupConfirm');
        var name      = nameEl    ? nameEl.value.trim()            : '';
        var email     = emailEl   ? emailEl.value.trim().toLowerCase() : '';
        var pw        = pwEl      ? pwEl.value                     : '';
        var confirm   = confEl    ? confEl.value                   : '';
        var ok = true;
        if (name.length < 2)       { setErr('signupNameErr',     'Name must be at least 2 characters.'); ok = false; }
        if (!email)                { setErr('signupEmailErr',    'Enter your Gmail address.');           ok = false; }
        else if (!validGmail(email)) { setErr('signupEmailErr',  'Must end with @gmail.com');           ok = false; }
        if (pw.length < 8)         { setErr('signupPasswordErr', 'Password must be at least 8 chars.'); ok = false; }
        if (!confirm)              { setErr('signupConfirmErr',  'Please confirm your password.');      ok = false; }
        else if (confirm !== pw)   { setErr('signupConfirmErr',  'Passwords do not match.');            ok = false; }
        if (!ok) return;
        var users = getUsers();
        if (users[email]) { setErr('signupEmailErr', 'Email already registered. Sign in instead.'); return; }
        users[email] = { name: name, email: email, pw: hashPw(pw), created: Date.now() };
        saveUsers(users);
        setSession({ email: email, name: name });
        toast('Account created! Welcome, ' + name + '! 🎉', 'success');
        setTimeout(function () { go('dash'); }, 900);
    };

    window.authLogout = function () {
        clearSession();
        go('login');
    };

    /* =====================================================
       PAGE INIT — runs on window load, AFTER script.js onload
       Uses addEventListener so it never overwrites script.js's
       window.onload = () => { ... } assignment
       ===================================================== */
    window.addEventListener('load', function () {
        /* Use rAF so stars + cursor always render one frame before any redirect */
        requestAnimationFrame(function () {
        var session = getSession();
        var onLoginPage = !!document.getElementById('loginPanel');

        if (onLoginPage) {
            /* Already logged in → skip straight to dashboard */
            if (session) { setTimeout(function(){ go('dash'); }, 0); }
            return;
        }

        /* Dashboard / monthly — must be logged in */
        if (!session) {
            go('login');
            return;
        }

        /* Populate user badge */
        var badge = document.getElementById('userBadge');
        if (badge) {
            var safeName  = (session.name  || 'User').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var safeEmail = (session.email || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            badge.innerHTML = '👤 <strong>' + safeName + '</strong>'
                + ' <span style="opacity:0.5;font-size:0.78em">(' + safeEmail + ')</span>';
        }

        /* Populate welcome line */
        var wl = document.getElementById('welcomeLine');
        if (wl && session.name) {
            var hr     = new Date().getHours();
            var greet  = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
            var first  = session.name.split(' ')[0];
            wl.textContent = greet + ', ' + first + '! 👋';
            wl.style.opacity = '1';
        }
        }); /* end rAF */
    });

})();
