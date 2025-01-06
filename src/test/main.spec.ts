import {hex} from "../build/MasterEscrow.compiled.json";
import {hex  as hexC} from "../build/ChildEscrow.compiled.json";
import {Address, Cell, CellType, fromNano, Slice, toNano} from "ton-core";
import {Blockchain, SandboxContract, TreasuryContract} from "@ton-community/sandbox";
import "@ton-community/test-utils";
import {MasterEscrowContract} from "../wrappers/MasterEscrow";
import {beginCell} from "ton-core/dist/boc/Builder";
import {ChildEscrow} from "../wrappers/ChildEscrow";
import {stringToCell} from "ton-core/dist/boc/utils/strings";

describe("test tests", () => {
    const codeMint = Cell.fromBoc(Buffer.from(hex, "hex"))[0]
    const codeWallet = Cell.fromBoc(Buffer.from(hexC, "hex"))[0]
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let implementer: SandboxContract<TreasuryContract>;

    let masterContract: SandboxContract<MasterEscrowContract>;
    let childrenContract: SandboxContract<ChildEscrow>

    beforeAll(async () => {
        // initial item, for test
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer")
        implementer= await blockchain.treasury("implementer")
        masterContract = blockchain.openContract(
            MasterEscrowContract.createFromConfig({
                admin_address: deployer.address,
                escrow_code: codeWallet,
                version_code: 1,
            }, codeMint)
        )
    })

    it("tests of stable work smart contract", async () => {
        const deployResult = await masterContract.sendDeploy(deployer.getSender(), toNano('0.1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: masterContract.address,
            deploy: true,
        });

        const addressChildC = await masterContract.getData(deployer.address, implementer.address, "details")

        childrenContract = blockchain.openContract(
            ChildEscrow.createFromAddress(
                addressChildC
            )
        );

        const contractDetails = beginCell().storeRef(stringToCell("details")).endCell()

        const mintResult = await masterContract.sendMint(deployer.getSender(),  implementer.address, contractDetails, toNano('20'));

        expect(mintResult.transactions).toHaveTransaction({
            from: masterContract.address,
            to: childrenContract.address,
            deploy: true,
        });

        console.log("balanceCO after mint", fromNano(await childrenContract.getBalance()))
        const contract_data = await childrenContract.get_contract_data()
        console.log("contract_data", contract_data)
    })


    it("test of changeState", async () => {
        const firstTsState = await childrenContract.get_state_of_contract()
        console.log("firstTsState", firstTsState)

        // const send_to_cancel_escrow = await childrenContract.send_to_cancel_escrow(deployer.getSender(), toNano('0.1'))
        //
        // console.log("send_to_cancel_escrow-  ",send_to_cancel_escrow)
        //
        // console.log("balanceCO after send_to_cancel_escrow", fromNano(await childrenContract.getBalance()))
        // await childrenContract.send_to_next_step(implementer.getSender(), toNano('0.1'))
        //
        // const secondTsState = await childrenContract.get_state_of_contract()
        //
        // console.log("secondTsState", secondTsState)

        await childrenContract.send_to_next_step(implementer.getSender(), toNano('0.1'))

        const thirdTsState = await childrenContract.get_state_of_contract()

        console.log("thirdTsState", thirdTsState)


        await childrenContract.send_to_submit_project(implementer.getSender(), toNano('0.1'))
        const foursState = await childrenContract.get_state_of_contract()
        console.log("foursState", foursState)
        await childrenContract.send_to_requires_admins_intervention(implementer.getSender(), toNano('0.1'))
        const fifeState = await childrenContract.get_state_of_contract()

        console.log("fifeState", fifeState)

        const messagesToChangeStateOfAdmins = beginCell().storeUint(41, 32).storeUint(0, 64).endCell()
        await masterContract.sendMessages(deployer.getSender(), childrenContract.address, messagesToChangeStateOfAdmins)


        const sixState = await childrenContract.get_state_of_contract()

        console.log("sixState", sixState)

    })

    it('test of changes codes', async () => {
        const contract_data = await masterContract.get_storage_data()
        console.log("contract_data", contract_data)
      await masterContract.send_change_code(deployer.getSender(), codeMint);
        const contract_data_after = await masterContract.get_storage_data()
        console.log("contract_data_after", contract_data_after)
    })

});