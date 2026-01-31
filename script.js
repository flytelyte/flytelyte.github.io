
document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const terminalContainer = document.getElementById('terminal-container');
    const typer = document.getElementById('typer');
    const inputLine = document.getElementById('input-line');

    let isAdmin = false; // Admin state
    let currentInput = '';

    // ASCII Art Logo
    const logo = `
   ___   _  __ ______  ____  ______   _____   ___    ___   ____  ______  __  __
  / _ | / |/ //_  __/ /  _/ / ____/  / ___/  / _ \\  / _ | / __/ /  _/ /_ \\/ /
 / __ |/    /  / /   _/ /  / / __   / / _   / , _/ / __ |/ _ \\ _/ /  / / / / 
/_/ |_/_/|_/  /_/   /___/ /_/ /_/  /_/ |_| /_/|_| /_/ |_/____//___/ /_/ /_/  
                                                                             
    `;

    // File System / Content
    const fileSystem = {
        'about': `
    <span class="uppercase">Identify:</span> ANTIGRAVITY AGENT
    <span class="uppercase">Role:</span> Lead Frontend Engineer
    <span class="uppercase">Specialty:</span> Terminal Brutalism, React, Systems Design
    
    I am a digital architect obsessed with the raw aesthetic of early computing. 
    I build web experiences that are not just viewed, but traversed.
        `,
        'contact': `
    <span class="uppercase">Comms Link:</span>
    
    <span class="error">CONTACT INFO REDACTED. AUTHORIZATION REQUIRED.</span>
        `,
        'contact_admin': `
    <span class="uppercase">Comms Link [SECURE]:</span>
    
    Email: <a href="mailto:guest@antigrabity.io">guest@antigrabity.io</a>
    GitHub: <a href="#" target="_blank">github.com/antigrabity</a>
        `,
        'project-one': `
    <span class="uppercase">PROJECT_ONE</span>
    -------------------------
    A specialized interface for encrypted communication. Built with React and WebSockets.
    Features real-time key exchange and steganographic encryption.
        `,
        'project-two': `
    <span class="uppercase">PROJECT_TWO</span>
    -------------------------
    High-fidelity data visualization tool using D3.js and WebGL. 
    Renders millions of data points with zero latency.
        `,
        'project-three': `
    <span class="uppercase">PROJECT_THREE</span>
    -------------------------
    Dashboard for monitoring and controlling autonomous drone swarms.
    Implemented with Vue.js and MQTT.
        `
    };

    // Helper: Print line to output
    function printLine(text, className = '', typing = false) {
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
                break;
            case 'ls':
            case 'projects':
                await printLine("PROJECTS LOCATED IN MAIN MEMORY:");
                await printLine("- PROJECT_ONE");
                await printLine("- PROJECT_TWO");
                await printLine("- PROJECT_THREE");
                await printLine("USE 'view [project-id]' FOR DETAILS OR SCROLL UP.");
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
                output.innerHTML = '';
                break;
            case '':
                break;
            default:
                await printLine(`Command not found: ${cmd}. Type 'help' for assistance.`);
        }
    }

    // Input Handling
    function updateTyper() {
        typer.text = currentInput;
        typer.textContent = currentInput;
    }

    // Initial Message
    (async () => {
        await printLine("ANTIGRABITY TERMINAL V1.0 INITIALIZED.");
        await printLine("TYPE 'help' FOR COMMANDS.");
    })();

    // Global Key Listener (only if terminal is visible/focused? No, keeping it global for "hacky" feel but respecting scroll)
    // Actually, let's bind it only when typing doesn't interfere? 
    // For now, let's keep it global but maybe add a listener to the input area or just document.
    document.addEventListener('keydown', (e) => {
        // Prevent typing if ctrl/meta keys are pressed
        if (e.ctrlKey || e.metaKey || e.altKey) return;

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

            // Auto-scroll to terminal if typing starts? Maybe annoying.
            // Let's only scroll if checks
        }
    });
});
