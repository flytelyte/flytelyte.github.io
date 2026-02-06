
document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const terminalContainer = document.getElementById('terminal-container');
    const typer = document.getElementById('typer');
    const inputLine = document.getElementById('input-line');
    const langToggle = document.getElementById('lang-toggle');

    let isAdmin = false; // Admin state
    let currentInput = '';
    let currentLang = 'en'; // Default language
    let translations = {};
    let allProjects = [];

    // ASCII Art Logo
    const logo = `
   ___   _  __ ______  ____  ______   _____   ___    ___   ____  ______  __  __
  / _ | / |/ //_  __/ /  _/ / ____/  / ___/  / _ \\  / _ | / __/ /  _/ /_ \\/ /
 / __ |/    /  / /   _/ /  / / __   / / _   / , _/ / __ |/ _ \\ _/ /  / / / / 
/_/ |_/_/|_/  /_/   /___/ /_/ /_/  /_/ |_| /_/|_| /_/ |_/____//___/ /_/ /_/  
                                                                             
    `;

    // File System / Content
    let fileSystem = {};

    // Load Translations and Projects
    async function initSystem() {
        try {
            const [transRes, projRes] = await Promise.all([
                fetch('data/translations.json'),
                fetch('data/projects.json')
            ]);
            translations = await transRes.json();
            allProjects = await projRes.json();

            // Freeze data REMOVED to allow editing
            // allProjects.forEach(p => Object.freeze(p));
            // Object.freeze(allProjects);
            Object.freeze(translations);

            // Determine Language based on Filename (Static Authority)
            const path = window.location.pathname;
            const isJaPage = path.includes('_ja.html') || path.endsWith('/ja'); // Basic detection
            const isGenericPage = path.includes('editor.html') || path.includes('admin.html');

            const params = new URLSearchParams(window.location.search);
            const urlLang = params.get('lang');
            const storedLang = localStorage.getItem('guest_lang');

            if (isGenericPage) {
                // For Editor/Admin, checks params > storage > default
                if (urlLang && ['en', 'ja'].includes(urlLang)) {
                    currentLang = urlLang;
                } else if (storedLang && ['en', 'ja'].includes(storedLang)) {
                    currentLang = storedLang;
                } else {
                    currentLang = 'en';
                }
            } else {
                // For Static Pages (index.html, project.html), ENFORCE the language
                if (isJaPage) {
                    currentLang = 'ja';
                } else {
                    currentLang = 'en';
                }
            }

            // Sync LocalStorage with the Determined Language
            localStorage.setItem('guest_lang', currentLang);

            // Initialize Language State
            // setLanguage() will use this enforced currentLang to render dynamic content matches the file
            setLanguage(currentLang, false);

            // Determine Page Context
            const projectId = params.get('id');
            const isProjectPage = !!document.getElementById('p-title');
            const isEditorPage = !!document.getElementById('editor-form');

            if (isEditorPage) {
                initEditor();
            } else if (isProjectPage && projectId) {
                renderProjectPage(projectId);
            } else {
                // Initial Terminal Message only on Home/Terminal view
                if (output) {
                    await printLine("SOLO DEV TERMINAL V1.0 INITIALIZED.");
                    await printLine("TYPE 'help' FOR COMMANDS.");
                }
            }

        } catch (e) {
            console.error("System Failure: Initialization Failed", e);
            if (output) printLine("CRITICAL ERROR: SYSTEM INITIALIZATION FAILED.");
        }
    }

    // Initialize Editor
    function initEditor() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const lang = params.get('lang') || 'en';

        // Set Context
        const contextEl = document.getElementById('edit-context');
        if (contextEl) contextEl.innerText = `${id} [${lang.toUpperCase()}]`;

        const projectBox = allProjects.find(p => p.id === id);
        if (!projectBox) {
            alert("Project not found!");
            return;
        }

        // Get Data to Edit
        let dataToEdit = projectBox;
        if (lang === 'ja') {
            if (!projectBox.ja) projectBox.ja = {};
            dataToEdit = projectBox.ja;
        }

        // Localize UI if Japanese
        if (lang === 'ja') {
            const labels = {
                'lbl-title': 'プロジェクトID (TITLE)',
                'lbl-name': '表示名 (NAME)',
                'lbl-subtitle': 'サブタイトル (SUBTITLE)',
                'lbl-brief': '概要 (DESCRIPTION)',
                'lbl-demo': 'デモテキスト (DEMO TEXT)',
                'lbl-specs': '技術仕様 (TECHNICAL SPECS)',
                'btn-save': '変更を保存',
                'btn-view-page': 'ページを表示',
                'copy-json': 'JSONをコピー'
            };
            for (const [id, text] of Object.entries(labels)) {
                const el = document.getElementById(id);
                if (el) el.innerText = text;
            }
        }

        // Populate Form
        document.getElementById('title').value = dataToEdit.title || '';
        document.getElementById('name').value = dataToEdit.name || '';
        document.getElementById('subtitle').value = dataToEdit.subtitle || '';
        document.getElementById('brief').value = dataToEdit.brief || '';
        document.getElementById('demo_text').value = dataToEdit.demo_text || '';

        // Populate Specs
        renderEditorSpecs(dataToEdit.specs || []);

        // Setup Add Spec Button
        document.getElementById('btn-add-spec').onclick = () => {
            addEditorSpec();
        };

        // Setup Buttons
        const btnSwitch = document.getElementById('btn-switch-lang');
        const otherLang = lang === 'en' ? 'ja' : 'en';
        if (btnSwitch) {
            btnSwitch.innerText = lang === 'en' ? "EDIT JAPANESE VERSION" : "英語版を編集"; // Localized
            btnSwitch.onclick = () => {
                window.location.href = `editor.html?id=${id}&lang=${otherLang}`;
            };
        }

        const btnView = document.getElementById('btn-view-page');
        if (btnView) {
            const targetPage = lang === 'ja' ? 'project_ja.html' : 'project.html';
            btnView.onclick = () => {
                window.location.href = `${targetPage}?id=${id}`;
            };
        }

        // Handle Save
        const form = document.getElementById('editor-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProjectData(id, lang, projectBox);
        });

        // Handle JSON Copy
        document.getElementById('copy-json').addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify(allProjects, null, 4));
            alert("Full Projects JSON copied to clipboard.");
        });
    }

    function renderEditorSpecs(specs) {
        const container = document.getElementById('specs-container');
        if (!container) return;
        container.innerHTML = '';

        specs.forEach((spec, index) => {
            const row = document.createElement('div');
            row.className = 'spec-row';
            row.style.display = 'flex';
            row.style.gap = '10px';
            row.style.marginBottom = '10px';

            row.innerHTML = `
                <input type="text" class="spec-label" value="${spec.label}" placeholder="Label (e.g. Protocol)" style="flex: 1;">
                <input type="text" class="spec-value" value="${spec.value}" placeholder="Value (e.g. WSS)" style="flex: 1;">
                <button type="button" class="action-btn" onclick="removeEditorSpec(this)" style="border-color: #ff4444; color: #ff4444; padding: 0 10px;">X</button>
            `;
            container.appendChild(row);
        });
    }

    window.addEditorSpec = () => {
        const container = document.getElementById('specs-container');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'spec-row';
        row.style.display = 'flex';
        row.style.gap = '10px';
        row.style.marginBottom = '10px';

        row.innerHTML = `
            <input type="text" class="spec-label" placeholder="Label" style="flex: 1;">
            <input type="text" class="spec-value" placeholder="Value" style="flex: 1;">
            <button type="button" class="action-btn" onclick="removeEditorSpec(this)" style="border-color: #ff4444; color: #ff4444; padding: 0 10px;">X</button>
        `;
        container.appendChild(row);
    }

    window.removeEditorSpec = (btn) => {
        btn.parentElement.remove();
    }

    async function saveProjectData(id, lang, rootProject) {
        const now = new Date().toISOString();
        const statusEl = document.getElementById('save-status');

        // Update Timestamp (Only for the version being edited)
        if (lang === 'en') {
            rootProject.last_updated = now;
        } else {
            if (rootProject.ja) rootProject.ja.last_updated = now;
        }

        const titleVal = document.getElementById('title').value;
        const nameVal = document.getElementById('name').value;
        const subtitleVal = document.getElementById('subtitle').value;
        const briefVal = document.getElementById('brief').value;
        const demoVal = document.getElementById('demo_text').value;

        // Scrape Specs
        const specRows = document.querySelectorAll('.spec-row');
        const newSpecs = Array.from(specRows).map(row => ({
            label: row.querySelector('.spec-label').value,
            value: row.querySelector('.spec-value').value
        })).filter(s => s.label && s.value);

        const newData = {
            title: titleVal,
            name: nameVal,
            subtitle: subtitleVal,
            brief: briefVal,
            demo_text: demoVal,
            specs: newSpecs,
            last_updated: now
        };

        // Apply Update in Memory
        if (lang === 'en') {
            Object.assign(rootProject, newData);
        } else {
            if (!rootProject.ja) rootProject.ja = {};
            Object.assign(rootProject.ja, newData);
        }

        // Save to Server
        if (statusEl) statusEl.innerText = "SAVING...";

        try {
            const res = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allProjects)
            });
            const data = await res.json();

            if (data.success) {
                if (statusEl) statusEl.innerText = "SAVED";

                // Show Success Modal
                const modal = document.getElementById('success-modal');
                if (modal) {
                    const params = new URLSearchParams(window.location.search);
                    const currentId = params.get('id');
                    const currentLang = params.get('lang') || 'en';
                    const otherLang = currentLang === 'en' ? 'ja' : 'en';

                    // Localize Strings First
                    let msgText = "THE CHANGES SUCCEEDED";
                    let adminText = "OK, RETURN TO ADMIN PAGE";
                    let otherText = "EDIT OTHER VERSION";

                    if (currentLang === 'ja') {
                        msgText = "保存完了";
                        adminText = "管理画面に戻る (RETURN TO ADMIN)";
                        otherText = "他のバージョンを編集 (EDIT OTHER)";
                    }

                    // Apply to DOM (Unified Path)
                    const msgEl = document.getElementById('modal-msg');
                    const btnAdmin = document.getElementById('btn-modal-admin');
                    const btnOther = document.getElementById('btn-modal-other');

                    if (msgEl) msgEl.innerText = msgText;
                    if (btnAdmin) btnAdmin.innerText = adminText;
                    if (btnOther) btnOther.innerText = otherText;

                    // Setup Actions (Direct assignment overwrites previous listeners safely)
                    if (btnAdmin) {
                        btnAdmin.onclick = () => window.location.href = 'admin.html';
                    }
                    if (btnOther) {
                        btnOther.onclick = () => window.location.href = `editor.html?id=${currentId}&lang=${otherLang}`;
                    }

                    modal.style.display = 'flex';
                }
            } else {
                if (statusEl) statusEl.innerText = "ERROR: SAVE FAILED";
                alert("Save Failed: " + data.message);
            }
        } catch (e) {
            console.error("Save Error:", e);
            if (statusEl) statusEl.innerText = "CRITICAL ERROR";
            alert("Critical Error during save.");
        }
    }

    // Helper to safely get localized object
    function getLocalizedData(item, lang) {
        if (!item) return null;
        if (lang === 'ja' && item.ja) {
            return { ...item, ...item.ja };
        }
        return item;
    }

    // Inject UI elements dynamically - REMOVED FUNCTIONALITY
    // function injectGlobalUI() {} 

    // function toggleLanguage() {}

    // Language Switching Function
    function setLanguage(lang, updateURL = true) {
        currentLang = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('guest_lang', lang);

        // Update Static Text
        if (translations[lang]) {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (translations[lang][key]) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = translations[lang][key];
                    } else {
                        el.innerText = translations[lang][key];
                    }
                }
            });
        }

        // Update Toggle Button Text
        const btn = document.getElementById('lang-toggle');
        if (btn) {
            btn.innerText = lang === 'en' ? '[EN/JA]' : '[JP/EN]';
        }

        // Re-populate Projects Grid (Index Page)
        const grid = document.getElementById('projects-grid-container');
        if (grid) {
            renderProjectsGrid(lang);
        }

        // Re-populate Project Details (Project Page)
        const pTitle = document.getElementById('p-title');
        if (pTitle) {
            const params = new URLSearchParams(window.location.search);
            renderProjectPage(params.get('id'));
        }

        // Update Terminal File System
        updateFileSystem();

        // Update URL Logic
        if (updateURL) {
            const url = new URL(window.location);
            url.searchParams.set('lang', lang);
            window.history.replaceState({}, '', url);

            // Update links to preserve language
            document.querySelectorAll('a').forEach(a => {
                if (a.href && !a.href.startsWith('#') && !a.href.includes('mailto')) {
                    try {
                        const linkUrl = new URL(a.href, window.location.origin);
                        if (linkUrl.origin === window.location.origin) {
                            linkUrl.searchParams.set('lang', lang);
                            a.href = linkUrl.toString();
                        }
                    } catch (e) { }
                }
            });
        }
    }

    function renderProjectsGrid(lang) {
        const grid = document.getElementById('projects-grid-container');
        grid.innerHTML = allProjects.map(p => {
            const pData = getLocalizedData(p, lang);
            return `
            <article class="project-card">
                <h3>${pData.title}</h3>
                <p>${pData.subtitle}</p>
                <p class="card-brief">${pData.brief.substring(0, 100)}...</p>
                <a href="project.html?id=${p.id}&lang=${lang}" class="read-more">${translations[lang]['read_more']}</a>
            </article>
            `;
        }).join('');
    }

    function renderProjectPage(projectId) {
        if (!projectId) return;
        const projectBox = allProjects.find(p => p.id === projectId);
        const t = translations[currentLang];

        if (projectBox) {
            const project = getLocalizedData(projectBox, currentLang);

            document.title = `${project.name} | Solo Developer Yuki`;
            const titleEl = document.getElementById('p-title');
            if (titleEl) titleEl.innerText = `${project.title}: ${project.name}`;

            const subEl = document.getElementById('p-subtitle');
            if (subEl) subEl.innerText = project.subtitle;

            const briefEl = document.getElementById('p-brief');
            if (briefEl) briefEl.innerText = project.brief;

            const demoEl = document.getElementById('p-demo');
            if (demoEl) demoEl.innerText = project.demo_text;

            const specsList = document.getElementById('p-specs');
            if (specsList) {
                specsList.innerHTML = project.specs.map(s =>
                    `<li><strong>${s.label}:</strong> ${s.value}</li>`
                ).join('');
            }
        } else {
            const titleEl = document.getElementById('p-title');
            if (titleEl) titleEl.innerText = t ? t.error_not_found : 'ERROR: NOT FOUND';
        }
    }

    function updateFileSystem() {
        const t = translations[currentLang];
        if (!t) return;

        fileSystem = {
            'about': `
    <span class="uppercase">${t.about_id}</span>
    <span class="uppercase">${t.about_role}</span>
    
    ${t.about_desc}
            `,
            'contact': `
    <span class="uppercase">${t.contact_heading}:</span>
    
    <span class="error">CONTACT INFO REDACTED. AUTHORIZATION REQUIRED.</span>
            `,
            'contact_admin': `
    <span class="uppercase">${t.contact_heading} [SECURE]:</span>
    
    Email: <a href="mailto:guest@solodev.io">guest@solodev.io</a>
    GitHub: <a href="#" target="_blank">github.com/solodev</a>
            `
        };

        allProjects.forEach(p => {
            const pData = getLocalizedData(p, currentLang);
            fileSystem[p.id] = `
    <span class="uppercase">${pData.title}</span>
    -------------------------
    ${pData.brief}
    <a href="project.html?id=${p.id}&lang=${currentLang}" style="color:var(--primary-color)">${t.open_gui}</a>
            `;
        });
    }

    // Helper: Print line to output
    function printLine(text, className = '', typing = false) {
        if (!output) return Promise.resolve();
        return new Promise((resolve) => {
            const line = document.createElement('div');
            if (className) line.className = className;
            output.appendChild(line);

            if (typing) {
                let i = 0;
                terminalContainer.scrollTop = terminalContainer.scrollHeight;
                const interval = setInterval(() => {
                    line.innerHTML += text.charAt(i);
                    i++;
                    terminalContainer.scrollTop = terminalContainer.scrollHeight;
                    if (i >= text.length) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 10);
            } else {
                line.innerHTML = text;
                terminalContainer.scrollTop = terminalContainer.scrollHeight;
                resolve();
            }
        });
    }

    // Command Parser
    async function handleCommand(cmdRaw) {
        const parts = cmdRaw.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        await printLine(`<span class="prompt">${isAdmin ? 'admin' : 'guest'}@solodev:~$</span> ${cmdRaw}`);

        switch (cmd) {
            case 'help':
                // Localized Help
                if (currentLang === 'ja') {
                    await printLine(`
    利用可能なコマンド:
    -------------------
    about       - ユーザーIDを表示
    projects    - プロジェクト一覧 (メイン表示と同期)
    contact     - 通信を確立
    clear       - 画面をクリア
    admin       - ルートアクセスを要求
    exit        - ログアウト/管理者モード終了
    view [id]   - 特定のアイテム情報を表示
                    `);
                } else {
                    await printLine(`
    AVAILABLE COMMANDS:
    -------------------
    about       - View user identity
    projects    - List projects (synced with main display)
    contact     - Establish communication
    clear       - Clear terminal screen
    admin       - Request Root Access
    exit        - Logout/Exit Admin Mode
    view [id]   - View specific item info
                    `);
                }
                break;
            case 'ls':
            case 'projects':
                await printLine(currentLang === 'ja' ? "メインメモリ内のプロジェクト:" : "PROJECTS LOCATED IN MAIN MEMORY:");
                allProjects.forEach(p => {
                    const pData = (currentLang === 'ja' && p.ja) ? { ...p, ...p.ja } : p;
                    printLine(`- ${pData.title} (${p.id})`);
                });
                await printLine(currentLang === 'ja' ? "'view [project-id]' で詳細を表示。" : "USE 'view [project-id]' FOR DETAILS.");
                break;
            case 'about':
            case 'whoami':
                await printLine(fileSystem['about']);
                break;
            case 'contact':
                if (isAdmin) {
                    await printLine(fileSystem['contact_admin']);
                } else {
                    await printLine(fileSystem['contact']);
                }
                break;
            case 'admin':
                if (isAdmin) {
                    await printLine("ALREADY AUTHENTICATED AS ADMIN.");
                } else {
                    await printLine("AUTHENTICATING...", "", true);
                    await new Promise(resolve => setTimeout(() => {
                        isAdmin = true;
                        document.body.classList.add('admin-mode');
                        resolve();
                    }, 1000));
                    await printLine("<br>ACCESS GRANTED. WELCOME, ADMIN.");
                }
                break;
            case 'exit':
            case 'logout':
                if (isAdmin) {
                    isAdmin = false;
                    document.body.classList.remove('admin-mode');
                    await printLine("LOGGING OUT... SESSION TERMINATED.");
                } else {
                    await printLine("ALREADY IN GUEST MODE.");
                }
                break;
            case 'view':
                if (fileSystem[args]) {
                    await printLine(fileSystem[args]);
                } else {
                    await printLine(`Error: Object '${args}' not found.`);
                }
                break;
            case 'clear':
                if (output) output.innerHTML = '';
                break;
            case '':
                break;
            default:
                await printLine(`Command not found: ${cmd}. Type 'help' for assistance.`);
        }
    }

    // Input Handling
    function updateTyper() {
        if (typer) {
            typer.textContent = currentInput;
        }
    }

    // Initialize System
    initSystem();

    // Global Key Listener
    document.addEventListener('keydown', (e) => {
        // Prevent typing if ctrl/meta keys are pressed
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // If typing in input fields, ignore (though we don't have many inputs other than the terminal)

        if (e.key === 'Enter') {
            handleCommand(currentInput);
            currentInput = '';
            updateTyper();
            e.preventDefault();
        } else if (e.key === 'Backspace') {
            currentInput = currentInput.slice(0, -1);
            updateTyper();
        } else if (e.key.length === 1) {
            currentInput += e.key;
            updateTyper();
        }
    });
});
