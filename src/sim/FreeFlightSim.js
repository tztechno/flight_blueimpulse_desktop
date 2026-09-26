/**
 * FreeFlightSim.js
 * 6-DOF Jet Fighter Aerodynamic Simulation Engine for Kawasaki T-4 Blue Impulse.
 * Supports Solo Freestyle, Formation Leader AI Companion, and Wingman Training Challenge.
 */

import * as THREE from 'three';

export class FreeFlightSim {
  constructor() {
    this.reset('runway_takeoff');
  }

  reset(preset = 'runway_takeoff') {
    this.preset = preset;

    const rad07 = (68.0 * Math.PI) / 180.0;
    const fwd07X = Math.sin(rad07);
    const fwd07Z = -Math.cos(rad07);

    if (preset === 'airborne_bay') {
      // Airborne over Matsushima Bay at 2,500ft, 250kt
      this.position = new THREE.Vector3(fwd07X * -1500.0, 750.0, fwd07Z * -1500.0);
      this.heading = 68.0;
      this.pitch = 2.0;
      this.bank = 0.0;
      this.speed = 130.0; // ~250 kt
      this.gear = 0.0;
      this.throttle = 0.7;
      this.actualThrustRatio = 0.7;
      this.isGrounded = false;
    } else if (preset === 'final_approach') {
      // 3km out on Runway 07 Final Approach (1,000ft, 140kt, Gear Down)
      this.position = new THREE.Vector3(fwd07X * -3000.0, 160.0, fwd07Z * -3000.0);
      this.heading = 68.0;
      this.pitch = -3.0;
      this.bank = 0.0;
      this.speed = 72.0; // ~140 kt
      this.gear = 1.0;
      this.throttle = 0.55;
      this.actualThrustRatio = 0.55;
      this.isGrounded = false;
    } else {
      // Default: Runway 07 Threshold ready for Takeoff
      this.position = new THREE.Vector3(fwd07X * -1100.0, 2.5, fwd07Z * -1100.0);
      this.heading = 68.0;
      this.pitch = 0.0;
      this.bank = 0.0;
      this.speed = 0.0;
      this.gear = 1.0;
      this.throttle = 0.6;
      this.actualThrustRatio = 0.6;
      this.isGrounded = true;
    }

    // Control Inputs
    this.elevatorInput = 0.0;
    this.aileronInput = 0.0;
    this.rudderInput = 0.0;
    this.airbrake = 0.0;
    this.wheelBrakes = false;
    this.isSmoking = false;

    // Aircraft Physical Properties (Kawasaki T-4 Jet Trainer)
    this.mass = 5500.0; // kg (Aerobatic clean weight)
    this.wingArea = 21.0; // m^2
    this.maxThrust = 32800.0; // N (2x 16.4 kN IHI F3 turbofans)
    this.rho = 1.225; // kg/m^3
    this.g = 9.80665; // m/s^2

    // Flight Dynamics State
    this.verticalSpeed = 0.0;
    this.gamma = 0.0; // flight path angle (rad)
    this.gForce = 1.0;
    this.elapsedTime = 0.0;
    this.groundElevation = 2.5;
    this.stallWarning = false;
    this.touchdownRecorded = false;
    this.isCrashed = false;
    this.hasEverTakenOff = false;
    this.justImpacted = false;
    this.lastImpactData = null;
  }

  setThrottle(valPercent) {
    this.throttle = Math.max(0.0, Math.min(100.0, valPercent)) / 100.0;
  }

  syncState(state) {
    if (!state) return;
    if (state.position) this.position.copy(state.position);
    if (state.heading !== undefined) this.heading = state.heading;
    if (state.pitch !== undefined) this.pitch = state.pitch;
    if (state.bank !== undefined) this.bank = state.bank;
    if (state.speed !== undefined) this.speed = state.speed;
    if (state.gear !== undefined) this.gear = state.gear;
    if (state.throttle !== undefined) {
      this.throttle = state.throttle;
      this.actualThrustRatio = state.throttle;
    }
    if (state.isSmoking !== undefined) this.isSmoking = state.isSmoking;
    if (state.isGrounded !== undefined) this.isGrounded = state.isGrounded;
    else this.isGrounded = this.position.y <= (this.groundElevation || 2.5) + 0.5;
    this.hasEverTakenOff = !this.isGrounded;
    this.isCrashed = false;
    this.justImpacted = false;
    this.lastImpactData = null;
    this.elapsedTime = 0.0;
  }

  toggleGear() {
    if (!this.isCrashed) {
      if (this.isGrounded) {
        this.gear = 1.0;
      } else {
        this.gear = this.gear > 0.5 ? 0.0 : 1.0;
      }
      return this.gear;
    }
    return this.gear;
  }

