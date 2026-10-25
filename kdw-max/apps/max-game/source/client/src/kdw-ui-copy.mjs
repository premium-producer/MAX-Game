import * as original from './journey-v5-ui-copy.mjs';
import {typographyMarkup} from './kdw-typography.mjs';
export {installV5CopyStyles,syncV5InstructionVisibility} from './journey-v5-ui-copy.mjs';
export const v5CopyMarkup=value=>typographyMarkup(original.v5CopyMarkup(value));
export const v5ButtonMarkup=value=>typographyMarkup(original.v5ButtonMarkup(value));
