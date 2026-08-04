/**
 * The filter language, over Filtrex.
 *
 * This is the ONLY file that names Filtrex. The domain asks for a
 * 'FilterEvaluator' and gets one from here, which is what makes the note in
 * D-12 actionable: replacing the evaluator, the day the board wants a Content
 * Security Policy without 'unsafe-eval', is a change confined to this file.
 *
 * Filtrex builds the expression with 'new Function' ('filtrex.js:57'). That is
 * exactly why the seam exists, and exactly why this feature does not yet
 * declare the policy.
 */

import { FilterEvaluator } from '../domain/filtering';
import { FilterFunctions, FilterValues } from '../domain/filter-functions';
import { requireVendor } from './vendor';

/**
 * The shape 'filtrex.js' puts on the page.
 */
type CompileExpression = (
    expression: string,
    funcs: FilterFunctions,
) => (values: FilterValues) => unknown;

/**
 * The name of the global.
 */
const VENDOR = 'compileExpression';

/**
 * Builds the evaluator the domain filters with.
 *
 * Nothing is cached between calls: the board recompiles on every keystroke
 * today, and this feature does not change how often that happens.
 *
 * @return {FilterEvaluator} The evaluator.
 */
export function createFiltrexEvaluator(): FilterEvaluator {
    return (expression: string, funcs: FilterFunctions) => {
        const COMPILE = requireVendor<CompileExpression>(VENDOR);

        return COMPILE(expression, funcs);
    };
}
