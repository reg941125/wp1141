import React from 'react';
import './GameBoard.css';

const GameBoard = ({ board, currentPiece, ghostPiece, clearingLines, isClearing }) => {
  // 渲染方塊
  const renderPiece = (piece, isGhost = false) => {
    if (!piece) return null;

    return piece.shape.map((row, y) =>
      row.map((cell, x) => {
        if (cell) {
          const style = {
            position: 'absolute',
            left: `${(piece.x + x) * 25}px`,
            top: `${(piece.y + y) * 25}px`,
            width: '23px',
            height: '23px',
            backgroundColor: isGhost ? 'transparent' : piece.color,
            border: isGhost ? '2px solid #666666' : '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '2px',
            boxShadow: isGhost ? 'none' : 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            zIndex: isGhost ? 1 : 2
          };
          return <div key={`${x}-${y}`} style={style} />;
        }
        return null;
      })
    );
  };

  return (
    <div className="game-board">
      <div className="board-grid">
        {board.map((row, y) =>
          row.map((cell, x) => {
            const isClearingLine = clearingLines.includes(y);
            return (
              <div
                key={`${x}-${y}`}
                className={`grid-cell ${isClearingLine ? 'clearing-line' : ''}`}
                style={{
                  backgroundColor: cell || 'transparent',
                  border: cell ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: cell ? 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.3)' : 'none'
                }}
              />
            );
          })
        )}
      </div>
      
      {/* 鬼影方塊 */}
      {ghostPiece && !isClearing && renderPiece(ghostPiece, true)}
      
      {/* 當前方塊 */}
      {currentPiece && !isClearing && renderPiece(currentPiece, false)}
      
      {/* 消除行特效覆蓋層 */}
      {isClearing && clearingLines.map(lineY => (
        <div
          key={`clearing-${lineY}`}
          className="clearing-effect"
          style={{
            top: `${lineY * 25}px`,
            height: '25px'
          }}
        />
      ))}
    </div>
  );
};

export default GameBoard;
