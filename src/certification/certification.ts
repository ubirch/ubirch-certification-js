import i18n from 'i18next';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  EError,
  EInfo,
  EUbirchCertificationStateKeys, EUbirchHashAlgorithms, EUbirchLanguages,
  EUbirchMessageTypes,
  EUbirchStages,
  EUppTypes,
  IUbirchCertificationConfig,
  IUbirchCertificationResult,
  IUbirchCertificationState,
  IUbirchError,
  IUbirchErrorDetails,
  IUbirchInfo,
  UbirchMessage,
} from '../models/models';
import {
  UbirchCertificationTools
} from './tools';

export class UbirchCertification {
  protected stage: EUbirchStages = EUbirchStages.prod;
  protected algorithm: EUbirchHashAlgorithms = EUbirchHashAlgorithms.SHA256;
  protected language?: EUbirchLanguages = EUbirchLanguages.en;
  type: EUppTypes = EUppTypes.signed

  protected messageSubject$: BehaviorSubject<UbirchMessage> = new BehaviorSubject<UbirchMessage>(null);
  private messenger$: Observable<UbirchMessage> = this.messageSubject$.asObservable();

  constructor(config: IUbirchCertificationConfig) {
    this.stage = config.stage || this.stage;
    this.type = config.uppType || this.type;
    this.algorithm = config.algorithm || this.algorithm;
    this.language = config.language || this.language;
  }

  public async certifyJson(json: string): Promise<IUbirchCertificationResult> {
    const certificationResult: IUbirchCertificationResult = this.createInitialUbirchCerTificationResult();

    return certificationResult;
  }

  public async certifyHash(hash: string): Promise<IUbirchCertificationResult> {
    const certificationResult: IUbirchCertificationResult = this.createInitialUbirchCerTificationResult();

    return certificationResult;
  }

  public get messenger(): Observable<UbirchMessage> {
    return this.messenger$;
  }

  protected log(logInfo: UbirchMessage): void {
    this.messageSubject$.next(logInfo);
  }

  protected handleError(code: EError, errorDetails?: IUbirchErrorDetails): void {
    const errorMsg: string =
      code === EError.CERTIFICATION_UNAVAILABLE && errorDetails
        ? i18n.t(`default:error.${code}`, { message: errorDetails.errorMessage })
        : i18n.t(`default:error.${code}`);

    const err: IUbirchError = {
      type: EUbirchMessageTypes.ERROR,
      message: errorMsg,
      code,
      errorDetails,
    };

    this.log(err);
    throw err;
  }

  protected handleInfo(code: EInfo): void {
    const infoMsg: string = i18n.t(`default:info.${code}`);

    const info: IUbirchInfo = {
      type: EUbirchMessageTypes.INFO,
      message: infoMsg,
      code,
    };

    this.log(info);
  }

  protected handleCertificationState(
    code: EUbirchCertificationStateKeys,
    result?: IUbirchCertificationResult
  ): void {
    const infoMsg: string = i18n.t(`default:verification-state.${code}`);

    const info: IUbirchCertificationState = {
      type: EUbirchMessageTypes.CERTIFICATION_STATE,
      message: infoMsg,
      code,
      result,
    };

    this.log(info);
  }

  protected createInitialUbirchCerTificationResult(): IUbirchCertificationResult {
      const result: IUbirchCertificationResult = {
        upp: undefined,
        creationTimestamp: undefined,
        certificationState: EUbirchCertificationStateKeys.CERTIFICATION_PENDING
      };

      return result;
    }
}

window['UbirchCertification'] = UbirchCertification;
