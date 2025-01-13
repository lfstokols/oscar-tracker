export function LogToConsole(message: string) {
  if (process.env.REACT_APP_RUN_DEBUG === 'true') {
    console.log(message);
  }
}
