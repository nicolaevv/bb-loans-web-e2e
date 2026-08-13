export class Logger {
  // ANSI-коды цветов
  private static COLORS = {
    RESET: '\x1b[0m',
    GREEN: '\x1b[32m',
    CYAN: '\x1b[36m',
    RED: '\x1b[31m',
  };

  private static formatMessage(level: string, message: string, color: string = ''): string {
    const timestamp = new Date().toISOString();
    // Раскрашивается только сам тег уровня [INFO], [STEP], [ERROR]
    const formattedLevel = color 
      ? `${color}[${level}]${this.COLORS.RESET}` 
      : `[${level}]`;

    return `[${timestamp}] ${formattedLevel} ${message}`;
  }

  static step(stepName: string) {
    console.log(`\n${this.formatMessage('STEP', `---> ${stepName}`, this.COLORS.CYAN)}`);
  }

  static info(message: string) {
    console.log(this.formatMessage('INFO', message, this.COLORS.GREEN));
  }

  static error(message: string, error?: any) {
    console.error(this.formatMessage('ERROR', message, this.COLORS.RED), error || '');
  }
}