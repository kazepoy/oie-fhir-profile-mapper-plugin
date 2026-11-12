// SPDX-License-Identifier: MPL-2.0
export let React = null;
export const bindReact = instance => { React = instance; };
export const h = (...args) => React.createElement(...args);
