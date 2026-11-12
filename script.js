    const output = document.getElementById('output');
    const cursor = document.getElementById('cursor');
    const PROMPT = 'USER@MAINFRAME:~$ ';

    let locked = output.textContent.length;

    // ---------- STATE ----------
    let unlocked = false;   // becomes true after "penetrate cat"
    let busy = false;       // true while a command is still printing

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function print(text) {
        output.textContent += text + '\n';
        keepCursorVisible();
    }

    // ---------- COMMANDS ----------
    // A command can return a string, null (print nothing),
    // or a Promise of either (for animated output).
    const commands = {
        help: () =>
`AVAILABLE COMMANDS:  help             - show this list
  whoami           - show current user
  ls               - list files
  cat FILE         - read a file
  echo TEXT        - print text
  date             - show date and time
  penetrate TARGET - attempt to breach a target
  clear            - clear the screen
  logo             - shows the HACK-CLI logo that appears at startup`,

        whoami: 'ADMIN\\USER',

        ls: 'root.cli   debug.log   secrets.txt   cat.png',

        cat: (args) => {
            const files = {                'debug.log': '[OK] Emulator running. No errors found.',
                'root.cli': 'EXECUTING /CAT_OS/DEBUG/EMU/ROOT.CLI',
                'secrets.txt': unlocked
                    ? 'CONTACTS \n EMail:simo.dim@gmail.com \n \n DATA \n This site was simply made for fun. If you\'re reading this, you did it. You found why I made this. I updated many times and it was fun to make. Why I\'m using past tense? Because of stupid autocorrect XD'
                    : 'ACCESS DENIED.',
                'cat.png': 'not a text-based file format'
            };            for (const [text, delay] of steps) {
                print(text);
                await sleep(delay);
            }
            unlocked = true;
            return 'CAT HAS BEEN PENETRATED. SECURITY LEVEL: 0';
        },

        clear: () => {
            output.textContent = '';
            return null;
        },
        logo: () => String.raw`      /\_/\           _    _          _____ _   _          _____ _      _____ 
     ( o.o )         | |  | |   /\   / ____| | | |        / ____| |    |_   _|
      > ^ <          | |__| |  /  \ | |    | |_| |  ____ | |    | |      | |  
     /     \         |  __  | / /\ \| |    |  _  | |____|| |    | |      | |  
    |       |        | |  | |/ ____ \ |____| | | |        | |____| |____ _| |_ 
    (___)___)        |_|  |_/_/    \_\_____|_| |_|         \_____|______|_____|`,
    };

    function runCommand(line) {
        const parts = line.trim().split(/\s+/);
        const name = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (name === '') return null;

        const cmd = commands[name];        if (cmd === undefined) return `${name}: command not found`;

        return typeof cmd === 'function' ? cmd(args) : cmd;
    }

    function newPrompt() {
        output.textContent += PROMPT;
        locked = output.textContent.length;
    }

    function keepCursorVisible() {
        const r = cursor.getBoundingClientRect();
        if (r.bottom > window.innerHeight || r.top < 0) {
            cursor.scrollIntoView({ block: 'end' });
        }
    }

    function handleKey(e) {
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

            Promise.resolve(runCommand(line)).then(result => {
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

    window.addEventListener('keydown', handleKey, true);

    ['keypress', 'keyup'].forEach(type => {
        window.addEventListener(type, function (e) {
            if (e.key === ' ' || e.code === 'Space') e.preventDefault();
        }, true);
    });

    document.body.tabIndex = 0;
    document.body.style.outline = 'none';
    window.focus();
    document.body.focus();
    document.addEventListener('click', () => {
        window.focus();
        document.body.focus();
    });
