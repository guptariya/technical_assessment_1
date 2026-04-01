import * as React from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useCertificateWeb3 } from '../hooks/use-certificate-web3';

export const VerifyCertificatePage = () => {
  const [certificateId, setCertificateId] = React.useState('');
  const [result, setResult] = React.useState<{
    id: string;
    studentId: string;
    studentName: string;
    course: string;
    metadataURI: string;
    isValid: boolean;
  } | null>(null);
  const { verifyCertificate } = useCertificateWeb3();

  const handleVerify = async () => {
    const id = Number(certificateId);
    if (!id || id < 1) {
      toast.error('Enter a valid certificate id');
      return;
    }

    try {
      const cert = await verifyCertificate(id);
      setResult({
        id: cert.id.toString(),
        studentId: cert.studentId.toString(),
        studentName: cert.studentName,
        course: cert.course,
        metadataURI: cert.metadataURI,
        isValid: cert.isValid
      });
    } catch (error) {
      setResult(null);
      toast.error((error as Error).message);
    }
  };

  return (
    <Box component={Paper} sx={{ p: 3, maxWidth: 700 }}>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Verify Certificate
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          size='small'
          label='Certificate ID'
          value={certificateId}
          onChange={(event) => setCertificateId(event.target.value)}
        />
        <Button variant='contained' onClick={handleVerify}>
          Verify
        </Button>
      </Stack>

      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='subtitle1'>Certificate #{result.id}</Typography>
          <Typography variant='body2'>Student ID: {result.studentId}</Typography>
          <Typography variant='body2'>Student Name: {result.studentName}</Typography>
          <Typography variant='body2'>Course: {result.course}</Typography>
          <Typography variant='body2'>Metadata URI: {result.metadataURI}</Typography>
          <Typography variant='body2'>Status: {result.isValid ? 'Valid' : 'Revoked'}</Typography>
        </Box>
      )}
    </Box>
  );
};

