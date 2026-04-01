// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StudentCertificateRegistry {
    struct Certificate {
        uint256 id;
        uint256 studentId;
        string studentName;
        string course;
        string metadataURI;
        uint256 issuedAt;
        address issuer;
        bool isValid;
    }

    uint256 private _certificateCounter;
    address public owner;

    mapping(uint256 => Certificate) public certificatesById;
    mapping(uint256 => uint256[]) private studentCertificateIds;

    event CertificateIssued(
        uint256 indexed certificateId,
        uint256 indexed studentId,
        address indexed issuer,
        string metadataURI
    );
    event CertificateRevoked(uint256 indexed certificateId, address indexed revokedBy);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCertificate(
        uint256 studentId,
        string calldata studentName,
        string calldata course,
        string calldata metadataURI
    ) external returns (uint256) {
        require(studentId > 0, "Invalid student id");
        require(bytes(studentName).length > 0, "Student name is required");
        require(bytes(course).length > 0, "Course is required");
        require(bytes(metadataURI).length > 0, "Metadata URI is required");

        _certificateCounter += 1;
        uint256 newId = _certificateCounter;

        Certificate memory cert = Certificate({
            id: newId,
            studentId: studentId,
            studentName: studentName,
            course: course,
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            issuer: msg.sender,
            isValid: true
        });

        certificatesById[newId] = cert;
        studentCertificateIds[studentId].push(newId);

        emit CertificateIssued(newId, studentId, msg.sender, metadataURI);
        return newId;
    }

    function revokeCertificate(uint256 certificateId) external onlyOwner {
        Certificate storage cert = certificatesById[certificateId];
        require(cert.id != 0, "Certificate not found");
        require(cert.isValid, "Certificate already revoked");
        cert.isValid = false;
        emit CertificateRevoked(certificateId, msg.sender);
    }

    function verifyCertificate(uint256 certificateId) external view returns (Certificate memory) {
        Certificate memory cert = certificatesById[certificateId];
        require(cert.id != 0, "Certificate not found");
        return cert;
    }

    function getCertificatesByStudent(uint256 studentId) external view returns (Certificate[] memory) {
        uint256[] memory certIds = studentCertificateIds[studentId];
        Certificate[] memory certs = new Certificate[](certIds.length);
        for (uint256 i = 0; i < certIds.length; i++) {
            certs[i] = certificatesById[certIds[i]];
        }
        return certs;
    }
}

