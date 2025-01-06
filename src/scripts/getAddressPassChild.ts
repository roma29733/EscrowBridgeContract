import {Address} from "ton-core";
import {MasterEscrowContract} from "../wrappers/MasterEscrow";

async function getDataInitem() {
    try {
        const contractChild = MasterEscrowContract.createFromAddress(
            Address.parse("0QCwisufEIA3ySsz39b5b6t71SYGbInYz35MkNdlPpzgN6Qx")
        );

        // @ts-ignore
        const resultRequest = await contractChild.getData(
            Address.parse("0QD_4qEt5T0D5-J1X2HEIU5CRFKmH4qZErVHaweyJGZncWOD"),
            Address.parse("0QBaMxgvGGZ17ixRJI1STvYZ_wz2JsAlOorj_JMiEDUbV5nR")
        );

        console.log("resultRequest", resultRequest);
    } catch (error) {
        console.error("Error in getDataInitem:", error);
    }
}

getDataInitem()