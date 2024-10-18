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


    async sendChangeItemTitle(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
        newTitle: Cell
    ) {

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x5773d1f5, 32).storeUint(0, 64).storeRef(newTitle).endCell()
        })
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


    // async sendToRevision(
    //     provider: ContractProvider,
    //     sender: Sender,
    //     value: bigint,
    // ) {
    //     await provider.internal(sender, {
    //         value,
    //         sendMode: SendMode.PAY_GAS_SEPARATELY,
    //         body: beginCell().storeUint(0x13423f, 32).storeUint(0, 64).endCell()
    //     })
    // }


    async get_state_of_contract(provider: ContractProvider) {
        const res = await provider.get("get_contract_data", [])
        return res.stack.skip(5).readBigNumber()
    }

    async get_contract_data(provider: ContractProvider) {
        const res = await provider.get("get_contract_data", [])
        return res.stack
    }
}