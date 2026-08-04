/**
 * Captures the observable behaviour of the current board logic, so that the
 * rewrite of the Webview can be compared against it later.
 *
 * It loads the untouched scripts of the Webview ('filtrex.js', 'moment',
 * 'showdown', 'script.js' and 'board.js') into an isolated context, runs a
 * fixed board through them and writes the result as JSON.
 *
 * Usage:
 *     npm run build
 *     node ./scripts/capture-reference.js <output-file>
 *
 * The output is deterministic: same input, same file. A diff between the file
 * taken before the rewrite and the one taken after is the evidence for RF-02,
 * RF-03 and RF-28.
 */

const FS = require('fs');
const Path = require('path');
const VM = require('vm');

/**
 * Where the vendored libraries live: they are still shipped, because the new
 * interface reaches them through its adapters.
 */
const VENDOR_DIR = Path.resolve(__dirname, '..', 'src', 'res', 'js');

/**
 * Where the two scripts of the OLD interface live.
 *
 * 'script.js' and 'board.js' stopped being served with this feature, and are
 * kept only as the oracle this capture reads: they are the definition of "how
 * version 1.33.1 behaved", and they are what the new board is compared
 * against. They are not part of the extension any more, which is why they sit
 * beside the reference instead of under 'src/res/'.
 */
const LEGACY_DIR = Path.resolve(
    __dirname, '..',
    '_reversa_forward', '001-interface-react-tema-e-done', 'reference', 'legacy'
);

/**
 * The scripts, in the order the old Webview loaded them, with the directory
 * each of them now lives in.
 */
const SCRIPT_FILES = [
    { dir: VENDOR_DIR, file: 'filtrex.js' },
    { dir: VENDOR_DIR, file: 'moment-with-locales.min.js' },
    { dir: VENDOR_DIR, file: 'showdown.min.js' },
    { dir: LEGACY_DIR, file: 'script.js' },
    { dir: LEGACY_DIR, file: 'board.js' },
];

/**
 * Anything called on this returns itself: it stands in for jQuery, whose
 * methods are chained.
 */
function createChainableStub() {
    const STUB = function () {
        return STUB;
    };

    return new Proxy(STUB, {
        apply: () => STUB,
        get: (target, property) => {
            if ('then' === property) {
                return undefined;  // it is not a promise
            }

            return STUB;
        },
    });
}

function loadWebview() {
    const JQUERY = createChainableStub();

    const SANDBOX = {
        vscode: { postMessage: () => { } },
        vsckb_log: () => { },
        $: JQUERY,
        jQuery: JQUERY,
        document: createChainableStub(),
        navigator: { userAgent: 'vscode-kanban reference capture' },
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
    };
    SANDBOX.window = SANDBOX;
    SANDBOX.self = SANDBOX;
    SANDBOX.globalThis = SANDBOX;

    const CONTEXT = VM.createContext(SANDBOX);

    for (const SCRIPT of SCRIPT_FILES) {
        const FULL_PATH = Path.join(SCRIPT.dir, SCRIPT.file);

        VM.runInContext(
            FS.readFileSync(FULL_PATH, 'utf8'),
            CONTEXT,
            { filename: FULL_PATH }
        );
    }

    return {
        call: (func, ...args) => {
            const ARGS = args.map(a => undefined === a ? 'undefined'
                                                       : JSON.stringify(a))
                             .join(', ');

            const RESULT = VM.runInContext(
                `JSON.stringify( ${ func }(${ ARGS }) )`, CONTEXT
            );

            return undefined === RESULT ? undefined
                                        : JSON.parse(RESULT);
        },
        eval: (code) => VM.runInContext(code, CONTEXT),
        set: (name, value) => {
            VM.runInContext(`${ name } = ${ JSON.stringify(value) };`, CONTEXT);
        },
    };
}

/**
 * A board that exercises every rule the sorting has: priority, type and
 * title, including the values the tests pinned down as quirks.
 */
const FIXTURE_BOARD = {
    'todo': [
        { id: 1, title: 'Escrever o roadmap', type: '', prio: 3 },
        { id: 2, title: 'Corrigir a exportação', type: 'bug', prio: 3 },
        { id: 3, title: 'Servidor fora do ar', type: 'emergency', prio: 3 },
        { id: 4, title: 'Anotar a ideia', type: '' },
        { id: 5, title: '  aparar as arestas  ', type: 'note', prio: '5xyz' },
        { id: 6, title: 'Zelar pelo backlog', type: 'task', prio: 'abc' },
    ],
    'in-progress': [
        { id: 7, title: 'Migrar o toolchain', type: 'issue', prio: 9 },
        { id: 8, title: 'Ajustar o filtro', type: 'BUG', prio: 9 },
    ],
    'testing': [
        { id: 9, title: 'Rever o contraste', type: '  EMERGENCY  ', prio: 1 },
    ],
    'done': [
        { id: 10, title: 'Destravar o build', type: '', prio: 7 },
        { id: 11, title: 'Criar a rede de testes', type: '', prio: 7 },
    ],
};

