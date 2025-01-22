/// <reference types="vite/client" />

const RUN_DEBUG = import.meta.env.VITE_RUN_DEBUG;

export function LogToConsole(message: any) {
  if (RUN_DEBUG) {
    console.log(message);
  }
}

export function WarnToConsole(message: any) {
  if (RUN_DEBUG) {
    console.warn(message);
  }
}

export function LogToConsoleError(message: any) {
  if (RUN_DEBUG) {
    console.error(message);
  }
}
