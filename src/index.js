import React from "react";
import ReactDOM from "react-dom";
import { Stage, Layer, Line, Rect, Circle, useStrictMode } from "react-konva";
import "./styles.css";

useStrictMode(true);

const snapToPer = 5;

function roundToNearest(num) {
  return Math.round(num / snapToPer) * snapToPer;
}

const COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "gray",
  "black",
];

const initialState = {
  pieces: [
    {
      name: "Triangle",
      x: 80,
      y: 120,
      offsetX: 60,
      offsetY: 50,
      rotation: 0,
      points: [0, 0, 120, 0, 60, 100],
      fill: "orange",
      draggable: true,
      scale: 1,
    },
    {
      name: "Square",
      x: 200,
      y: 120,
      offsetX: 50,
      offsetY: 50,
      rotation: 0,
      points: [0, 0, 100, 0, 100, 100, 0, 100],
      fill: "yellow",
      draggable: true,
      scale: 1,
    },
    {
      name: "Rectangle",
      type: "rect",
      x: 350,
      y: 120,
      width: 150,
      height: 80,
      rotation: 0,
      fill: "purple",
      draggable: true,
      scale: 1,
    },
    {
      name: "Diamond",
      x: 120,
      y: 260,
      offsetX: 60,
      offsetY: 60,
      rotation: 0,
      points: [60, 0, 90, 60, 60, 120, 30, 60],
      fill: "lightblue",
      draggable: true,
      scale: 1,
    },
    {
      name: "Parallelogram",
      x: 260,
      y: 260,
      offsetX: 50,
      offsetY: 25,
      rotation: 0,
      points: [0, 0, 120, 0, 80, 60, -40, 60],
      fill: "green",
      draggable: true,
      scale: 1,
    },
    {
      name: "Circle",
      type: "circle",
      x: 500,
      y: 260,
      radius: 50,
      rotation: 0,
      fill: "pink",
      draggable: true,
      scale: 1,
    },
  ],
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...initialState,
      history: [],
      selectedId: null,
      stageWidth: window.innerWidth,
      stageHeight: window.innerHeight,
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    this.setState({
      stageWidth: window.innerWidth,
      stageHeight: window.innerHeight,
    });
  };

  saveHistory = () => {
    this.setState((prev) => ({
      history: [...prev.history, JSON.parse(JSON.stringify(prev.pieces))],
    }));
  };

  undo = () => {
    this.setState((prev) => {
      if (prev.history.length === 0) return prev;

      const previous = prev.history[prev.history.length - 1];
      const newHistory = prev.history.slice(0, -1);

      return {
        pieces: previous,
        history: newHistory,
      };
    });
  };

  resetAllPieces = () => {
    this.setState({
      ...initialState,
      history: [],
      selectedId: null,
    });
  };

  bringToFront = (name) => {
    this.setState((prev) => {
      const pieces = [...prev.pieces];
      const index = pieces.findIndex((p) => p.name === name);
      const item = pieces.splice(index, 1)[0];
      pieces.push(item);
      return { pieces };
    });
  };

  handleKeyDown = (e) => {
    if (e.key.toLowerCase() === "r") {
      if (!this.state.selectedId) return;

      this.saveHistory();

      this.setState((prev) => ({
        pieces: prev.pieces.map((p) =>
          p.name === prev.selectedId
            ? { ...p, rotation: (p.rotation + 45) % 360 }
            : p
        ),
      }));
    }

    if (e.key.toLowerCase() === "c") {
      if (!this.state.selectedId) return;

      this.saveHistory();

      this.setState((prev) => ({
        pieces: prev.pieces.map((p) => {
          if (p.name !== prev.selectedId) return p;
          const index = COLORS.indexOf(p.fill);
          const nextColor = COLORS[(index + 1) % COLORS.length];
          return { ...p, fill: nextColor };
        }),
      }));
    }

    if (e.ctrlKey && e.key === "z") {
      this.undo();
    }
  };

  zoomShape = (i, delta) => {
    this.saveHistory();

    this.setState((prev) => {
      const pieces = [...prev.pieces];
      const current = pieces[i].scale || 1;
      let next = current + delta;
      next = Math.max(0.3, Math.min(next, 3));
      pieces[i].scale = next;
      return { pieces };
    });
  };

  renderShape = (p, i) => {
    const isSelected = this.state.selectedId === p.name;

    const commonEvents = {
      draggable: p.draggable,
      scaleX: p.scale,
      scaleY: p.scale,
      stroke: isSelected ? "red" : undefined,
      strokeWidth: isSelected ? 3 : 0,

      onClick: () => {
        this.bringToFront(p.name);
        this.setState({ selectedId: p.name });
      },

      onDragStart: () => {
        this.saveHistory();
        this.bringToFront(p.name);
        this.setState({ selectedId: p.name });
      },

      onWheel: (e) => {
        e.evt.preventDefault();
        const direction = e.evt.deltaY > 0 ? -0.1 : 0.1;
        this.zoomShape(i, direction);
      },

      onDragEnd: (e) => {
        this.setState((prev) => ({
          pieces: prev.pieces.map((piece) =>
            piece.name === p.name
              ? {
                  ...piece,
                  x: roundToNearest(e.target.x()),
                  y: roundToNearest(e.target.y()),
                }
              : piece
          ),
        }));
      },

      onDblClick: () => {
        this.saveHistory();
        this.setState((prev) => ({
          pieces: [
            ...prev.pieces,
            {
              ...p,
              name: p.name + "_copy_" + Date.now(),
              x: p.x + 20,
              y: p.y + 20,
            },
          ],
        }));
      },
    };

    if (p.type === "circle") {
      return (
        <Circle
          key={p.name}
          x={p.x}
          y={p.y}
          radius={p.radius}
          rotation={p.rotation}
          fill={p.fill}
          {...commonEvents}
        />
      );
    }

    if (p.type === "rect") {
      return (
        <Rect
          key={p.name}
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height}
          offsetX={p.width / 2}
          offsetY={p.height / 2}
          rotation={p.rotation}
          fill={p.fill}
          {...commonEvents}
        />
      );
    }

    return (
      <Line
        key={p.name}
        x={p.x}
        y={p.y}
        offsetX={p.offsetX}
        offsetY={p.offsetY}
        rotation={p.rotation}
        points={p.points}
        fill={p.fill}
        closed
        {...commonEvents}
      />
    );
  };

  render() {
    return (
      <div className="app">
        <Stage
          width={this.state.stageWidth}
          height={this.state.stageHeight}
          style={{ background: "transparent" }}
        >
          <Layer>
            {this.state.pieces.map((p, i) => this.renderShape(p, i))}
          </Layer>
        </Stage>

        <div className="toolbar">
          <button onClick={this.resetAllPieces}>Reset</button>
          <button onClick={this.undo}>Undo</button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
