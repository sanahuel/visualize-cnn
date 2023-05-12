import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import * as tf from "@tensorflow/tfjs";
import "./App.css";
import leftimg from "./icons/left.svg";
import rightimg from "./icons/right.svg";

function App() {
  // ---------- THREE js ---------- //

  const conv1 = Array.from({ length: 32 }, () =>
    Array.from({ length: 26 }, () => Array.from({ length: 26 }, () => 0))
  );
  const conv2 = Array.from({ length: 48 }, () =>
    Array.from({ length: 11 }, () => Array.from({ length: 11 }, () => 0))
  );
  const conv3 = Array.from({ length: 64 }, () =>
    Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => 0))
  );
  const array28 = new Array(28 * 28).fill(25 / 250);
  const array10 = new Array(10).fill(250 / 250);
  const [hidden, setHidden] = useState([conv1, conv2, conv3, array10]);
  const [input, setInput] = useState(array28);

  const CameraControls = () => {
    const { camera } = useThree();
    camera.position.set(-55, 25, 50);

    return null;
  };

  let Box = ({ position, color }) => {
    const clampedColor = Math.round(Math.min(Math.max(color * 255, 25), 255));
    return (
      <mesh position={position}>
        <boxBufferGeometry attach={"geometry"} />
        <meshLambertMaterial
          attach={"material"}
          color={
            "rgb(" +
            clampedColor +
            ", " +
            clampedColor +
            ", " +
            clampedColor +
            ")"
          }
        />
      </mesh>
    );
  };

  let Line = ({ start, end }) => {
    const ref = useRef();
    useLayoutEffect(() => {
      ref.current.geometry.setFromPoints(
        [start, end].map((point) => new THREE.Vector3(...point))
      );
    }, [start, end]);
    return (
      <line ref={ref}>
        <bufferGeometry />
        <lineBasicMaterial color={"#191919"} />
      </line>
    );
  };

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  let LineLayers = () => {
    const lines = [];

    // 1st layer
    for (let i = 0; i < 14; i++) {
      for (let j = 0; j < 14; j++) {
        lines.push(
          Line({
            start: [(i - 7) * 1.5, (j - 7) * 1.5, 16.5],
            end: [(getRandomInt(10) - 4.5) * 1.5, -0.5 * 1.5, 25],
          })
        );
      }
    }

    return lines;
  };

  let Layer10 = () => {
    const boxes = [];
    let k = 0;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 1; j++) {
        boxes.push(
          Box({
            position: [(i - 4.5) * 1.5, (j - 0.5) * 1.5, 30],
            color: hidden[3][k],
          })
        );
        k++;
      }
    }
    return boxes;
  };

  let InputLayer = () => {
    const boxes = [];
    let k = 0;
    for (let i = 28; i > 0; i--) {
      for (let j = 0; j < 28; j++) {
        boxes.push(
          Box({
            position: [(j - 14) * 1.5, (i - 14) * 1.5, -30],
            color: input[k],
          })
        );
        k++;
      }
    }
    return boxes;
  };

  let Conv1 = () => {
    return (
      <mesh
        position={[0, 0, -5]}
        onClick={() => {
          setLimit(32);
          setShow(true);
          setConv(0);
          setCount(1);
        }}
      >
        <boxBufferGeometry attach={"geometry"} args={[28 * 1.5, 28 * 1.5, 5]} />
        <meshLambertMaterial attach={"material"} color={"rgb(30,30,30)"} />
      </mesh>
    );
  };

  let Conv2 = () => {
    return (
      <mesh
        position={[0, 0, 5]}
        onClick={(e) => {
          e.stopPropagation();
          setLimit(48);
          setShow(true);
          setConv(1);
          setCount(1);
        }}
      >
        <boxBufferGeometry
          attach={"geometry"}
          args={[16 * 1.5, 16 * 1.5, 10]}
        />
        <meshLambertMaterial attach={"material"} color={"rgb(30,30,30)"} />
      </mesh>
    );
  };

  let Conv3 = () => {
    return (
      <mesh
        position={[0, 0, 20]}
        onClick={(e) => {
          e.stopPropagation();
          setLimit(64);
          setShow(true);
          setConv(2);
          setCount(1);
        }}
      >
        <boxBufferGeometry
          attach={"geometry"}
          args={[10 * 1.5, 10 * 1.5, 14]}
        />
        <meshLambertMaterial attach={"material"} color={"rgb(30,30,30)"} />
      </mesh>
    );
  };

  // ---------- TF js ---------- //

  let clamp = (color) => Math.round(Math.min(Math.max(color * 255, 5), 255));

  useEffect(() => {
    setCount(0);
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    function handleKeyDown(event) {
      if (event.keyCode === 27) {
        // Clear the canvas to black
        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [model, setModel] = useState(null);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(0);
  const [show, setShow] = useState(false);
  const [conv, setConv] = useState(0);

  // Load hidden features in canvas
  useEffect(() => {
    const canvasRef = imgsRef.current;
    const context = canvasRef.getContext("2d");

    canvasRef.width = 200;
    canvasRef.height = 200;

    const pixelSize = 200 / hidden[conv][count].length;

    for (let i = 0; i < hidden[conv][count].length; i++) {
      for (let j = 0; j < hidden[conv][count][i].length; j++) {
        const pixel = hidden[conv][count][i][j];
        const color = clamp(pixel * 255);
        // const color = `rgb(${pixel * 255}, ${pixel * 255}, ${pixel * 255})`;
        context.fillStyle = "rgb(" + color + ", " + color + ", " + color + ")";
        context.fillRect(j * pixelSize, i * pixelSize, pixelSize, pixelSize);
      }
    }
  }, [count, conv, hidden]);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const imgsRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load the model
  useEffect(() => {
    async function loadModel() {
      const model = await tf.loadLayersModel("/tfjs_model/model.json");
      setModel(model);
      setModelLoaded(true);
      console.log("Model Loaded:", model.layers);
    }
    loadModel();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 200;
    canvas.height = 200;

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.strokeStyle = "white";
    context.lineWidth = 15;
    contextRef.current = context;
  }, []);

  // Compute the outputs of each layer for the given input tensor
  async function computeLayerOutputs(input, model) {
    const outputs = [];
    let currentOutput = input;

    for (let i = 1; i < model.layers.length; i++) {
      currentOutput = model.layers[i].apply(currentOutput);
      const outputCopy = currentOutput.clone(); // create a copy of currentOutput
      if (i === 1) {
        const output = outputCopy.transpose([3, 1, 2, 0]).reshape([32, 26, 26]);
        outputs.push(await output.array());
      } else if (i === 3) {
        const output = outputCopy.transpose([3, 1, 2, 0]).reshape([48, 11, 11]);
        outputs.push(await output.array());
      } else if (i === 5) {
        const output = outputCopy.transpose([3, 1, 2, 0]).reshape([64, 3, 3]);
        outputs.push(await output.array());
      } else if (i === 9) {
        const output = outputCopy.reshape([10]);
        outputs.push(await output.array());
      }
    }
    // setHidden(outputs.map((arr) => arr.map((num) => num * 255)));
    setHidden(outputs);
    return outputs;
  }

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.imageSmoothingEnabled = true;
    contextRef.current.moveTo(offsetX, offsetY);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
    setIsDrawing(true);
    nativeEvent.preventDefault();
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
    nativeEvent.preventDefault();
  };

  const stopDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);

    // Get the canvas pixel data
    const imageData = contextRef.current.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const pixels = imageData.data;

    // Determine the scale factor
    const scaleFactor =
      canvasRef.current.width > 28 ? 28 / canvasRef.current.width : 1;

    // Convert the pixel data into a matrix
    const matrix = [];
    for (let y = 0; y < 28; y++) {
      const row = [];
      for (let x = 0; x < 28; x++) {
        const sx = Math.floor(x / scaleFactor);
        const sy = Math.floor(y / scaleFactor);
        const index = (sy * canvasRef.current.width + sx) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const gray = (r + g + b) / 3;
        const normalized = gray / 255;
        row.push(normalized);
      }
      matrix.push(row);
    }

    // Flatten the matrix into a 1D array
    const flattened = matrix.flat();

    // Convert the flattened array to float32
    const floatArray = new Float32Array(flattened);

    // Reshape the floatArray into a 2D array with shape (1, 784)
    const inp = tf.tensor(Array.from(floatArray), [1, 28, 28, 1]);

    setInput(floatArray);

    if (modelLoaded) {
      // Compute outputs of each layer for the input tensor
      computeLayerOutputs(inp, model);
    } else {
      console.log("Model not loaded yet");
    }
  };

  return (
    <div className="App">
      <Canvas style={{ width: "80vw", height: "100vh" }}>
        <CameraControls />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <spotLight position={[200, 250, 200]} angle={0.2} intensity={1.5} />
        <InputLayer />
        <Conv1 />
        <Conv2 />
        <Conv3 />
        <Layer10 />
      </Canvas>
      <div className="canvas-div">
        <img
          className="left-img"
          src={leftimg}
          alt="left"
          onClick={() => {
            if (count > 0) {
              setCount(count - 1);
            } else {
              setCount(limit - 1);
            }
          }}
          style={{ visibility: show ? "visible" : "hidden" }}
        />
        <canvas
          className="hidden-canvas"
          width={200}
          height={200}
          ref={imgsRef}
          style={{ visibility: show ? "visible" : "hidden" }}
        />
        <img
          className="right-img"
          src={rightimg}
          alt="right"
          onClick={() => {
            if (count < limit - 1) {
              setCount(count + 1);
            } else {
              setCount(1);
            }
          }}
          style={{ visibility: show ? "visible" : "hidden" }}
        />
        <canvas
          className="drawing-canvas"
          width={28}
          height={28}
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          willReadFrequently={true}
        />
        <span>Esc to clear</span>
      </div>
    </div>
  );
}

export default App;
