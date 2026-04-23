export function logIntegration(event: string, metadata: any, level: 'info' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] Integration Event: ${event} | Data: ${JSON.stringify(metadata)}`;
  
  if (level === 'error') {
    console.error(logEntry);
  } else {
    console.log(logEntry);
  }
}
