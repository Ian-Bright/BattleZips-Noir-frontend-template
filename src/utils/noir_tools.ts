import { acir_from_bytes } from "@noir-lang/noir_wasm";
import setup_generic_prover from "setup_generic_prover";
import initNoirWasm from '@noir-lang/noir_wasm';

const BOARD_SIZES = {
    board: 8192,
    shot: 4096
}

const PROOF_TO_FILES = {
    board: {
        acir: 'boardAcir.buf',
        circuit: 'boardCircuit.buf'
    },
    shot: {
        acir: 'shotAcir.buf',
        circuit: 'shotCircuit.buf'
    }
}

export type BoardABI = {
    hash: string,
    ships: number[],
}

export type ShotABI = {
    hash: string,
    hit: number,
    ships: number[],
    shot: number[];
}

type Proof = 'board' | 'shot'

export const generateProof = async (proofType: Proof, input: BoardABI | ShotABI) => {
    await initNoirWasm();
    let response = await fetch(PROOF_TO_FILES[proofType].circuit);
    let buffer = await response.arrayBuffer();
    const circuit = new Uint8Array(buffer);

    response = await fetch(PROOF_TO_FILES[proofType].acir);
    buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const acir = acir_from_bytes(bytes);

    let [prover] = await setup_generic_prover(circuit, BOARD_SIZES[proofType]);
    const worker = new Worker(new URL('./worker.js', import.meta.url));

    const errorPromise = new Promise((_resolve, reject) => {
        worker.onerror = (e) => {
            reject(e);
        }
    });

    const resultPromise = new Promise((resolve, _reject) => {
        worker.onmessage = (e) => {
            resolve(e.data);
        }
    });

    worker.postMessage({ url: document.URL, acir, input });

    const witness: any = await Promise.race([errorPromise, resultPromise]);
    const proof = await prover.createProof(witness);
    return proof;
}