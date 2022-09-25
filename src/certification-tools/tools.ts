import UbirchProtocol from '@ubirch/ubirch-protocol-verifier/src/upp';
import { Buffer } from 'buffer';
import { EError, IUbirchError, IUbirchSignedCertificationResponse } from '../models/models';
import i18n from '../utils/translations';

export class UbirchCertificationTools {
  protected static ProtocolVersion = 2;

  public static getMsgPackPayload (jsonPayload: any): Uint8Array {
    return UbirchProtocol.tools.createMsgPackPayloadFromJSON(jsonPayload);
  }

  public static getHashedPayload (payload): string {
    return UbirchProtocol.tools.getHashedPayload(payload);
  }

  public static replaceHashByMsgPackInUpp(hashUpp: Buffer, msgPackPayload: Uint8Array) {
    return UbirchProtocol.tools.replaceHashByMsgPackInUpp(hashUpp, msgPackPayload);
  }

  /**
   * C01:BASE45_STRING(COMPRESS_ZLIB(NEW UPP))
   * @param msgPackUpp: UInt8Array
   * @returns {string} signed UPP
   */
  public static packSignedUpp(msgPackUpp: Uint8Array): string {
    return UbirchProtocol.tools.packSignedUpp(msgPackUpp);
  }

  public static extractSignedUpp(resultObj: IUbirchSignedCertificationResponse): Buffer {

    const data = resultObj?.data?.body;
    if (!data) {
      throw { code: EError.UNKNOWN_ERROR } as IUbirchError;
    }
    if (data.response.header && data.response.header['X-Err'] && data.response.header['X-Err'].length > 0){
      let message = '';
      data.response.header['X-Err'].forEach(err => {
        message += i18n.t(`default:error.${err}`);
        message += '\n';
      })
      throw { code: EError.CERTIFICATION_CALL_ERROR, message: message } as IUbirchError;
    }

    if (!resultObj?.data?.body?.upp || !resultObj.data.body.upp.length) {
      throw { code: EError.CERTIFICATION_FAILED_NO_UPP } as IUbirchError;
    }

    return UbirchProtocol.tools.unpackBase64String(resultObj.data.body.upp);
  }
}

window['UbirchCertificationTools'] = UbirchCertificationTools;
