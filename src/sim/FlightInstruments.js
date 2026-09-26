/**
 * FlightInstruments.js
 * High-performance 2D Canvas Heads-Up Display (HUD) for Kawasaki T-4 Fighter Jet.
 * Renders Pitch Ladder, FPV Vector, Airspeed/Mach, Altimeter, G-meter, Compass Tape,
 * Smoke Status, and Formation Guidance Reticle.
 */

export class FlightInstruments {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.hudColor = '#00f0ff'; // Neon Cyan/Green
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = (rect.width || 260) * dpr;
    this.canvas.height = (rect.height || 260) * dpr;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  render(telemetry = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;

    const pitch = telemetry.pitchDeg || 0;
    const bank = telemetry.bankDeg || 0;
    const hdg = telemetry.headingDeg || 0;
    const spdKt = Math.round(telemetry.airspeedKt || 0);
    const altFt = Math.round(telemetry.altitudeFt || 0);
    const mach = (telemetry.mach || 0.45).toFixed(2);
    const gForce = (telemetry.gForce || 1.0).toFixed(1);
    const isSmoking = telemetry.isSmoking || false;
    const gear = telemetry.gear !== undefined ? telemetry.gear : 0;
    const airbrake = telemetry.airbrake !== undefined ? telemetry.airbrake : 0;

    // Glowing HUD styling
    ctx.strokeStyle = this.hudColor;
    ctx.fillStyle = this.hudColor;
    ctx.lineWidth = 2 * (w / 260);
    ctx.shadowColor = this.hudColor;
    ctx.shadowBlur = 4;

    ctx.save();
    ctx.translate(cx, cy);
    // Rotate pitch ladder and horizon to match aircraft roll direction perfectly (Right roll -> Clockwise)
    ctx.rotate((bank * Math.PI) / 180.0);

    // 1. Pitch Ladder
    const pixelsPerDeg = (h * 0.5) / 25.0;
    const pitchOffset = pitch * pixelsPerDeg;

    for (let deg = -60; deg <= 60; deg += 10) {
      if (deg === 0) {
        // Horizon Line
        const y = pitchOffset;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, y);
        ctx.lineTo(-w * 0.1, y);
        ctx.moveTo(w * 0.1, y);
        ctx.lineTo(w * 0.35, y);
        ctx.stroke();
      } else {
        const y = pitchOffset - deg * pixelsPerDeg;
        if (Math.abs(y) < h * 0.42) {
          const rungW = deg % 20 === 0 ? w * 0.16 : w * 0.1;
          ctx.beginPath();
          if (deg > 0) {
            // Positive pitch: solid rung
            ctx.moveTo(-rungW, y);
            ctx.lineTo(-w * 0.05, y);
            ctx.lineTo(-w * 0.05, y + 4);
            ctx.moveTo(rungW, y);
            ctx.lineTo(w * 0.05, y);
            ctx.lineTo(w * 0.05, y + 4);
          } else {
            // Negative pitch: dashed rung
            ctx.setLineDash([4, 4]);
            ctx.moveTo(-rungW, y);
            ctx.lineTo(-w * 0.05, y);
            ctx.moveTo(rungW, y);
            ctx.lineTo(w * 0.05, y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.stroke();

          // Pitch number
          ctx.font = `bold ${Math.round(11 * (w / 260))}px monospace`;
          ctx.textAlign = 'right';
          ctx.fillText(`${Math.abs(deg)}`, -rungW - 4, y + 4);
          ctx.textAlign = 'left';
          ctx.fillText(`${Math.abs(deg)}`, rungW + 4, y + 4);
        }
      }
    }
    ctx.restore();

    // 2. Flight Path Vector (FPV) Aircraft Reticle in Center
    ctx.beginPath();
    ctx.arc(cx, cy, 6 * (w / 260), 0, Math.PI * 2);
    ctx.moveTo(cx - 14 * (w / 260), cy);
    ctx.lineTo(cx - 6 * (w / 260), cy);
    ctx.moveTo(cx + 6 * (w / 260), cy);
    ctx.lineTo(cx + 14 * (w / 260), cy);
    ctx.moveTo(cx, cy - 6 * (w / 260));
    ctx.lineTo(cx, cy - 12 * (w / 260));
    ctx.stroke();

    // 2B. Bank Angle Indicator Arc (Top)
    const bankNorm = Math.round(((bank % 360) + 360) % 360);
    const bankDisplay = bankNorm > 180 ? `L ${360 - bankNorm}°` : `R ${bankNorm}°`;
    ctx.font = `bold ${Math.round(10 * (w / 260))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`BANK: ${bankNorm === 0 ? 'LEVEL 0°' : bankDisplay}`, cx, 48 * (w / 260));

    // 3. Airspeed Box (Left)
    ctx.font = `bold ${Math.round(14 * (w / 260))}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`${spdKt} KT`, 12 * (w / 260), cy - 10);
    ctx.font = `${Math.round(11 * (w / 260))}px monospace`;
    ctx.fillText(`M ${mach}`, 12 * (w / 260), cy + 12);

    // 4. Altitude Box (Right)
    ctx.font = `bold ${Math.round(14 * (w / 260))}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`${altFt} FT`, w - 12 * (w / 260), cy - 10);
    const altM = Math.round(altFt / 3.28084);
    ctx.font = `${Math.round(11 * (w / 260))}px monospace`;
    ctx.fillText(`${altM} M`, w - 12 * (w / 260), cy + 12);

    // 5. Top Status Bar: Pilot Role / Camera Mode (Left) & Smoke (Right)
    const pilotBadge = telemetry.pilotRoleText || (telemetry.isManual ? 'PILOT: #1 LEAD' : 'AUTO ROUTINE');
    ctx.fillStyle = telemetry.isManual ? '#ffd700' : '#00f0ff';
    ctx.font = `bold ${Math.round(10 * (w / 260))}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(pilotBadge, 10 * (w / 260), 16 * (w / 260));

    // Smoke Status Indicator (Top Right)
    if (isSmoking) {
      ctx.fillStyle = '#00ff88';
      ctx.textAlign = 'right';
      ctx.font = `bold ${Math.round(10 * (w / 260))}px monospace`;
      ctx.fillText('SMOKE ON', w - 10 * (w / 260), 16 * (w / 260));
    }

    // Heading Compass Tape (Top Center)
    ctx.fillStyle = this.hudColor;
    ctx.font = `bold ${Math.round(12 * (w / 260))}px monospace`;
    ctx.textAlign = 'center';
    const hdgPad = Math.round(hdg).toString().padStart(3, '0');
    ctx.fillText(`HDG ${hdgPad}°`, cx, 32 * (w / 260));

    // 6. G-Meter (Bottom Left)
    const gVal = parseFloat(gForce);
    ctx.fillStyle = gVal > 5.0 ? '#ff3344' : this.hudColor;
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.round(11 * (w / 260))}px monospace`;
    ctx.fillText(`G: ${gForce}`, 12 * (w / 260), h - 14 * (w / 260));

    // 8. Gear / Airbrake indicators
    if (gear > 0.5) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('GEAR', cx, h - 32 * (w / 260));
    }
    if (airbrake > 0.5) {
      ctx.fillStyle = '#ff4444';
      ctx.fillText('SPD BRAKE', cx, h - 16 * (w / 260));
    }
  }
}
