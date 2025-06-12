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


export async function GET(req: NextRequest) {
    try {
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const serverUrl = `${protocol}://${host}`;

        // Metadata now describes the new parameters for creating the NFT metadata on the fly
        const metadata: Metadata = {
            url: "https://sherry.social", // Your project's URL
            icon: "https://avatars.githubusercontent.com/u/117962315", // Your project's icon
            title: "NFT Minter with IPFS Upload",
            baseUrl: serverUrl,
            description: "Upload an image and provide details to mint an NFT. Metadata is created and stored on IPFS automatically.",
            actions: [
                {
                    type: "dynamic",
                    label: "Create and Mint NFT",
                    description: "Upload an image to create and mint your NFT.",
                    chains: { source: "fuji" },
                    path: `/api/nft`, // Your API route path
                    params: [
                        { name: "recipient", label: "Recipient Address", type: "text", required: true, description: "The wallet address that will receive the NFT." },
                        { name: "name", label: "NFT Name", type: "text", required: true, description: "The name of your NFT." },
                        { name: "description", label: "NFT Description", type: "text", required: true, description: "A description for your NFT." },
                        // This indicates a file upload field to the client
                        { name: "image", label: "Image", type: "file", required: true, description: "Select an image file to be minted as an NFT." },
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
    try {
        // Check for Pinata API Key and Secret
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            throw new Error("Pinata API Key and Secret are not configured in environment variables.");
        }
        
        // 1. Handle multipart/form-data
        const formData = await req.formData();
        const recipient = formData.get('recipient') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const imageFile = formData.get('image') as File | null;

        if (!recipient || !name || !description || !imageFile) {
            return NextResponse.json({ error: "Missing required form fields." }, { status: 400 });
        }

        // 2. Upload Image to IPFS
        const imageUploadData = new FormData();
        imageUploadData.append('file', imageFile);
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
            name: name,
            description: description,
            image: imageUri,
            attributes: [
                { "trait_type": "Minted By", "value": "SherryLinks API" }
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
