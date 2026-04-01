export const CERTIFICATE_REGISTRY_ABI = [
  'function issueCertificate(uint256 studentId, string studentName, string course, string metadataURI) returns (uint256)',
  'function verifyCertificate(uint256 certificateId) view returns ((uint256 id, uint256 studentId, string studentName, string course, string metadataURI, uint256 issuedAt, address issuer, bool isValid))',
  'function getCertificatesByStudent(uint256 studentId) view returns ((uint256 id, uint256 studentId, string studentName, string course, string metadataURI, uint256 issuedAt, address issuer, bool isValid)[])'
];

