type EnvKeyMap<K extends string> = Readonly<Record<K, string>>;

type ResolvedEnv<K extends string, V> = Readonly<Record<K, V>>;

abstract class EnvConfig<K extends string, V> {
  constructor(
    protected readonly keys: EnvKeyMap<K>,
    protected readonly prefix: string = ''
  ) {
    for (const property of Object.keys(keys) as K[]) {
      Object.defineProperty(this, property, {
        get: () => this.get(property),
        enumerable: true,
      });
    }
  }

  get(key: K): V {
    return this.read(`${this.prefix}${this.keys[key]}`);
  }

  all(): Record<K, V> {
    return (Object.keys(this.keys) as K[]).reduce(
      (resolved, key) => {
        resolved[key] = this.get(key);
        return resolved;
      },
      {} as Record<K, V>
    );
  }

  protected abstract read(variable: string): V;
}

class RequiredEnv<K extends string> extends EnvConfig<K, string> {
  protected read(variable: string): string {
    const value = process.env[variable];

    if (!value) {
      throw new Error(
        `Missing required environment variable "${variable}". Add it to your .env file (see .env.example).`
      );
    }

    return value;
  }
}

class FlagEnv<K extends string> extends EnvConfig<K, boolean> {
  protected read(variable: string): boolean {
    return !!process.env[variable];
  }
}

const requiredEnv = <K extends string>(keys: EnvKeyMap<K>, prefix?: string) =>
  new RequiredEnv(keys, prefix) as RequiredEnv<K> & ResolvedEnv<K, string>;

const flagEnv = <K extends string>(keys: EnvKeyMap<K>) =>
  new FlagEnv(keys) as FlagEnv<K> & ResolvedEnv<K, boolean>;

const URL_ENV_KEYS = {
  base: 'BASE_URL',
  products: 'PRODUCTS_URL',
  loanApplication: 'LOAN_APPLICATION_URL',
  loanOriginationApi: 'LOAN_ORIGINATION_API_URL',
  shellBff: 'SHELL_BFF_URL',
} as const;

const UI_CREDENTIAL_ENV_KEYS = {
  username: 'UI_USERNAME',
  password: 'UI_PASSWORD',
} as const;

const API_CREDENTIAL_ENV_KEYS = {
  clientId: 'API_CLIENT_ID',
  clientSecret: 'API_CLIENT_SECRET',
  tokenUrl: 'API_TOKEN_URL',
} as const;

const COMPANY_ID_ENV_KEYS = {
  TRANCHE: 'TRANCHE_COMPANY_ID',
  LOAN: 'LOAN_COMPANY_ID',
  ORDINARY_GUARANTY: 'ORDYNARY_GUARANTY_COMPANY_ID',
  LINE_GUARANTY: 'LINE_GUARANTY_COMPANY_ID',
} as const;

const RUN_FLAG_ENV_KEYS = {
  isCi: 'CI',
  forceAuth: 'FORCE_AUTH',
} as const;

export type CompanyIdKey = keyof typeof COMPANY_ID_ENV_KEYS;

export type Credentials = ResolvedEnv<keyof typeof UI_CREDENTIAL_ENV_KEYS, string>;

export const ENV = {
  urls: requiredEnv(URL_ENV_KEYS),
  ui: requiredEnv(UI_CREDENTIAL_ENV_KEYS),
  bnplUi: requiredEnv(UI_CREDENTIAL_ENV_KEYS, 'BNPL_'),
  api: requiredEnv(API_CREDENTIAL_ENV_KEYS),
  companies: requiredEnv(COMPANY_ID_ENV_KEYS),
  flags: flagEnv(RUN_FLAG_ENV_KEYS),
} as const;
