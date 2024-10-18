import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano
} from "ton-core";

export type PassMasterStorageConfig = {
    admin_address: Address;
    escrow_code: Cell;
};

export function passMasterStorageToCell(config: PassMasterStorageConfig): Cell {
    return beginCell().storeAddress(config.admin_address).storeRef(config.escrow_code).endCell();
}

export class MasterEscrowContract implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell, data: Cell }
    ) {
    }

    static createFromConfig(config: PassMasterStorageConfig, code: Cell, workchain = 0) {
        const data = passMasterStorageToCell(config);
        const init = {code, data};
        const address = contractAddress(workchain, init);

        return new MasterEscrowContract(address, init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    static mintMessage(to: Address, implementer_address: Address, contract_details: Cell, total_ton_amount: bigint,) {
        return beginCell().storeUint(0x1674b0a0, 32).storeUint(0, 64) // op, queryId
            .storeAddress(to).storeAddress(implementer_address).storeRef(contract_details).storeCoins(total_ton_amount)
            .endCell();
    }

    async sendMint(provider: ContractProvider, via: Sender, to: Address, implementer_address: Address, contract_details: Cell, total_ton_amount: bigint) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: MasterEscrowContract.mintMessage(to, implementer_address, contract_details, total_ton_amount),
            value: total_ton_amount + toNano("0.1"),
        });
    }

    async getData(provider: ContractProvider, owner: Address, implementer_address: Address) {
        const res = await provider.get('get_address_pass', [{
            type: 'slice',
            cell: beginCell().storeAddress(owner).endCell()
        }, {type: 'slice', cell: beginCell().storeAddress(implementer_address).endCell()}])
        return res.stack.readAddress()
    }


}