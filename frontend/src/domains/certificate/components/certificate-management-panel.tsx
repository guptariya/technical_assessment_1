import * as React from 'react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useCertificateWeb3 } from '../hooks/use-certificate-web3';
import { uploadCertificateMetadataToIPFS } from '../services/ipfs-service';
import { Certificate } from '../types';

type Props = {
  studentId: number;
  studentName: string;
};

export const CertificateManagementPanel: React.FC<Props> = ({ studentId, studentName }) => {
  const [course, setCourse] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [certificates, setCertificates] = React.useState<Certificate[]>([]);
  const { walletAddress, connectWallet, issueCertificate, getCertificatesByStudent } = useCertificateWeb3();

  const loadCertificates = React.useCallback(async () => {
    if (!studentId) return;
    try {
      const list = await getCertificatesByStudent(studentId);
      setCertificates(list);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [getCertificatesByStudent, studentId]);

  React.useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleIssueCertificate = async () => {
    const normalizedCourse = course.trim() || 'Blockchain Achievement Certificate';

    setLoading(true);
    try {
      const metadataURI = await uploadCertificateMetadataToIPFS({
        studentId,
        studentName,
        course: normalizedCourse,
        issuedBy: walletAddress || 'unknown-wallet',
        issuedAt: new Date().toISOString()
      });

      await issueCertificate({
        studentId,
        studentName,
        course: normalizedCourse,
        metadataURI
      });

      toast.success('Certificate issued on blockchain');
      setCourse('');
      await loadCertificates();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'start', md: 'end' }}>
        <TextField
          label='Course / Achievement'
          value={course}
          onChange={(event) => setCourse(event.target.value)}
          size='small'
          sx={{ minWidth: { xs: '100%', md: 320 } }}
        />
        <Button variant='outlined' onClick={handleConnectWallet}>
          {walletAddress ? `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
        </Button>
        <Button variant='contained' onClick={handleIssueCertificate} disabled={loading}>
          Issue Certificate
        </Button>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Typography variant='h6' sx={{ mb: 1 }}>
          Issued Certificates
        </Typography>
        {certificates.length === 0 ? (
          <Typography variant='body2'>No certificates issued yet.</Typography>
        ) : (
          <Stack spacing={1}>
            {certificates.map((cert) => (
              <Card key={cert.id.toString()} variant='outlined'>
                <CardContent>
                  <Typography variant='subtitle2'>Certificate #{cert.id.toString()}</Typography>
                  <Typography variant='body2'>Course: {cert.course}</Typography>
                  <Typography variant='body2'>Status: {cert.isValid ? 'Valid' : 'Revoked'}</Typography>
                  <Typography variant='body2'>Metadata URI: {cert.metadataURI}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

