import {
  EUbirchStages,
  IUbirchCertificationConfig,
  UbirchMessage,
} from '../../models/models';
import { UbirchCertification } from '../certification';
import { UbirchCertificationTools } from '../tools';
import * as exampleJSON from './example.json';

global.fetch = jest.fn();

const deepCopy = <T>(obj: T) => JSON.parse(JSON.stringify(obj)) as T;

class UbirchCertificationMock extends UbirchCertification {
  constructor(config: IUbirchCertificationConfig) {
    super(config);
  }
  public log(logInfo: UbirchMessage): void {
    super.log(logInfo);
  }
}

class UbirchCertificationToolsMock extends UbirchCertificationTools {
  public static getMsgPackPayload(jsonPayload: string) {
    return super.getMsgPackPayload(jsonPayload);
  }
  public static getHashedPayload(payload: any) {
    return super.getHashedPayload(payload);
  }
  public static replaceHashByMsgPackInUpp(hashUpp, msgPackPayload) {
    return super.replaceHashByMsgPackInUpp(hashUpp, msgPackPayload);
  }
  public static packSignedUpp(upp): string {
    return super.packSignedUpp(upp);
  }

}

const jsonPayloadStr = '{"id":"0001","type":"donut","name":"Cake","ppu":0.55,"batters":{"batter":[{"id":1001,"type":"Regular"},{"id":1002,"type":"Chocolate"},{"id":1003,"type":"Blueberry"}]},"topping":[{"id":5001,"type":"None"},{"id":5002,"type":"Glazed"},{"id":5005,"type":"Sugar"},{"id":5007,"type":"Powdered Sugar"},{"id":5006,"type":"Chocolate with Sprinkles"},{"id":5003,"type":"Chocolate"},{"id":5004,"type":"Maple"}]}';
const expectedMsgPackPayload = "86a26964a430303031a474797065a5646f6e7574a46e616d65a443616b65a3707075cb3fe199999999999aa76261747465727381a66261747465729382a26964cd03e9a474797065a7526567756c617282a26964cd03eaa474797065a943686f636f6c61746582a26964cd03eba474797065a9426c75656265727279a7746f7070696e679782a26964cd1389a474797065a44e6f6e6582a26964cd138aa474797065a6476c617a656482a26964cd138da474797065a5537567617282a26964cd138fa474797065ae506f77646572656420537567617282a26964cd138ea474797065b843686f636f6c617465207769746820537072696e6b6c657382a26964cd138ba474797065a943686f636f6c61746582a26964cd138ca474797065a54d61706c65";
const upp = "lSLEEFjc3bREqFSCqXOVVBOUwLoAxCA4CSN9J2/kHfv6U93LoiIlKhxLYkG17M+IlUCB/rtTN8RA59VexuYkHGlHeZggox3ZorLouWvGICW2ZPNB2wTDMXJY0sm7w8H89CXCp/sQQVhOWTsHQFWTv2YhLj6e6akNew=="
const hashExpected = "WFOCrSiXH+1MYYp2sL918SDsL4XLVePLCHFm11hrJqc=";
let certifier: UbirchCertificationMock;

const defaultSettings: IUbirchCertificationConfig = {
  stage: EUbirchStages.dev,
};


describe('UbirchCertification', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear().mockReset();
    certifier = new UbirchCertificationMock(defaultSettings);
  });

  describe('certify', () => {
    describe('packaging msgPack payload', () => {
      test('should create MsgPack from JSON and hash it with sha256 on base64', () => {
        const data = JSON.stringify(exampleJSON['default']);
        console.log(data);
        expect(data).toEqual(jsonPayloadStr);

        // TODO: implement
      });
    })
  });
});

function uInt8Array2Hex(val) {
  return Buffer.from(val).toString('hex');
}
