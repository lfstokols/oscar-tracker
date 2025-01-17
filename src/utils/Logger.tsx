import env from '../../env.json';

const RUN_DEBUG = env.RUN_DEBUG;

export function LogToConsole(message: any) {
  if (RUN_DEBUG === 'true') {
    console.log(message);
  }
}

export function LogToConsoleError(message: any) {
  if (RUN_DEBUG === 'true') {
    console.error(message);
  }
}
