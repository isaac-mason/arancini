import * as ramda from 'ramda';

export const empty = (value: never): boolean => ramda.empty(value);

export const notEmpty = (value: never): boolean => !empty(value);
