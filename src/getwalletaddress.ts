import { TonClient, Address, JettonMaster } from "@ton/ton";

const tonClient = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC", // MainNet endpoint
});

export const getSenderJettonWalletAddress = async (loggedInAddress: string): Promise<string> => {
    try {
        const usdtMasterContractAddress = Address.parse("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"); // USDT Master Contract Address

        // Open the Jetton Master Contract
        const jettonMaster = tonClient.open(JettonMaster.create(usdtMasterContractAddress));

        // Fetch the user's Jetton Wallet Address
        const senderJettonWalletAddress = await jettonMaster.getWalletAddress(Address.parse(loggedInAddress));

         console.log("Sender Jetton Wallet Address:", senderJettonWalletAddress.toString());
        return senderJettonWalletAddress.toString();
    } catch (error) {
        console.error("Failed to fetch Sender Jetton Wallet Address:", error);
        throw error;
    }
};

