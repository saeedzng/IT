import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type WalletContractConfig = {
    ch_number: number;
    owner_address: Address;
    master_address: Address;
    referal_address: Address;
    eggs_number: number;
    last_calc: number;
    first_buy: number;
    is_deployed:number;
};

export function walletContractConfigToCell(config: WalletContractConfig): Cell {
    return beginCell()
        .storeUint(config.ch_number, 32)
        .storeAddress(config.owner_address)
        .storeAddress(config.master_address)
        .storeAddress(config.referal_address)
        .storeUint(config.eggs_number, 32)
        .storeUint(config.last_calc, 32)
        .storeUint(config.first_buy, 32)
        .storeUint(config.is_deployed, 32)
        .endCell();
}

export class WalletContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new WalletContract(address);
    }

    static createFromConfig(config: WalletContractConfig, code: Cell, workchain = 0) {
        const data = walletContractConfigToCell(config);
        const init = { code, data };
        return new WalletContract(contractAddress(workchain, init), init);
    }

    async send_buy_chicken_order(provider: ContractProvider, via: Sender, value: bigint, chicken_to_buy: number) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1, 32).storeUint(chicken_to_buy, 32).endCell(),
        });
    }

    async send_recive_eggs_order(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(3, 32).endCell(),
        });
    }

    async send_ballance_to_owner(provider: ContractProvider, via: Sender, value: bigint , withdraw_amount :number) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(4,32).storeCoins(withdraw_amount).endCell(),
        });
    }
    
    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("load_contract_storage_content", []);
        return {
            chicken_number: stack.readNumber(),
            owner_address: stack.readAddress(),
            master_address: stack.readAddress(),
            referal_address: stack.readAddress(),
            eggs_number: stack.readNumber(),
            last_calc: stack.readNumber(),
            first_buy: stack.readNumber(),
            is_deployed: stack.readNumber(),
        };
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get("balance", []);
        return {
            number: stack.readNumber(),
        }
    }

}
