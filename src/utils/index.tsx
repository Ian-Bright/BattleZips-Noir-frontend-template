import { SinglePedersen } from '@noir-lang/barretenberg/dest/crypto';
import { BarretenbergWasm } from '@noir-lang/barretenberg/dest/wasm';

export const createShipHash = async (board: number[][]) => {
  const barrentenberg = await BarretenbergWasm.new();
  const pedersen = new SinglePedersen(barrentenberg);
  const shipBuffer = pedersen.compressInputs(
    board.flat().map((val) => Buffer.from(numToHex(val), 'hex'))
  );
  return `0x${shipBuffer.toString('hex')}`;
};

export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const formatAddress = (
  address: string | null | undefined,
  ensName: string | null | undefined,
  chars = 4
): string => {
  if (ensName) return ensName;
  else if (address)
    return `${address
      .substring(0, chars + 2)
      .toLowerCase()}...${address.substring(42 - chars)}`;
  else return '';
};

export const numToHex = (num: number) => {
  const hex = num.toString(16);
  return `${'0'.repeat(64 - hex.length)}${hex}`;
};
