import { useEffect, useState } from "react";
import { WalletContract } from "../contracts/WalletContract";
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { Address, OpenedContract } from 'ton-core';
import { toNano } from "ton-core";
import { useTonConnect } from "./useTonConnect";

export function useWalletContract(UserAddress: Address) {
  const client = useTonClient();
  const { sender } = useTonConnect();
  // const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));
  const [contractData, setContractData] = useState<null | {
    ch_number: number;
    owner_address: Address;
    master_address: Address;
    referal_address: Address;
    eggs_number: number;
    last_calc: number;
    first_buy: number;
    is_deployed:number;
  }>();
  const [balance, setBalance] = useState<null | number>(0);
  const walletContract = useAsyncInitialize(async () => {
    if (!client) return;
    const contract = new WalletContract(UserAddress);
    return client.open(contract) as OpenedContract<WalletContract>;
  }, [client]);

  useEffect(() => {
    async function getValue() {
      if (!walletContract) return;
      setContractData(null);
      const val = await walletContract.getData();
      const balance = await walletContract.getBalance();
      setContractData({
        ch_number: val.chicken_number,
        owner_address: val.owner_address,
        master_address: val.master_address,
        referal_address: val.referal_address,
        eggs_number: val.eggs_number,
        last_calc: val.last_calc,
        first_buy: val.first_buy,
        is_deployed: val.is_deployed,
      });
      setBalance(balance.number);
      // await sleep(150000); // sleep 15 seconds and poll value again
      // getValue();
    }
    getValue();
  }, [walletContract]);

  return {
    wallet_contract_address: walletContract?.address.toString(),
    wallet_contract_balance: balance,
    wallet_owner_address: contractData?.owner_address?.toString(),
    wallet_referal_address: contractData?.referal_address?.toString(),
    wallet_master_address: contractData?.master_address?.toString(),
    ...contractData,
    send_buy_chicken_order: (chicken_to_buy: number) => {
      return walletContract?.send_buy_chicken_order(sender, toNano((chicken_to_buy * 1) + 0.01), chicken_to_buy);
    },
    send_buy_chicken_by_eggs: (chicken_to_buy: number) => {
      return walletContract?.send_buy_chicken_order(sender, toNano(0.01), chicken_to_buy);
    },
    send_recive_eggs_order: () => {
      return walletContract?.send_recive_eggs_order(sender, toNano(0.01));
    },
    withdraw_to_owner: (ton_to_send : number) => {
      return walletContract?.send_ballance_to_owner(sender, toNano(0.01),ton_to_send);
    }
  };

}
