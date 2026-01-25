
document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const terminalContainer = document.getElementById('terminal-container');
    const typer = document.getElementById('typer');
    const inputLine = document.getElementById('input-line');

    let isBooting = true;
    let isAdmin = false; // Admin state
    let currentInput = '';

    // ASCII Art Logo
    const logo = `
   ___   _  __ ______  ____  ______   _____   ___    ___   ____  ______  __  __
  / _ | / |/ //_  __/ /  _/ / ____/  / ___/  / _ \\  / _ | / __/ /  _/ /_ \\/ /
 / __ |/    /  / /   _/ /  / / __   / / _   / , _/ / __ |/ _ \\ _/ /  / / / / 
/_/ |_/_/|_/  /_/   /___/ /_/ /_/  /_/ |_| /_/|_| /_/ |_/____//___/ /_/ /_/  
                                                                             
    `;

    const bootText = [
        "BIOS CHECK... OK",
        "LOADING KERNEL... OK",
        "MOUNTING FILE SYSTEM... OK",
        "INITIALIZING VIDEO ADAPTER... OK",
        "MOUNTING ANTIGRABITY_CORE... OK",
        "WELCOME TO ANTIGRABITY TERMINAL V1.0"
    ];

    // File System / Content
    const fileSystem = {
        'about': `
    <span class="uppercase">Identify:</span> ANTIGRAVITY AGENT
    <span class="uppercase">Role:</span> Lead Frontend Engineer
    <span class="uppercase">Specialty:</span> Terminal Brutalism, React, Systems Design
    
    I am a digital architect obsessed with the raw aesthetic of early computing. 
    I build web experiences that are not just viewed, but traversed.
        `,
        'projects': `
    <span class="uppercase">Listing Projects...</span>
    
    1. <span class="cmd-link" data-cmd="view project-one">PROJECT_ONE</span>  -  [ENCRYPTED]
    2. <span class="cmd-link" data-cmd="view project-two">PROJECT_TWO</span>  -  [ENCRYPTED]
    3. <span class="cmd-link" data-cmd="view project-three">PROJECT_THREE</span> -  [ENCRYPTED]
    
    <span class="error">ACCESS DENIED. Run 'admin' to authenticate.</span>
        `,
        'projects_admin': `
    <span class="uppercase">Listing Projects [ADMIN ACCESS]...</span>
    
    1. <span class="cmd-link" data-cmd="view project-one">PROJECT_ONE</span>  -  [Secure comms uplink interface]
    2. <span class="cmd-link" data-cmd="view project-two">PROJECT_TWO</span>  -  [Retro-futuristic data visualizer]
    3. <span class="cmd-link" data-cmd="view project-three">PROJECT_THREE</span> -  [Autonomous drone control dashboard]
    
    Type 'view [project-name]' for details.
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
    Features real-time key exchange and steganographic encoding.
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
                // Scroll to bottom immediately so user sees start
                terminalContainer.scrollTop = terminalContainer.scrollHeight;

                const interval = setInterval(() => {
                    line.innerHTML += text.charAt(i);
                    i++;
                    terminalContainer.scrollTop = terminalContainer.scrollHeight;
                    if (i >= text.length) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 20);
            } else {
                line.innerHTML = text;
                terminalContainer.scrollTop = terminalContainer.scrollHeight;
                resolve();
            }
        });
    }

    // Helper: Print ASCII Art
    function printAscii() {
        const asciiContainer = document.createElement('div');
        asciiContainer.className = 'ascii-art';
        asciiContainer.textContent = logo;
        output.appendChild(asciiContainer);
    }

    // Boot Sequence controls
    async function boot() {
        inputLine.style.display = 'none';

        for (let text of bootText) {
            await printLine(text);
            await new Promise(r => setTimeout(r, 100)); // Faster boot for UX
        }

        await new Promise(r => setTimeout(r, 200));
        printAscii();
        await new Promise(r => setTimeout(r, 500));

        await printLine("<br>Type 'help' for available commands.<br>");

        inputLine.style.display = 'flex';
        isBooting = false;
        focusInput();
    }

    // Command Parser
    async function handleCommand(cmdRaw) {
        // Handle chained commands logic
        if (cmdRaw.includes('&&')) {
            const commands = cmdRaw.split('&&');
            for (let i = 0; i < commands.length; i++) {
                const subCmd = commands[i].trim();
                if (subCmd) {
                    await handleCommand(subCmd);
                    // Small delay between chained commands for effect
                    await new Promise(r => setTimeout(r, 300));
                }
            }
            return;
        }

        const parts = cmdRaw.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        await printLine(`<span class="prompt">${isAdmin ? 'admin' : 'guest'}@antigrabity:~$</span> ${cmdRaw}`);

        switch (cmd) {
            case 'help':
                await printLine(`
    AVAILABLE COMMANDS:
    -------------------
    <span class="cmd-link" data-cmd="about">about</span>     - View user identity
    <span class="cmd-link" data-cmd="projects">projects</span>  - List projects ${!isAdmin ? '[LOCKED]' : ''}
    <span class="cmd-link" data-cmd="contact">contact</span>   - Establish communication ${!isAdmin ? '[LOCKED]' : ''}
    <span class="cmd-link" data-cmd="clear">clear</span>     - Clear terminal screen
    <span class="cmd-link" data-cmd="admin">admin</span>     - Request Root Access
    <span class="cmd-link" data-cmd="exit">exit</span>      - Logout/Exit Admin Mode
    view [id] - View specific item
                `);
                break;
            case 'ls':
            case 'projects':
                if (isAdmin) {
                    await printLine(fileSystem['projects_admin']);
                } else {
                    await printLine(fileSystem['projects']);
                }
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
                    // Actual implementation of the delay logic
                    await new Promise(resolve => setTimeout(() => {
                        isAdmin = true;
                        document.body.classList.add('admin-mode');
                        resolve();
                    }, 1500));

                    await printLine("<br>ACCESS GRANTED. WELCOME, ADMIN.");
                    await printLine("SYSTEM UNLOCKED. FULL DATA ACCESS ENABLED.");
                }
                break;
            case 'exit':
            case 'logout':
                if (isAdmin) {
                    isAdmin = false;
                    document.body.classList.remove('admin-mode');
                    await printLine("LOGGING OUT... SESSION TERMINATED.");
                    await printLine("RETURNING TO GUEST MODE.");
                } else {
                    await printLine("ALREADY IN GUEST MODE.");
                }
                break;
            case 'view':
                if (!isAdmin) {
                    await printLine(`ACCESS DENIED. AUTHORIZATION REQUIRED FOR OBJECT: '${args}'`);
                } else {
                    if (fileSystem[args]) {
                        await printLine(fileSystem[args]);
                    } else {
                        await printLine(`Error: Object '${args}' not found.`);
                    }
                }
                break;
            case 'clear':
                output.innerHTML = '';
                // printAscii(); // Optional: don't reprint logo on clear for cleaner look
                break;
            case '':
                break;
            default:
                await printLine(`Command not found: ${cmd}. Type 'help' for assistance.`);
        }

        terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }

    // Input Handling
    function updateTyper() {
        typer.textContent = currentInput;
    }

    function focusInput() {
        // Just ensures we are ready to type, maybe scroll to bottom
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }

    // Global Key Listener
    document.addEventListener('keydown', (e) => {
        if (isBooting) return;

        // Special keys
        if (e.key === 'Enter') {
            handleCommand(currentInput);
            currentInput = '';
            updateTyper();
        } else if (e.key === 'Backspace') {
            currentInput = currentInput.slice(0, -1);
            updateTyper();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            currentInput += e.key;
            updateTyper();
        }

        // Keep focus visible
        focusInput();
    });

    // Delegate clicks on .cmd-link using event delegation
    // This allows dynamically created links to work
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('cmd-link')) {
            const cmd = e.target.getAttribute('data-cmd');
            if (cmd) {
                // Simulate typing? Or just run it. 
                // Spec says "simulate the typing of that command".
                // Let's just run it for instant gratification or we can animate it.
                // Instant is better UX for clicks usually, but let's be cool.
                currentInput = cmd;
                updateTyper();
                setTimeout(() => {
                    handleCommand(cmd);
                    currentInput = '';
                    updateTyper();
                }, 200);
            }
        }
    });

    // Start
    boot();
});
