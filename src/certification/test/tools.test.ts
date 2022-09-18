import { decode } from '@msgpack/msgpack';
import { UbirchCertificationTools } from '../tools';
import { Buffer } from 'buffer';
import * as exampleJson from './example.json';
import * as testResp from './testresp.json';
import * as errorresp from './errorresp.json';

global.fetch = jest.fn();

const exampleJsonData = exampleJson['default'];
const jsonPayloadStr = '{"id":"0001","type":"donut","name":"Cake","ppu":0.55,"batters":{"batter":[{"id":1001,"type":"Regular"},{"id":1002,"type":"Chocolate"},{"id":1003,"type":"Blueberry"}]},"topping":[{"id":5001,"type":"None"},{"id":5002,"type":"Glazed"},{"id":5005,"type":"Sugar"},{"id":5007,"type":"Powdered Sugar"},{"id":5006,"type":"Chocolate with Sprinkles"},{"id":5003,"type":"Chocolate"},{"id":5004,"type":"Maple"}]}';
const jsonPayloadTxt = '{\n' +
  '\t"id": "0001",\n' +
  '\t"type": "donut",\n' +
  '\t"name": "Cake",\n' +
  '\t"ppu": 0.55,\n' +
  '\t"batters":\n' +
  '\t\t{\n' +
  '\t\t\t"batter":\n' +
  '\t\t\t\t[\n' +
  '\t\t\t\t\t{ "id": 1001, "type": "Regular" },\n' +
  '\t\t\t\t\t{ "id": 1002, "type": "Chocolate" },\n' +
  '\t\t\t\t\t{ "id": 1003, "type": "Blueberry" }\n' +
  '\t\t\t\t]\n' +
  '\t\t},\n' +
  '\t"topping":\n' +
  '\t\t[\n' +
  '\t\t\t{ "id": 5001, "type": "None" },\n' +
  '\t\t\t{ "id": 5002, "type": "Glazed" },\n' +
  '\t\t\t{ "id": 5005, "type": "Sugar" },\n' +
  '\t\t\t{ "id": 5007, "type": "Powdered Sugar" },\n' +
  '\t\t\t{ "id": 5006, "type": "Chocolate with Sprinkles" },\n' +
  '\t\t\t{ "id": 5003, "type": "Chocolate" },\n' +
  '\t\t\t{ "id": 5004, "type": "Maple" }\n' +
  '\t\t]\n' +
  '}\n';
const expectedMsgPackPayload = "86a26964a430303031a474797065a5646f6e7574a46e616d65a443616b65a3707075cb3fe199999999999aa76261747465727381a66261747465729382a26964cd03e9a474797065a7526567756c617282a26964cd03eaa474797065a943686f636f6c61746582a26964cd03eba474797065a9426c75656265727279a7746f7070696e679782a26964cd1389a474797065a44e6f6e6582a26964cd138aa474797065a6476c617a656482a26964cd138da474797065a5537567617282a26964cd138fa474797065ae506f77646572656420537567617282a26964cd138ea474797065b843686f636f6c617465207769746820537072696e6b6c657382a26964cd138ba474797065a943686f636f6c61746582a26964cd138ca474797065a54d61706c65";
const hashExpected = "WFOCrSiXH+1MYYp2sL918SDsL4XLVePLCHFm11hrJqc=";

const testRespData = testResp['default'];
const errorRespData = errorresp['default'];
const uppWithHash = "9522c41058dcddb444a85482a97395541394c0ba00c420d2fef7e1018876211991177c3d052bf5dc75a9bb199d226f09caa64670b165dac4400c777b833cc77f298c4627661c6bd73a327d123e007872a2f8489604c9589127104bd06c2a24073869475b23503f9af7385f7f86dbab8f461634413a2df07965";
const uppWithMsgPack = "9522c41058dcddb444a85482a97395541394c0bacceec5012386a26964a430303031a474797065a5646f6e7574a46e616d65a443616b65a3707075cb3fe199999999999aa76261747465727381a66261747465729382a26964cd03e9a474797065a7526567756c617282a26964cd03eaa474797065a943686f636f6c61746582a26964cd03eba474797065a9426c75656265727279a7746f7070696e679782a26964cd1389a474797065a44e6f6e6582a26964cd138aa474797065a6476c617a656482a26964cd138da474797065a5537567617282a26964cd138fa474797065ae506f77646572656420537567617282a26964cd138ea474797065b843686f636f6c617465207769746820537072696e6b6c657382a26964cd138ba474797065a943686f636f6c61746582a26964cd138ca474797065a54d61706c65c4400c777b833cc77f298c4627661c6bd73a327d123e007872a2f8489604c9589127104bd06c2a24073869475b23503f9af7385f7f86dbab8f461634413a2df07965";
const exprectedSignedUpp = "C01:6BFPUJJVE374$6Q1W54L50NJ- 2FT1H1K-AC2IJL:8N.II$2F0L$966469UBLIAFDITQ6D28A MHC9/JCRQTMDTD.T$+O5W0EAL.04SP0$FBUQIEN9QJAUKHL5J 43STJTNFVI6:R02TBHZI8/BASI6N0%OF8$2:NTJII0 JASI KIM92FT14+E/95VY9.V57OL0/BA2CRCII5J/U3+Z5O91Z:BP7JS-0C26.S0XAB52K.8B6LJ-B2*$GAO6LQ6FLDP8E%7BMZBM:FFI97DA5KHKMIE/38ID1$R:G1AGJK733IO.Z88IF1D73-OK$8CHR$I50L0E8PTHME25Y8H52AQ*EQ1QRNF+ 3.:UTKJ XTB.84I8XN1SZ8L:FPT9$97PA6F%BHYV71I2G1A 8XSFHLE53W6AULQU7*DJ5B*VNTGJ8MBO0GLR9*40TT6.0";

