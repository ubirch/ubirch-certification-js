import { IUbirchCertificationEnvConfig } from './models/models';
export default {
  certify_api_url: {
    local: 'https://api.certify.dev.ubirch.com/api/v1/x509/anchor',
    dev: 'https://api.certify.dev.ubirch.com/api/v1/x509/anchor',
    demo: 'https://api.certify.demo.ubirch.com/api/v1/x509/anchor',
    prod: 'https://api.certify.ubirch.com/api/v1/x509/anchor',
  }
} as IUbirchCertificationEnvConfig;
