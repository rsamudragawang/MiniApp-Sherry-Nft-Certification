// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ImageNFT
 * @dev This contract allows for the creation and management of NFTs,
 * where each NFT is linked to an image via a token URI. It uses the
 * ERC721 standard for non-fungible tokens.
 *
 * This contract leverages several components from OpenZeppelin:
 * - ERC721: The base implementation for NFTs.
 * - ERC721URIStorage: An extension to store metadata URIs for each token.
 * - Ownable: A mechanism to manage contract ownership and restrict access
 * to certain functions.
 * - Counters: A utility to safely increment token IDs.
 */
contract ImageNFT is ERC721, ERC721URIStorage, Ownable {
    // Counter to keep track of the next available token ID.
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    /**
     * @dev Initializes the contract, setting the name and symbol for the NFT collection.
     * The `initialOwner` of the contract is set to the deployer's address.
     * @param initialOwner The address that will initially own the contract.
     */
    constructor(address initialOwner)
        ERC721("CertificateNFT", "CERT")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mints a new NFT and assigns it to a specified address.
     * This function can only be called by the contract owner.
     *
     * @param to The address that will receive the newly minted NFT.
     * @param _tokenURI A string containing the URI for the NFT's metadata,
     * which should point to a JSON file containing the image URL
     * and other details.
     */
    function safeMint(address to, string memory _tokenURI) public onlyOwner {
        // Get the current token ID and increment the counter.
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint the new token and assign it to the 'to' address.
        _safeMint(to, tokenId);

        // Set the metadata URI for the newly minted token.
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     * This function is overridden because it is defined in both ERC721 and ERC721URIStorage.
     * We specify both parent contracts in the override to resolve the ambiguity.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Overrides the default `supportsInterface` function to include
     * ERC721URIStorage. This allows other contracts and applications to
     * verify that this contract supports the URI storage extension.
     *
     * @param interfaceId The interface identifier to check.
     * @return A boolean indicating whether the interface is supported.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
