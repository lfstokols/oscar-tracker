/// <reference types="vite/client" />

const RUN_DEBUG = import.meta.env.VITE_RUN_DEBUG;

export function logToConsole(message: any) {
  if (RUN_DEBUG) {
    console.log(message);
  }
}

export function warnToConsole(message: any) {
  if (RUN_DEBUG) {
    console.warn(message);
  }
}

export function logToConsoleError(message: any) {
  if (RUN_DEBUG) {
    console.error(message);
  }
}
