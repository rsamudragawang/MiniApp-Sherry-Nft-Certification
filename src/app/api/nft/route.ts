import { NextRequest, NextResponse } from "next/server";
import { avalancheFuji } from "viem/chains";
import { createMetadata, Metadata, ValidatedMetadata, ExecutionResponse } from "@sherrylinks/sdk";
import { serialize } from 'wagmi';
import { encodeFunctionData } from "viem";
import axios from 'axios';
import FormData from 'form-data';

// --- NFT Smart Contract Details ---
// TODO: Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x45804FA4dDfBC8D6BB5aeABB3EE5765740661e8a"; 

// ABI for the safeMint function from your ImageNFT contract
const CONTRACT_ABI =[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "initialOwner",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC721IncorrectOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ERC721InsufficientApproval",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC721InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "ERC721InvalidOperator",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC721InvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC721InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC721InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ERC721NonexistentToken",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "approved",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "ApprovalForAll",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_fromTokenId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_toTokenId",
				"type": "uint256"
			}
		],
		"name": "BatchMetadataUpdate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_tokenId",
				"type": "uint256"
			}
		],
		"name": "MetadataUpdate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_tokenURI",
				"type": "string"
			}
		],
		"name": "safeMint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "setApprovalForAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "getApproved",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "isApprovedForAll",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes4",
				"name": "interfaceId",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "tokenURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
// --- End of NFT Smart Contract Details ---

// --- Pinata IPFS Details ---
// IMPORTANT: Store these in environment variables (.env.local) for security
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
// --- End of Pinata IPFS Details ---

/**
 * @dev Generates a dynamic SVG image for the certificate.
 * @param name The name of the recipient to be displayed on the certificate.
 * @returns An SVG string representing the certificate.
 */
const generateCertificateSvg = (name: string): string => {
	const issueDate = new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
	});
	
	// A simple and elegant certificate template
	return `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
	<defs>
			<style>
					.title { font: bold 50px 'Georgia', serif; fill: #2d3748; text-anchor: middle; }
					.subtitle { font: 24px 'Georgia', serif; fill: #4a5568; text-anchor: middle; }
					.recipient-name { font: bold 48px 'Georgia', serif; fill: #2c5282; text-anchor: middle; }
					.description { font: italic 30px 'Georgia', serif; fill: #2d3748; text-anchor: middle; }
					.footer-text { font: 20px 'Georgia', serif; fill: #4a5568; }
			</style>
	</defs>
	<rect width="100%" height="100%" fill="#f7fafc"/>
	<rect x="20" y="20" width="760" height="560" rx="15" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
	<rect x="30" y="30" width="740" height="540" rx="10" fill="none" stroke="#4299e1" stroke-width="10" stroke-dasharray="20 10"/>
	
	<text x="50%" y="120" class="title">Certificate of Completion</text>
	<text x="50%" y="200" class="subtitle">This is to certify that</text>
	<text x="50%" y="280" class="recipient-name">${name}</text>
	<text x="50%" y="350" class="subtitle">has successfully demonstrated proficiency in</text>
	<text x="50%" y="390" class="description">On-Chain Achievement</text>
	
	<text x="60" y="540" class="footer-text">Date: ${issueDate}</text>
	<text x="740" y="540" class="footer-text" text-anchor="end">Signed: Your Organization</text>
</svg>
	`;
};


export async function GET(req: NextRequest) {
	try {
			const host = req.headers.get('host') || 'localhost:3000';
			const protocol = req.headers.get('x-forwarded-proto') || 'http';
			const serverUrl = `${protocol}://${host}`;

			// Metadata now only asks for the recipient's name
			const metadata: Metadata = {
					url: "https://sherry.social", // Your project's URL
					icon: "https://avatars.githubusercontent.com/u/117962315", // Your project's icon
					title: "NFT Certificate Generator",
					baseUrl: serverUrl,
					description: "Enter a name to generate a unique, on-chain NFT certificate.",
					actions: [
							{
									type: "dynamic",
									label: "Generate Certificate",
									description: "Create and mint a personalized NFT certificate.",
									chains: { source: "sepolia" },
									path: `/api/nft`, // Your API route path
									params: [
											{ name: "recipient", label: "Recipient Address", type: "text", required: true, description: "The wallet address that will receive the certificate." },
											{ name: "name", label: "Recipient's Name", type: "text", required: true, description: "The name to be printed on the certificate." },
									],
							},
					],
			};

			const validated: ValidatedMetadata = createMetadata(metadata);
			return NextResponse.json(validated, { headers: { "Access-Control-Allow-Origin": "*" }});
	} catch (e) {
			console.error("Error creating metadata:", e);
			return NextResponse.json({ error: "Failed to create metadata" }, { status: 500 });
	}
}
export async function POST(req: NextRequest) {
	console.log(req)
	try {
			if (!PINATA_API_KEY || !PINATA_API_SECRET) {
					throw new Error("Pinata API keys are not configured in environment variables.");
			}
			
			// 1. Handle JSON input
			const body = await req.json();
			const { recipient, name } = body;

			if (!recipient || !name) {
					return NextResponse.json({ error: "Missing 'recipient' or 'name' in request body." }, { status: 400 });
			}

			// 2. Generate SVG and upload to IPFS
			const svgString = generateCertificateSvg(name);
			const imageUploadData = new FormData();
			imageUploadData.append('file', Buffer.from(svgString), {
					filename: `${name.replace(/\s+/g, '-')}-certificate.svg`,
					contentType: 'image/svg+xml'
			});

			const imageUploadResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', imageUploadData, {
					headers: {
							'pinata_api_key': PINATA_API_KEY,
							'pinata_secret_api_key': PINATA_API_SECRET,
							...imageUploadData.getHeaders(),
					},
			});
			const imageIpfsHash = imageUploadResponse.data.IpfsHash;
			const imageUri = `ipfs://${imageIpfsHash}`;

			// 3. Construct and Upload Metadata JSON to IPFS
			const metadataJson = {
					name: `Certificate for ${name}`,
					description: `An on-chain certificate of achievement for ${name}.`,
					image: imageUri,
					attributes: [
							{ "trait_type": "Recipient Name", "value": name },
							{ "trait_type": "Certificate Type", "value": "Completion" }
					]
			};

			const metadataUploadResponse = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadataJson, {
					headers: {
							'pinata_api_key': PINATA_API_KEY,
							'pinata_secret_api_key': PINATA_API_SECRET,
					}
			});
			const metadataIpfsHash = metadataUploadResponse.data.IpfsHash;
			const tokenURI = `ipfs://${metadataIpfsHash}`;

			// 4. Prepare the smart contract transaction
			const callData = encodeFunctionData({
					abi: CONTRACT_ABI,
					functionName: 'safeMint',
					args: [recipient, tokenURI],
			});

			const tx = {
					to: CONTRACT_ADDRESS,
					data: callData,
					value: BigInt(0),
					chainId: avalancheFuji.id,
			};

			const serialized = serialize(tx);
			const resp: ExecutionResponse = {
					serializedTransaction: serialized,
					chainId: avalancheFuji.name,
			};

			return NextResponse.json(resp, { status: 200, headers: { "Access-Control-Allow-Origin": "*" }});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
			console.error("Error in POST request:", error);
			const errorMessage = error.response?.data?.error || error.message || "Internal Server Error";
			return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(request: NextRequest) {
    // Standard OPTIONS handler for CORS preflight requests
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
        },
    });
}
