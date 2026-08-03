/**
 * How the preview fails.
 *
 * Every failure of this tool has a remedy, and the two travel together: a
 * message that states a problem without stating the way out is how a tool
 * acquires the reputation of being finicky. It throws rather than exiting, so
 * that the same check can be exercised by a test without taking the test runner
 * down with it -- only the command turns this into an exit code.
 */

const Path = require('path');

const ROOT = Path.resolve(__dirname, '..', '..');

/**
 * A failure of the preview itself, as opposed to one of the board.
 *
 * It carries the remedy beside the cause, because every one of them here has
 * one, and a message that states a problem without stating the way out is how a
 * tool acquires the reputation of being finicky.
 */
class PreviewError extends Error {
    constructor(message, remedy) {
        super(message);

        this.name = 'PreviewError';
        this.remedy = remedy;
    }
}

/**
 * Stops, loudly.
 *
 * It throws rather than exiting, so that the same check can be exercised by a
 * test without taking the test runner down with it. Only 'main' turns this into
 * an exit code.
 *
 * @param {string} message What went wrong.
 * @param {string} [remedy] What fixes it.
 */
function fail(message, remedy) {
    throw new PreviewError(message, remedy);
}

/**
 * Names a file the shortest way that still says where it is.
 *
 * A path inside the project reads better relative; one outside it reads as a
 * row of '..' that says nothing, and is exactly the case where the person at
 * the prompt needs to see where the file actually was.
 *
 * @param {string} file The file.
 *
 * @return {string} The name to show.
 */
function nameOf(file) {
    const RELATIVE = Path.relative(ROOT, file);

    return RELATIVE.startsWith('..') ? file : RELATIVE;
}

/**
 * Writes a failure where the person running the command will see it.
 *
 * @param {Error} error What went wrong.
 */
function report(error) {
    console.error(`preview: ${ error.message }`);

    if (error.remedy) {
        console.error(`preview: ${ error.remedy }`);
    }

    // an error that is not ours is a defect of this script, and the stack is
    // the only thing that will point at it
    if (!(error instanceof PreviewError)) {
        console.error(error.stack);
    }
}

module.exports = {
    PreviewError: PreviewError,
    ROOT: ROOT,
    fail: fail,
    report: report,
    nameOf: nameOf,
};
