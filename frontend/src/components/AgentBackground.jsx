// import React, { useRef, useEffect } from "react";

// function AgentBackground({ size = 300, children }) {
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     let animationId;
//     let time = 0;

//     const draw = () => {
//       const w = canvas.width;
//       const h = canvas.height;
//       ctx.clearRect(0, 0, w, h);

//       // dark background
//       ctx.fillStyle = "#0f0f0f";
//       ctx.fillRect(0, 0, w, h);

//       // radial gradient center glow
//       const grad = ctx.createRadialGradient(
//         w / 2, h / 2, w * 0.1,
//         w / 2, h / 2, w * 0.8
//       );
//       grad.addColorStop(0, "rgba(255, 200, 50, 0.3)");
//       grad.addColorStop(0.5, "rgba(255, 100, 0, 0.0)");
//       grad.addColorStop(1, "rgba(0, 0, 0, 0.5)");

//       ctx.fillStyle = grad;
//       ctx.beginPath();
//       ctx.arc(w / 2, h / 2, w * 0.8, 0, Math.PI * 2);
//       ctx.fill();

//       // rotating ring / lines effect
//       ctx.save();
//       ctx.translate(w / 2, h / 2);
//       ctx.rotate(time * 0.0005);
//       ctx.strokeStyle = "rgba(255,255,200,0.2)";
//       ctx.lineWidth = 2;
//       const rings = 6;
//       for (let i = 1; i <= rings; i++) {
//         ctx.beginPath();
//         const r = (w / 2) * (i / rings);
//         ctx.arc(0, 0, r, 0, Math.PI * 2);
//         ctx.stroke();
//       }
//       ctx.restore();

//       // subtle noise / flicker overlay (optional)
//       const imageData = ctx.getImageData(0, 0, w, h);
//       const data = imageData.data;
//       for (let i = 0; i < data.length; i += 4) {
//         const rand = (Math.random() - 0.5) * 5;
//         data[i] += rand;
//         data[i + 1] += rand;
//         data[i + 2] += rand;
//       }
//       ctx.putImageData(imageData, 0, 0);

//       time += 1;
//       animationId = requestAnimationFrame(draw);
//     };

//     draw();

//     return () => {
//       cancelAnimationFrame(animationId);
//     };
//   }, []);

//   return (
//     <div style={{ position: "relative", width: size, height: size }}>
//       <canvas
//         ref={canvasRef}
//         width={size}
//         height={size}
//         style={{ position: "absolute", top: 0, left: 0, borderRadius: "50%" }}
//       />
//       <div style={{
//         position: "absolute",
//         top: 0, left: 0, right: 0, bottom: 0,
//         display: "flex",
//         alignItems: "center", justifyContent: "center"
//       }}>
//         {children}
//       </div>
//     </div>
//   );
// }

// export default AgentBackground;
