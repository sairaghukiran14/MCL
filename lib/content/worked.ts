import type { WorkedExample } from "./types";

/* One fully solved problem per core lesson, shown one step at a time before the challenges.
   Numbers differ from the lesson's challenges so the learner still has to do those alone. */
export const WORKED: Record<string, WorkedExample> = {
  "ac-phasors": {
    prompt: "A 50 Hz supply v = 325·sin(ω<i>t</i>) V drives an RL load with R = 4 Ω and L = 9.55 mH. Find the RMS current and how far it lags the voltage.",
    steps: [
      "Angular frequency: ω = 2π × 50 = 314.2 rad/s.",
      "Inductive reactance: X<sub>L</sub> = ωL = 314.2 × 0.00955 = 3.0 Ω.",
      "Impedance magnitude: |Z| = √(R² + X<sub>L</sub>²) = √(16 + 9) = 5 Ω.",
      "Peak current: I<sub>m</sub> = 325 / 5 = 65 A, so I<sub>rms</sub> = 65 / √2 = 46.0 A.",
      "Phase: φ = atan(X<sub>L</sub>/R) = atan(3/4) = 36.9°. The load is inductive, so the current lags.",
    ],
    answer: "46.0 A rms, lagging the voltage by 36.9°.",
  },
  "three-phase": {
    prompt: "A star-connected motor on a 400 V line draws 12 A at a power factor of 0.8 lagging. Find the phase voltage, S, P and Q.",
    steps: [
      "Phase voltage in star: V<sub>ph</sub> = V<sub>L</sub> / √3 = 400 / 1.732 = 230.9 V.",
      "Apparent power: S = √3 · V<sub>L</sub> · I<sub>L</sub> = 1.732 × 400 × 12 = 8314 VA.",
      "Real power: P = S · cos φ = 8314 × 0.8 = 6651 W.",
      "sin φ = √(1 − 0.8²) = 0.6, so Q = S · sin φ = 4988 var.",
      "Check the power triangle: √(6651² + 4988²) = 8314 VA. It closes.",
    ],
    answer: "V<sub>ph</sub> = 231 V, S = 8.31 kVA, P = 6.65 kW, Q = 4.99 kvar.",
  },
  "em-torque": {
    prompt: "A 20-turn rectangular coil, 40 mm long and 30 mm wide, sits in a 0.5 T field and carries 3 A. Find the maximum torque, and the torque when the coil's normal is 60° from B.",
    steps: [
      "Coil area: A = 0.040 × 0.030 = 1.2 × 10⁻³ m².",
      "Maximum torque (sin θ = 1): T = N·B·I·A = 20 × 0.5 × 3 × 0.0012 = 0.036 N·m.",
      "Cross-check with forces: each 40 mm side feels F = N·B·I·L = 20 × 0.5 × 3 × 0.04 = 1.2 N, at a lever arm of 15 mm. Two sides: 2 × 1.2 × 0.015 = 0.036 N·m. Same answer.",
      "At θ = 60°: T = 0.036 × sin 60° = 0.0312 N·m.",
    ],
    answer: "36 mN·m at most, 31.2 mN·m at 60°.",
  },
  "dc-motor": {
    prompt: "A 12 V DC motor with R = 0.8 Ω and K = 0.02 V·s/rad runs at 4000 rpm under load. Ignoring friction, find the current, torque, output power and efficiency.",
    steps: [
      "Speed in rad/s: ω = 4000 × 2π / 60 = 418.9 rad/s.",
      "Back-EMF: E = K·ω = 0.02 × 418.9 = 8.38 V.",
      "Current: I = (V − E) / R = (12 − 8.38) / 0.8 = 4.53 A.",
      "Torque: T = K·I = 0.02 × 4.53 = 0.0906 N·m. Output power: T·ω = 37.9 W (equal to E·I, as it should be).",
      "Input power: V·I = 12 × 4.53 = 54.3 W. Efficiency: 37.9 / 54.3 = 69.8%. The rest is I²R = 16.4 W in the winding.",
    ],
    answer: "4.53 A, 0.091 N·m, 37.9 W out, 70% efficient.",
  },
  "bldc-sixstep": {
    prompt: "A 4-pole-pair BLDC runs at 1800 rpm with sensorless six-step. Find the commutation rate, the time per step, and how long after a back-EMF zero crossing to commutate.",
    steps: [
      "Mechanical speed: 1800 / 60 = 30 rev/s.",
      "Steps per mechanical revolution: 6 × p = 6 × 4 = 24.",
      "Commutation rate: 30 × 24 = 720 Hz, so each 60° step lasts 1 / 720 = 1.389 ms.",
      "The zero crossing sits in the middle of a step, so commutate 30° later: half a step, 0.694 ms.",
      "In firmware, measure the time between the last two zero crossings and wait half of it. That tracks speed changes automatically.",
    ],
    answer: "720 Hz, 1.39 ms per step, commutate 0.69 ms after the zero crossing.",
  },
  "pmsm-dq": {
    prompt: "An IPMSM has p = 3, λ<sub>m</sub> = 0.08 Wb, L<sub>d</sub> = 0.3 mH and L<sub>q</sub> = 0.6 mH. With a fixed current magnitude of 50 A, compare the torque at i<sub>d</sub> = 0 with the torque at i<sub>d</sub> = −15 A.",
    steps: [
      "At i<sub>d</sub> = 0, all 50 A is on q: T = 1.5 × 3 × 0.08 × 50 = 18.0 N·m.",
      "At i<sub>d</sub> = −15 A, the same magnitude leaves i<sub>q</sub> = √(50² − 15²) = 47.7 A.",
      "Magnet torque: 1.5 × 3 × 0.08 × 47.7 = 17.17 N·m.",
      "Reluctance torque: 1.5 × 3 × (0.0003 − 0.0006) × (−15) × 47.7 = +0.97 N·m.",
      "Total: 18.14 N·m, slightly more from the same current. Try i<sub>d</sub> = −20 A and the total falls to 17.7 N·m: there is a best angle, which is MTPA.",
    ],
    answer: "18.0 N·m at i<sub>d</sub> = 0, 18.1 N·m at i<sub>d</sub> = −15 A.",
  },
  "pwm-buck": {
    prompt: "Design a buck converter from 24 V to 5 V at 3 A, switching at 100 kHz, with ripple no more than 30% of the load current. Find D and the minimum inductance.",
    steps: [
      "Duty cycle: D = 5 / 24 = 0.208.",
      "Allowed ripple: ΔI = 0.3 × 3 = 0.9 A peak-to-peak.",
      "Rearrange the ripple formula: L = (V<sub>in</sub> − V<sub>out</sub>) · D / (ΔI · f) = 19 × 0.208 / (0.9 × 100,000) = 44 µH.",
      "Pick the next standard value, 47 µH. Real ripple: 19 × 0.208 / (47 µH × 100 kHz) = 0.84 A.",
      "Peak inductor current: 3 + 0.84 / 2 = 3.42 A, so choose an inductor rated above 3.5 A for saturation.",
    ],
    answer: "D = 20.8%, L ≥ 44 µH (use 47 µH rated over 3.5 A).",
  },
  "mosfet-losses": {
    prompt: "A 48 V inverter switch carries 25 A rms. R<sub>ds(on)</sub> is 4 mΩ at 25 °C, t<sub>r</sub> + t<sub>f</sub> = 80 ns and f<sub>sw</sub> = 20 kHz. With R<sub>θ,ja</sub> = 12 °C/W and 40 °C ambient, find the junction temperature.",
    steps: [
      "Use the hot resistance: about 1.6 × 4 mΩ = 6.4 mΩ.",
      "Conduction loss: 25² × 0.0064 = 4.0 W.",
      "Switching loss: 0.5 × 48 × 25 × 80 ns × 20 kHz = 0.96 W.",
      "Total: 4.96 W. Junction temperature: 40 + 4.96 × 12 = 99.5 °C.",
      "That is below a 110 °C design limit. At 40 kHz, switching loss doubles and T<sub>j</sub> reaches 111 °C, so this heatsink limits you to about 20 kHz.",
    ],
    answer: "About 5 W per switch and T<sub>j</sub> ≈ 100 °C.",
  },
  "inverter-svpwm": {
    prompt: "V<sub>dc</sub> = 48 V and T<sub>s</sub> = 50 µs. The reference vector is 20 V at θ = 20° inside sector 1. Find T<sub>1</sub>, T<sub>2</sub> and T<sub>0</sub>.",
    steps: [
      "Check it is in the linear range: the limit is 48/√3 = 27.7 V, and 20 V is below it.",
      "Common factor: √3 · T<sub>s</sub> · V<sub>ref</sub>/V<sub>dc</sub> = 1.732 × 50 × (20/48) = 36.08 µs.",
      "T<sub>1</sub> = 36.08 × sin(60° − 20°) = 36.08 × 0.643 = 23.19 µs.",
      "T<sub>2</sub> = 36.08 × sin 20° = 36.08 × 0.342 = 12.34 µs.",
      "T<sub>0</sub> = 50 − 23.19 − 12.34 = 14.47 µs, split equally between the 000 and 111 zero vectors.",
    ],
    answer: "T<sub>1</sub> = 23.2 µs, T<sub>2</sub> = 12.3 µs, T<sub>0</sub> = 14.5 µs.",
  },
  "pi-control": {
    prompt: "Tune a current loop for R = 0.25 Ω and L = 0.5 mH with 20 kHz PWM. Choose a bandwidth of one tenth of the sample rate and find K<sub>p</sub>, K<sub>i</sub> and the per-sample integral gain.",
    steps: [
      "Bandwidth: f<sub>c</sub> = 20 kHz / 10 = 2 kHz, so ω<sub>c</sub> = 2π × 2000 = 12,570 rad/s.",
      "Pole cancellation: K<sub>p</sub> = L·ω<sub>c</sub> = 0.0005 × 12,570 = 6.28 V/A.",
      "K<sub>i</sub> = R·ω<sub>c</sub> = 0.25 × 12,570 = 3142 V/(A·s).",
      "In code the integrator adds K<sub>i</sub>·T<sub>s</sub>·e each period: 3142 × 50 µs = 0.157.",
      "Sanity check: a 5 A step asks for K<sub>p</sub> × 5 = 31 V at once. A 24 V bus gives only 24/√3 = 13.9 V, so the output will saturate. Anti-windup is not optional here.",
    ],
    answer: "K<sub>p</sub> = 6.28 V/A, K<sub>i</sub> = 3142 V/(A·s), 0.157 per sample.",
  },
  "clarke-park": {
    prompt: "At one instant i<sub>a</sub> = 8 A, i<sub>b</sub> = 4 A and θ<sub>e</sub> = 120°. Find i<sub>c</sub>, i<sub>α</sub>, i<sub>β</sub>, i<sub>d</sub> and i<sub>q</sub>.",
    steps: [
      "Kirchhoff: i<sub>c</sub> = −(8 + 4) = −12 A.",
      "Clarke: i<sub>α</sub> = i<sub>a</sub> = 8 A, and i<sub>β</sub> = (8 + 2 × 4) / √3 = 9.24 A.",
      "cos 120° = −0.5 and sin 120° = 0.866.",
      "i<sub>d</sub> = 8 × (−0.5) + 9.24 × 0.866 = 4.0 A. i<sub>q</sub> = −8 × 0.866 + 9.24 × (−0.5) = −11.55 A.",
      "Check: Park only rotates, so the magnitude must not change. √(8² + 9.24²) = 12.22 A and √(4² + 11.55²) = 12.22 A.",
    ],
    answer: "i<sub>c</sub> = −12 A, i<sub>α</sub> = 8 A, i<sub>β</sub> = 9.24 A, i<sub>d</sub> = 4.0 A, i<sub>q</sub> = −11.55 A.",
  },
  "foc-fw": {
    prompt: "An SPMSM has λ<sub>m</sub> = 0.012 Wb, p = 4 and L<sub>d</sub> = L<sub>q</sub> = 0.1 mH on a 48 V bus. Ignoring R, how much negative i<sub>d</sub> does it need to run at 6000 rpm with i<sub>q</sub> = 20 A?",
    steps: [
      "Electrical speed: ω<sub>e</sub> = 6000 × 2π/60 × 4 = 2513 rad/s. Voltage limit: 48/√3 = 27.71 V.",
      "Without field weakening, v<sub>q</sub> = ω<sub>e</sub>·λ<sub>m</sub> = 30.2 V, already over the limit.",
      "v<sub>d</sub> = −ω<sub>e</sub>·L<sub>q</sub>·i<sub>q</sub> = −2513 × 0.0001 × 20 = −5.03 V.",
      "The remaining room for v<sub>q</sub>: √(27.71² − 5.03²) = 27.25 V, so λ<sub>m</sub> + L<sub>d</sub>·i<sub>d</sub> ≤ 27.25 / 2513 = 0.01084 Wb.",
      "Solve: i<sub>d</sub> ≤ (0.01084 − 0.012) / 0.0001 = −11.6 A. The total current is now √(20² + 11.6²) = 23.1 A for the same torque.",
    ],
    answer: "i<sub>d</sub> ≈ −11.6 A, raising the current magnitude to 23.1 A.",
  },
  "adc-sampling": {
    prompt: "Choose a shunt and amplifier gain to measure ±40 A on a 3.3 V, 12-bit ADC with a mid-rail offset. The shunt may dissipate at most 1 W at 20 A rms. Amplifiers come in gains of 20, 50 and 100.",
    steps: [
      "Loss limit: I²R ≤ 1 W at 20 A, so R ≤ 2.5 mΩ.",
      "Available swing around mid-rail: ±1.65 V.",
      "Try 2 mΩ with gain 20: 40 A × 0.002 × 20 = 1.6 V. It fits, with full scale at 1.65 / 0.04 = 41.3 A.",
      "Gain 50 would need 0.8 mΩ for the same range, which is harder to lay out accurately, so 2 mΩ × 20 wins.",
      "Resolution: 3.3 / 4096 / (20 × 0.002) = 20 mA per count. Shunt loss at 20 A: 0.8 W.",
    ],
    answer: "2 mΩ shunt, gain 20: ±41 A full scale, 20 mA per count, 0.8 W loss.",
  },
  "loop-timing": {
    prompt: "Your ISR measures: ADC 2 µs, Clarke and Park 3 µs, two PIs 2 µs, inverse Park and SVPWM 4 µs, protection 1 µs, entry and exit 1.5 µs. Can you add a 6 µs observer and move from 20 kHz to 40 kHz?",
    steps: [
      "Today's ISR: 2 + 3 + 2 + 4 + 1 + 1.5 = 13.5 µs. At 20 kHz the load is 13.5 × 0.02 = 27%.",
      "With the observer: 19.5 µs.",
      "At 40 kHz the period is 25 µs, so the load would be 19.5 / 25 = 78%. That is over the 70% guideline.",
      "Highest frequency at 70%: 0.7 / 19.5 µs = 35.9 kHz.",
      "Run at 30 kHz (59% load), or move the observer to a slower task at 10 kHz.",
    ],
    answer: "Not at 40 kHz (78% load). 30 kHz works at 59%.",
  },
  "telemetry-debug": {
    prompt: "You stream i<sub>d</sub>, i<sub>q</sub>, speed and v<sub>q</sub> as 32-bit floats at 2 kHz over 1 Mbit/s classic CAN. The 7-pole-pair motor runs at 1200 rpm and the i<sub>q</sub> spectrum shows a peak at 280 Hz. Find the bus load and name the likely fault.",
    steps: [
      "Data rate: 4 channels × 4 bytes × 2000 = 32,000 bytes/s.",
      "Frames: 8 bytes each, so 4000 frames/s. At about 130 bits per frame: 520 kbit/s, which is 52% of the bus.",
      "Sending int16 instead of float halves it to 26%.",
      "Electrical frequency: 7 × 1200 / 60 = 140 Hz. The 280 Hz peak is the 2nd harmonic.",
      "2nd harmonic in d-q points to a current-sensor gain mismatch between phases.",
    ],
    answer: "52% bus load (26% with int16). The fault is a phase gain mismatch.",
  },
  "thrust-hover": {
    prompt: "A 1.2 kg quadcopter uses four 10-inch propellers. Find ideal hover power, electrical hover power with FM = 0.65 and η<sub>drive</sub> = 0.85, and the efficiency in g/W.",
    steps: [
      "Thrust: T = 1.2 × 9.81 = 11.77 N.",
      "Disc area: each 10-inch prop has radius 0.127 m, so A = 4 × π × 0.127² = 0.203 m².",
      "Ideal power: T<sup>1.5</sup> / √(2ρA) = 40.38 / √(2 × 1.225 × 0.203) = 57.3 W.",
      "Shaft power: 57.3 / 0.65 = 88.2 W. Electrical power: 88.2 / 0.85 = 103.7 W.",
      "Efficiency: 1200 g / 103.7 W = 11.6 g/W, about twice the full-scale board's 5.2 g/W because the disc loading is far lower.",
    ],
    answer: "57 W ideal, 104 W electrical, 11.6 g/W.",
  },
  "board-sizing": {
    prompt: "Close the sizing loop: rider 80 kg, structure 15 kg, motors 12 kg. Hover power scales as P = 17.5 · m<sup>1.5</sup> W (23 kW at 120 kg). Fly 8 minutes with DoD × η = 0.76 from a 170 Wh/kg pack. Start from a 120 kg guess.",
    steps: [
      "Iteration 1: m = 120 kg gives P = 23.0 kW, E = 23,000 × (8/60) / 0.76 = 4035 Wh, battery = 23.7 kg, so m = 107 + 23.7 = 130.7 kg.",
      "Iteration 2: m = 130.7 kg gives P = 26.2 kW, E = 4589 Wh, battery = 27.0 kg, so m = 134.0 kg.",
      "Iteration 3: m = 134.0 kg gives P = 27.1 kW, battery = 28.0 kg, so m = 135.0 kg.",
      "The steps shrink each time (10.7, 3.3, 1.0 kg), so the loop converges at about 135.5 kg.",
      "Final design: 135.5 kg total, 27.6 kW hover, 4.84 kWh and 28.5 kg of battery. The first guess was 15 kg light.",
    ],
    answer: "It converges: about 135.5 kg, 27.6 kW and a 28.5 kg battery.",
  },
  "stability-failure": {
    prompt: "A 135 kg coaxial X8 board (four arms, two motors per arm) uses motors with 300 N maximum thrust. Find the hover throttle, and check whether it can survive losing one motor.",
    steps: [
      "Weight: 135 × 9.81 = 1324 N. Each arm carries a quarter: 331 N.",
      "All motors working: 331 / 2 = 166 N per motor, which is 55% throttle. Overall T/W = 2400 / 1324 = 1.81.",
      "One motor fails: to keep that arm's thrust and avoid a roll and pitch moment, its partner must give all 331 N.",
      "But the partner's maximum is 300 N, so that arm is 31 N short and the board cannot hold attitude and altitude at the same time.",
      "The fix: motors rated at least 331 N, plus about 10% for control, so roughly 365 N each.",
    ],
    answer: "Hover at 55% throttle. It does not survive a motor loss: it needs about 365 N motors.",
  },
};