  toggleAirbrake() {
    if (!this.isCrashed) {
      this.airbrake = this.airbrake > 0.5 ? 0.0 : 1.0;
      return this.airbrake;
    }
    return this.airbrake;
  }

  toggleSmoke() {
    this.isSmoking = !this.isSmoking;
    return this.isSmoking;
  }

  update(dt, inputs = {}, terrainElev = 2.5) {
    if (this.isCrashed) return;

    dt = Math.max(0.001, Math.min(dt, 0.1));
    this.elapsedTime += dt;
    this.groundElevation = Math.max(0.0, terrainElev);

    // Apply inputs
    if (inputs.elevator !== undefined) this.elevatorInput = inputs.elevator;
    if (inputs.aileron !== undefined) this.aileronInput = inputs.aileron;
    if (inputs.rudder !== undefined) this.rudderInput = inputs.rudder;
    if (inputs.throttle !== undefined) this.throttle = Math.max(0.0, Math.min(1.0, inputs.throttle));
    if (inputs.airbrake !== undefined) this.airbrake = inputs.airbrake;
    if (inputs.wheelBrakes !== undefined) this.wheelBrakes = inputs.wheelBrakes;
    if (inputs.isSmoking !== undefined) this.isSmoking = inputs.isSmoking;

    // Engine Spool Dynamics (Twin turbofans)
    const spoolRate = 1.2 * dt;
    if (this.actualThrustRatio < this.throttle) {
      this.actualThrustRatio = Math.min(this.throttle, this.actualThrustRatio + spoolRate);
    } else if (this.actualThrustRatio > this.throttle) {
      this.actualThrustRatio = Math.max(this.throttle, this.actualThrustRatio - spoolRate * 1.5);
    }

    const netThrust = this.actualThrustRatio * this.maxThrust;
    const q = 0.5 * this.rho * this.speed * this.speed; // dynamic pressure

    const toRad = (d) => (d * Math.PI) / 180.0;
    const toDeg = (r) => (r * 180.0) / Math.PI;

    if (this.isGrounded) {
      // Ground Roll Dynamics
      this.gear = 1.0;
      this.bank = 0.0;

      // Nosewheel steering on ground
      this.heading += this.rudderInput * 25.0 * dt * Math.min(1.0, Math.max(0.1, this.speed / 10.0));

      // Elevator pitch on ground (rotation for liftoff when speed > 55 m/s (~110 kt))
      if (this.speed > 45.0) {
        this.pitch = Math.max(0.0, Math.min(14.0, this.pitch + this.elevatorInput * 18.0 * dt));
      } else {
        this.pitch = 0.0;
      }

      // Rolling friction + Wheel Brakes + Aero Drag
      let frictionCoeff = 0.022;
      if (this.wheelBrakes) frictionCoeff += 0.55;
      if (this.airbrake > 0.5) frictionCoeff += 0.25;
      if (this.throttle <= 0.05) frictionCoeff += 0.15; // Natural taxi engine idle deceleration

      const frictionForce = frictionCoeff * this.mass * this.g;
      const aeroDrag = q * this.wingArea * (0.025 + 0.04 * this.gear + (this.airbrake > 0.5 ? 0.08 : 0.0));
      const accel = (netThrust - frictionForce - aeroDrag) / this.mass;

      this.speed = Math.max(0.0, this.speed + accel * dt);
      if (this.speed < 0.6 && (this.wheelBrakes || this.airbrake > 0.5 || this.throttle <= 0.05)) {
        this.speed = 0.0; // Clean full stop
      }
      this.verticalSpeed = 0.0;
      this.position.y = this.groundElevation;
      this.gForce = 1.0;

      // Move along heading
      const hdgRad = toRad(this.heading);
      this.position.x += Math.sin(hdgRad) * this.speed * dt;
      this.position.z += -Math.cos(hdgRad) * this.speed * dt;

      // Liftoff Check (Speed > 50m/s (~100kt) and positive pitch rotation > 3.0 deg)
      const lift = q * this.wingArea * (0.42 + 0.15 * this.pitch);
      if (lift > this.mass * this.g * 0.92 && this.speed > 48.0 && this.pitch > 2.5) {
        this.isGrounded = false;
        this.verticalSpeed = Math.max(2.5, this.speed * Math.sin(toRad(this.pitch)));
        this.gamma = toRad(Math.min(18.0, this.pitch));
      }

    } else {
      // Only consider plane permanently airborne after climbing past safe altitude (12m / ~40ft) at speed
      if (this.position.y >= this.groundElevation + 10.0 && this.speed > 50.0) {
        this.hasEverTakenOff = true;
      }

      // Airborne Jet Flight Dynamics
      const aoa = this.pitch - toDeg(this.gamma);

      // Jet Fighter Control Authority
      const ctrlAuthority = Math.min(2.0, Math.max(0.2, this.speed / 45.0));
      const pitchRate = this.elevatorInput * 38.0 * ctrlAuthority; // high G pull
      const rollRate = this.aileronInput * 160.0 * ctrlAuthority; // rapid roll rate
      const yawRate = this.rudderInput * 20.0 * ctrlAuthority;

      this.pitch += pitchRate * dt;
      this.bank += rollRate * dt;

      // Turn rate from bank angle (Coordinated aerodynamic turn)
      const turnRate = (this.g * Math.tan(toRad(this.bank))) / Math.max(20.0, this.speed);
      this.heading += (toDeg(turnRate) + yawRate) * dt;
      this.heading = (this.heading + 360.0) % 360.0;

      // Aerodynamic Lift & Drag
      let cL = 0.36 + 0.12 * aoa;
      if (aoa > 26.0 || aoa < -16.0) {
        this.stallWarning = true;
        cL *= 0.5; // stall loss
      } else {
        this.stallWarning = false;
      }

      const lift = q * this.wingArea * cL;
      const inducedDrag = (cL * cL) / (Math.PI * 7.5 * 0.85);
      const totalCD = 0.020 + inducedDrag + 0.030 * this.gear + (this.airbrake > 0.5 ? 0.08 : 0.0);
      const drag = q * this.wingArea * totalCD;

      // Flight path accelerations
      const dV = (netThrust * Math.cos(toRad(aoa)) - drag - this.mass * this.g * Math.sin(this.gamma)) / this.mass;
      this.speed = Math.max(15.0, this.speed + dV * dt);

      const dGamma = (lift * Math.cos(toRad(this.bank)) + netThrust * Math.sin(toRad(aoa)) - this.mass * this.g * Math.cos(this.gamma)) / (this.mass * Math.max(20.0, this.speed));
      this.gamma += dGamma * dt;
      this.verticalSpeed = this.speed * Math.sin(this.gamma);

      this.gForce = Math.max(-2.0, Math.min(8.5, (lift / (this.mass * this.g)) * Math.cos(toRad(this.bank))));

      // Position update
      const hdgRad = toRad(this.heading);
      const horizSpeed = this.speed * Math.cos(this.gamma);
      this.position.x += Math.sin(hdgRad) * horizSpeed * dt;
      this.position.z += -Math.cos(hdgRad) * horizSpeed * dt;
      this.position.y += this.verticalSpeed * dt;

      // Touchdown / Ground Impact Check
      if (this.position.y <= this.groundElevation + 0.3) {
        this.justImpacted = true;
        this.lastImpactData = {
          verticalSpeed: this.verticalSpeed,
          speed: this.speed,
          pitch: this.pitch,
          bank: this.bank,
          gear: this.gear,
          groundElevation: this.groundElevation,
          airspeedKt: this.speed * 1.94384,
        };

        this.position.y = this.groundElevation;
        this.isGrounded = true;
        this.touchdownRecorded = true;
      }
    }
  }

