import {Address, beginCell, Cell, Contract, ContractProvider, Sender, SendMode} from "ton-core";

export class ChildEscrow implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell, data: Cell }
    ) {
    }

    static createFromAddress(address: Address) {
        return new ChildEscrow(address);
    }


    async send_to_next_step(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
    ) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x12345f, 32).storeUint(0, 64).endCell()
        })
    }


    async send_to_cancel_escrow(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
    ){
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x1432f, 32).storeUint(0, 64).endCell()
        })
    }

    async get_state_of_contract(provider: ContractProvider) {
        const res = await provider.get("get_contract_data", [])
        return res.stack.skip(5).readBigNumber()
    }

    async get_contract_data(provider: ContractProvider) {
        const res = await provider.get("get_contract_data", [])
        return res.stack
    }

    async getBalance(provider: ContractProvider) {
        const res = await provider.get("get_balance_contract", [])
        return res.stack.readNumber()
    }
}