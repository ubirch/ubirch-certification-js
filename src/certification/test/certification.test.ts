import {
  EError,
  EUbirchCertificationStateKeys,
  EUbirchStages,
  IUbirchCertificationConfig, IUbirchCertificationResult,
  UbirchMessage,
} from '../../models/models';
import { UbirchCertification } from '../certification';
import * as exampleJson from '../../testdata/example.json';
import * as testResp from '../../testdata/testresp.json';
import * as errorResp from '../../testdata/errorresp.json';

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

let certifier: UbirchCertificationMock;

const defaultSettings: IUbirchCertificationConfig = {
  deviceId: '776d1279-bb02-55e7-9da1-e2d01a14a758',
  stage: EUbirchStages.dev,
};

const exampleJsonData = exampleJson['default'];
const testRespData = testResp['default'];
const errorRespData = errorResp['default'];
const expectedSignedUpp = "C01:6BFPUJJVE374$6Q1W54L50NJ- 2FT1H1K-AC2IJL:8N.II$2F0L$966469UBLIAFDITQ6D28A MHC9/JCRQTMDTD.T$+O5W0EAL.04SP0$FBUQIEN9QJAUKHL5J 43STJTNFVI6:R02TBHZI8/BASI6N0%OF8$2:NTJII0 JASI KIM92FT14+E/95VY9.V57OL0/BA2CRCII5J/U3+Z5O91Z:BP7JS-0C26.S0XAB52K.8B6LJ-B2*$GAO6LQ6FLDP8E%7BMZBM:FFI97DA5KHKMIE/38ID1$R:G1AGJK733IO.Z88IF1D73-OK$8CHR$I50L0E8PTHME25Y8H52AQ*EQ1QRNF+ 3.:UTKJ XTB.84I8XN1SZ8L:FPT9$97PA6F%BHYV71I2G1A 8XSFHLE53W6AULQU7*DJ5B*VNTGJ8MBO0GLR9*40TT6.0";

describe('UbirchCertification', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear().mockReset();
    certifier = new UbirchCertificationMock(defaultSettings);
  });

  describe('certify', () => {
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
  })
});