/**
 * The expressions the filter is characterised with, including the broken one,
 * whose result is 'show everything'.
 */
const FILTER_EXPRESSIONS = [
    '1 == 1',
    '1 == 2',
    'is_bug',
    'is_note',
    'is_emergency',
    'is_issue',
    'is_task',
    'prio > 5',
    'contains(title, "quadro")',
    'is_bug and prio > 5',
    'is_bug ((',
    'nao_existe(1)',
];

/**
 * The card contents the Markdown barrier is characterised with.
 */
const MARKDOWN_SAMPLES = [
    'Texto simples.',
    '# Título\n\nParágrafo com **negrito** e `código`.',
    '<script>vsckb_log("nao deveria rodar")</script>Depois do script.',
    '<img src=x onerror="vsckb_log(\'nem isto\')">Depois da imagem.',
    '<iframe src="https://example.org"></iframe>Depois do quadro.',
    '[link](https://example.org)',
];

function captureSorting(webview) {
    const RESULT = {};

    for (const COLUMN of Object.keys(FIXTURE_BOARD)) {
        // the board is reset for every column, because sorting mutates it
        webview.set('allCards', JSON.parse(JSON.stringify(FIXTURE_BOARD)));

        const SORTED = webview.call('vsckb_get_cards_sorted', COLUMN);

        RESULT[COLUMN] = {
            displayed: SORTED.map(c => c.id),
            // the board after sorting: this is what would be written to disk
            persisted: webview.eval(`JSON.stringify(allCards['${ COLUMN }'].map(c => c.id))`),
        };
    }

    return RESULT;
}

function captureSortValues(webview) {
    const PRIOS = [5, '7', '5xyz', 'abc', undefined, 0, -1, 3.9];
    const TYPES = ['emergency', 'bug', 'note', 'task', 'issue', '', '  EMERGENCY  ', undefined];

    return {
        priority: PRIOS.map(p => ({
            input: undefined === p ? null : p,
            value: webview.call('vsckb_get_card_prio_sort_val',
                                undefined === p ? {} : { prio: p }),
        })),
        type: TYPES.map(t => ({
            input: undefined === t ? null : t,
            value: webview.call('vsckb_get_card_type_sort_val',
                                undefined === t ? {} : { type: t }),
        })),
    };
}

function captureFilter(webview) {
    // the names of the filter environment, not the fields of the card:
    // 's. 'vsckb_does_match' in 'script.js'
    const CARD = {
        id: 42,
        title: 'Corrigir o quadro',
        type: 'bug',
        prio: 7,
        priority: 7,
        cat: 'frontend',
        category: 'frontend',
        assigned_to: 'iago',
        description: 'A exportação escapa entidades.',
        details: '',
        is_bug: true,
        is_emerg: false,
        is_emergency: false,
        is_issue: false,
        is_note: false,
        is_task: false,
    };

    return FILTER_EXPRESSIONS.map(expr => {
        let result;
        let failed = false;

        try {
            result = webview.call('vsckb_does_match', expr, { values: CARD });
        } catch (e) {
            failed = true;
            result = `${ e }`;
        }

        return {
            expression: expr,
            // the raw value matters: the filter returns 1, not true
            result: result,
            type: typeof result,
            threw: failed,
        };
    });
}

/**
 * Only the conversion is captured here, not the sanitising step.
 *
 * 'vsckb_from_markdown' (script.js:227) converts with Showdown and then
 * strips '<script>' through jQuery, over a real DOM. Without a DOM that
 * second half cannot run, so the barrier itself is verified by hand, s.
 * 'onboarding.md' §8. What is pinned down here is that the same Markdown
 * keeps producing the same HTML.
 */
function captureMarkdown(webview) {
    return MARKDOWN_SAMPLES.map(md => {
        let html;
        let failed = false;

        try {
            html = webview.eval(
                `new showdown.Converter().makeHtml(${ JSON.stringify(md) })`
            );
        } catch (e) {
            failed = true;
            html = `${ e }`;
        }

        return {
            input: md,
            convertedBeforeSanitising: html,
            threw: failed,
        };
    });
}

function main() {
    const OUTPUT = process.argv[2];

    if (!OUTPUT) {
        console.error('Usage: node ./scripts/capture-reference.js <output-file>');
        process.exit(1);
    }

    const WEBVIEW = loadWebview();

    const SNAPSHOT = {
        capturedFrom: {
            version: require('../package.json').version,
            scripts: SCRIPT_FILES,
        },
        fixture: FIXTURE_BOARD,
        sorting: captureSorting(WEBVIEW),
        sortValues: captureSortValues(WEBVIEW),
        filter: captureFilter(WEBVIEW),
        markdown: captureMarkdown(WEBVIEW),
    };

    FS.mkdirSync(Path.dirname(OUTPUT), { recursive: true });
    FS.writeFileSync(OUTPUT, JSON.stringify(SNAPSHOT, null, 4) + '\n', 'utf8');

    console.log(`Reference written to ${ OUTPUT }`);
}

main();
