import { EError, EUbirchCertificationStateKeys, EUbirchStages, EUppTypes, IUbirchCertificationConfig, IUbirchCertificationResult, IUbirchUpp, UbirchMessage } from '../../models/models';
import * as errorResp from '../../testdata/errorresp.json';
import * as exampleJson from '../../testdata/example.json';
import * as testResp from '../../testdata/testresp.json';
import { UbirchCertification } from '../certification';

global.fetch = jest.fn();

const deepCopy = <T>(obj: T) => JSON.parse(JSON.stringify(obj)) as T;

class UbirchCertificationMock extends UbirchCertification {
  constructor(config: IUbirchCertificationConfig) {
    super(config);
  }
  public log(logInfo: UbirchMessage): void {
    super.log(logInfo);
  }
  public formatJSON(json: string, sort = true): string {
    return super.formatJSON(json, sort);
  }

  public certifyHash(hash: string, uppType: EUppTypes = EUppTypes.SIGNED, originalPayload?: Uint8Array): Promise<IUbirchUpp> {
    return super.certifyHash(hash, uppType, originalPayload);
  }
}

let certifier: UbirchCertificationMock;

const defaultSettings: IUbirchCertificationConfig = {
  deviceId: '776d1279-bb02-55e7-9da1-e2d01a14a758',
  stage: EUbirchStages.dev,
};

const exampleJsonData = exampleJson['default'];
const testRespData = testResp['default'];
const errorRespData = errorResp['default'];
const expectedSignedUpp = "C01:6BFPUJJVE374$6Q1W54L50NJ- 2FT1H1K-AC2IJL:8N.II$2F0L$966469UBLIAFDITQ6D28A MHC9/JCRQTMDTD.T$+O5W0EAL.04SP0$FBUQIEN9QJAUKHL5J 43STJTNFVI6:R02TBHZI8/BASI6N0%OF8$2:NTJII0 JASI KIM92FT14+E/95VY9.V57OL0/BA2CRCII5J/U3+Z5O91Z:BP7JS-0C26.S0XAB52K.8B6LJ-B2*$GAO6LQ6FLDP8E%7BMZBM:FFI97DA5KHKMIE/38ID1$R:G1AGJK733IO.Z88IF1D73-OK$8CHR$I50L0E8PTHME25Y8H52AQ*EQ1QRNF+ 3.:UTKJ XTB.84I8XN1SZ8L:FPT9$97PA6F%BHYV71I2G1A 8XSFHLE53W6AULQU7*DJ5B*VNTGJ8MBO0GLR9*40TT6.0";
const hash = "WFOCrSiXH+1MYYp2sL918SDsL4XLVePLCHFm11hrJqc=";

describe('UbirchCertification Failures with incomplete setup', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear().mockReset();
  });
  test('should fail without deviceId initialisation', () => {
    expect(
      () => new UbirchCertificationMock({
        deviceId: undefined,
        stage: EUbirchStages.dev,
      })
    ).toThrow('You need to provide the deviceID to certify data with');
  });
});

