import { useEffect, useRef, useState } from "react";
import type { CanvasPoint, CanvasStroke } from "../services/api";

interface DrawingCanvasProps {
  strokes: CanvasStroke[];
  canDraw: boolean;
  onStrokeComplete: (stroke: CanvasStroke) => Promise<void>;
  onClear: () => Promise<void>;
}

const STROKE_COLOR = "#111827";
const STROKE_WIDTH = 3;

function drawStroke(context: CanvasRenderingContext2D, stroke: CanvasStroke) {
  if (stroke.points.length === 0) {
    return;
  }

  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let index = 1; index < stroke.points.length; index += 1) {
    context.lineTo(stroke.points[index].x, stroke.points[index].y);
  }

  context.stroke();
}

export function DrawingCanvas({ strokes, canDraw, onStrokeComplete, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePoints, setActivePoints] = useState<CanvasPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((stroke) => drawStroke(context, stroke));

    if (activePoints.length > 0) {
      drawStroke(context, {
        id: "preview",
        points: activePoints,
        color: STROKE_COLOR,
        width: STROKE_WIDTH,
        createdBy: "",
        createdAt: ""
      });
    }
  }, [activePoints, strokes]);

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>): CanvasPoint | null {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || isSubmitting) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    setActivePoints([point]);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !canDraw) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    setActivePoints((current) => [...current, point]);
  }

  async function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !canDraw) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDrawing(false);

    const completedPoints = activePoints;
    setActivePoints([]);

    if (completedPoints.length === 0) {
      return;
    }

    const stroke: CanvasStroke = {
      id: crypto.randomUUID(),
      points: completedPoints,
      color: STROKE_COLOR,
      width: STROKE_WIDTH,
      createdBy: "",
      createdAt: new Date().toISOString()
    };

    try {
      setIsSubmitting(true);
      await onStrokeComplete(stroke);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClear() {
    if (!canDraw || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onClear();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        className="drawing-canvas__surface"
        width={800}
        height={500}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: "none", cursor: canDraw ? "crosshair" : "default" }}
      />
      {canDraw ? (
        <div className="button-row button-row--compact">
          <button
            className="button button--secondary"
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleClear()}
          >
            Clear Canvas
          </button>
        </div>
      ) : (
        <p className="drawing-canvas__hint">Watch the drawer&apos;s sketch update here.</p>
      )}
    </div>
  );
}
