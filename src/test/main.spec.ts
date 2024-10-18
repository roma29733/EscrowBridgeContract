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

    let masterContract: SandboxContract<MasterEscrowContract>;
    let childrenContract: SandboxContract<ChildEscrow>
    beforeAll(async () => {
        // initial item, for test
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer")

        masterContract = blockchain.openContract(
            MasterEscrowContract.createFromConfig({
                admin_address: deployer.address,
                escrow_code: codeWallet,
            }, codeMint)
        )
    })

    it("tests of stable work smart contract", async () => {
        const deployResult = await masterContract.sendDeploy(deployer.getSender(), toNano('2'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: masterContract.address,
            deploy: true,
        });

        const addressDeploer = await masterContract.getData(deployer.address,deployer.address)

        childrenContract = blockchain.openContract(
            ChildEscrow.createFromAddress(
                addressDeploer
            )
        );

        const contractDetails = beginCell().endCell()

        const mintResult = await masterContract.sendMint(deployer.getSender(), deployer.address, deployer.address, contractDetails, toNano('2'));

        expect(mintResult.transactions).toHaveTransaction({
            from: masterContract.address,
            to: childrenContract.address,
            deploy: true,
        });

        const contract_data = await childrenContract.get_contract_data()
        console.log("contract_data", contract_data)
    })

    it("test of changeState", async () => {
        const firstTsState = await childrenContract.get_state_of_contract()
        console.log("firstTsState", firstTsState)

        await childrenContract.send_to_next_step( deployer.getSender(), toNano('1'))

        const secondTsState = await childrenContract.get_state_of_contract()

        console.log("secondTsState", secondTsState)

        await childrenContract.send_to_next_step( deployer.getSender(), toNano('1'))

        const thirdTsState = await childrenContract.get_state_of_contract()

        console.log("thirdTsState", thirdTsState)

        await childrenContract.send_to_next_step( deployer.getSender(), toNano('1'))

        const fourTsState = await childrenContract.get_state_of_contract()

        console.log("fourTsState", fourTsState)

    })


});
