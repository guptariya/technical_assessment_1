export type Certificate = {
  id: bigint;
  studentId: bigint;
  studentName: string;
  course: string;
  metadataURI: string;
  issuedAt: bigint;
  issuer: string;
  isValid: boolean;
};

