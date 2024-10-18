import {beginCell, Builder} from "ton-core/dist/boc/Builder";
import {Cell} from "ton-core";

function writeBuffer(src: Buffer, builder: Builder) {
    if (src.length > 0) {
        let bytes = Math.floor(builder.availableBits / 8);
        console.log("bytes", bytes)
        console.log("src.length > bytes", src.length > bytes)
        if (src.length > bytes) {
            let a = src.subarray(0, bytes);
            let t = src.subarray(bytes);
            console.log("a", a)
            console.log("t", t)
            builder = builder.storeBuffer(a);
            let bb = beginCell();
            console.log("bb", bb)
            writeBuffer(t, bb);
            builder = builder.storeRef(bb.endCell());
        } else {
            builder = builder.storeBuffer(src);
        }
    }
}

export function listToCell(list: string): Cell {
    let builder = beginCell();
    writeBuffer(Buffer.from(list), builder);
    return builder.endCell();
}