  getLeaderState() {
    const hdgRad = (this.heading * Math.PI) / 180.0;
    const pitchRad = (this.pitch * Math.PI) / 180.0;
    const bankRad = (this.bank * Math.PI) / 180.0;

    const fwd = new THREE.Vector3(
      Math.sin(hdgRad) * Math.cos(pitchRad),
      Math.sin(pitchRad),
      -Math.cos(hdgRad) * Math.cos(pitchRad)
    ).normalize();

    const r0 = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    if (r0.lengthSq() < 1e-4) r0.set(1, 0, 0);
    else r0.normalize();

    const u0 = new THREE.Vector3().crossVectors(r0, fwd).normalize();
    const rBanked = new THREE.Vector3().copy(r0).multiplyScalar(Math.cos(bankRad)).addScaledVector(u0, -Math.sin(bankRad));
    const uBanked = new THREE.Vector3().copy(r0).multiplyScalar(Math.sin(bankRad)).addScaledVector(u0, Math.cos(bankRad));
    const dBack = new THREE.Vector3().copy(fwd).negate();

    const rotMatrix = new THREE.Matrix4().makeBasis(rBanked, uBanked, dBack);
    const quat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

    return {
      position: this.position.clone(),
      quaternion: quat,
      forward: fwd,
      velocity: fwd.clone().multiplyScalar(this.speed),
      heading: this.heading,
      pitch: this.pitch,
      bank: this.bank,
      speed: this.speed,
      airspeedKt: this.speed * 1.94384,
      mach: this.speed / 340.0,
      altitudeFt: this.position.y * 3.28084,
      verticalSpeed: this.verticalSpeed,
      gForce: this.gForce,
      gear: this.gear,
      airbrake: this.airbrake,
      throttle: this.actualThrustRatio,
      isSmoking: this.isSmoking,
      isGrounded: this.isGrounded,
      hasEverTakenOff: this.hasEverTakenOff,
      isCrashed: this.isCrashed,
    };
  }
}
