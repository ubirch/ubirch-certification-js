import i18n from '../utils/translations';
import { decode, encode } from '@msgpack/msgpack';
import * as base45 from 'base45';
import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import zlib from 'zlib';
import { EError, EUppStates, EUppTypes, IUbirchError, IUbirchSignedCertificationResponse, IUbirchUpp } from '../models/models';

export class UbirchCertificationTools {
  protected static ProtocolVersion = 2;

// Commented out as it is currently not used
// const PLAIN = (ProtocolVersion << 4) | 0x01
  private static SIGNED = (UbirchCertificationTools.ProtocolVersion << 4) | 0x02;
  private static CHAINED = (UbirchCertificationTools.ProtocolVersion << 4) | 0x03;
  public static UPP_TYPE = {
    CHAINED: 0x00,
    SIGNED: 0xEE
  }

  private static CERT_PREFIX = "C01:";

  public static getMsgPackPayload (jsonPayload: any): Uint8Array {
    return encode(jsonPayload);
  }

  public static getHashedPayload (payload): string {
    return createHash('sha256').update(payload).digest('base64');
  }

  public static replaceHashByMsgPackInUpp(hashUpp: Buffer, msgPackPayload: Uint8Array) {
    let unpacked_upp: any[] = decode(hashUpp) as any[];
    const uppLength = unpacked_upp.length;

    unpacked_upp[uppLength - 2] = msgPackPayload;
    unpacked_upp[uppLength - 3] = UbirchCertificationTools.UPP_TYPE.SIGNED;

    return encode(unpacked_upp);
  }

  /**
   * C01:BASE45_STRING(COMPRESS_ZLIB(NEW UPP))
   * @param msgPackUpp: UInt8Array
   * @returns {string} signed UPP
   */
  public static packSignedUpp(msgPackUpp: Uint8Array): string {
    const buf = Buffer.from(msgPackUpp);
    const zlibbed_upp = zlib.deflateSync(buf);

    const base45ed_upp = base45.encode(zlibbed_upp);

    return UbirchCertificationTools.CERT_PREFIX + base45ed_upp;
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

    return Buffer.from(resultObj.data.body.upp, 'base64');
  }
}
