import i18n from '../utils/translations';
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
    const certificationResult: IUbirchCertificationResult = this.createInitialUbirchCerTificationResult();
    try {
      const data = JSON.parse(jsonStr);
      return this.certifyJson(data, uppType);
    } catch (e) {
      this.handleError(EError.JSON_MALFORMED, {errorMessage: e.message})
    }
  }

  public async certifyJson(json: any, uppType: EUppTypes = EUppTypes.SIGNED): Promise<IUbirchCertificationResult> {
    let certificationResult: IUbirchCertificationResult = this.createInitialUbirchCerTificationResult();
    try {
      const hash: string = this.createHash(json, uppType);
      return await this.certifyHash(hash, uppType);
    } catch (e) {
      if (e.isTypeOf(EError)) {
        this.handleError(e.code, e.message);
      } else {
        this.handleError(EError.UNKNOWN_ERROR);
      }
    }
    return certificationResult;
  }

  public async certifyHash(hash: string, uppType: EUppTypes = EUppTypes.SIGNED, originalPayload?: Uint8Array): Promise<IUbirchCertificationResult> {
    switch (uppType) {
      case EUppTypes.SIGNED:
        const signedUpp: IUbirchSignedCertificationResponse = await this.callSignedCertification(hash);
        const upp: IUbirchUpp = this.getSignedUpp(signedUpp, originalPayload);

        break;
      case EUppTypes.CHAINED:
        this.handleError(EError.NOT_YET_IMPLEMENTED);
        return undefined;
    }
  }

  public get messenger(): Observable<UbirchMessage> {
    return this.messenger$;
  }

  private createHash(json: any, uppType: EUppTypes = EUppTypes.SIGNED): string {
    let hash: string;
    switch (uppType) {
      case EUppTypes.SIGNED:
        const msgPackPayload: Uint8Array = UbirchCertificationTools.getMsgPackPayload(json);
        hash = UbirchCertificationTools.getHashedPayload(msgPackPayload);
        break;
      case EUppTypes.CHAINED:
        const sortedJsonStr = this.formatJSON(json);
        hash = UbirchCertificationTools.getHashedPayload(sortedJsonStr);
        break;
      default:
        hash = UbirchCertificationTools.getHashedPayload(json);
        break;
    }
    return hash;
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
