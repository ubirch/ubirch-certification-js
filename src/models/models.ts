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
  CHAINED = 'CHAINED',
  SIGNED = 'SIGNED',
//  PLAIN = 'PLAIN'
}

export interface IUbirchUpp {
  upp: string;
  state: EUppStates;
  type: EUppTypes;
}

export interface IUbirchCertificationResult {
  certificationState: EUbirchCertificationStateKeys;
  upp: IUbirchUpp;
  failed?: {
    code: EError;
    message?: string;
  }
}

export enum EUbirchCertificationStateKeys {
  CERTIFICATION_PENDING = 'CERTIFICATION_PENDING',
  CERTIFICATION_FAILED = 'CERTIFICATION_FAILED',
  CERTIFICATION_SUCCESSFUL = 'CERTIFICATION_SUCCESSFUL',
  CERTIFICATION_STATE_UNDEFINED = 'CERTIFICATION_STATE_UNDEFINED'
}

export interface IUbirchSignedCertificationResponse {
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
        header: {
          'X-Err'?: string[]
        },
      }
      content: string
    }
  }
}

export interface IUbirchCertificationConfig {
  deviceId: string;
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

export interface IUbirchStagesURLs {
  local?: string;
  dev?: string;
  demo?: string;
  prod?: string;
}

export interface IUbirchCertificationEnvConfig {
  certify_api_url: IUbirchStagesURLs;
}

export type UbirchMessage = IUbirchInfo | IUbirchError | IUbirchCertificationState;

export enum EInfo {
}

export enum EError {
  CERTIFICATION_UNAVAILABLE = 'CERTIFICATION_UNAVAILABLE',
  CERTIFICATION_CALL_ERROR = 'CERTIFICATION_CALL_ERROR',
  CERTIFICATION_FAILED_NO_UPP = 'CERTIFICATION_FAILED_NO_UPP',
  MISSING_DEVICE_ID = 'MISSING_DEVICE_ID',
  JSON_MALFORMED = 'JSON_MALFORMED',
  ID_CANNOT_BE_FOUND = 'ID_CANNOT_BE_FOUND',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  CRTIFICATE_ALREADY_EXISTS = 'CRTIFICATE_ALREADY_EXISTS',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERRORD',
  NOT_YET_IMPLEMENTED = 'NOT_YET_IMPLEMENTED',
  NA401_1000 = 'NA401-1000',
  NA401_2000 = 'NA401-2000',
  NA401_3000 = 'NA401-3000',
  NA401_4000 = 'NA401-4000',
  ND403_1100 = 'ND403-1100',
  ND403_1200 = 'ND403-1200',
  ND403_1300 = 'ND403-1300',
  ND400_2100 = 'ND400-2100',
  ND403_2200 = 'ND403-2200',
  ND400_2300 = 'ND400-2300',
  NE400_1000 = 'NE400-1000',
  NE400_2000 = 'NE400-2000',
  NE404_0000 = 'NE404-0000',
  NF409_0000 = 'NF409-0000',
  NF409_0010 = 'NF409-0010',
  NF409_0020 = 'NF409-0020',
  NF409_0030 = 'NF409-0030'
}

export interface IUbirchErrorDetails {
  errorMessage?: string;
}

export enum EUbirchMessageTypes {
  INFO = 'info',
  ERROR = 'error',
  CERTIFICATION_STATE = 'certification-state',
}
