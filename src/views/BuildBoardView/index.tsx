import { useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import Board from 'components/Board';
import { EMPTY_SHIP, Ship } from 'components/Board/types';
import MainLayout from 'layouts/MainLayout';
import ShipSelection from './components/ShipSelection';
import carrier from 'components/Board/images/carrierSelection.svg';
import battleship from 'components/Board/images/battleshipSelection.svg';
import submarine from 'components/Board/images/submarineSelection.svg';
import cruiser from 'components/Board/images/cruiserSelection.svg';
import destroyer from 'components/Board/images/destroyerSelection.svg';
import { ITx, transaction, getGameIndex } from 'web3/battleshipGame';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWallet } from 'contexts/WalletContext';
import { toast } from 'react-hot-toast';
import { BigNumber as BN } from 'ethers';
import { IMetaTx, metatransaction } from 'web3/erc2771';
import { generateProof } from 'utils/noir_tools';
import { createShipHash } from 'utils';

const useStyles = createUseStyles({
  content: {
    display: 'flex',
    gap: '114px',
    marginInline: 'auto',
    width: 'fit-content',
  },
  fleetLabel: {
    borderRadius: '3px',
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '34.68px',
    paddingBlock: '2px',
    textAlign: 'center',
  },
  wrapper: {
    outline: 'none',
  },
});

const SHIPS: Ship[] = [
  {
    color: '#8204D6',
    image: carrier,
    name: 'carrier',
    length: 5,
    sections: [],
  },
  {
    color: '#1C04D3',
    image: battleship,
    name: 'battleship',
    length: 4,
    sections: [],
  },
  {
    color: '#09D1E8',
    image: cruiser,
    name: 'cruiser',
    length: 3,
    sections: [],
  },
  {
    color: '#26F207',
    image: submarine,
    name: 'submarine',
    length: 3,
    sections: [],
  },
  {
    color: '#EFE707',
    image: destroyer,
    name: 'destroyer',
    length: 2,
    sections: [],
  },
];

export default function BuildBoard(): JSX.Element {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('game');
  const styles = useStyles();
  const navigate = useNavigate();
  const { address, chainId, provider, biconomy } = useWallet();
  const [placedShips, setPlacedShips] = useState<Ship[]>([]);
  const [rotationAxis, setRotationAxis] = useState('y');
  const [selectedShip, setSelectedShip] = useState<Ship>(EMPTY_SHIP);

  const allPlaced = useMemo(() => {
    return placedShips.length === 5;
  }, [placedShips]);

  const handleShipSelect = (ship: Ship) => {
    setSelectedShip(ship.name === selectedShip.name ? EMPTY_SHIP : ship);
  };

  const handlePlacedShip = (placedShip: Ship) => {
    setPlacedShips((prev) =>
      [...prev, placedShip].sort((a, b) => b.length - a.length)
    );
    setSelectedShip(EMPTY_SHIP);
  };

  const handleRemoveShip = (removedShip: Ship) => {
    setPlacedShips((prev) =>
      prev.filter((ship) => ship.name !== removedShip.name)
    );
  };

  const handleRotate = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Space') {
      setRotationAxis((prev) => (prev === 'x' ? 'y' : 'x'));
    }
  };

  // given a board, return mimcSponge hash and zk proof of board integrity
  const boardProof = async (
    board: number[][]
  ): Promise<{ hash: string; proof: Buffer }> => {
    const _shipHash = await createShipHash(board);
    const abi = {
      hash: _shipHash,
      ships: board.flat(),
    };
    const proof = await generateProof('board', abi);
    // TODO: Add browser verification
    // await window.snarkjs.groth16.verify(vkey, publicSignals, proof);
    return { hash: _shipHash, proof };
  };

  const startGame = async () => {
    if (!chainId || !provider) return;
    let loadingToast = '';
    try {
      loadingToast = toast.loading('Generating board proof...');
      const board: number[][] = [];
      placedShips.forEach((ship: Ship) => {
        const x = Math.floor(ship.sections[0] / 10);
        const y = ship.sections[0] % 10;
        const z = ship.orientation === 'x' ? 0 : 1;
        board.push([x, y, z]);
      });
      const switchedBoard = board.map((entry) => [
        entry[1],
        entry[0],
        entry[2],
      ]);
      const { hash, proof } = await boardProof(switchedBoard);
      if (id) {
        toast.loading(`Attempting to join game ${id}...`, {
          id: loadingToast,
        });
        const params = [+id, BN.from(hash), proof];
        if (biconomy) {
          const metatx: IMetaTx = {
            provider,
            biconomy,
            functionName: 'joinGame',
            args: params,
          };
          await metatransaction(metatx);
        } else {
          const tx: ITx = {
            provider,
            functionName: 'joinGame',
            args: params,
          };
          await transaction(tx);
        }
        localStorage.setItem(
          `BOARD_STATE_${id}_${address}`,
          JSON.stringify(placedShips)
        );
        toast.remove(loadingToast);
        toast.success(`Joined game ${id}`);
        navigate(`game?id=${id}`);
      } else {
        toast.loading(`Creating game...`, { id: loadingToast });
        const currentIndex = await getGameIndex(chainId, provider);
        const params = [BN.from(hash), proof];
        if (biconomy) {
          const metatx: IMetaTx = {
            provider,
            biconomy,
            functionName: 'newGame',
            args: params,
          };
          await metatransaction(metatx);
        } else {
          const tx: ITx = {
            provider,
            functionName: 'newGame',
            args: params,
          };
          await transaction(tx);
        }
        localStorage.setItem(
          `BOARD_STATE_${+currentIndex + 1}_${address}`,
          JSON.stringify(placedShips)
        );
        toast.success('Game successfully created.', {
          duration: 5000,
          id: loadingToast,
        });
        navigate(`game?id=${+currentIndex + 1}`);
      }
    } catch (err) {
      console.log('ERROR: ', err);
      toast.error(id ? 'Error joining game' : 'Error creating game', {
        id: loadingToast,
        duration: 5000,
      });
    }
  };

  return (
    <MainLayout>
      <div
        className={styles.wrapper}
        onKeyDown={(e) => handleRotate(e)}
        tabIndex={0}
      >
        <div className={styles.content}>
          <div style={{ width: '551px' }}>
            <div
              className={styles.fleetLabel}
              style={{ background: '#717C96' }}
            >
              DEPLOY YOUR FLEET
            </div>
            <ShipSelection
              allPlaced={allPlaced}
              placedShips={placedShips}
              removeShip={handleRemoveShip}
              selectShip={handleShipSelect}
              selectedShip={selectedShip}
              ships={SHIPS}
              startGame={startGame}
            />
          </div>
          <div style={{ width: '523px' }}>
            <div
              className={styles.fleetLabel}
              style={{ background: '#FF0055' }}
            >
              YOUR FLEET
            </div>
            <Board
              allPlaced={allPlaced}
              opponentShots={[]}
              placedShips={placedShips}
              rotationAxis={rotationAxis}
              selectedShip={selectedShip}
              setPlacedShip={handlePlacedShip}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
