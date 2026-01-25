
document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const terminalContainer = document.getElementById('terminal-container');
    const typer = document.getElementById('typer');
    const inputLine = document.getElementById('input-line');

    let isBooting = true;
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
    
    1. <span class="cmd-link" data-cmd="view project-one">PROJECT_ONE</span>  -  [Secure comms uplink interface]
    2. <span class="cmd-link" data-cmd="view project-two">PROJECT_TWO</span>  -  [Retro-futuristic data visualizer]
    3. <span class="cmd-link" data-cmd="view project-three">PROJECT_THREE</span> -  [Autonomous drone control dashboard]
    
    Type 'view [project-name]' for details.
        `,
        'contact': `
    <span class="uppercase">Comms Link:</span>
    
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
        const line = document.createElement('div');
        if (className) line.className = className;

        if (typing) {
            output.appendChild(line);
            let i = 0;
            const interval = setInterval(() => {
                line.innerHTML += text.charAt(i);
                i++;
                terminalContainer.scrollTop = terminalContainer.scrollHeight;
                if (i >= text.length) clearInterval(interval);
            }, 20);
            return 50 * text.length; // Approximate duration
        } else {
            line.innerHTML = text;
            output.appendChild(line);
            terminalContainer.scrollTop = terminalContainer.scrollHeight;
            return 0;
        }
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
            printLine(text);
            await new Promise(r => setTimeout(r, 400));
        }

        await new Promise(r => setTimeout(r, 500));
        printAscii();
        await new Promise(r => setTimeout(r, 1000));

        printLine("<br>Type 'help' for available commands.<br>");

        inputLine.style.display = 'flex';
        isBooting = false;
        focusInput();
    }

    // Command Parser
    function handleCommand(cmdRaw) {
        const parts = cmdRaw.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        printLine(`<span class="prompt">guest@antigrabity:~$</span> ${cmdRaw}`);

        switch (cmd) {
            case 'help':
                printLine(`
    AVAILABLE COMMANDS:
    -------------------
    <span class="cmd-link" data-cmd="about">about</span>     - View user identity
    <span class="cmd-link" data-cmd="projects">projects</span>  - List projects
    <span class="cmd-link" data-cmd="contact">contact</span>   - Establish communication
    <span class="cmd-link" data-cmd="clear">clear</span>     - Clear terminal screen
    view [id] - View specific item
                `);
                break;
            case 'ls':
            case 'projects':
                printLine(fileSystem['projects']);
                break;
            case 'about':
            case 'whoami':
                printLine(fileSystem['about']);
                break;
            case 'contact':
                printLine(fileSystem['contact']);
                break;
            case 'view':
                if (fileSystem[args]) {
                    printLine(fileSystem[args]);
                } else {
                    printLine(`Error: Object '${args}' not found.`);
                }
                break;
            case 'clear':
                output.innerHTML = '';
                printAscii(); // Keep logo maybe? Or full clear. Let's keep logic simple.
                break;
            case '':
                break;
            default:
                printLine(`Command not found: ${cmd}. Type 'help' for assistance.`);
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
