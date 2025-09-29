import React from 'react';
import './NextPieces.css';

const NextPieces = ({ pieces }) => {
  const renderPiece = (piece, index) => {
    if (!piece) return null;

    return piece.shape.map((row, y) =>
      row.map((cell, x) => {
        if (cell) {
          const style = {
            position: 'absolute',
            left: `${x * 12}px`,
            top: `${y * 12}px`,
            width: '10px',
            height: '10px',
            backgroundColor: piece.color,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '1px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.3)'
          };
          return <div key={`${index}-${x}-${y}`} style={style} />;
        }
        return null;
      })
    );
  };

  return (
    <div className="next-pieces">
      <h3 className="next-title">NEXT</h3>
      <div className="next-list">
        {pieces.map((piece, index) => (
          <div key={index} className="next-item">
            <div className="next-preview">
              <div className="piece-container">
                {renderPiece(piece, index)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextPieces;




