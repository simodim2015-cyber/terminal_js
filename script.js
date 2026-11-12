    const output = document.getElementById('output');
    const cursor = document.getElementById('cursor');
    const PROMPT = 'USER@MAINFRAME:~$ ';

    // Everything before this index is read-only (banner + output + current prompt)
    let locked = output.textContent.length;

    // ---------- STATE ----------
    let unlocked = false;   // becomes true after "penetrate cat"
    let busy = false;       // true while a command is still running

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // ---------- PAGE LOG ----------
    const logLines = [];
    const startTime = Date.now();

    function log(level, message) {
        const t = ((Date.now() - startTime) / 1000).toFixed(3).padStart(8, ' ');
        logLines.push(`[${t}s] [${level}] ${message}`);
    }

    log('INFO', 'Page loaded');
    log('INFO', `User agent: ${navigator.userAgent}`);
    log('INFO', `Screen: ${screen.width}x${screen.height}, window: ${innerWidth}x${innerHeight}`);
    log('INFO', `Language: ${navigator.language}`);
    log('INFO', `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

    window.addEventListener('error', (e) => {
        log('ERROR', `${e.message} (line ${e.lineno})`);
    });
    window.addEventListener('unhandledrejection', (e) => {
        log('ERROR', `Unhandled promise rejection: ${e.reason}`);
    });
    window.addEventListener('resize', () => log('INFO', `Window resized to ${innerWidth}x${innerHeight}`));
    document.addEventListener('visibilitychange', () => log('INFO', `Tab ${document.hidden ? 'hidden' : 'visible'}`));

    // ---------- ERRORS ----------
    class CommandError extends Error {
        constructor(code, message) {
            super(message);
            this.code = code;
        }
    }

    // ---------- HELPERS ----------
    function print(text) {
        output.textContent += text + '\n';
        keepCursorVisible();
    }

    function keepCursorVisible() {
        const r = cursor.getBoundingClientRect();
        if (r.bottom > window.innerHeight || r.top < 0) {
            cursor.scrollIntoView({ block: 'end' });
        }
    }

    function newPrompt() {
        output.textContent += PROMPT;
        locked = output.textContent.length;
    }

    // ---------- FILES (shared by ls and cat) ----------
    const LOGO = String.raw`      /\_/\           _    _          _____ _   _          _____ _      _____ 
     ( o.o )         | |  | |   /\   / ____| | | |        / ____| |    |_   _|
      > ^ <          | |__| |  /  \ | |    | |_| |  ____ | |    | |      | |  
     /     \         |  __  | / /\ \| |    |  _  | |____|| |    | |      | |  
    |       |        | |  | |/ ____ \ |____| | | |        | |____| |____ _| |_ 
    (___)___)        |_|  |_/_/    \_\_____|_| |_|         \_____|______|_____|`;

    const files = {
        'debug.log': () => logLines.join('\n'),
        'root.cli': () => 'EXECUTING /CAT_OS/DEBUG/EMU/ROOT.CLI',
        'cat.png': () => 'not a text-based file format',
        'secrets.txt': () => unlocked
            ? 'CONTACTS \n EMail:simo.dim@gmail.com \n \n DATA \n This site was simply made for fun. If you\'re reading this, you did it. You found why I made this. I updated many times and it was fun to make. Why I\'m using past tense? Because of stupid autocorrect XD'
            : 'ACCESS DENIED.'
    };

    // ---------- COMMANDS ----------
    // A command can return a string, null (print nothing),
    // or a Promise of either (for animated output).
    const commands = {
        help: () =>
`AVAILABLE COMMANDS:
  help             - show this list
  logo             - display the logo
  whoami           - show current user
  ls               - list files
  cat FILE         - read a file
  echo TEXT        - print text
  date             - show date and time
  penetrate TARGET - attempt to breach a target
  clear            - clear the screen`,

        logo: () => LOGO,

        whoami: 'ADMIN\\USER',

        ls: () => Object.keys(files).join('   '),

        cat: (args) => {
            if (!args[0]) throw new CommandError('File Absent', 'cat: missing file name');
            const file = files[args[0].toLowerCase()];
            if (file === undefined) {
                throw new CommandError('File Absent', `cat: ${args[0]}: No such file (404)`);
            }
            return file();
        },

        echo: (args) => args.join(' '),

        date: () => new Date().toString(),

        penetrate: async (args) => {
            if (args[0]?.toLowerCase() !== 'cat') {
                throw new CommandError('Invalid Penetration', args[0]
                    ? `penetrate: ${args[0]}: target not found`
                    : 'usage: penetrate TARGET');
            }
            if (unlocked) return 'cat: already compromised.';

            const steps = [
                ['Scanning ports...', 700],
                ['Port 9 (meow) open', 600],
                ['Bypassing firewall.......... [OK]', 900],
                ['Injecting payload.......... [OK]', 900],
                ['Escalating privileges.......... [OK]', 900]
            ];
            for (const [text, delay] of steps) {
                print(text);
                await sleep(delay);
            }
            log('WARN', 'Security breach: cat compromised');
            unlocked = true;
            return 'CAT HAS BEEN PENETRATED. SECURITY LEVEL: 0';
        },

        clear: () => {
            output.textContent = '';
            return null;
        }
    };

    function runCommand(line) {
        const parts = line.trim().split(/\s+/);
        const name = parts[0].toLowerCase();
        const args = parts.slice(1);

        const cmd = commands[name];
        if (cmd === undefined) {
            throw new CommandError('Command Unavailable', `${name}: command not found`);
        }

        return typeof cmd === 'function' ? cmd(args) : cmd;
    }

    async function execute(line) {
        const cmdText = line.trim();
        if (cmdText === '') return { result: null };

        log('CMD', cmdText);

        let result = null;
        let errorLabel = null;
        try {
            result = await runCommand(cmdText);
        } catch (err) {
            if (err instanceof CommandError) {
                errorLabel = `Error ${err.code}`;
                result = err.message;
            } else {
                errorLabel = `Error Runtime Fault (${err.message})`;
                result = `Runtime error: ${err.message}`;
            }
        }

        // Keep the log readable: one line, max 100 characters
        const preview = String(result ?? '(no output)').replace(/\s*\n\s*/g, ' ⏎ ');
        log('OUT', preview.length > 100 ? preview.slice(0, 100) + '…' : preview);
        log(errorLabel ? 'ERROR' : 'OK', errorLabel ?? 'Safe Load');

        return { result };
    }

    // ---------- KEYBOARD ----------
    function handleKey(e) {
        // Let browser shortcuts (Ctrl+C, Cmd+R, etc.) work normally
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // While a command is running, swallow all typing
        if (busy) {
            e.preventDefault();
            return;
        }

        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            e.stopPropagation();
            output.textContent += ' ';
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            if (output.textContent.length > locked) {
                output.textContent = output.textContent.slice(0, -1);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();

            const line = output.textContent.slice(locked);
            output.textContent += '\n';
            busy = true;

            execute(line).then(({ result }) => {
                if (result !== null && result !== undefined) {
                    output.textContent += result + '\n';
                }
                newPrompt();
                busy = false;
                keepCursorVisible();
            });
            return;
        } else if (e.key.length === 1) {
            e.preventDefault();
            output.textContent += e.key;
        } else {
            return;
        }

        keepCursorVisible();
    }

    // Capture phase: catch the key before the browser handles it
    window.addEventListener('keydown', handleKey, true);

    // Extra protection: some browsers scroll on keypress/keyup for Space
    ['keypress', 'keyup'].forEach(type => {
        window.addEventListener(type, function (e) {
            if (e.key === ' ' || e.code === 'Space') e.preventDefault();
        }, true);
    });

    // Make sure the page receives keystrokes
    document.body.tabIndex = 0;
    document.body.style.outline = 'none';
    window.focus();
    document.body.focus();
    document.addEventListener('click', () => {
        window.focus();
        document.body.focus();
    });
