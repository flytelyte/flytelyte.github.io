
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

            // Freeze data to prevent mutation
            allProjects.forEach(p => Object.freeze(p));
            Object.freeze(allProjects);
            Object.freeze(translations);

            // Determine Language Priority: URL Param > LocalStorage > Default (en)
            const params = new URLSearchParams(window.location.search);
            const urlLang = params.get('lang');
            const storedLang = localStorage.getItem('guest_lang');

            if (urlLang && ['en', 'ja'].includes(urlLang)) {
                currentLang = urlLang;
            } else if (storedLang && ['en', 'ja'].includes(storedLang)) {
                currentLang = storedLang;
            } else {
                currentLang = 'en';
            }

            // Inject Global UI Elements (like Language Toggle if missing)
            injectGlobalUI();

            // Initialize Language State
            setLanguage(currentLang, false); // false = don't reload/pushState yet

            // Determine Page Context
            const projectId = params.get('id');
            const isProjectPage = !!document.getElementById('p-title');

            if (isProjectPage && projectId) {
                renderProjectPage(projectId);
            } else {
                // Initial Terminal Message only on Home/Terminal view
                if (output) {
                    await printLine("ANTIGRABITY TERMINAL V1.0 INITIALIZED.");
                    await printLine("TYPE 'help' FOR COMMANDS.");
                }
            }

        } catch (e) {
            console.error("System Failure: Initialization Failed", e);
            if (output) printLine("CRITICAL ERROR: SYSTEM INITIALIZATION FAILED.");
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

    // Inject UI elements dynamically
    function injectGlobalUI() {
        // Check if Nav exists
        const navLinks = document.querySelector('.nav-links');
        if (navLinks && !document.getElementById('lang-toggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'lang-toggle';
            toggleBtn.className = 'lang-btn';
            toggleBtn.innerText = '[EN/JA]';
            toggleBtn.addEventListener('click', toggleLanguage);
            navLinks.appendChild(toggleBtn);
        } else {
            // Re-attach listener if element exists (e.g. hardcoded in index.html)
            const existingBtn = document.getElementById('lang-toggle');
            if (existingBtn) {
                existingBtn.addEventListener('click', toggleLanguage);
            }
        }
    }

    function toggleLanguage() {
        const newLang = currentLang === 'en' ? 'ja' : 'en';
        setLanguage(newLang, true);
        if (output) printLine(`SYSTEM: LANGUAGE SWITCHED TO [${newLang.toUpperCase()}]`);
    }

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

            document.title = `${project.name} | Antigravity`;
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
    
    Email: <a href="mailto:guest@antigrabity.io">guest@antigrabity.io</a>
    GitHub: <a href="#" target="_blank">github.com/antigrabity</a>
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

        await printLine(`<span class="prompt">${isAdmin ? 'admin' : 'guest'}@antigrabity:~$</span> ${cmdRaw}`);

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
