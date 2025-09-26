import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import "./preview.js";

const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
	layout: LAYOUT,
	panelWidth: 28,
	isMirrored: true,
	transport: !IS_DEV ? {
		type: 'serial',
		path: '/dev/ttyACM0',
		baudRate: 57600
	} : {
		type: 'ip',
		host: '127.0.0.1',
		port: 3000
	}
});

const { width, height } = display;

// Create output directory if it doesn't exist
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

registerFont(
    path.resolve(import.meta.dirname, "../fonts/init-pidmobil-3-led-dotmap.ttf"),
    { family: "Dotmap" },
);

// Register fonts
registerFont(
	path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"),
	{ family: "OpenSans" },
);

registerFont(
	path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
	{ family: "PPNeueMontreal" },
);
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), {
	family: "Px437_ACM_VGA",
});

// Create canvas with the specified resolution
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;
// Set a pixel-perfect monospace font
ctx.font = "24px monospace";
// Align text precisely to pixel boundaries
ctx.textBaseline = "top";

// Initialize the ticker at x frames per second
const ticker = new Ticker({ fps: FPS });

const gameState = {turnsLeft: 0, maxTurns: 11};

ticker.start(({ deltaTime, elapsedTime }) => {
	// Clear the console
	console.clear();
	console.time("Write frame");
	console.log(`Rendering a ${width}x${height} canvas`);
	console.log("View at http://localhost:3000/view");

	ctx.clearRect(0, 0, width, height);

	// Fill the canvas with a black background
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);

	// Display the word
	{
		const text = "D";

		ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#fff";
		ctx.font = '14px Dotmap';

        const sine = Math.sin(elapsedTime / 1000);

		const { actualBoundingBoxAscent, actualBoundingBoxRight, actualBoundingBoxLeft, width: textWidth } =
			ctx.measureText(text);

        ctx.fillText(
            "B",
            24 + 0*10,
            4,
        );
        ctx.fillText(
            "O",
            23 + 1*10,
            4,
        );
        ctx.fillText(
            "E",
            24 + 2*10,
            4,
        );
        ctx.fillText(
            "K",
            24 + 3*10,
            4,
        );
        ctx.fillText(
            "E",
            24 + 4*10,
            4,
        );
        ctx.fillText(
            "N",
            23 + 5*10,
            4,
        );

        for (let i = 0; i < 6; i++) {
            ctx.fillRect(
                23 + i*10,
                20,
                9,
                1
            );
        }
        const x = 11;
        const y = 5;
        const size = 5;

        //Pole

        if(gameState.turnsLeft <= 10)
            ctx.fillRect(x-8, y-3, 1, 24)

        //Hanging Stick

        if(gameState.turnsLeft <= 9)
            ctx.fillRect(x-8, y-3, 15, 1)

        //Support

        if(gameState.turnsLeft <= 8)
        {
            ctx.beginPath();
            ctx.moveTo(x-8, y+5);
            ctx.lineTo(x, y-3);
            ctx.stroke();
        }

        //Base

        if(gameState.turnsLeft <= 7)
            ctx.fillRect(x-10, y+20, 19, 1)

        //Strop

        if(gameState.turnsLeft <= 6)
            ctx.fillRect(x+2, y-3, 1, 3)

        //Head

        if(gameState.turnsLeft <= 5)
        {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        //Body

        if(gameState.turnsLeft <= 4)
            ctx.fillRect(x + 2, y + 5, 1, 4)

        //Right Arm

        if(gameState.turnsLeft <= 3)
        {

            ctx.beginPath();
            ctx.moveTo(x + 2, y + 5);
            ctx.lineTo(x + 6, y + 9);
            ctx.stroke();
        }

        //Left Arm

        if(gameState.turnsLeft <= 2)
        {

            ctx.beginPath();
            ctx.moveTo(x + 3, y + 5);
            ctx.lineTo(x - 1, y + 9);
            ctx.stroke();
        }

        //Left Leg

        if(gameState.turnsLeft <= 1)
        {
            ctx.beginPath();
            ctx.moveTo(x + 3, y + 9);
            ctx.lineTo(x -1, y + 15);
            ctx.stroke();
        }

        //Right Leg

        if(gameState.turnsLeft <= 0)
        {
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 9);
            ctx.lineTo(x + 6, y + 15);
            ctx.stroke();
        }
	}

	// Convert image to binary (purely black and white) for flipdot display
	{
		const imageData = ctx.getImageData(0, 0, width, height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			// Apply thresholding - any pixel above 127 brightness becomes white (255), otherwise black (0)
			const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
			const binary = brightness > 127 ? 255 : 0;
			data[i] = binary; // R
			data[i + 1] = binary; // G
			data[i + 2] = binary; // B
			data[i + 3] = 255; // The board is not transparent :-)
		}
		ctx.putImageData(imageData, 0, 0);
	}

	if (IS_DEV) {
		// Save the canvas as a PNG file
		const filename = path.join(outputDir, "frame.png");
		const buffer = canvas.toBuffer("image/png");
		fs.writeFileSync(filename, buffer);
	} else {
		const imageData = ctx.getImageData(0, 0, display.width, display.height);
		display.setImageData(imageData);
		if (display.isDirty()) {
			display.flush();
		}
	}

	console.log(`Eslapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
	console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
	console.timeEnd("Write frame");
});
