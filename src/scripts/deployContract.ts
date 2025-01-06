import {Cell, StateInit, beginCell, contractAddress, storeStateInit, toNano, Address} from "ton-core";
import {hex} from "../build/MasterEscrow.compiled.json";
import {hex as hexChild} from "../build/ChildEscrow.compiled.json";
import qs from "qs";
import qrcode from "qrcode";
import {passMasterStorageToCell} from "../wrappers/MasterEscrow";

// uno deployment - 0QCwisufEIA3ySsz39b5b6t71SYGbInYz35MkNdlPpzgN6Qx

async function generateQRCode(link: string): Promise<void> {
    try {
        // Генерация и отображение QR-кода в терминале
        qrcode.toString(link, { type: 'terminal', small: true }, (err, qr) => {
            if (err) throw err;
            console.log("QR-код:");
            console.log(qr);
        });

        // Сохранение QR-кода в файл
        await qrcode.toFile('./qrcode.png', link, {
            errorCorrectionLevel: 'L', // Минимальная коррекция ошибок для компактного размера
            scale: 4, // Масштаб QR-кода
            width: 200, // Максимальная ширина изображения
        });

        console.log("QR-код сохранен в файл: ./qrcode.png");
    } catch (error) {
        console.error("Ошибка при генерации QR-кода:", error);
    }
}

async function deployContract() {
    const codeCell = Cell.fromBoc(Buffer.from(hex,"hex"))[0];
    const codeChild = Cell.fromBoc(Buffer.from(hexChild, "hex"))[0];

    const data = passMasterStorageToCell({
        admin_address: Address.parse("0QD_4qEt5T0D5-J1X2HEIU5CRFKmH4qZErVHaweyJGZncWOD"),
        escrow_code: codeChild,
    });

    const stateInit: StateInit = {
        code: codeCell,
        data: data,
    };

    const stateInitBuilder = beginCell();
    storeStateInit(stateInit)(stateInitBuilder);
    const stateInitCell = stateInitBuilder.endCell();

    const address = contractAddress(0, {
        code: codeCell,
        data: data,
    });

    let deployLink =
        'https://app.tonkeeper.com/transfer/' +
        address.toString({
            testOnly: true,
        }) +
        "?" +
        qs.stringify({
            text: "Deploy contract by QR",
            amount: toNano("0.1").toString(10),
            init: stateInitCell.toBoc({idx: false}).toString("base64"),
        });

    console.log("Ссылка для деплоя контракта:", deployLink);

    // Генерация уменьшенного QR-кода с помощью библиотеки `qrcode`
    generateQRCode(deployLink)

    let scanAddr =
        'https://tonscan.org/address/' +
        address.toString({
            testOnly: true,
        });

    console.log("Ссылка на TONScan для проверки контракта:", scanAddr);
}



deployContract();
