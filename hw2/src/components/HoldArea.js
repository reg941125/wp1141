import React from 'react';
import './HoldArea.css';

const HoldArea = ({ heldPiece }) => {
  const renderPiece = (piece) => {
    if (!piece) return null;

    return piece.shape.map((row, y) =>
      row.map((cell, x) => {
        if (cell) {
          const style = {
            position: 'absolute',
            left: `${x * 15}px`,
            top: `${y * 15}px`,
            width: '13px',
            height: '13px',
            backgroundColor: piece.color,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '1px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.3)'
          };
          return <div key={`${x}-${y}`} style={style} />;
        }
        return null;
      })
    );
  };

  return (
    <div className="hold-area">
      <h3 className="hold-title">HOLD</h3>
      <div className="hold-preview">
        {heldPiece ? (
          <div className="piece-container">
            {renderPiece(heldPiece)}
          </div>
        ) : (
          <div className="empty-hold">
            <div className="empty-placeholder"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HoldArea;




