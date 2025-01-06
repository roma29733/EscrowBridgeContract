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
import {stringToCell} from "ton-core/dist/boc/utils/strings";

export type PassMasterStorageConfig = {
    admin_address: Address;
    escrow_code: Cell;
    version_code: number;
};

export function passMasterStorageToCell(config: PassMasterStorageConfig): Cell {
    return beginCell().storeAddress(config.admin_address).storeRef(config.escrow_code).storeInt(config.version_code, 8).endCell();
}

export class MasterEscrowContract implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell, data: Cell }
    ) {
    }

    static createFromAddress(address: Address) {
        return new MasterEscrowContract(address);
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

    static mintMessage( implementer_address: Address, contract_details: Cell, total_ton_amount: bigint) {
        return beginCell().storeUint(0, 32).storeUint(0, 64) // op, queryId
            .storeAddress(implementer_address).storeRef(contract_details).storeCoins(total_ton_amount)
            .endCell();
    }

    async sendMint(provider: ContractProvider, via: Sender,  implementer_address: Address, contract_details: Cell, total_ton_amount: bigint) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: MasterEscrowContract.mintMessage(implementer_address, contract_details, total_ton_amount),
            value: total_ton_amount + toNano("0.1"),
        });
    }

    async send_change_code(provider: ContractProvider, via: Sender,  code: Cell) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(12, 32).storeUint(0, 64).storeRef(code).endCell(),
            value:  toNano("0.1"),
        });
    }


    async sendMessages(provider: ContractProvider, via: Sender, toAddress: Address, messages: Cell) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(31 ,32).storeUint(0, 64).storeAddress(toAddress).storeRef(messages).endCell(),
            value:  toNano("0.1"),
        });
    }

    async getData(provider: ContractProvider, owner: Address, implementer_address: Address, contract_details: string) {
        const res = await provider.get('get_address_child', [{
            type: 'slice',
            cell: beginCell().storeAddress(owner).endCell()
        }, {type: 'slice', cell: beginCell().storeAddress(implementer_address).endCell()}, {type: 'cell', cell: beginCell().storeRef(stringToCell(contract_details)).endCell()}])
        return res.stack.readAddress()
    }

    async get_storage_data(provider: ContractProvider,) {
        const res = await provider.get('get_storage_data', [])
        return res.stack
    }


}