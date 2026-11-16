import { BRAND } from "@/lib/brand";
import { ImageResponse } from "next/og";
export const alt = `${BRAND.name} — Kendine uygun olanı keşfet`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px",
          background: "#101a2b",
          color: "#edf3fc",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#65d8be" }}>
          {BRAND.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            lineHeight: 1.1,
            letterSpacing: "-3px",
            maxWidth: 960,
          }}
        >
          Kendine uygun olanı keşfet.
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#95a8c1" }}>
          Android · iOS · Windows · Made by softwexa.com
        </div>
      </div>
    ),
    size,
  );
}
