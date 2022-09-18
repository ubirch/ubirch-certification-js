import { BehaviorSubject, Observable } from 'rxjs';
import environment from '../environment';
import {
  EError,
  EInfo,
  EUbirchCertificationStateKeys,
  EUbirchHashAlgorithms,
  EUbirchLanguages,
  EUbirchMessageTypes,
  EUbirchStages,
  EUppStates,
  EUppTypes,
  IUbirchCertificationConfig,
  IUbirchCertificationResult,
  IUbirchCertificationState,
  IUbirchError,
  IUbirchErrorDetails,
  IUbirchInfo,
  IUbirchSignedCertificationResponse,
  IUbirchUpp,
  UbirchMessage,
} from '../models/models';
import i18n from '../utils/translations';
import { UbirchCertificationTools } from './tools';

export class UbirchCertification {
  protected stage: EUbirchStages = EUbirchStages.prod;
  protected algorithm: EUbirchHashAlgorithms = EUbirchHashAlgorithms.SHA256;
  protected language?: EUbirchLanguages = EUbirchLanguages.en;
  protected deviceId: string;
  type: EUppTypes = EUppTypes.SIGNED

  protected messageSubject$: BehaviorSubject<UbirchMessage> = new BehaviorSubject<UbirchMessage>(null);
  private messenger$: Observable<UbirchMessage> = this.messageSubject$.asObservable();

  constructor(config: IUbirchCertificationConfig) {
    if (!config.deviceId) {
      this.handleError(EError.MISSING_DEVICE_ID);
    }
    this.deviceId = config.deviceId;

    this.stage = config.stage || this.stage;
    this.type = config.uppType || this.type;
    this.algorithm = config.algorithm || this.algorithm;
    this.language = config.language || this.language;
  }

  public async certifyJSONString(jsonStr: string, uppType: EUppTypes = EUppTypes.SIGNED): Promise<IUbirchCertificationResult> {
    try {
      const data = JSON.parse(jsonStr);
      return this.certifyJson(data, uppType);
    } catch (e) {
      const certificationResult: IUbirchCertificationResult = this.createInitialUbirchCertificationResult();
      certificationResult.certificationState = EUbirchCertificationStateKeys.CERTIFICATION_FAILED;
      certificationResult.failed = {
        code: EError.JSON_MALFORMED,
        message: e.message
      };
      this.handleCertificationState(certificationResult);
      return certificationResult;
    }
  }

  public async certifyJson(json: any, uppType: EUppTypes = EUppTypes.SIGNED): Promise<IUbirchCertificationResult> {
    let certificationResult: IUbirchCertificationResult = this.createInitialUbirchCertificationResult();
    this.handleCertificationState(certificationResult);

    try {
      let hash: string;
      let originalPayload: Uint8Array;

      switch (uppType) {
        case EUppTypes.SIGNED:
          originalPayload = UbirchCertificationTools.getMsgPackPayload(json);
          hash = UbirchCertificationTools.getHashedPayload(originalPayload);
          break;
        case EUppTypes.CHAINED:
        default:
          certificationResult.certificationState = EUbirchCertificationStateKeys.CERTIFICATION_FAILED;
          certificationResult.failed = {
            code: EError.NOT_YET_IMPLEMENTED
          };
          this.handleCertificationState(certificationResult);
          return certificationResult;
      }

      certificationResult.upp = await this.certifyHash(hash, uppType, originalPayload);
      certificationResult.certificationState = EUbirchCertificationStateKeys.CERTIFICATION_SUCCESSFUL;
    } catch (e) {
      certificationResult.certificationState = EUbirchCertificationStateKeys.CERTIFICATION_FAILED;
      certificationResult.failed = {
        code: e.code || EError.UNKNOWN_ERROR,
        message: e.message
      };
      this.handleCertificationState(certificationResult);
    }
    return certificationResult;
  }

  public async certifyHash(hash: string, uppType: EUppTypes = EUppTypes.SIGNED, originalPayload?: Uint8Array): Promise<IUbirchUpp> {
    switch (uppType) {
      case EUppTypes.SIGNED:
        const signedUpp: IUbirchSignedCertificationResponse = await this.callSignedCertification(hash);
        return this.getSignedUpp(signedUpp, originalPayload);
      case EUppTypes.CHAINED:
        this.handleError(EError.NOT_YET_IMPLEMENTED);
        return undefined;
    }
  }

