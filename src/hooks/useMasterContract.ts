import { useEffect, useState } from "react";
import { Master } from "../contracts/Master";
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { Address, OpenedContract } from 'ton-core';
import { toNano } from "ton-core";
import { useTonConnect } from "./useTonConnect";

export function useMasterContract(wowner_address : Address , wreferal_address : Address) {

  const [future_user_wallet_address, setFuture_user_wallet_address] = useState<null | { wc_addressss: Address; }>();
  const client = useTonClient();
  const { sender } = useTonConnect();
  const [contractData, setContractData] = useState<null | { owner_address: Address ; total_supply: number}>();
  const [balance, setBalance] = useState<null | number>(0);
  const masterContract = useAsyncInitialize(async () => {
    if (!client) return;
    const contract = new Master(
      Address.parse("EQD6nwTiwkZdCboXJagUXiiOIWSGIChxv_p5uNO00-NOoluE") 
    );
    return client.open(contract) as OpenedContract<Master>;
  }, [client]);

  useEffect(() => {
    async function getValue() {
      if (!masterContract) return;
      setContractData(null);
      setFuture_user_wallet_address(null);
      const val = await masterContract.getData();
      const balance = await masterContract.getBalance();
      const wc = await masterContract.getWalletAddress(wowner_address, wreferal_address);
      setContractData({ owner_address: val.admin_address , total_supply:val.total_sup  });
      setBalance(balance.number);
      setFuture_user_wallet_address({ wc_addressss: wc.wallet_contract_address });
    }
    getValue();
  }, [masterContract]);
  
  return {
    master_contract_address: masterContract?.address.toString(),
    master_contract_balance: balance,
    ...future_user_wallet_address,
    ...contractData,
    send_withdraw_order: (withdraw_amount:number) => {
      return masterContract?.send_withdrawal_order(sender, toNano(0.02),withdraw_amount);
    },
    sendDeployByMaster: (wc_referal: Address) => {
      return masterContract?.sendDeployByMaster(sender, toNano(0.01), wc_referal);
    },
    get_user_wallet_address: (wc_owner: Address, wc_referal: Address) => {
      return masterContract?.getWalletAddress(wc_owner, wc_referal);
    },

  };
}
