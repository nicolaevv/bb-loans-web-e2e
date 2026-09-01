type LogLevelSpec = {
  label: string;
  color: string;
  stream: 'log' | 'error';
};

type LogLevelMap<K extends string> = Readonly<Record<K, LogLevelSpec>>;

type LogMethod = (message: string, detail?: unknown) => void;

const RESET = '\x1b[0m';

class LevelLogger<K extends string> {
  constructor(levels: LogLevelMap<K>) {
    for (const level of Object.keys(levels) as K[]) {
      Object.defineProperty(this, level, {
        value: (message: string, detail?: unknown) => this.write(levels[level], message, detail),
        enumerable: true,
      });
    }
  }

  private write({ label, color, stream }: LogLevelSpec, message: string, detail?: unknown): void {
    const line = `[${new Date().toISOString()}] ${color}[${label}]${RESET} ${message}`;

    if (detail === undefined) {
      console[stream](line);
      return;
    }

    console[stream](line, detail);
  }
}

const LOG_LEVEL_SPECS = {
  step: { label: 'STEP', color: '\x1b[36m', stream: 'log' },
  info: { label: 'INFO', color: '\x1b[32m', stream: 'log' },
  error: { label: 'ERROR', color: '\x1b[31m', stream: 'error' },
} as const satisfies LogLevelMap<string>;

const levelLogger = <K extends string>(levels: LogLevelMap<K>) =>
  new LevelLogger(levels) as LevelLogger<K> & Readonly<Record<K, LogMethod>>;

export const Logger = levelLogger(LOG_LEVEL_SPECS);
