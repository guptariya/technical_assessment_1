type CertificateMetadata = {
  studentId: number;
  studentName: string;
  course: string;
  issuedBy: string;
  issuedAt: string;
};

const PINATA_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

/** When Pinata JWT is not set, store JSON inline (demo/local only). Production: set VITE_PINATA_JWT. */
const metadataAsDataUri = (metadata: CertificateMetadata): string => {
  const json = JSON.stringify(metadata);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `data:application/json;base64,${base64}`;
};

export const uploadCertificateMetadataToIPFS = async (
  metadata: CertificateMetadata
): Promise<string> => {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT?.trim();
  if (!pinataJwt) {
    return metadataAsDataUri(metadata);
  }

  const response = await fetch(PINATA_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pinataMetadata: {
        name: `student-certificate-${metadata.studentId}-${Date.now()}`
      },
      pinataContent: metadata
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload?.IpfsHash) {
    throw new Error(payload?.error?.details || payload?.message || 'Failed to upload metadata to IPFS');
  }

  return `ipfs://${payload.IpfsHash}`;
};

