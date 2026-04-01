import * as React from 'react';
import type { Provider } from 'ethers';
import { BrowserProvider, Contract, isAddress, JsonRpcProvider } from 'ethers';
import { CERTIFICATE_REGISTRY_ABI } from '../constants/certificate-abi';
import { Certificate } from '../types';

const getContractAddress = () => {
  const contractAddress = import.meta.env.VITE_CERTIFICATE_CONTRACT_ADDRESS?.trim();
  if (!contractAddress) {
    throw new Error('VITE_CERTIFICATE_CONTRACT_ADDRESS is missing.');
  }
  if (!isAddress(contractAddress)) {
    throw new Error('VITE_CERTIFICATE_CONTRACT_ADDRESS is not a valid Ethereum address.');
  }
  return contractAddress;
};

/** Hardhat default chain id */
const HARDHAT_LOCAL_CHAIN_ID_HEX = '0x7a69';

const ensureHardhatLocalChain = async () => {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HARDHAT_LOCAL_CHAIN_ID_HEX }]
    });
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: HARDHAT_LOCAL_CHAIN_ID_HEX,
            chainName: 'Hardhat Local',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['http://127.0.0.1:8545']
          }
        ]
      });
    } else {
      throw err;
    }
  }
};

const assertContractDeployed = async (provider: Provider, address: string) => {
  const network = await provider.getNetwork();
  const code = await provider.getCode(address);
  if (!code || code === '0x') {
    throw new Error(
      `No contract bytecode at ${address} on chain ${network.chainId.toString()}. ` +
        'Run `cd blockchain && npm run node`, then `npm run deploy:local`, put the printed address in ' +
        'VITE_CERTIFICATE_CONTRACT_ADDRESS, restart Vite. For transactions, use MetaMask on chain 31337.'
    );
  }
};

const toCertificate = (raw: {
  id: bigint;
  studentId: bigint;
  studentName: string;
  course: string;
  metadataURI: string;
  issuedAt: bigint;
  issuer: string;
  isValid: boolean;
}): Certificate => ({
  id: raw.id,
  studentId: raw.studentId,
  studentName: raw.studentName,
  course: raw.course,
  metadataURI: raw.metadataURI,
  issuedAt: raw.issuedAt,
  issuer: raw.issuer,
  isValid: raw.isValid
});

export const useCertificateWeb3 = () => {
  const [walletAddress, setWalletAddress] = React.useState('');

  const getBrowserProvider = React.useCallback(() => {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }
    return new BrowserProvider(window.ethereum);
  }, []);

  /**
   * Read-only calls go through Hardhat’s HTTP RPC (same chain as `npm run node`).
   * This avoids “wrong MetaMask network” when listing / verifying.
   */
  const getReadContract = React.useCallback(async () => {
    const rpcUrl = import.meta.env.VITE_HARDHAT_RPC_URL?.trim() || 'http://127.0.0.1:8545';
    const provider = new JsonRpcProvider(rpcUrl);
    const address = getContractAddress();
    await assertContractDeployed(provider, address);
    return new Contract(address, CERTIFICATE_REGISTRY_ABI, provider);
  }, []);

  /** Writes — needs signer (connect wallet first for issue). */
  const getWriteContract = React.useCallback(async () => {
    await ensureHardhatLocalChain();
    const provider = getBrowserProvider();
    const address = getContractAddress();
    await assertContractDeployed(provider, address);
    const signer = await provider.getSigner();
    return new Contract(address, CERTIFICATE_REGISTRY_ABI, signer);
  }, [getBrowserProvider]);

  const connectWallet = React.useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }
    await ensureHardhatLocalChain();
    const [address] = (await window.ethereum.request({
      method: 'eth_requestAccounts'
    })) as string[];
    setWalletAddress(address || '');
    return address || '';
  }, []);

  const issueCertificate = React.useCallback(
    async ({
      studentId,
      studentName,
      course,
      metadataURI
    }: {
      studentId: number;
      studentName: string;
      course: string;
      metadataURI: string;
    }) => {
      const contract = await getWriteContract();
      const tx = await contract.issueCertificate(studentId, studentName, course, metadataURI);
      await tx.wait();
    },
    [getWriteContract]
  );

  const verifyCertificate = React.useCallback(
    async (certificateId: number) => {
      const contract = await getReadContract();
      const cert = await contract.verifyCertificate(certificateId);
      return toCertificate(cert);
    },
    [getReadContract]
  );

  const getCertificatesByStudent = React.useCallback(
    async (studentId: number) => {
      const contract = await getReadContract();
      const certs = (await contract.getCertificatesByStudent(studentId)) as Array<{
        id: bigint;
        studentId: bigint;
        studentName: string;
        course: string;
        metadataURI: string;
        issuedAt: bigint;
        issuer: string;
        isValid: boolean;
      }>;
      return certs.map((c) => toCertificate(c));
    },
    [getReadContract]
  );

  return {
    walletAddress,
    connectWallet,
    issueCertificate,
    verifyCertificate,
    getCertificatesByStudent
  };
};

