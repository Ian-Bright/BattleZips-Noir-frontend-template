import { createUseStyles } from 'react-jss';
import { EMPTY_SHIP, Ship } from 'components/Board/types';

const useStyles = createUseStyles({
  row: {
    alignItems: 'flex-end',
    display: 'flex',
    justifyContent: 'space-between'
  },
  select: {
    cursor: 'pointer',
    fontSize: '24px',
    fontWeight: 400,
    letterSpacing: '3.6px',
    lineHeight: '34.68px'
  },
  ships: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '18px'
  },
  space: {
    background: '#EBEBEB',
    borderRadius: '3px',
    height: '46px',
    width: '46px'
  },
  spaces: {
    display: 'flex',
    gap: '7px',
    marginTop: '9px'
  },
  startButton: {
    borderRadius: '3px',
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '3.6px',
    margin: '46px auto 0 auto',
    padding: '5px 15px',
    width: 'fit-content'
  }
});

type ShipSelectionProps = {
  allPlaced: boolean;
  placedShips: Ship[];
  removeShip: (ship: Ship) => void;
  selectShip: (ship: Ship) => void;
  selectedShip: Ship;
  ships: Ship[];
  startGame: () => void;
};

export default function ShipSelection({
  allPlaced,
  placedShips,
  removeShip,
  selectShip,
  selectedShip,
  ships,
  startGame
}: ShipSelectionProps): JSX.Element {
  const styles = useStyles();

  const handleSelect = (ship: Ship) => {
    if (ship.name === selectShip.name) {
      selectShip(EMPTY_SHIP);
    } else {
      selectShip(ship);
    }
  };

  const isPlaced = (ship: Ship) => {
    return placedShips.find((placedShip) => placedShip.name === ship.name);
  };

  return (
    <div>
      <div className={styles.ships}>
        {ships.map((ship) => {
          const placed = isPlaced(ship);
          return (
            <div className={styles.row} key={ship.name}>
              <div>
                <img alt="Ship" src={ship.image} />
                <div className={styles.spaces}>
                  {new Array(ship.length).fill('').map((_, index) => (
                    <div
                      className={styles.space}
                      key={`${ship.name}-${index}`}
                    />
                  ))}
                </div>
              </div>
              <div
                className={styles.select}
                onClick={() => (placed ? removeShip(ship) : handleSelect(ship))}
              >
                {placed
                  ? '[REMOVE]'
                  : ship.name === selectedShip.name
                  ? '[SELECTED]'
                  : '[SELECT]'}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className={styles.startButton}
        onClick={() => allPlaced && startGame()}
        style={{
          background: allPlaced ? '#2861E9' : '#C7C7C7',
          cursor: allPlaced ? 'pointer' : 'not-allowed'
        }}
      >
        START GAME
      </div>
    </div>
  );
}
