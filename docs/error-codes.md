# Ubirch Certification Error Codes

| error code            | type           | description         |
|-----------------------|------------------------------------------------------|-------------------------------------|
| CERTIFICATION_UNAVAILABLE | http           | Certification service is not available! {{message}}  |
| CERTIFICATION_CALL_ERROR | http           | Error occurred during certification: {{message}}     |
| CERTIFICATION_FAILED_NO_UPP | internal       | Error occurred during certification: no certificate (UPP) has been created         |
| MISSING_DEVICE_ID | internal       | You need to provide the deviceID to certify data with|
| JSON_PARSE_FAILED | internal       | JSON could not be parsed          |
| JSON_MALFORMED | internal       | Building JSON format from input string failed        |
| ID_CANNOT_BE_FOUND | http-404       | Thing with that deviceId cannot be found             |
| NOT_AUTHORIZED | http-401, http-403, http-405      | You are not authorised to create a certificate       |
| CRTIFICATE_ALREADY_EXISTS | http-409       | This certificate has already been anchored!          |
| INTERNAL_SERVER_ERROR | http-500       | An internal server error occurred |
| UNKNOWN_ERROR | internal       | An unexpected error occurred      |
| BAD_REQUEST | http-400       | Bad request - request cannot be handled              |
| NOT_YET_IMPLEMENTED | internal       | This function is not yet implemented                 |
|-----------------------| ---------------------------------------------------- |-------------------------------------|
| NA401-1000 | backend        | Authentication Error: Missing header/param - Niomon Auth        |
| NA401-2000 | backend        | Authentication Error: Error processing authentication response/Failed Request - Niomon Auth |
| NA401-3000 | backend        | Authentication Error (Cumulocity): Error processing authentication request - Niomon Auth |
| NA401-4000 | backend        | Authentication Error: Failed Request - Niomon Auth   |
| ND403-1100 | backend        | Invalid Verification: Missing header/param - Niomon Decoder - verification -       |
| ND403-1200 | backend        | Invalid Verification: Invalid Parts - Niomon Decoder - verification -              |
| ND403-1300 | backend        | Invalid Verification - Niomon Decoder - verification -          |
| ND400-2100 | backend        | Decoding Error: Missing header/param - Niomon Decoder - decoding -                 |
| ND403-2200 | backend        | Decoding Error: Invalid Match - Niomon Decoder - decoding -     |
| ND400-2300 | backend        | Decoding Error: Decoding Error/Null Payload - Niomon Decoder - decoding -          |
| NE400-1000 | backend        | Enriching Error: Missing header/param/body - Niomon Enricher    |
| NE400-2000 | backend        | Enriching Error: Error processing enrichment request - Niomon Enricher             |
| NE404-0000 | backend        | Enriching Error: Not found (Cumulocity) - Niomon Enricher       |
| NF409-0000 | backend        | Integrity Error: Duplicate Hash - Niomon Filter      |
| NF409-0010 | backend        | Integrity Error: Disable already disabled or non-existing hash - Niomon Filter     |
| NF409-0020 | backend        | Integrity Error: Enable already enabled or non-existing hash - Niomon Filter       |
| NF409-0030 | backend        | Integrity Error: Delete non-existing hash - Niomon Filte        |

