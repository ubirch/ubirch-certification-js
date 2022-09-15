import zlib from 'zlib';
import { encode, decode }  from '@msgpack/msgpack';
import { createHash } from 'crypto';
import * as base45 from 'base45';

export class UbirchCertificationTools {
  protected static ProtocolVersion = 2;

// Commented out as it is currently not used
// const PLAIN = (ProtocolVersion << 4) | 0x01
  private static SIGNED = (UbirchCertificationTools.ProtocolVersion << 4) | 0x02;
  private static CHAINED = (UbirchCertificationTools.ProtocolVersion << 4) | 0x03;
  private static CERT_PREFIX = "C01:";

  public static getMsgPackPayload (jsonPayload: string) {
    return encode(jsonPayload);
  }

  public static getHashedPayload (payload): string {
    return createHash('sha256').update(payload).digest('base64');
  }

  public static replaceHashByMsgPackInUpp(hashUpp: string, msgPackPayload: Uint8Array) {
    let unpacked_upp: any[] = decode(Buffer.from(hashUpp, 'base64')) as any[];
    const uppLength = unpacked_upp.length;

    unpacked_upp[uppLength - 2] = msgPackPayload;
    unpacked_upp[uppLength - 3] = UbirchCertificationTools.SIGNED;

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
};
