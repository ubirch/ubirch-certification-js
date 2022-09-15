export enum EUbirchStages {
  local = 'local',
  dev = 'dev',
  demo = 'demo',
  qa = 'qa',
  prod = 'prod',
}

export enum EUbirchHashAlgorithms {
  SHA256 = 'sha256',
  SHA512 = 'sha512',
}

export enum EUbirchLanguages {
  de = 'de',
  en = 'en',
}

export enum EUppStates {
  created = 'created',
  anchored = 'anchored',
}

export enum EUppTypes {
  chained = 'chained',
  signed = 'signed',
}

export interface IUbirchUpp {
  upp: string;
  state: EUppStates;
  type: EUppTypes;
}

export interface IUbirchCertificationResult {
  certificationState: EUbirchCertificationStateKeys;
  upp: IUbirchUpp;
  creationTimestamp: string;
  rawData?: IUbirchCertificationResponse;
  failReason?: EError;
}

export enum EUbirchCertificationStateKeys {
  CERTIFICATION_PENDING = 'CERTIFICATION_PENDING',
  CERTIFICATION_FAILED = 'CERTIFICATION_FAILED',
  CERTIFICATION_SUCCESSFUL = 'CERTIFICATION_SUCCESSFUL',
}

export interface IUbirchCertificationResponse {
  version: string,
  ok: boolean,
  data: {
    status: number,
    headers: any,
    body:{
      hash: string,
      upp: string,
      publicKey: string,
      response:{
        statusCode: number,
        header: any,
        'X-Err': string[]
      }
      content: string
    }
  }
}

export interface IUbirchCertificationConfig {
  stage?: EUbirchStages;
  uppType?: EUppTypes;
  algorithm?: EUbirchHashAlgorithms;
  language?: EUbirchLanguages;
}

export interface IUbirchInfo {
  type: EUbirchMessageTypes.INFO;
  message: string;
  code: EInfo;
}

export interface IUbirchError {
  type: EUbirchMessageTypes.ERROR;
  message: string;
  code: EError;
  errorDetails?: IUbirchErrorDetails;
}

export interface IUbirchCertificationState {
  type: EUbirchMessageTypes.CERTIFICATION_STATE;
  message: string;
  code: EUbirchCertificationStateKeys;
  result?: IUbirchCertificationResult;
}

export type UbirchMessage = IUbirchInfo | IUbirchError | IUbirchCertificationState;

export enum EInfo {
}

export enum EError {
  CERTIFICATION_UNAVAILABLE = 'CERTIFICATION_UNAVAILABLE',
}

export interface IUbirchErrorDetails {
  errorMessage?: string;
}

export enum EUbirchMessageTypes {
  INFO = 'info',
  ERROR = 'error',
  CERTIFICATION_STATE = 'certification-state',
}