describe('UbirchCertification', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear().mockReset();
    certifier = new UbirchCertificationMock(defaultSettings);
  });

  describe('certify', () => {
    test('should fail because chained upp creation is not yet implemented - certifyJson', () => {
      certifier.certifyJson(exampleJsonData, EUppTypes.CHAINED)
        .then((result: IUbirchCertificationResult) => {
          expect(result).toBeDefined();
          expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
          expect(result.failed).toBeDefined();
          expect(result.failed.code).toBeDefined();
          expect(result.failed.code).toEqual(EError.NOT_YET_IMPLEMENTED);
        });
    });

    test('should create signed upp from JSON data', () => {
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            status: 200,
            json: () => testRespData,
          });

        return certifier
          .certifyJson(exampleJsonData)
          .then((result: IUbirchCertificationResult) => {
            expect(result).toBeDefined();
            expect(result.upp).toBeDefined();
            expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_SUCCESSFUL);
            expect(result.failed).toBeUndefined();
            expect(result.upp.upp).toBeDefined();
            console.log(result.upp.upp);
            expect(result.upp.upp).toEqual(expectedSignedUpp);
          });
      });

      test('should handle BE error occurred during creation of signed upp', () => {
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            status: 401,
            json: () => errorRespData,
          });

        return certifier
          .certifyJson(exampleJsonData)
          .then((result: IUbirchCertificationResult) => {
            expect(result).toBeDefined();
            expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
            expect(result.failed).toBeDefined();
            expect(result.failed.code).toBeDefined();
            expect(result.failed.code).toEqual(EError.NOT_AUTHORIZED);
            expect(result.failed.errorBECodes).toBeDefined();
            expect(result.failed.errorBECodes.length).toBe(1);
            expect(result.failed.message).toBeDefined();
            expect(result.failed.message).toEqual("Authentication Error: Error processing authentication response/Failed Request - Niomon Auth");
          });
      });

      test('should handle multiple BE error occurred during creation of signed upp', () => {
        const errorRespDataWithSeveralBECodes = deepCopy(errorRespData);
        errorRespDataWithSeveralBECodes.data.body.response.header['X-Err'].push('NF409-0030');
        const expectedError = "Authentication Error: Error processing authentication response/Failed Request - Niomon Auth" + "\n" + "Integrity Error: Delete non-existing hash - Niomon Filter";

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            status: 401,
            json: () => errorRespDataWithSeveralBECodes,
          });

        return certifier
          .certifyJson(exampleJsonData)
          .then((result: IUbirchCertificationResult) => {
            expect(result).toBeDefined();
            expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
            expect(result.failed).toBeDefined();
            expect(result.failed.code).toBeDefined();
            expect(result.failed.code).toEqual(EError.NOT_AUTHORIZED);
            expect(result.failed.errorBECodes).toBeDefined();
            expect(result.failed.errorBECodes.length).toBe(2);
            expect(result.failed.message).toBeDefined();
            expect(result.failed.message).toEqual(expectedError);
          });
      });


    test('should not replace unknown BE errors in message', () => {
      const errorRespDataWithSeveralBECodes = deepCopy(errorRespData);
      errorRespDataWithSeveralBECodes.data.body.response.header['X-Err'] = ['unknown-code'];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 401,
          json: () => errorRespDataWithSeveralBECodes,
        });

      return certifier
        .certifyJson(exampleJsonData)
        .then((result: IUbirchCertificationResult) => {
          expect(result).toBeDefined();
          expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
          expect(result.failed).toBeDefined();
          expect(result.failed.code).toBeDefined();
          expect(result.failed.code).toEqual(EError.NOT_AUTHORIZED);
          expect(result.failed.errorBECodes).toBeDefined();
          expect(result.failed.errorBECodes.length).toBe(1);
          expect(result.failed.message).toBeUndefined();
        });
    });

    test('should handele http response status 404', () => {
      const errorRespDataWithSeveralBECodes = deepCopy(errorRespData);
      errorRespDataWithSeveralBECodes.data.status = 404;
      errorRespDataWithSeveralBECodes.data.body.response.statusCode = 404;
      errorRespDataWithSeveralBECodes.data.body.response.header['X-Err'] = ['unknown-code'];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 404,
          json: () => errorRespDataWithSeveralBECodes,
        });

      return certifier
        .certifyJson(exampleJsonData)
        .then((result: IUbirchCertificationResult) => {
          expect(result).toBeDefined();
          expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
          expect(result.failed).toBeDefined();
          expect(result.failed.code).toBeDefined();
          expect(result.failed.code).toEqual(EError.ID_CANNOT_BE_FOUND);
          expect(result.failed.errorBECodes).toBeDefined();
          expect(result.failed.errorBECodes.length).toBe(1);
          expect(result.failed.errorBECodes[0]).toEqual('unknown-code');
        });
    });

    test('should handele http response status 409 - already exists', () => {
      const errorRespDataWithSeveralBECodes = deepCopy(errorRespData);
      errorRespDataWithSeveralBECodes.data.status = 409;
      errorRespDataWithSeveralBECodes.data.body.response.statusCode = 409;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 409,
          json: () => errorRespDataWithSeveralBECodes,
        });

      return certifier
        .certifyJson(exampleJsonData)
        .then((result: IUbirchCertificationResult) => {
          expect(result).toBeDefined();
          expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
          expect(result.failed).toBeDefined();
          expect(result.failed.code).toBeDefined();
          expect(result.failed.code).toEqual(EError.CRTIFICATE_ALREADY_EXISTS);
        });
    });

    test('should handele http response status 400 - bad request', () => {
      const errorRespDataWithSeveralBECodes = deepCopy(errorRespData);
      errorRespDataWithSeveralBECodes.data.status = 400;
      errorRespDataWithSeveralBECodes.data.body.response.statusCode = 400;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 400,
          json: () => errorRespDataWithSeveralBECodes,
        });

      return certifier
        .certifyJson(exampleJsonData)
        .then((result: IUbirchCertificationResult) => {
          expect(result).toBeDefined();
          expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
          expect(result.failed).toBeDefined();
          expect(result.failed.code).toBeDefined();
          expect(result.failed.code).toEqual(EError.BAD_REQUEST);
        });
    });

    test('should handele http response status 500 - internal server error', () => {
      const errorRespDataWithSeveralBECodes = deepCopy(errorRespData);
      errorRespDataWithSeveralBECodes.data.status = 500;
      errorRespDataWithSeveralBECodes.data.body.response.statusCode = 500;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 500,
          json: () => errorRespDataWithSeveralBECodes,
        });

      return certifier
        .certifyJson(exampleJsonData)
        .then((result: IUbirchCertificationResult) => {
          expect(result).toBeDefined();
          expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
          expect(result.failed).toBeDefined();
          expect(result.failed.code).toBeDefined();
          expect(result.failed.code).toEqual(EError.INTERNAL_SERVER_ERROR);
        });
    });

    test('should handele unexpected http response status code', () => {
      const errorRespDataWithSeveralBECodes = deepCopy(errorRespData);
      errorRespDataWithSeveralBECodes.data.status = 555;
      errorRespDataWithSeveralBECodes.data.body.response.statusCode = 555;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 555,
          json: () => errorRespDataWithSeveralBECodes,
        });

      return certifier
        .certifyJson(exampleJsonData)
        .then((result: IUbirchCertificationResult) => {
          expect(result).toBeDefined();
          expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_FAILED);
          expect(result.failed).toBeDefined();
          expect(result.failed.code).toBeDefined();
          expect(result.failed.code).toEqual(EError.UNKNOWN_ERROR);
        });
    });
  })
  describe('formatJSON', () => {
    test('should simply sort JSON params', () => {
      const jsonString = '{"b":"2","a":"1"}';
      const result = certifier.formatJSON(jsonString);
      expect(result).toEqual('{"a":"1","b":"2"}');
    });

    test('should trim JSON params', () => {
      const jsonString = '{"b": "2", "c": "A", "a": "-1"}';
      const result = certifier.formatJSON(jsonString);
      expect(result).toEqual('{"a":"-1","b":"2","c":"A"}');
    });

    test('should sort JSON params recursively', () => {
      const jsonString =
        '{"b": "2", "x": { "1": "hallo", "3": "bello", "2": {"A": "x", "B": "xx"}}, "a": "-1"}';
      const result = certifier.formatJSON(jsonString);
      expect(result).toEqual(
        '{"a":"-1","b":"2","x":{"1":"hallo","2":{"A":"x","B":"xx"},"3":"bello"}}'
      );
    });

    test("shouldn't sort JSON params recursively", () => {
      const jsonString =
        '{"b": "2", "x": { "1": "hallo", "3": "bello", "2": {"A": "x", "B": "xx"}}, "a": "-1"}';
      const result = certifier.formatJSON(jsonString, false);
      expect(result).toEqual(
        '{"b":"2","x":{"1":"hallo","2":{"A":"x","B":"xx"},"3":"bello"},"a":"-1"}'
      );
    });

    test('should sort JSON params recursively nested in arrays', () => {
      const jsonString =
        '{"b": "2", "x": { "1": "hallo", "3": "bello", "2": [{"C": "xxx", "A": "x", "B": "xx"}]}, "a": "-1"}';
      const result = certifier.formatJSON(jsonString);
      expect(result).toEqual(
        '{"a":"-1","b":"2","x":{"1":"hallo","2":[{"A":"x","B":"xx","C":"xxx"}],"3":"bello"}}'
      );
    });

    test('should NOT sort arrays as JSON params', () => {
      const jsonString = '{"a": [6, 4, 9]}';
      const result = certifier.formatJSON(jsonString);
      expect(result).toEqual('{"a":[6,4,9]}');
    });

    test('should NOT change number params to string', () => {
      const jsonString = '{"b": "2", "a": -1}';
      const result = certifier.formatJSON(jsonString);
      expect(result).toEqual('{"a":-1,"b":"2"}');
    });

    test('should NOT change special characters in params', () => {
      const jsonString: string = '{"g":"äöüÄÖÜß","p":"!§$%&/()=?*+#_-:.;","r":"®","a":"\\n"}';
      const result = certifier.formatJSON(jsonString);
      expect(result).toEqual('{"a":"\\n","g":"äöüÄÖÜß","p":"!§$%&/()=?*+#_-:.;","r":"®"}');
    });

    test('should throw an error if the json is malformed', () => {
      const jsonString = '"a":"-1"';
      expect(() => certifier.formatJSON(jsonString)).toThrow(
        'Building JSON format from input string failed'
      );
    });
  });
  describe('Check messanger observable', () => {
    test('should warn with NO_BLXTX_FOUND if any of the blockchain data is in settings', (done) => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 200,
          json: () => testRespData,
        });

      const infoReceived = [];
      const infoChain = [
        EUbirchCertificationStateKeys.CERTIFICATION_PENDING,
      ];

      const subscription = certifier.messenger.subscribe((message: UbirchMessage) => {
        if (message !== null) {
          infoReceived.push(message.code);
        }
      });

      return certifier
        .certifyJson(exampleJsonData)
        .then((result: IUbirchCertificationResult) => {
          expect(result).toBeDefined();
          expect(result.upp).toBeDefined();
          expect(result.certificationState).toBe(EUbirchCertificationStateKeys.CERTIFICATION_SUCCESSFUL);
          expect(result.failed).toBeUndefined();
          expect(result.upp.upp).toBeDefined();
          console.log(result.upp.upp);
          expect(result.upp.upp).toEqual(expectedSignedUpp);
          expect(infoReceived).toEqual(infoChain);
          subscription.unsubscribe();
          done();
        });
    });

  })
});