describe('UbirchCertificationTools', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear().mockReset();
  });

  describe('packaging msgPack payload', () => {
    test('should create same JSON from string with newlines and spaces or trimmed', () => {
      const data = JSON.parse(jsonPayloadStr);
      console.log(data);
      console.log(data.batters);

      const data2 = JSON.parse(jsonPayloadTxt);
      console.log(data2);
      console.log(data2.batters);

      expect(data).toEqual(data2);
      expect(data).toEqual(exampleJsonData);
    });

    test('should create MsgPack from JSON and hash it with sha256 on base64', () => {
      const data = JSON.parse(jsonPayloadStr);

      const msgPackPayload = UbirchCertificationTools.getMsgPackPayload(data);
      console.log(msgPackPayload);
      const masPackPayloadInHex = uInt8Array2Hex(msgPackPayload);
      console.log(masPackPayloadInHex);
      expect(msgPackPayload).toBeDefined();
      expect(masPackPayloadInHex).toBeDefined();
      expect(masPackPayloadInHex).toEqual(expectedMsgPackPayload);

      const hash = UbirchCertificationTools.getHashedPayload(msgPackPayload);
      console.log(hash);
      expect(hash).toBeDefined();
      expect(hash).toEqual(hashExpected);
    });
  });

  describe('create signed UPP from certification response', () => {
    test('should extract upp from successful response', () => {
      const upp: Buffer = UbirchCertificationTools.extractSignedUpp(testRespData);
      console.log(upp.toString('hex'));
      expect(upp.toString('hex')).toEqual(uppWithHash);
    });

    test('CERT_TYPE should be replaced by 0xEE', () => {
      const CERT_TYPE = 0xEE;
      console.log(`CERT_TYPE: ${CERT_TYPE}`);
      console.log(`UbirchCertificationTools.UPP_TYPE.SIGNED: ${UbirchCertificationTools.UPP_TYPE.SIGNED}`);
      expect(UbirchCertificationTools.UPP_TYPE.SIGNED).toEqual(CERT_TYPE);
    });

    test('should replace hash by original msgPack in upp from successful response to same result as python lib', () => {
      const data = JSON.parse(jsonPayloadStr);
      const msgPackPayload = UbirchCertificationTools.getMsgPackPayload(data);

      const upp: Buffer = UbirchCertificationTools.extractSignedUpp(testRespData);

      const uppWithMsgPackPayload: Uint8Array = UbirchCertificationTools.replaceHashByMsgPackInUpp(upp, msgPackPayload);
      const uppWithMsgPackPayloadInHex = uInt8Array2Hex(uppWithMsgPackPayload);
      console.log(uppWithMsgPackPayloadInHex);
      expect(uppWithMsgPackPayloadInHex).toBeDefined();
      expect(uppWithMsgPackPayloadInHex).toEqual(uppWithMsgPack);
    });

    test('should create same certificate from data as python lib', () => {
      const data = JSON.parse(jsonPayloadStr);
      const msgPackPayload = UbirchCertificationTools.getMsgPackPayload(data);

      const upp: Buffer = UbirchCertificationTools.extractSignedUpp(testRespData);

      const uppWithMsgPackPayload: Uint8Array = UbirchCertificationTools.replaceHashByMsgPackInUpp(upp, msgPackPayload);
      const cert: string = UbirchCertificationTools.packSignedUpp(uppWithMsgPackPayload);
      console.log(cert);
      expect(cert).toEqual(exprectedSignedUpp);
    });
  });

  describe('handle errors which occurred during certification response', () => {
    test('should extract error from failing response', () => {
      const expectedError: string = "Authentication Error: Error processing authentication response/Failed Request - Niomon Auth\n";
      expect(
        () => UbirchCertificationTools.extractSignedUpp(errorRespData)
      ).toThrow( expectedError);
    });
  });
});

function uInt8Array2Hex(encoded: Uint8Array) {
  return Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength).toString('hex');
}
