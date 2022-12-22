import { BarretenbergWasm, WorkerPool } from "@noir-lang/barretenberg/dest/wasm";
import { SinglePippenger } from "@noir-lang/barretenberg/dest/pippenger";

const numWorkers = 4;

export class StandardExampleVerifier {
    async verifyProof(proof: Buffer) {
        const wasm = await BarretenbergWasm.new();
        const workerPool = await WorkerPool.new(wasm, numWorkers);
        const pippenger = new SinglePippenger(workerPool.workers[0]);
        const worker = pippenger.getWorker()
        const proofPtr = await worker.call('bbmalloc', proof.length);
        await worker.transferToHeap(proof, proofPtr);
        const verified = (await worker.call('standard_example__verify_proof', proofPtr, proof.length)) ? true : false;
        console.log('FLAG PAST VERIFIED')
        await worker.call('bbfree', proofPtr);
        return verified;
    }
}