import { Cell, Slice, Address } from 'ton';

export function extractTransactionDetails(response: { result: string; id: number }) {
    const boc = response.result; // Extract BOC string from the response object

    // Convert BOC string to Buffer
    const buffer = Buffer.from(boc, 'base64'); // Convert base64 BOC string to Buffer
    const cells = Cell.fromBoc(buffer); // Decode BOC to get an array of Cells

    if (cells.length === 0) {
        throw new Error("No cells found in the BOC.");
    }

    const cell = cells[0]; // Get the first Cell
    const slice = cell.beginParse(); // Create a Slice from the Cell for parsing

    console.log("Initial remaining bits:", slice.remainingBits);

    try {
        // Skip the first byte (tag)
        slice.skip(1);

        // Read flags
        const ihrDisabled = slice.loadUint(1);
        const bounceFlag = slice.loadUint(1);
        const bouncedFlag = slice.loadUint(1);

        // Skip 3 bytes for anycast address
        slice.skip(3);

        // Read workchain ID
        const wc = slice.loadUint(8); // Read workchain ID
        
        // Read address as a BitString (256 bits)
        const addrBits = slice.loadBits(256); // Load 256 bits for address
        
        // Convert BitString to Buffer
        const addrBytes = Buffer.from(addrBits.toString(), 'hex'); // Convert hex string to Buffer

        let targetWallet = new Address(wc, addrBytes); // Create Address object

        console.log("Destination Address:", targetWallet.toString());

        // Check if there are enough bits left for amount
        if (slice.remainingBits < 256) {
            throw new Error("Not enough bits to read transaction amount.");
        }

        // Read transaction amount
        const amount = slice.loadCoins(); // Load transaction amount in nanotons

        console.log("Transaction Amount:", amount);

        return {
            ihrDisabled,
            bounceFlag,
            bouncedFlag,
            destination: targetWallet.toString(),
            amount,
        };
    } catch (error) {
        console.error("Error reading from slice:", error);
        throw new Error("Failed to extract transaction details.");
    }
}





// const extract =  () => {
//   const response = {
//     "result": "te6ccgEBAwEArAABRYgBtn9TizpJJauyeiDl8jftsDaOEVHg4X6vRvd3HDRKsuQMAQGcA/3nmKbmUn05tdT2jhyE2ZP9AAZF/MFAL2EGOxoAIfZKsCKJEKOme9/okGFy8GTj5jWNuxcgHLivOO0H5RK8ACmpoxdnVKrEAAABeQADAgBmQgBVB40r4JVd3fAnhyGbF2hqkGrsC3xwApZNj6e/W5RRBpzEtAAAAAAAAAAAAAAAAAAA",
//     "id": 12
// };
//   const transactionDetails = extractTransactionDetails(response);
//   console.log('Destination Address:', transactionDetails.destination.toString());
//   console.log('Transaction Amount:', transactionDetails.amount);
// } 
  


