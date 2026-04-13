import React from "react";
import ReactDOM from "react-dom";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  Text,
  Group,
  useStrictMode,
} from "react-konva";
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
    // ⭐ ADDED: RIGHT TRIANGLE (KHÔNG XOÁ GÌ CŨ)
    {
      name: "RightTriangle",
      x: 650,
      y: 120,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      points: [0, 0, 120, 0, 0, 120],
      fill: "brown",
      draggable: true,
      scale: 1,
    },

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
    {
      name: "Trapezoid",
      x: 420,
      y: 380,
      offsetX: 60,
      offsetY: 40,
      rotation: 0,
      points: [0, 0, 120, 0, 90, 80, 30, 80],
      fill: "cyan",
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

      // ⭐ ADDED RULER ONLY (KHÔNG ĐỤNG CODE CŨ)
      rulerVisible: false,
      ruler: {
        x1: 200,
        y1: 500,
        x2: 500,
        y2: 500,
        rotation: 0,
      },
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

  toggleRuler = () => {
    this.setState((prev) => ({
      rulerVisible: !prev.rulerVisible,
    }));
  };

  getDistance = (r) => Math.sqrt((r.x2 - r.x1) ** 2 + (r.y2 - r.y1) ** 2);

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
    };

    if (p.type === "circle") {
      return <Circle key={p.name} {...p} {...commonEvents} />;
    }

    if (p.type === "rect") {
      return <Rect key={p.name} {...p} {...commonEvents} />;
    }

    return <Line key={p.name} {...p} closed {...commonEvents} />;
  };

  render() {
    const r = this.state.ruler;
    const length = this.getDistance(r).toFixed(0);

    return (
      <div className="app">
        {/* TOOLBAR */}
        <div className="toolbar">
          <button onClick={this.resetAllPieces}>Reset</button>
          <button onClick={this.undo}>Undo</button>
          <button onClick={this.toggleRuler}>
            {this.state.rulerVisible ? "Hide Ruler" : "Show Ruler"}
          </button>
        </div>

        <Stage width={this.state.stageWidth} height={this.state.stageHeight}>
          <Layer>
            {/* SHAPES (GIỮ NGUYÊN 100%) */}
            {this.state.pieces.map((p, i) => this.renderShape(p, i))}

            {/* ⭐ RULER (ADDED ONLY) */}
            {this.state.rulerVisible && (
              <Group draggable rotation={r.rotation}>
                <Line
                  points={[r.x1, r.y1, r.x2, r.y2]}
                  stroke="black"
                  strokeWidth={3}
                  dash={[10, 5]}
                />

                <Circle
                  x={r.x1}
                  y={r.y1}
                  radius={6}
                  fill="red"
                  draggable
                  onDragMove={(e) =>
                    this.setState((prev) => ({
                      ruler: {
                        ...prev.ruler,
                        x1: e.target.x(),
                        y1: e.target.y(),
                      },
                    }))
                  }
                />

                <Circle
                  x={r.x2}
                  y={r.y2}
                  radius={6}
                  fill="red"
                  draggable
                  onDragMove={(e) =>
                    this.setState((prev) => ({
                      ruler: {
                        ...prev.ruler,
                        x2: e.target.x(),
                        y2: e.target.y(),
                      },
                    }))
                  }
                />

                <Text
                  x={(r.x1 + r.x2) / 2}
                  y={(r.y1 + r.y2) / 2 - 10}
                  text={`${length}px`}
                  fontSize={16}
                  fill="black"
                />
              </Group>
            )}
          </Layer>
        </Stage>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