  public get messenger(): Observable<UbirchMessage> {
    return this.messenger$;
  }

  private async callSignedCertification (hash): Promise<IUbirchSignedCertificationResponse> {
    const verificationUrl = environment.certify_api_url[this.stage];
    const self = this;

    const options = {
      method: 'POST',
      body: hash,
      headers: {
        'Content-type': 'text/plain',
        'X-UPP-Type-Id': 'signed',
        'X-Identity-Id':this.deviceId
      }
    };

    return fetch(verificationUrl, options)
      .catch((err) => err.message as string)
      .then((response) => {
        if (typeof response === 'string') {
          return self.handleError(EError.CERTIFICATION_UNAVAILABLE, { errorMessage: response });
        }

        switch (response.status) {
          case 200: {
            return response.json();
          }
          case 404: {
            self.handleError(EError.ID_CANNOT_BE_FOUND);
          }
          case 401: {
            self.handleError(EError.NOT_AUTHORIZED);
          }
          case 403: {
            self.handleError(EError.NOT_AUTHORIZED);
          }
          case 405: {
            self.handleError(EError.NOT_AUTHORIZED);
          }
          case 409: {
            self.handleError(EError.CRTIFICATE_ALREADY_EXISTS);
          }
          case 500: {
            self.handleError(EError.INTERNAL_SERVER_ERROR);
          }
          default: {
            self.handleError(EError.UNKNOWN_ERROR);
          }
        }
      });
  }

  protected getSignedUpp(resultObj: IUbirchSignedCertificationResponse, msgPackPayload: Uint8Array): IUbirchUpp {
    try {
      const upp: Buffer = UbirchCertificationTools.extractSignedUpp(resultObj);
      const uppWithMsgPackPayload: Uint8Array = UbirchCertificationTools.replaceHashByMsgPackInUpp(upp, msgPackPayload);
      const signedUpp: string = UbirchCertificationTools.packSignedUpp(uppWithMsgPackPayload);
      return {
        upp: signedUpp,
        state: EUppStates.created,
        type: EUppTypes.SIGNED
      } as IUbirchUpp;
    } catch (e) {

    }
    return undefined;
  }

  private formatJSON(json: string, sort = true): string {
    try {
      const object: { [key: string]: any } = JSON.parse(json);
      return JSON.stringify(sort ? this.sortObjectRecursive(object) : object);
    } catch (e) {
      this.handleError(EError.JSON_MALFORMED, { errorMessage: e.message });
    }
  }

  protected sortObjectRecursive(object: unknown): unknown {
    // recursive termination condition
    if (typeof object !== 'object') {
      return object;
    } else if (Array.isArray(object)) {
      return object.map(item => this.sortObjectRecursive(item));
    } else {
      const objectSorted: { [key: string]: any } = {};
      const keysOrdered: { [key: string]: any } = Object.keys(object).sort();
      keysOrdered.forEach(
        (key: string) => (objectSorted[key] = this.sortObjectRecursive(object[key]))
      );

      return objectSorted;
    }
  }

  protected log(logInfo: UbirchMessage): void {
    this.messageSubject$.next(logInfo);
  }

  protected handleError(code: EError, errorDetails?: IUbirchErrorDetails): void {
    const errorMsg: string =
      code === (EError.CERTIFICATION_UNAVAILABLE || EError.CERTIFICATION_CALL_ERROR) && errorDetails
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
    result: IUbirchCertificationResult
  ): void {
    const code = result.certificationState || EUbirchCertificationStateKeys.CERTIFICATION_STATE_UNDEFINED;
    const infoMsg: string = i18n.t(`default:verification-state.${code}`);

    const info: IUbirchCertificationState = {
      type: EUbirchMessageTypes.CERTIFICATION_STATE,
      message: infoMsg,
      code,
      result,
    };

    this.log(info);
  }

  protected createInitialUbirchCertificationResult(): IUbirchCertificationResult {
      const result: IUbirchCertificationResult = {
        upp: undefined,
        certificationState: EUbirchCertificationStateKeys.CERTIFICATION_PENDING
      };

      return result;
    }
}

window['UbirchCertification'] = UbirchCertification;
