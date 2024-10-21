import {hex} from "../build/MasterEscrow.compiled.json";
import {hex  as hexC} from "../build/ChildEscrow.compiled.json";
import {Address, Cell, CellType, fromNano, Slice, toNano} from "ton-core";
import {Blockchain, SandboxContract, TreasuryContract} from "@ton-community/sandbox";
import "@ton-community/test-utils";
import {MasterEscrowContract} from "../wrappers/MasterEscrow";
import {beginCell} from "ton-core/dist/boc/Builder";
import {ChildEscrow} from "../wrappers/ChildEscrow";

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

        const addressDeploer = await masterContract.getData(deployer.address,implementer.address)

        childrenContract = blockchain.openContract(
            ChildEscrow.createFromAddress(
                addressDeploer
            )
        );

        const contractDetails = beginCell().endCell()

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

        const send_to_cancel_escrow = await childrenContract.send_to_cancel_escrow(deployer.getSender(), toNano('0.1'))

        console.log("send_to_cancel_escrow-  ",send_to_cancel_escrow)
        // expect(send_to_cancel_escrow.transactions).toHaveTransaction(
        //     {
        //         success: false,
        //         exitCode: 0
        //     }
        // )
        console.log("balanceCO after send_to_cancel_escrow", fromNano(await childrenContract.getBalance()))
        await childrenContract.send_to_next_step(implementer.getSender(), toNano('0.1'))

        const secondTsState = await childrenContract.get_state_of_contract()
        //
        console.log("secondTsState", secondTsState)


        // await childrenContract.send_to_next_step(implementer.getSender(), toNano('0.1'))
        //
        // const thirdTsState = await childrenContract.get_state_of_contract()
        //
        // console.log("thirdTsState", thirdTsState)
        //
        // await childrenContract.send_to_next_step(implementer.getSender(), toNano('0.1'))
        //
        // const fourTsState = await childrenContract.get_state_of_contract()
        //
        // console.log("fourTsState", fourTsState)
        //
        // await childrenContract.send_to_next_step(deployer.getSender(), toNano('0.1'))
        //
        // const fiveTsState = await childrenContract.get_state_of_contract()
        //
        // console.log("fiveTsState", fiveTsState)
        //
        // console.log("balanceCO", fromNano(await childrenContract.getBalance()))

    })

});