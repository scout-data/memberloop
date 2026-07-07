import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const CIRCLES = [
  [17.47, 16.0], [14.12, 17.72], [16.29, 12.73], [18.37, 19.09],
  [11.66, 15.23], [20.11, 13.38], [14.62, 21.12], [13.38, 10.95],
  [21.69, 18.08], [10.08, 18.44], [18.85, 9.9],  [18.11, 22.73],
  [9.64,  12.32], [23.46, 14.36], [11.45, 22.48], [14.95, 7.88],
  [22.46, 21.44], [7.31,  16.36], [22.34, 9.69],  [15.58, 25.17],
  [9.97,  8.77],  [25.55, 17.28], [7.91,  21.63], [18.21, 6.17],
  [21.12, 24.93], [6.0,   12.81], [25.71, 11.51], [11.79, 26.06],
];

// Map original coordinates (range ~6-26) to 32px canvas
const MIN = 5.5, MAX = 26.5, RANGE = MAX - MIN;

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: 32, height: 32, position: "relative", background: "transparent" }}>
      {CIRCLES.map(([cx, cy], i) => {
        const x = ((cx - MIN) / RANGE) * 32;
        const y = ((cy - MIN) / RANGE) * 32;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 1.8,
              top: y - 1.8,
              width: 3.6,
              height: 3.6,
              borderRadius: "50%",
              background: "#003014",
            }}
          />
        );
      })}
    </div>,
    { ...size }
  );
}
