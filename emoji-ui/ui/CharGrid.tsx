import React, { useState, useImperativeHandle, Ref } from 'react';

export interface CharCell {
	char: string;           // intended: exactly 1 char
	className?: string;
}

export interface CharGridAPI {
	setChar: (x: number, y: number, char: string, className?: string) => void;
	getChar: (x: number, y: number) => CharCell | undefined;
	print: (x: number, y: number, str: string, className?: string) => void;
	fill: (x1: number, y1: number, x2: number, y2: number, char: string, className?: string) => void;
	clear: () => void;
	drawLine: (x1: number, y1: number, x2: number, y2: number, char: string, className?: string) => void;
	drawRect: (
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		char: string,
		className?: string,
		filled?: boolean
	) => void;
	getDimensions: () => { rows: number; cols: number };
}

export interface CharGridProps {
	rows?: number;
	cols?: number;
	ref?: Ref<CharGridAPI>;
}

function enforceSingleChar(input: string): string {
	if (input.length === 0) return ' ';
	// Take first grapheme (most practical for games — handles emoji too)
	return [...input][0] ?? ' ';
	// Alternative (strict code unit): return input[0] ?? ' ';
}

const CharGrid: React.FC<CharGridProps> = ({ rows = 24, cols = 80, ref }) => {
	const [grid, setGrid] = useState<CharCell[][]>(() =>
		Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => ({ char: ' ' }))
		)
	);

	useImperativeHandle(ref, () => {
		const api: CharGridAPI = {
			setChar(x, y, char, className) {
				if (x < 0 || x >= cols || y < 0 || y >= rows) return;
				const single = enforceSingleChar(char);
				setGrid((prev) => {
					const newGrid = prev.map((row) => [...row]);
					newGrid[y][x] = { char: single, className };
					return newGrid;
				});
			},

			getChar(x, y) {
				if (x < 0 || x >= cols || y < 0 || y >= rows) return undefined;
				return grid[y]?.[x];
			},

			print(x, y, str, className) {
				if (y < 0 || y >= rows) return;
				for (let i = 0; i < str.length; i++) {
					const targetX = x + i;
					if (targetX < 0 || targetX >= cols) continue;
					// Each char is enforced individually
					this.setChar(targetX, y, str[i]!, className);
				}
			},

			fill(x1, y1, x2, y2, char, className) {
				const single = enforceSingleChar(char);
				const minX = Math.max(0, Math.min(x1, x2));
				const maxX = Math.min(cols - 1, Math.max(x1, x2));
				const minY = Math.max(0, Math.min(y1, y2));
				const maxY = Math.min(rows - 1, Math.max(y1, y2));

				setGrid((prev) => {
					const newGrid = prev.map((row) => [...row]);
					for (let yy = minY; yy <= maxY; yy++) {
						for (let xx = minX; xx <= maxX; xx++) {
							newGrid[yy][xx] = { char: single, className };
						}
					}
					return newGrid;
				});
			},

			clear() {
				setGrid(
					Array.from({ length: rows }, () =>
						Array.from({ length: cols }, () => ({ char: ' ' }))
					)
				);
			},

			drawLine(x1, y1, x2, y2, char, className) {
				const single = enforceSingleChar(char);
				const dx = Math.abs(x2 - x1);
				const dy = Math.abs(y2 - y1);
				const sx = x1 < x2 ? 1 : -1;
				const sy = y1 < y2 ? 1 : -1;
				let err = dx - dy;
				let cx = x1;
				let cy = y1;

				while (true) {
					this.setChar(cx, cy, single, className);
					if (cx === x2 && cy === y2) break;
					const e2 = 2 * err;
					if (e2 > -dy) { err -= dy; cx += sx; }
					if (e2 < dx)  { err += dx; cy += sy; }
				}
			},

			drawRect(x1, y1, x2, y2, char, className, filled = false) {
				const single = enforceSingleChar(char);
				const minX = Math.min(x1, x2);
				const maxX = Math.max(x1, x2);
				const minY = Math.min(y1, y2);
				const maxY = Math.max(y1, y2);

				if (filled) {
					this.fill(minX, minY, maxX, maxY, single, className);
				} else {
					for (let x = minX; x <= maxX; x++) {
						this.setChar(x, minY, single, className);
						this.setChar(x, maxY, single, className);
					}
					for (let y = minY + 1; y < maxY; y++) {
						this.setChar(minX, y, single, className);
						this.setChar(maxX, y, single, className);
					}
				}
			},

			getDimensions() {
				return { rows, cols };
			},
		};

		return api;
	});

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: `repeat(${cols}, 1ch)`,
				fontFamily: 'monospace',
				whiteSpace: 'pre',
				lineHeight: 1,
				overflow: 'hidden',
			}}
		>
			{grid.flatMap((row, y) =>
				row.map((cell, x) => (
					<span key={`${y}-${x}`} className={cell.className}>
            {cell.char}
          </span>
				))
			)}
		</div>
	);
};

export { CharGrid };