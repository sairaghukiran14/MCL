import type { Lesson } from "./types";

/* Twelve additional lessons, two per track. Merged into the core tracks in ./index.ts. */
export const EXTRA_LESSONS: Record<string, Lesson[]> = {
  /* ===================================================================== T01 */
  foundations: [
    {
      id: "rl-transient", level: "Basic", title: "RL circuits and time constants", minutes: 45, sim: "rl",
      theory: `
<p>A motor winding is a resistor in series with an inductor. Apply a voltage step and the current does not jump. It climbs along an exponential.</p>
<div class="eq">i(<i>t</i>) = (V / R) · (1 − e<sup>−<i>t</i>/τ</sup>) &nbsp;&nbsp; τ = L / R &nbsp;&nbsp; E = ½ · L · I²</div>
<ul>
<li>After one τ the current has reached 63% of its final value. After 5τ it is within 1%.</li>
<li>At <i>t</i> = 0 the inductor blocks the change, so the initial slope is di/d<i>t</i> = V/L, whatever R is.</li>
<li>The current loop of every FOC drive is this circuit with a controller around it. Its time constant (L/R, typically 1–10 ms) is the plant you tune against.</li>
<li>Energy stored in the field, ½LI², is why a switch opening in series with an inductor makes a voltage spike. Inverters need freewheeling paths for exactly this reason.</li>
</ul>`,
      simNote: "Change R and L and watch the time constant move. The dotted line marks 63% at one τ. The slope at the start depends only on V and L.",
      quiz: [
        { q: "What is the time constant of L = 2 mH in series with R = 0.1 Ω?", options: ["0.2 ms", "2 ms", "20 ms", "200 ms"], answer: 2, why: "τ = L/R = 0.002 / 0.1 = 0.02 s = 20 ms." },
        { q: "After one time constant, the current has reached about…", options: ["37% of final", "50% of final", "63% of final", "86% of final"], answer: 2, why: "1 − e⁻¹ ≈ 0.632." },
        { q: "Why can't the current in a winding change instantly?", options: ["The inductor stores energy in its magnetic field, and energy can't change instantly", "The resistance is too high", "The supply is too slow", "Back-EMF is always present"], answer: 0, why: "Changing the current instantly would need infinite power, since E = ½LI²." },
      ],
      challenges: [
        { q: "24 V is applied to R = 0.5 Ω and L = 1 mH. What is the final current?", answer: 48, tol: 0.01, unit: "A", hints: ["At steady state the inductor is a wire: I = V/R."], solution: "24 / 0.5 = 48 A." },
        { q: "Same circuit. How long does the current take to reach 90% of its final value?", answer: 4.605, tol: 0.02, unit: "ms", hints: ["τ = L/R = 2 ms", "0.9 = 1 − e^(−t/τ), so t = τ · ln 10"], solution: "t = 2 ms × 2.3026 = 4.605 ms." },
      ],
      debug: {
        scenario: "Your firmware model of a winding (L = 0.15 mH, R = 0.1 Ω) barely moves when you apply 12 V. The real motor reaches its final current in a few milliseconds, but the model takes several seconds.",
        code: `const float L = 0.15f;   <span class="cm">// mH</span>
const float R = 0.1f;
i += (v - R * i) / L * Ts;`,
        options: ["The step size Ts is too small", "L is entered in millihenries but the equation needs henries: the model is 1000× too slow", "R must be in milliohms", "Forward Euler is unstable here"],
        answer: 1, why: "The equation di/dt = (v − R·i)/L needs SI units. 0.15 mH is 0.00015 H. Mixing units is the commonest bug in motor models.",
      },
      pow: "Notebook: simulate an RL step with forward Euler at three step sizes and compare with the exact solution. Find the largest stable step (Euler goes unstable above 2L/R).",
    },
    {
      id: "magnetic-circuit", level: "Fundamental", title: "Magnetic circuits, B-H curves and saturation", minutes: 60, sim: "bh",
      theory: `
<p>A magnetic circuit works like an electric one. Magnetomotive force (N·I) drives flux (Φ) through reluctance (ℛ), the same way voltage drives current through resistance.</p>
<div class="eq">N·I = H<sub>core</sub>·ℓ<sub>core</sub> + H<sub>gap</sub>·g &nbsp;&nbsp; H<sub>gap</sub> = B / μ<sub>0</sub> &nbsp;&nbsp; L = N·Φ / I</div>
<ul>
<li>Real steel is not linear. B follows H up to about 1.5 T, then flattens toward saturation (about 1.8–2.0 T for silicon steel).</li>
<li>Below saturation the airgap takes almost all of the ampere-turns. Above it the iron suddenly needs far more.</li>
<li>Saturation lowers inductance and makes torque per amp fall at high current. Designers keep peak tooth flux near 1.5–1.7 T.</li>
<li>A larger gap lowers inductance but keeps the circuit linear to higher current.</li>
</ul>`,
      simNote: "Raise the current until the core saturates and watch the share of ampere-turns in the gap fall. Widen the gap and the knee moves right.",
      quiz: [
        { q: "How many ampere-turns does a 1 mm airgap need to carry 1 T?", options: ["80", "800", "8000", "80000"], answer: 1, why: "N·I = B·g/μ₀ = 1 × 0.001 / (4π×10⁻⁷) ≈ 796 A·t." },
        { q: "Once the steel is saturated, doubling the current…", options: ["doubles the flux", "raises the flux only slightly", "halves the flux", "has no effect on inductance"], answer: 1, why: "Past the knee, μ falls toward μ₀. A lot more mmf adds little flux, and inductance drops." },
        { q: "A wider airgap makes inductance…", options: ["higher", "lower, and the circuit stays linear to higher current", "unchanged", "zero"], answer: 1, why: "Gap reluctance dominates, so L = N²/ℛ falls. The iron sees less flux for the same current, so it saturates later." },
      ],
      challenges: [
        { q: "A core path of 0.2 m, μr = 4000 (treat as linear) and 10 cm² area has no gap. What is its reluctance?", answer: 39789, tol: 0.02, unit: "A/Wb", hints: ["ℛ = ℓ / (μ₀ · μr · A)", "μ₀ = 4π×10⁻⁷, A = 0.001 m²"], solution: "0.2 / (1.2566×10⁻⁶ × 4000 × 0.001) ≈ 39,790 A/Wb." },
        { q: "Now add a 0.5 mm airgap to the same core. What is the total reluctance?", answer: 437676, tol: 0.02, unit: "A/Wb", hints: ["Gap ℛ = g / (μ₀ · A)", "Reluctances in series add"], solution: "Gap = 0.0005 / (1.2566×10⁻⁶ × 0.001) = 397,887. Total = 437,676 A/Wb. The tiny gap holds 91% of it." },
      ],
      debug: {
        scenario: "Your torque estimate Te = Kt·iq matches the dyno up to about 100 A. Above that the real torque falls well short, and the gap grows with current.",
        code: `float Te = Kt * iq;   <span class="cm">// Kt constant from the datasheet</span>`,
        options: ["Kt is constant, but at high current the iron saturates, so flux and torque per amp fall. Use a Kt(i) lookup table.", "The PI controller is too slow", "The encoder offset is wrong", "Dead time is too long"],
        answer: 0, why: "A constant Kt assumes linear magnetics. Real machines lose torque per amp when teeth saturate, so production firmware uses flux maps.",
      },
      pow: "FEMM: a C-core with gaps of 0.5, 1 and 2 mm. Plot B against I and inductance against I for each. Mark where each core saturates.",
    },
  ],

  /* ===================================================================== T02 */
  machines: [
    {
      id: "motor-constants", level: "Basic", title: "Reading a motor datasheet: Kv, Kt and efficiency", minutes: 50, sim: "kv",
      theory: `
<p>Hobby and EV motors are rated by a few constants. If you can read them, you can predict speed, torque and efficiency before you build anything.</p>
<div class="eq">K<sub>t</sub> [N·m/A] = 60 / (2π · K<sub>v</sub>) ≈ 9.55 / K<sub>v</sub> &nbsp;&nbsp; no-load rpm ≈ K<sub>v</sub> · V</div>
<div class="eq">η = (1 − I·R/V) · (1 − I<sub>0</sub>/I) &nbsp;&nbsp; I<sub>η,max</sub> = √(I<sub>0</sub> · V / R) &nbsp;&nbsp; η<sub>max</sub> = (1 − √(I<sub>0</sub>·R/V))²</div>
<ul>
<li>K<sub>v</sub> is rpm per volt with no load. A high K<sub>v</sub> motor is fast but gives less torque per amp. K<sub>t</sub> and K<sub>v</sub> are the same property seen from two sides.</li>
<li>I<sub>0</sub> is the no-load current. It pays for friction and iron loss, so it is lost at every speed.</li>
<li>Efficiency is poor at light load (I<sub>0</sub> dominates) and at heavy load (I²R dominates). The peak sits between them.</li>
<li>Pick the motor and gearing so that the usual load sits near the efficiency peak, not at the stall end.</li>
</ul>`,
      simNote: "Move the supply voltage and resistance. The efficiency peak shifts with √(I₀V/R), and the peak itself rises as R falls.",
      quiz: [
        { q: "A 400 Kv motor runs on 24 V with no load. What is its approximate speed?", options: ["960 rpm", "4,800 rpm", "9,600 rpm", "24,000 rpm"], answer: 2, why: "400 × 24 = 9,600 rpm." },
        { q: "Compared with a 200 Kv motor of the same size, a 400 Kv motor gives…", options: ["twice the torque per amp", "half the torque per amp", "the same torque per amp", "no torque"], answer: 1, why: "K<sub>t</sub> ∝ 1/K<sub>v</sub>, so doubling K<sub>v</sub> halves torque per amp." },
        { q: "Where is a brushed or BLDC motor's efficiency usually highest?", options: ["At stall", "At no load", "At a current between no-load and stall, near √(I₀·I<sub>stall</sub>)", "At maximum power"], answer: 2, why: "At low current I₀ dominates and at high current I²R does, so the peak sits at the geometric middle." },
      ],
      challenges: [
        { q: "A motor has Kv = 190 rpm/V. What is its Kt?", answer: 0.0503, tol: 0.02, unit: "N·m/A", hints: ["Kt = 60 / (2π · Kv)"], solution: "60 / (6.283 × 190) = 0.0503 N·m/A." },
        { q: "V = 24 V, R = 0.1 Ω, I₀ = 1 A. At what current is efficiency highest?", answer: 15.49, tol: 0.02, unit: "A", hints: ["I = √(I₀ · V / R)"], solution: "√(1 × 24 / 0.1) = √240 = 15.49 A." },
      ],
      debug: {
        scenario: "Your torque estimate from current reads about 10× lower than the dyno for a motor rated 270 Kv.",
        code: `float Kt = 1.0f / Kv;   <span class="cm">// Kv from the datasheet, rpm/V</span>
float torque = Kt * iq;`,
        options: ["1/Kv is volts per rpm, not N·m per amp. Convert: Kt = 60/(2π·Kv) = 9.55/Kv.", "iq is in the wrong frame", "The datasheet is wrong", "Kt must be squared"],
        answer: 0, why: "1/270 = 0.0037, but 9.55/270 = 0.0354 N·m/A. The factor 60/2π converts rpm to rad/s and is easy to forget.",
      },
      pow: "Take a real motor datasheet. Measure Kv by driving it with a known voltage and no load, then compute Kt. Plot measured efficiency against current and compare with the model.",
    },
    {
      id: "induction-slip", level: "Fundamental", title: "Induction motors: slip and torque", minutes: 70, sim: "induction",
      theory: `
<p>An induction motor has no magnets. The stator's rotating field induces currents in the rotor, and those currents create torque. That only works if the rotor turns <b>slower</b> than the field.</p>
<div class="eq">n<sub>s</sub> = 60·f / p &nbsp;&nbsp; s = (n<sub>s</sub> − n) / n<sub>s</sub> &nbsp;&nbsp; f<sub>rotor</sub> = s · f</div>
<div class="eq">T = (3 / ω<sub>s</sub>) · V<sub>ph</sub>² · (R<sub>2</sub>/s) / [ (R<sub>1</sub> + R<sub>2</sub>/s)² + X² ] &nbsp;&nbsp; s<sub>m</sub> = R<sub>2</sub> / √(R<sub>1</sub>² + X²)</div>
<ul>
<li>At s = 0 there is no relative motion, so no induced current and no torque. At s = 1 (standstill) the starting torque is moderate and the current is large.</li>
<li>Peak torque (pull-out) happens at s<sub>m</sub>. Its value does not depend on R<sub>2</sub>, only where it occurs.</li>
<li><b>V/f control</b>: to keep the flux constant, raise voltage in proportion to frequency. Fixed voltage at low frequency saturates the core and burns the motor.</li>
<li>Induction motors have no magnet cost and tolerate abuse. PMSMs are more efficient and dense, which is why most EVs use them.</li>
</ul>`,
      simNote: "Slide the frequency with V/f on, and the torque curve slides along the speed axis while keeping its height. Switch V/f off at low frequency and the voltage is far too high for that frequency: the curve soars and the current climbs, which in a real motor means a saturated core.",
      quiz: [
        { q: "What is the synchronous speed of a 4-pole motor (p = 2) on 50 Hz?", options: ["750 rpm", "1000 rpm", "1500 rpm", "3000 rpm"], answer: 2, why: "60 × 50 / 2 = 1500 rpm." },
        { q: "The rotor turns at 1440 rpm and the field at 1500 rpm. What is the slip?", options: ["1%", "2%", "4%", "6%"], answer: 2, why: "(1500 − 1440)/1500 = 0.04." },
        { q: "Why can't an unloaded induction rotor reach synchronous speed?", options: ["Bearings always add drag", "There'd be no relative motion, so no rotor current and no torque", "The stator would overheat", "Slip is fixed by design"], answer: 1, why: "Torque needs induced rotor current, and induction needs the rotor to slip against the field." },
      ],
      challenges: [
        { q: "A 6-pole motor (p = 3) on 60 Hz turns at 1164 rpm. What is the slip?", answer: 3, tol: 0.02, unit: "%", hints: ["n<sub>s</sub> = 60 × 60 / 3 = 1200 rpm"], solution: "(1200 − 1164)/1200 = 3%." },
        { q: "At that 3% slip on 60 Hz, what is the rotor current frequency?", answer: 1.8, tol: 0.02, unit: "Hz", hints: ["f<sub>rotor</sub> = s · f"], solution: "0.03 × 60 = 1.8 Hz." },
      ],
      debug: {
        scenario: "A VFD drives a 400 V / 50 Hz motor at 25 Hz but still outputs 400 V. The motor draws huge current, runs hot and hums.",
        options: ["The motor is overloaded mechanically", "V/f is not maintained: the flux is double the rated value, so the core saturates and magnetising current soars", "The carrier frequency is too low", "The rotor has too much slip"],
        answer: 1, why: "Flux ∝ V/f. At 25 Hz the drive should output about 200 V (plus a small boost for stator resistance).",
      },
      pow: "Python: plot the torque-speed curve of a 4-pole induction motor at 20, 35 and 50 Hz with constant V/f. Mark the pull-out torque and the effect of a low-frequency voltage boost.",
    },
  ],

  /* ===================================================================== T03 */
  power: [
    {
      id: "boost-regen", level: "Fundamental", title: "Boost converters and regenerative braking", minutes: 60, sim: "boost",
      theory: `
<p>A boost converter steps voltage up. It stores energy in an inductor while the switch is on, then dumps it to the output at a higher voltage when the switch opens.</p>
<div class="eq">V<sub>out</sub> = V<sub>in</sub> / (1 − D) &nbsp;&nbsp; I<sub>L,avg</sub> = I<sub>out</sub> / (1 − D) &nbsp;&nbsp; ΔI<sub>L</sub> = V<sub>in</sub> · D / (L · f<sub>sw</sub>)</div>
<ul>
<li>The inductor carries the <b>input</b> current, which is larger than the output current by 1/(1 − D).</li>
<li>During regeneration a motor drive <i>is</i> a boost converter. The motor's back-EMF is the source, its winding is the inductor, the lower switches charge the DC link and the bus voltage rises.</li>
<li>If the supply can't absorb the energy (a bench PSU, or a full battery), the DC link overshoots. Plan for it: brake chopper and resistor, or a limit on regenerative current.</li>
<li>Energy to raise the bus: E = ½ · C · (V₂² − V₁²).</li>
</ul>`,
      simNote: "Raise the duty cycle and the output voltage climbs steeply while the inductor current grows. Cut the inductance or frequency and the ripple expands.",
      quiz: [
        { q: "A boost converter has V<sub>in</sub> = 12 V and D = 0.5. What is V<sub>out</sub>?", options: ["6 V", "12 V", "24 V", "36 V"], answer: 2, why: "12 / (1 − 0.5) = 24 V." },
        { q: "Compared with the output current, the average inductor current in a boost converter is…", options: ["lower", "the same", "higher, by 1/(1 − D)", "zero"], answer: 2, why: "Output power equals input power, and the output voltage is higher, so the input current is higher." },
        { q: "During regenerative braking, the motor drive acts like…", options: ["a buck converter into the motor", "a boost converter pushing energy into the DC link", "a linear regulator", "a diode rectifier only"], answer: 1, why: "The back-EMF source and winding inductance, with the switches, form a boost stage into the bus." },
      ],
      challenges: [
        { q: "What duty cycle boosts 36 V to 60 V?", answer: 40, tol: 0.01, unit: "%", hints: ["D = 1 − V<sub>in</sub>/V<sub>out</sub>"], solution: "1 − 36/60 = 0.4, which is 40%." },
        { q: "V<sub>in</sub> = 36 V, D = 0.4, L = 22 µH, f = 40 kHz. What is the peak-to-peak ripple current?", answer: 16.36, tol: 0.02, unit: "A", hints: ["ΔI = V<sub>in</sub>·D / (L·f)"], solution: "14.4 / (22×10⁻⁶ × 40000) = 16.36 A." },
      ],
      debug: {
        scenario: "A bench-powered inverter (no battery) brakes hard. The DC link jumps from 48 V to about 70 V and the gate drivers trip on overvoltage.",
        options: ["The PWM frequency is too high", "Regenerated energy has nowhere to go: a bench supply can't sink current. Add a brake chopper and resistor, or limit regen current.", "The motor is mis-wired", "The DC-link capacitor is too big"],
        answer: 1, why: "The energy ½·J·ω² goes into the bus capacitor. With a source that cannot absorb it, the voltage rises until something trips.",
      },
      pow: "LTspice: a 36 → 60 V boost. Verify the formulas. Then model regeneration as a current source into the bus capacitor and read dV/dt = I/C.",
    },
    {
      id: "dc-link", level: "Advanced", title: "DC-link capacitor sizing and layout", minutes: 75, sim: "dclink",
      theory: `
<p>The inverter pulls current from the battery in sharp pulses. The DC-link capacitor supplies those pulses so the battery and its cables see something close to DC.</p>
<div class="eq">I<sub>cap,rms</sub> ≈ 0.6 · I<sub>phase,rms</sub> &nbsp;(high modulation) &nbsp;&nbsp; ΔV<sub>C</sub> ≈ I<sub>dc</sub> · 0.25 / (C · f<sub>sw</sub>) &nbsp;&nbsp; ΔV<sub>ESR</sub> ≈ ESR · I<sub>pk</sub></div>
<ul>
<li>Choose C for ripple <b>and</b> hold-up. The ripple current rating (heating, I²·ESR) matters as much as the capacitance.</li>
<li>Electrolytics have high ESR and age fast when hot. Film and ceramic parts have low ESR and take more ripple. Large packs use a mix.</li>
<li>Wiring has inductance. A 20 nH loop switching 100 A in 20 ns gives L·di/dt = 100 V of spike. Place small ceramic capacitors right at the switches and keep the loop tiny.</li>
<li>All numbers above are first estimates for sizing. Final choices come from the datasheet ripple tables and measurement.</li>
</ul>`,
      simNote: "Increase C and the capacitive ripple falls as 1/C, but the ESR term stays put. That is why a bigger capacitor alone doesn't always fix the ripple.",
      quiz: [
        { q: "What is the main job of the DC-link capacitor?", options: ["Store energy for hours", "Supply the pulsed current of the inverter so the source sees nearly DC", "Filter the motor's back-EMF", "Limit the maximum speed"], answer: 1, why: "It is a local energy reservoir that handles the high-frequency current." },
        { q: "Doubling C (everything else fixed) changes the capacitive voltage ripple by…", options: ["×2", "×0.5", "×0.25", "no change"], answer: 1, why: "ΔV ∝ 1/C." },
        { q: "Why does ripple-current rating matter?", options: ["It sets the capacitance", "I²·ESR heats the capacitor, and heat shortens its life", "It sets the switching frequency", "It sets the bus voltage"], answer: 1, why: "A capacitor run above its ripple rating overheats and fails early." },
      ],
      challenges: [
        { q: "A drive has 50 A rms phase current. What ripple current should the DC link handle (using 0.6 × I<sub>phase</sub>)?", answer: 30, tol: 0.01, unit: "A", hints: ["I<sub>cap</sub> ≈ 0.6 · I<sub>phase,rms</sub>"], solution: "0.6 × 50 = 30 A rms." },
        { q: "I<sub>dc</sub> = 40 A, C = 1000 µF, f<sub>sw</sub> = 20 kHz. What is the capacitive ripple (using ΔV = I<sub>dc</sub>·0.25/(C·f))?", answer: 0.5, tol: 0.02, unit: "V", hints: ["40 × 0.25 = 10", "C · f = 0.001 × 20000 = 20"], solution: "10 / 20 = 0.5 V peak-to-peak." },
      ],
      debug: {
        scenario: "A scope on the DC link shows 6 V spikes at every PWM edge. The 48 V bus has a 2000 µF bulk capacitor, which is plenty for the ripple.",
        options: ["The capacitance is too small", "Parasitic loop inductance between the capacitor and the switches: L·di/dt spikes. Add ceramic capacitors right at the switches and shrink the loop.", "The gate resistor is too large", "The PWM frequency is too low"],
        answer: 1, why: "Bulk capacitance can't help at nanosecond timescales. Spikes come from wiring inductance, so the fix is layout and local decoupling.",
      },
      pow: "Size C for your 48 V inverter: build a ripple-current table, pick two real capacitor parts and compute their heating. In LTspice add 20 nH of loop inductance and compare the overshoot with and without local ceramic capacitors.",
    },
  ],

  /* ===================================================================== T04 */
  control: [
    {
      id: "current-loop-delay", level: "Fundamental", title: "Current-loop bandwidth, delay and phase margin", minutes: 75, sim: "curloop",
      theory: `
<p>With the plant pole cancelled (K<sub>p</sub> = L·ω<sub>c</sub>, K<sub>i</sub> = R·ω<sub>c</sub>), the open loop is just an integrator: ω<sub>c</sub>/s. A digital drive adds delay: one sample of computation plus half a PWM period of hold, about 1.5·T<sub>s</sub>.</p>
<div class="eq">T<sub>d</sub> ≈ 1.5 · T<sub>s</sub> &nbsp;&nbsp; PM ≈ 90° − ω<sub>c</sub> · T<sub>d</sub> · (180/π) = 90° − 540° · (f<sub>c</sub> / f<sub>sw</sub>)</div>
<ul>
<li>Every bit of delay turns into phase lag proportional to frequency. Higher bandwidth means less margin.</li>
<li>A phase margin near 60° gives a clean response with a little overshoot. Below 30° the current rings. At 0° it oscillates.</li>
<li>Rule of thumb: f<sub>c</sub> ≈ f<sub>sw</sub> / 20, so a 20 kHz drive gets about 1 kHz of current bandwidth.</li>
<li>Higher f<sub>sw</sub>, faster ADC and double-update PWM all raise the usable bandwidth by cutting T<sub>d</sub>.</li>
</ul>`,
      simNote: "Raise the bandwidth until the step response rings. The phase-margin readout follows 90° − 540°·(f<sub>c</sub>/f<sub>sw</sub>). Increase the switching frequency and watch the margin return.",
      quiz: [
        { q: "What does delay do to a current loop?", options: ["Reduces steady-state error", "Adds phase lag that grows with frequency and cuts phase margin", "Increases torque", "Reduces noise only"], answer: 1, why: "A pure delay T<sub>d</sub> adds −ω·T<sub>d</sub> of phase at every frequency." },
        { q: "With f<sub>c</sub> = f<sub>sw</sub>/20 and a 1.5·T<sub>s</sub> delay, what is the phase margin?", options: ["36°", "63°", "77°", "90°"], answer: 1, why: "90 − 540/20 = 63°." },
        { q: "Why not choose the highest bandwidth the controller can do?", options: ["It saves power", "Delay, sampling noise and the voltage limit all get worse as bandwidth rises", "It is illegal", "Motors need slow loops"], answer: 1, why: "Margin drops, noise is amplified and the loop saturates at the voltage limit." },
      ],
      challenges: [
        { q: "f<sub>sw</sub> = 20 kHz, f<sub>c</sub> = 1 kHz and a 1.5·T<sub>s</sub> delay. What is the phase margin?", answer: 63, tol: 0.02, unit: "°", hints: ["PM = 90° − 540° · f<sub>c</sub>/f<sub>sw</sub>"], solution: "90 − 540 × 0.05 = 63°." },
        { q: "L = 0.15 mH, R = 0.08 Ω, target bandwidth 1500 Hz. What is K<sub>p</sub>?", answer: 1.414, tol: 0.02, unit: "V/A", hints: ["ω<sub>c</sub> = 2π × 1500 = 9425 rad/s", "K<sub>p</sub> = L · ω<sub>c</sub>"], solution: "0.00015 × 9425 = 1.414 V/A. (K<sub>i</sub> = R·ω<sub>c</sub> = 754.)" },
      ],
      debug: {
        scenario: "You raised the current-loop bandwidth from 800 Hz to 4 kHz on a 20 kHz drive. The current now rings, and the motor buzzes loudly even at low speed.",
        options: ["The motor needs more current", "At 4 kHz, PM = 90 − 540 × 0.2 = −18°: delay has made the loop unstable. Lower the bandwidth or raise the switching frequency.", "The speed loop is too slow", "The encoder is noisy"],
        answer: 1, why: "A negative phase margin means oscillation. The delay budget, not the plant, limits bandwidth.",
      },
      pow: "Python: simulate the pole-cancelled PI with a zero-order hold and a 1.5·T<sub>s</sub> delay. Sweep bandwidth, tabulate phase margin and overshoot, and check against a real step in i<sub>d</sub>*.",
    },
    {
      id: "sensorless", level: "Advanced", title: "Sensorless control and back-EMF observers", minutes: 90, sim: "sensorless",
      theory: `
<p>Removing the encoder saves cost and failure points. The controller instead estimates the rotor angle from the motor's own back-EMF.</p>
<div class="eq">e<sub>α</sub> = −λ<sub>m</sub> · ω<sub>e</sub> · sin θ &nbsp;&nbsp; e<sub>β</sub> = λ<sub>m</sub> · ω<sub>e</sub> · cos θ &nbsp;&nbsp; ε = −e<sub>α</sub>cos θ̂ − e<sub>β</sub>sin θ̂ ∝ sin(θ − θ̂)</div>
<ul>
<li>A phase-locked loop (PLL) drives ε to zero, so θ̂ tracks θ. Sliding-mode observers and extended Kalman filters do the same job with different trade-offs.</li>
<li>Back-EMF is proportional to speed. Near zero speed it sinks into noise and inverter dead-time error, and the estimate fails.</li>
<li><b>Startup</b>: drag the rotor open-loop (I-f control), then hand over to the observer once the EMF is big enough and the estimate has locked.</li>
<li>At standstill and very low speed, <b>high-frequency injection</b> uses magnetic saliency instead of back-EMF.</li>
<li>An angle error Δθ costs torque per amp as cos Δθ and puts current on the wrong axis.</li>
</ul>`,
      simNote: "Lower the speed and the estimate degrades: the EMF falls below the noise. Raise the PLL bandwidth and the angle error from noise grows. Lower it and the tracking lags in the transients.",
      quiz: [
        { q: "Why does back-EMF sensorless control fail near standstill?", options: ["The PWM stops", "Back-EMF is proportional to speed, so the signal falls into the noise", "The ADC saturates", "The stator is cold"], answer: 1, why: "At low speed there's almost no EMF to estimate from. Dead-time errors are of similar size." },
        { q: "How do drives usually start a motor sensorless?", options: ["Instantly in closed loop", "Open-loop (I-f) ramp to a speed where EMF is large enough, then hand over", "Using Hall sensors only", "By reversing the motor"], answer: 1, why: "The observer needs enough EMF to lock. The ramp provides that speed." },
        { q: "Which method can find the rotor position at standstill?", options: ["Back-EMF PLL", "High-frequency signal injection (uses saliency)", "Six-step zero crossing", "Dead-time compensation"], answer: 1, why: "HFI senses inductance variation with angle and needs no motion." },
      ],
      challenges: [
        { q: "λ = 0.006 Wb, p = 7, speed 600 rpm. What is the peak back-EMF?", answer: 2.639, tol: 0.02, unit: "V", hints: ["ω<sub>m</sub> = 600 × 2π / 60 = 62.83 rad/s", "e = λ · p · ω<sub>m</sub>"], solution: "0.006 × 7 × 62.83 = 2.64 V." },
        { q: "An angle estimation error of 20° electrical leaves what share of the torque per amp?", answer: 93.97, tol: 0.01, unit: "%", hints: ["Torque ∝ cos Δθ"], solution: "cos 20° = 0.9397, so 94%." },
      ],
      debug: {
        scenario: "A sensorless drive hands over from open-loop to observer at 150 rpm. About half the time the motor stalls or jerks at the handover.",
        options: ["Wrong pole-pair count", "The observer starts from zero angle and speed at handover. Initialise it from the open-loop ramp and wait for the estimate to lock before closing the loop.", "PWM frequency too low", "Dead time too long"],
        answer: 1, why: "A cold observer needs time to converge. Handing over before lock leaves the controller aiming at the wrong angle.",
      },
      pow: "Python: a PLL or sliding-mode observer on simulated back-EMF with noise. Plot angle error against speed and find the lowest usable speed. Then repeat on logged data from the Live Lab.",
    },
  ],

  /* ===================================================================== T05 */
  embedded: [
    {
      id: "quadrature-encoder", level: "Basic", title: "Quadrature encoders and speed measurement", minutes: 50, sim: "quadrature",
      theory: `
<p>An incremental encoder gives two square waves, A and B, 90° apart. Counting every edge of both gives four counts per line. Which channel leads tells you the direction.</p>
<div class="eq">counts/rev = 4 · PPR &nbsp;&nbsp; θ<sub>e</sub> = p · 2π · count / (4·PPR) + offset &nbsp;&nbsp; Δω<sub>min</sub> = 2π / (4·PPR · T<sub>w</sub>)</div>
<ul>
<li>Most microcontrollers have a hardware encoder mode in a timer. It counts for you without any CPU load.</li>
<li><b>M-method</b>: count edges in a fixed window T<sub>w</sub>. Simple, but the speed is quantised, and it is poor at low speed.</li>
<li><b>T-method</b>: time the gap between edges. Great at low speed, noisy at high speed. <b>M/T</b> combines both.</li>
<li>An incremental encoder gives no absolute angle. Use the index pulse, or align the rotor to the d-axis at startup to find the offset.</li>
</ul>`,
      simNote: "Raise the speed and watch the counts. Shrink the window and the speed readout steps become coarser. Reverse the direction and B leads A.",
      quiz: [
        { q: "A 1000 PPR encoder is read with 4× decoding. How many counts per revolution?", options: ["1000", "2000", "4000", "8000"], answer: 2, why: "Each of A and B has two edges per line: 4 × 1000." },
        { q: "How does the controller know the direction of rotation?", options: ["From the index pulse", "From which of A or B leads", "From the supply polarity", "It can't"], answer: 1, why: "The phase order of the two channels reverses with the direction." },
        { q: "Which speed measurement works best at very low speed?", options: ["M-method with a short window", "T-method (time between edges)", "Neither", "Averaging more windows only"], answer: 1, why: "With few edges per window, M is coarse. Timing individual edges gives fine resolution." },
      ],
      challenges: [
        { q: "A 2500 PPR encoder with 4× decoding. What is the angular resolution?", answer: 0.036, tol: 0.02, unit: "°", hints: ["10,000 counts per revolution", "360 / 10000"], solution: "360 / 10000 = 0.036°." },
        { q: "A 1024 PPR encoder read over a 1 ms window (M-method). What is the speed quantum?", answer: 14.65, tol: 0.02, unit: "rpm", hints: ["Quantum = 60 / (4 · PPR · T<sub>w</sub>)"], solution: "60 / (4 × 1024 × 0.001) = 14.65 rpm per count." },
      ],
      debug: {
        scenario: "With a 1024 PPR encoder, your speed readout is fine at 1000 rpm. At 100 rpm it jumps by about ±15 rpm even though the motor is steady. The window is 1 ms.",
        options: ["The encoder is damaged", "M-method quantisation: one count in a 1 ms window equals 14.65 rpm. Use a longer window, the T-method, or M/T plus a filter.", "The timer is overflowing", "Pole pairs are wrong"],
        answer: 1, why: "At 100 rpm and 4096 counts/rev there are only about 0.7 counts in 1 ms, so every reading is 0 or 1 count.",
      },
      pow: "STM32: read an encoder with a timer in encoder mode. Compute speed with M/T and a filter, plot it against rpm, and find the electrical-angle offset by locking the rotor to the d-axis.",
    },
    {
      id: "can-bus", level: "Fundamental", title: "CAN bus: frames, priority and bus load", minutes: 55, sim: "canload",
      theory: `
<p>CAN is the standard in-vehicle network. Every node shares one pair of wires and messages carry an identifier instead of an address.</p>
<div class="eq">bits(n bytes) = 8n + 47 + ⌊(34 + 8n − 1) / 4⌋ &nbsp;(worst case with stuffing) &nbsp;&nbsp; load = Σ(bits · rate) / bitrate</div>
<ul>
<li><b>Arbitration</b>: when two nodes send at once, the lower identifier wins non-destructively. Low IDs are high priority.</li>
<li>A standard frame with 8 data bytes is up to 135 bits on the wire. At 500 kbit/s that is 270 µs.</li>
<li>Keep the bus below roughly 30–50% load. Above that, low-priority messages wait unpredictably.</li>
<li>Assign IDs by importance: safety and torque commands lowest, diagnostics highest. Long messages should be sent less often.</li>
<li>CAN FD raises the data rate and payload to 64 bytes for bigger telemetry.</li>
</ul>`,
      simNote: "Add nodes or raise their rates and watch the bus load pass the comfortable range. Slow the bitrate and the same traffic fills the bus sooner.",
      quiz: [
        { q: "Two CAN nodes transmit at once. Which frame wins arbitration?", options: ["The longer one", "The one with the lower identifier", "The one sent first by clock", "The one with more data"], answer: 1, why: "A dominant 0 beats a recessive 1, so the lowest ID keeps the bus." },
        { q: "How long is a 135-bit frame at 500 kbit/s?", options: ["27 µs", "135 µs", "270 µs", "1.35 ms"], answer: 2, why: "135 / 500,000 = 270 µs." },
        { q: "What bus load is a sensible design limit?", options: ["100%", "90%", "30–50%", "5%"], answer: 2, why: "Leave headroom so high-priority frames meet their deadlines and bursts don't starve the rest." },
      ],
      challenges: [
        { q: "How long does a 135-bit frame take at 500 kbit/s?", answer: 270, tol: 0.01, unit: "µs", hints: ["time = bits / bitrate"], solution: "135 / 500000 = 270 µs." },
        { q: "4 nodes each send an 8-byte frame (135 bits) at 200 Hz on a 500 kbit/s bus. What is the bus load?", answer: 21.6, tol: 0.02, unit: "%", hints: ["Total bits per second = 4 × 200 × 135", "Divide by 500,000"], solution: "108,000 / 500,000 = 21.6%." },
      ],
      debug: {
        scenario: "The torque command (ID 0x300) sometimes arrives 3 ms late whenever a diagnostic logger bursts data. Average bus load is only 20%.",
        options: ["The bitrate is too low", "Priority inversion: the logger uses IDs below 0x300, so it wins arbitration. Give the torque command the lowest ID and diagnostics the highest.", "CAN can't carry torque", "The cable is too long"],
        answer: 1, why: "Average load hides worst-case latency. Priority decides who waits, so IDs must follow importance.",
      },
      pow: "Write a message table (ID, bytes, rate) for a five-node EV drive and compute the bus load in a spreadsheet. Verify against a CAN analyser trace.",
    },
  ],

  /* ===================================================================== T06 */
  flyboard: [
    {
      id: "battery-pack", level: "Fundamental", title: "Battery packs, internal resistance and voltage sag", minutes: 70, sim: "battery",
      theory: `
<p>A pack is Ns cells in series (for voltage) and Np strings in parallel (for current and capacity). Under load the terminal voltage sags by I·R, and a hover load is a heavy, constant draw.</p>
<div class="eq">V<sub>pack</sub> = N<sub>s</sub> · (V<sub>oc</sub>(SoC) − I<sub>cell</sub> · R<sub>cell</sub>) &nbsp;&nbsp; I<sub>cell</sub> = I / N<sub>p</sub> &nbsp;&nbsp; C-rate = I / capacity</div>
<ul>
<li>A Li-ion cell is 4.2 V full and about 3.0 V empty, nominal near 3.6–3.7 V.</li>
<li>Constant-power loads draw more current as the voltage falls, which sags it further.</li>
<li>Pack resistance is Ns·R<sub>cell</sub> / Np. More parallel strings cut both resistance and heating (I²R) and lower the C-rate each cell sees.</li>
<li>The flight ends on the <b>voltage under load</b> hitting the cutoff, usually well before the cells are empty. Plan the flight time from that, not from rated capacity.</li>
</ul>`,
      simNote: "Increase the hover power and the sag deepens, ending the flight sooner. Add parallel strings and the sag softens and the usable time grows.",
      quiz: [
        { q: "Why does terminal voltage fall as load current rises?", options: ["Cells lose charge instantly", "V = V<sub>oc</sub> − I·R drops across the internal resistance", "The cells warm up", "Wires get longer"], answer: 1, why: "Internal resistance turns current into a voltage drop and heat." },
        { q: "A 14S pack with 3.7 V nominal cells has a nominal voltage of…", options: ["37 V", "44.4 V", "51.8 V", "58.8 V"], answer: 2, why: "14 × 3.7 = 51.8 V." },
        { q: "Adding parallel strings to a pack…", options: ["raises voltage", "lowers pack resistance and the C-rate per cell", "has no effect", "raises sag"], answer: 1, why: "Parallel resistances combine to R/Np, and the current is shared." },
      ],
      challenges: [
        { q: "A 24S pack has fully charged cells at 4.2 V. What is the pack voltage?", answer: 100.8, tol: 0.01, unit: "V", hints: ["24 × 4.2"], solution: "24 × 4.2 = 100.8 V." },
        { q: "A 24S10P pack of 5 Ah cells supplies 24 kW at about 90 V. What C-rate is that?", answer: 5.33, tol: 0.02, unit: "C", hints: ["I = 24000 / 90", "Capacity = 10 × 5 = 50 Ah"], solution: "I = 266.7 A, so C = 266.7 / 50 = 5.33 C." },
      ],
      debug: {
        scenario: "In hover the flight controller cuts off with a low-voltage warning while the coulomb counter says 40% charge remains.",
        options: ["The coulomb counter is broken", "The pack voltage under load fell below the cutoff because of internal-resistance sag at a high C-rate. Add parallel cells or reduce hover current.", "The cells are overcharged", "The ESC is faulty"],
        answer: 1, why: "State of charge and voltage under load are different limits. High-C hover hits the voltage limit first.",
      },
      pow: "Characterise your scale-model battery: discharge at three currents, plot V against Ah, extract R and predict the flight time. Compare with a real hover test.",
    },
    {
      id: "motor-thermal", level: "Advanced", title: "Thermal limits and derating", minutes: 80, sim: "thermalmotor",
      theory: `
<p>Heat limits everything in a motor drive, and a first-order thermal model explains most of it.</p>
<div class="eq">C<sub>th</sub> · dT/d<i>t</i> = P − (T − T<sub>a</sub>) / R<sub>th</sub> &nbsp;&nbsp; τ = R<sub>th</sub> · C<sub>th</sub> &nbsp;&nbsp; T<sub>ss</sub> = T<sub>a</sub> + P · R<sub>th</sub></div>
<div class="eq">P<sub>cu</sub> = 3 · I<sub>rms</sub>² · R(T) &nbsp;&nbsp; R(T) = R<sub>25</sub> · [1 + 0.0039 · (T − 25)]</div>
<ul>
<li>Copper resistance rises about 0.39% per kelvin, so a hot winding loses more power and heats even more. If the feedback is strong enough, the temperature runs away.</li>
<li>The thermal time constant (tens of seconds for a winding) lets a motor take short peak currents well above its continuous rating.</li>
<li>Drives <b>derate</b>: they cut the current limit as winding temperature nears the insulation limit, and trip before the magnets demagnetise.</li>
<li>Cooling lowers R<sub>th</sub>. Doubling airflow can lift the continuous current rating by 20–40%.</li>
</ul>`,
      simNote: "Set a current beyond the continuous rating and watch the temperature climb. Past a critical current there is no steady state at all. Improve the cooling and the limit moves up.",
      quiz: [
        { q: "R<sub>th</sub> = 0.5 K/W and C<sub>th</sub> = 60 J/K. What is the thermal time constant?", options: ["0.5 s", "12 s", "30 s", "120 s"], answer: 2, why: "τ = R<sub>th</sub> · C<sub>th</sub> = 0.5 × 60 = 30 s." },
        { q: "Why does a hot winding produce more loss at the same current?", options: ["Magnets weaken", "Copper resistance rises with temperature", "The inverter switches faster", "Iron loss falls"], answer: 1, why: "About +0.39% per kelvin, so 100 K of heating adds roughly 39%." },
        { q: "A peak current above the continuous rating is acceptable if…", options: ["it is applied for a time much shorter than τ", "the PWM frequency is high", "the voltage is low", "it never is"], answer: 0, why: "The thermal mass absorbs the extra heat for a while before the temperature reaches its limit." },
      ],
      challenges: [
        { q: "R<sub>th</sub> = 0.5 K/W and C<sub>th</sub> = 60 J/K. What is the time constant?", answer: 30, tol: 0.01, unit: "s", hints: ["τ = R<sub>th</sub> · C<sub>th</sub>"], solution: "0.5 × 60 = 30 s." },
        { q: "A winding dissipates 100 W with R<sub>th</sub> = 0.5 K/W and 40 °C ambient. What is the steady-state temperature (ignoring the resistance change)?", answer: 90, tol: 0.01, unit: "°C", hints: ["T = T<sub>a</sub> + P · R<sub>th</sub>"], solution: "40 + 100 × 0.5 = 90 °C." },
      ],
      debug: {
        scenario: "A dyno test at 50 A continuous ran fine for two minutes and then the winding temperature ran away. Your spreadsheet predicted a steady 95 °C.",
        options: ["The thermocouple was loose", "The spreadsheet used the cold resistance R<sub>25</sub>. Hot copper has a higher resistance, so the loss and the temperature are higher, and the feedback can leave no steady state.", "The current sensor drifted", "The PWM frequency was too high"],
        answer: 1, why: "Always use R at the operating temperature, or solve T = T<sub>a</sub> + k·(1 + α(T − 25)) for the self-consistent value.",
      },
      pow: "Fix a thermocouple to a winding. Step the current, record T(t) and fit τ and R<sub>th</sub>. Compare with the model, then set a derating curve in firmware and test it.",
    },
  ],
};
