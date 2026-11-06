import type { Track, Mission } from "./types";
/* Course content. Each lesson: theory → sim → quiz → challenges → debug → proof of work.
   Add a lesson by appending an object; the app renders it automatically. */
export const CORE_TRACKS: Track[] = [
/* ======================================================================= */
{
  id: "foundations", code: "T01", title: "Electrical & Magnetic Foundations",
  summary: "AC waveforms, three-phase power and the physics that turns current into torque.",
  rating: "AC · 3Φ · Faraday · Lorentz",
  lessons: [
  {
    id: "ac-phasors", level: "Basic", title: "AC waveforms and phasors", minutes: 45, sim: "phasor",
    theory: `
<p>Every motor drive you will build is a machine for making sinusoids. A sinusoid has three numbers: amplitude, frequency and phase.</p>
<div class="eq">v(<i>t</i>) = V<sub>m</sub> · sin(ω<i>t</i> + φ) &nbsp;&nbsp; ω = 2π<i>f</i> &nbsp;&nbsp; V<sub>rms</sub> = V<sub>m</sub> / √2</div>
<p>A <b>phasor</b> is a vector of length V<sub>m</sub> spinning at ω. Its vertical projection is the instantaneous value. Two waves of the same frequency keep a fixed angle between their phasors, so you can compare them by angle alone.</p>
<ul>
<li>Indian mains is 230 V<sub>rms</sub>, 50 Hz, so the peak is 325 V.</li>
<li>In an inductor the current <b>lags</b> the voltage by 90°. In a capacitor it <b>leads</b> by 90°.</li>
<li>A motor's electrical frequency is f<sub>e</sub> = p · rpm / 60, where p is the number of pole pairs.</li>
</ul>
<div class="callout">Why it matters: FOC (field-oriented control) works by turning these spinning phasors into still DC values. Learn to see the phasor and the rest follows.</div>`,
    simNote: "Drag the phase slider and watch the gap between the two phasors match the time shift between the waves. Set φ = −90° to see an inductor's current.",
    quiz: [
      { q: "What is the peak voltage of 230 V rms mains?", options: ["230 V", "325 V", "398 V", "163 V"], answer: 1, why: "V<sub>m</sub> = √2 × 230 ≈ 325 V." },
      { q: "In a pure inductor, the current…", options: ["leads the voltage by 90°", "is in phase", "lags the voltage by 90°", "lags by 180°"], answer: 2, why: "v = L·di/dt, so the voltage peaks where the current changes fastest, a quarter-cycle before the current peaks." },
      { q: "What is ω for a 50 Hz waveform?", options: ["50 rad/s", "157 rad/s", "314 rad/s", "3000 rad/s"], answer: 2, why: "ω = 2π × 50 ≈ 314.16 rad/s." }
    ],
    challenges: [
      { q: "A PMSM with 7 pole pairs spins at 3000 rpm. What is its electrical frequency?", answer: 350, tol: 0.01, unit: "Hz",
        hints: ["Mechanical revolutions per second = rpm / 60.", "Each mechanical revolution is p electrical cycles."], solution: "f<sub>e</sub> = 7 × 3000 / 60 = 350 Hz." },
      { q: "A phase current is a 20 A peak sinusoid. What is its RMS value?", answer: 14.142, tol: 0.01, unit: "A",
        hints: ["For a sinusoid, RMS = peak / √2."], solution: "20 / 1.4142 = 14.14 A." }
    ],
    debug: {
      scenario: "Your RMS current readout shows about 0 A even though the motor clearly draws current. The scope shows a clean 50 Hz sine of 20 A peak.",
      code: `<span class="cm">// 200 samples per 50 Hz cycle, sampled at 10 kHz</span>
float acc = 0;
for (int k = 0; k &lt; 200; k++) acc += i[k];
float i_rms = acc / 200;`,
      options: ["The sample rate is too low for 50 Hz", "It computes the mean, not the RMS: square, average, then take the square root", "acc should be a double", "The loop should run 199 times"],
      answer: 1, why: "A sine averages to zero over a full cycle. RMS = √(Σi²/N): square each sample, average, then take the square root."
    },
    pow: "Notebook: plot v(t) and i(t) for an RL load (R = 1 Ω, L = 10 mH, 50 Hz). Measure the phase lag and compare it with atan(ωL/R)."
  },
  {
    id: "three-phase", level: "Fundamental", title: "Three-phase power and power factor", minutes: 60, sim: "threephase",
    theory: `
<p>A three-phase system has three sinusoids of equal amplitude, 120° apart. In India the phases are labelled <b style="color:var(--ph-r)">R</b>, <b style="color:var(--ph-y)">Y</b> and <b style="color:var(--ph-b)">B</b>.</p>
<div class="eq">i<sub>R</sub> + i<sub>Y</sub> + i<sub>B</sub> = 0 &nbsp;(balanced) &nbsp;&nbsp; V<sub>L</sub> = √3 · V<sub>ph</sub> &nbsp;(star)</div>
<div class="eq">P = √3 · V<sub>L</sub> · I<sub>L</sub> · cos φ &nbsp;&nbsp; Q = √3 · V<sub>L</sub> · I<sub>L</sub> · sin φ &nbsp;&nbsp; S = √(P² + Q²)</div>
<ul>
<li>Balanced currents sum to zero. This is why a drive needs only two current sensors: the third current is −(i<sub>a</sub> + i<sub>b</sub>).</li>
<li>The <b>instantaneous</b> power of a balanced three-phase load is constant. A single-phase load pulses at 2f. Constant power means smooth torque.</li>
<li>Power factor cos φ is the share of apparent power that does real work.</li>
</ul>`,
    simNote: "Move the power-factor angle and watch the instantaneous total power stay flat while each phase's power pulses. Unbalance one phase and the sum stops being zero.",
    quiz: [
      { q: "A balanced star system has 230 V phase voltage. What is the line voltage?", options: ["230 V", "325 V", "400 V", "690 V"], answer: 2, why: "V<sub>L</sub> = √3 × 230 ≈ 398 V, quoted as 400 V." },
      { q: "Why do three-phase motors run more smoothly than single-phase ones?", options: ["Higher voltage", "Instantaneous power is constant", "Lower frequency", "They have no back-EMF"], answer: 1, why: "In a balanced system the pulsations of the three phases cancel, so power and torque are constant." },
      { q: "In a balanced three-wire system, i<sub>a</sub> = 12 A and i<sub>b</sub> = −5 A at some instant. What is i<sub>c</sub>?", options: ["7 A", "−7 A", "17 A", "−17 A"], answer: 1, why: "i<sub>c</sub> = −(i<sub>a</sub> + i<sub>b</sub>) = −7 A." }
    ],
    challenges: [
      { q: "A 400 V line, 10 A, PF 0.85 load. What is the real power?", answer: 5889, tol: 0.02, unit: "W",
        hints: ["P = √3 · V<sub>L</sub> · I<sub>L</sub> · PF"], solution: "1.732 × 400 × 10 × 0.85 = 5889 W." },
      { q: "Same load. What is the reactive power Q?", answer: 3650, tol: 0.02, unit: "var",
        hints: ["φ = acos(0.85) = 31.8°", "Q = √3 · V<sub>L</sub> · I<sub>L</sub> · sin φ"], solution: "S = 6928 VA, sin φ = 0.527, Q ≈ 3650 var." }
    ],
    debug: {
      scenario: "Your two-shunt drive reconstructs phase C in firmware. Torque is rough and i<sub>c</sub> on the scope is twice the size it should be.",
      code: `ia = adc_to_amps(adc[0]);
ib = adc_to_amps(adc[1]);
ic = ia + ib;   <span class="cm">// reconstruct third phase</span>`,
      options: ["The ADC channels are swapped", "ic must be −(ia + ib)", "You need three shunts", "adc_to_amps is missing an offset"],
      answer: 1, why: "Kirchhoff's current law: i<sub>a</sub> + i<sub>b</sub> + i<sub>c</sub> = 0, so i<sub>c</sub> = −(i<sub>a</sub> + i<sub>b</sub>)."
    },
    pow: "Spreadsheet or notebook: compute P, Q and S for PF from 0.5 to 1.0 at 400 V / 10 A, and plot the power triangle."
  },
  {
    id: "em-torque", level: "Advanced", title: "Electromagnetism: from current to torque", minutes: 75, sim: "emag",
    theory: `
<p>Current produces a magnetic field (Ampère's law). A changing flux induces a voltage (Faraday's law). Current in a field feels a force (Lorentz force). A motor is these three laws arranged around a shaft.</p>
<div class="eq">F = B · I · L &nbsp;&nbsp; T = N · B · I · A · sin θ &nbsp;&nbsp; e = −N · dΦ/d<i>t</i></div>
<div class="eq">Magnetic circuit: &nbsp; N·I = Φ · ℛ &nbsp;&nbsp; ℛ = ℓ / (μ<sub>0</sub> μ<sub>r</sub> A)</div>
<ul>
<li>Steel has μ<sub>r</sub> in the thousands, so a 1 mm <b>airgap</b> can have more reluctance than 100 mm of iron. Airgap length drives motor design.</li>
<li>The torque on a coil changes sign every half-turn. Something has to reverse the current: a commutator (DC motor) or an inverter (BLDC/PMSM).</li>
<li>Energy balance: mechanical power T·ω equals the electrical power e·i drawn against the back-EMF.</li>
<li>Above roughly 1.6–1.8 T, steel <b>saturates</b>: more current gives little extra flux.</li>
</ul>`,
    simNote: "Turn commutation off and watch the coil rock back and forth because the average torque is zero. Turn it on and the torque never changes sign.",
    quiz: [
      { q: "Why does the airgap dominate a motor's magnetic circuit?", options: ["Air conducts flux better", "Air's permeability is thousands of times lower than steel's", "The airgap is where heat is produced", "Flux only exists in the airgap"], answer: 1, why: "ℛ = ℓ/(μA). With μ<sub>r</sub> ≈ 1 for air against about 4000 for steel, a tiny gap dominates." },
      { q: "Lenz's law says the induced EMF…", options: ["adds to the applied voltage", "opposes the change in flux that caused it", "is always zero in steady state", "depends only on resistance"], answer: 1, why: "That is the minus sign in e = −N dΦ/dt, and it is why back-EMF opposes the supply." },
      { q: "When is the torque on a single coil at its maximum?", options: ["Coil plane perpendicular to B", "Coil plane parallel to B", "At every angle equally", "Only at standstill"], answer: 1, why: "T ∝ sin θ, where θ is between the coil's normal and B. The maximum is at θ = 90°, with the coil plane parallel to the field." }
    ],
    challenges: [
      { q: "A conductor 50 mm long carries 20 A in a 0.8 T field, perpendicular to it. What is the force?", answer: 0.8, tol: 0.01, unit: "N",
        hints: ["F = B·I·L, with L in metres."], solution: "0.8 × 20 × 0.05 = 0.8 N." },
      { q: "A 1 mm airgap with 10 cm² area must carry 1 T. Ignoring the iron, how many ampere-turns (N·I) are needed?", answer: 796, tol: 0.02, unit: "A·t",
        hints: ["Φ = B·A = 0.001 Wb", "ℛ = g / (μ<sub>0</sub>·A), μ<sub>0</sub> = 4π×10⁻⁷"], solution: "ℛ = 0.001 / (4π×10⁻⁷ × 0.001) = 7.96×10⁵ A/Wb. N·I = Φ·ℛ ≈ 796 A·t." }
    ],
    debug: {
      scenario: "Your hand-wound single-coil motor, with a fixed DC supply and no commutator, swings to one position, rocks a few times and stops. Every time you push it, it snaps back.",
      options: ["The magnet is too weak", "The current never reverses, so the torque changes sign every half-turn and settles at the zero-torque position", "The supply voltage is too high", "The coil resistance is too low"],
      answer: 1, why: "Without commutation the average torque over a turn is zero, and the rotor settles where sin θ = 0. Real motors reverse the current with brushes or an inverter."
    },
    pow: "FEMM model: an iron C-core with a 1 mm gap and a 200-turn coil. Sweep the current from 0 to 10 A and plot gap B against I to find where saturation begins."
  }]
},
/* ======================================================================= */
{
  id: "machines", code: "T02", title: "Electrical Machines",
  summary: "DC motor, BLDC six-step, PMSM d-q model and reluctance torque.",
  rating: "DC · BLDC · PMSM · d-q",
  lessons: [
  {
    id: "dc-motor", level: "Basic", title: "DC motor: back-EMF and torque-speed", minutes: 60, sim: "dcmotor",
    theory: `
<p>The DC motor is the simplest model of every motor. Two equations describe it:</p>
<div class="eq">V = I·R + L·dI/d<i>t</i> + K·ω &nbsp;&nbsp;&nbsp; T = K·I &nbsp;&nbsp;&nbsp; J·dω/d<i>t</i> = T − T<sub>L</sub> − B·ω</div>
<ul>
<li>In SI units, K in N·m/A equals K in V/(rad/s). One constant links torque and back-EMF.</li>
<li><b>No-load speed</b> is ω₀ = V/K. The motor speeds up until back-EMF almost equals the supply.</li>
<li><b>Stall current</b> is V/R. It is huge, because no back-EMF limits it at standstill.</li>
<li>The torque-speed curve is a straight line. Output power peaks at half the no-load speed.</li>
</ul>
<div class="callout">Every PMSM equation you meet later is this one, written twice (d and q axes) in a rotating frame.</div>`,
    simNote: "Apply a voltage step and watch the starting current spike. Add load torque and the speed drops along the torque-speed line.",
    quiz: [
      { q: "What limits a DC motor's no-load speed?", options: ["Friction only", "Back-EMF approaching the supply voltage", "The inductance", "Rotor mass"], answer: 1, why: "As ω rises, K·ω approaches V, so the current, and with it the torque, drops to almost nothing." },
      { q: "When is the current largest?", options: ["At no-load speed", "At stall (ω = 0)", "At half speed", "It is always the same"], answer: 1, why: "With ω = 0 there is no back-EMF, so I = V/R." },
      { q: "At what speed does mechanical output power peak?", options: ["At stall", "At ω₀/2", "At ω₀", "At 0.9·ω₀"], answer: 1, why: "P = T·ω with T falling linearly in ω. The product peaks at the midpoint." }
    ],
    challenges: [
      { q: "24 V supply, R = 0.5 Ω, K = 0.05 V·s/rad. What is the no-load speed in rpm?", answer: 4584, tol: 0.02, unit: "rpm",
        hints: ["ω₀ = V/K in rad/s", "rpm = ω × 60 / 2π"], solution: "ω₀ = 480 rad/s, which is 4584 rpm." },
      { q: "Same motor. What is the stall torque?", answer: 2.4, tol: 0.02, unit: "N·m",
        hints: ["I<sub>stall</sub> = V/R", "T = K·I"], solution: "I = 48 A, T = 0.05 × 48 = 2.4 N·m." }
    ],
    debug: {
      scenario: "Your PWM speed controller (24 V, R = 0.5 Ω motor, 30 A MOSFET) blows the MOSFET the moment you press start. It works fine if you turn the pot up slowly.",
      code: `void start_motor(void) {
    set_duty(target_duty);   <span class="cm">// target_duty = 1.0 from the pot</span>
    enable_pwm();
}`,
      options: ["The PWM frequency is too high", "At standstill there is no back-EMF, so full duty pulls about 48 A of stall current. Ramp the duty or add a current limit.", "The MOSFET needs a heatsink", "The pot is wired backwards"],
      answer: 1, why: "I = V/R = 48 A at ω = 0. Soft-start ramps and cycle-by-cycle current limits exist for this reason."
    },
    pow: "Project 1: a MOSFET PWM DC speed controller with a soft-start ramp and RPM measured by an IR sensor. Log speed against duty and fit K."
  },
  {
    id: "bldc-sixstep", level: "Fundamental", title: "BLDC six-step commutation", minutes: 75, sim: "sixstep",
    theory: `
<p>A BLDC motor replaces brushes with electronics. Three Hall sensors give a 3-bit rotor position code with <b>6 valid states</b> per electrical revolution. Each state switches on the two phases that produce the most torque: one high, one low, one floating.</p>
<ul>
<li>Hall codes 000 and 111 are invalid. Seeing one means a broken sensor or a missing pull-up.</li>
<li>Each step covers 60° electrical. Steps per mechanical revolution = 6 × pole pairs.</li>
<li>Trapezoidal back-EMF and rectangular currents give good torque, but there is a <b>torque ripple</b> at every commutation.</li>
<li>Sensorless six-step watches the floating phase's back-EMF cross zero, then commutates 30° electrical later.</li>
</ul>
<div class="eq">f<sub>commutation</sub> = 6 · p · rpm / 60</div>`,
    simNote: "Step through the sectors. Turn on \"Wrong Hall order\" and watch the stator field point the wrong way, so torque collapses or reverses.",
    quiz: [
      { q: "How many valid Hall states are there per electrical revolution?", options: ["3", "6", "8", "12"], answer: 1, why: "3 bits give 8 codes, but 000 and 111 never occur with 120°-spaced sensors." },
      { q: "In six-step, how many phases conduct at a time?", options: ["1", "2", "3", "It depends on speed"], answer: 1, why: "One phase is high, one is low and the third floats. The floating phase is what sensorless control measures." },
      { q: "Sensorless six-step commutates how long after the back-EMF zero crossing?", options: ["0°", "30° electrical", "60° electrical", "90° electrical"], answer: 1, why: "The zero crossing falls in the middle of a 60° step, so the next commutation is 30° later." }
    ],
    challenges: [
      { q: "A 7-pole-pair motor. How many Hall transitions are there per mechanical revolution?", answer: 42, tol: 0, unit: "",
        hints: ["6 per electrical revolution"], solution: "6 × 7 = 42." },
      { q: "Same motor at 3000 rpm. What is the commutation frequency?", answer: 2100, tol: 0.01, unit: "Hz",
        hints: ["Revolutions per second × transitions per revolution"], solution: "50 rev/s × 42 = 2100 Hz." }
    ],
    debug: {
      scenario: "You log the Hall code while turning the rotor slowly by hand: 5 → 4 → 6 → 7 → 2 → 3 → 1 → 5. The motor stutters badly at one position.",
      options: ["The motor has the wrong pole count", "Code 7 (111) is invalid: one Hall line is stuck high, likely a missing pull-up on an open-collector sensor", "The commutation table is reversed", "The PWM frequency is too low"],
      answer: 1, why: "A valid sequence changes one bit at a time and never reads 000 or 111. Hall sensors are usually open-collector and need pull-ups. Check the line that should read 0 there."
    },
    pow: "Project 2: a 12 V current-limited six-step BLDC controller on STM32. Log the Hall sequence and phase currents, and show the commutation torque ripple on a scope."
  },
  {
    id: "pmsm-dq", level: "Advanced", title: "PMSM d-q model and reluctance torque", minutes: 90, sim: "pmsmtorque",
    theory: `
<p>A PMSM has sinusoidal back-EMF. Seen from a frame rotating with the rotor (the <b>d-q frame</b>), its AC quantities become DC. The d-axis lines up with the magnet flux and the q-axis is 90° ahead of it.</p>
<div class="eq">v<sub>d</sub> = R·i<sub>d</sub> + L<sub>d</sub>·di<sub>d</sub>/d<i>t</i> − ω<sub>e</sub>·L<sub>q</sub>·i<sub>q</sub></div>
<div class="eq">v<sub>q</sub> = R·i<sub>q</sub> + L<sub>q</sub>·di<sub>q</sub>/d<i>t</i> + ω<sub>e</sub>·L<sub>d</sub>·i<sub>d</sub> + ω<sub>e</sub>·λ<sub>m</sub></div>
<div class="eq">T<sub>e</sub> = 3/2 · p · [ λ<sub>m</sub>·i<sub>q</sub> + (L<sub>d</sub> − L<sub>q</sub>)·i<sub>d</sub>·i<sub>q</sub> ]</div>
<ul>
<li><b>SPMSM</b> (magnets on the surface): L<sub>d</sub> ≈ L<sub>q</sub>, so torque is just λ·i<sub>q</sub> and the best choice is i<sub>d</sub> = 0.</li>
<li><b>IPMSM</b> (magnets buried): L<sub>q</sub> &gt; L<sub>d</sub>. A <b>negative</b> i<sub>d</sub> adds reluctance torque. The best angle is MTPA (maximum torque per ampere).</li>
<li>A negative i<sub>d</sub> also weakens the effective flux, which lets the motor run faster than base speed (field weakening).</li>
</ul>`,
    simNote: "Set L<sub>q</sub> = L<sub>d</sub> and the peak sits at β = 0. Raise L<sub>q</sub> and the peak moves toward negative i<sub>d</sub>: that shift is reluctance torque.",
    quiz: [
      { q: "For an SPMSM (L<sub>d</sub> = L<sub>q</sub>), which i<sub>d</sub> gives maximum torque per amp?", options: ["Large positive", "Zero", "Large negative", "Equal to i<sub>q</sub>"], answer: 1, why: "The reluctance term vanishes, so any i<sub>d</sub> only adds copper loss." },
      { q: "In an IPMSM, the sign of (L<sub>d</sub> − L<sub>q</sub>) is…", options: ["positive", "negative", "zero", "it changes with speed"], answer: 1, why: "Buried magnets make the d-axis path mostly magnet (μ<sub>r</sub> ≈ 1), so L<sub>d</sub> &lt; L<sub>q</sub>." },
      { q: "To get reluctance torque with positive i<sub>q</sub> in an IPMSM, i<sub>d</sub> should be…", options: ["positive", "negative", "zero", "it doesn't matter"], answer: 1, why: "(L<sub>d</sub> − L<sub>q</sub>) is negative, so i<sub>d</sub> must be negative for the product to add torque." }
    ],
    challenges: [
      { q: "SPMSM: p = 4, λ<sub>m</sub> = 0.1 Wb, i<sub>q</sub> = 100 A, i<sub>d</sub> = 0. What is the torque?", answer: 60, tol: 0.01, unit: "N·m",
        hints: ["T = 1.5·p·λ·i<sub>q</sub>"], solution: "1.5 × 4 × 0.1 × 100 = 60 N·m." },
      { q: "IPMSM: p = 4, λ = 0.05 Wb, L<sub>d</sub> = 0.2 mH, L<sub>q</sub> = 0.5 mH, i<sub>d</sub> = −50 A, i<sub>q</sub> = 100 A. What is the total torque?", answer: 39, tol: 0.02, unit: "N·m",
        hints: ["Magnet part: 1.5·4·0.05·100", "Reluctance part: 1.5·4·(−0.0003)·(−50)·100"], solution: "Magnet 30 N·m + reluctance 9 N·m = 39 N·m." }
    ],
    debug: {
      scenario: "Your IPMSM torque estimate reads lower than the dyno whenever you inject negative i<sub>d</sub>. With i<sub>d</sub> = 0 it matches.",
      code: `float Te = 1.5f * p * (lambda * iq + (Lq - Ld) * id * iq);`,
      options: ["lambda is in the wrong units", "The inductance difference is reversed: it must be (Ld − Lq)", "1.5 should be 3", "iq must be squared"],
      answer: 1, why: "With (Lq − Ld) > 0 and id &lt; 0, the reluctance term turns negative, the opposite of reality. The error only appears when id ≠ 0, which matches the symptom."
    },
    pow: "Notebook: implement the d-q model with RK4 integration. Plot torque against current angle for an SPM and an IPM, and mark the MTPA point."
  }]
},
/* ======================================================================= */
{
  id: "power", code: "T03", title: "Power Electronics",
  summary: "PWM, buck converters, MOSFET losses, the three-phase inverter and SVPWM.",
  rating: "PWM · MOSFET · VSI · SVPWM",
  lessons: [
  {
    id: "pwm-buck", level: "Basic", title: "PWM and the buck converter", minutes: 60, sim: "pwm",
    theory: `
<p>A switch is either fully on or fully off, so it wastes almost no power. Pulse width modulation (PWM) switches fast enough that an inductor averages the pulses into a steady voltage.</p>
<div class="eq">V<sub>out</sub> = D · V<sub>in</sub> &nbsp;&nbsp;&nbsp; ΔI<sub>L</sub> = (V<sub>in</sub> − V<sub>out</sub>) · D / (L · f<sub>sw</sub>)</div>
<ul>
<li>Doubling f<sub>sw</sub> halves the ripple but doubles the switching loss. That is the central trade-off of power electronics.</li>
<li>One leg of an inverter (two switches with the motor winding as the inductor) is a <b>synchronous buck</b> that can push current both ways.</li>
<li>Motor drives typically run at 10–40 kHz with Si MOSFETs/IGBTs and 50–100+ kHz with SiC or GaN.</li>
</ul>`,
    simNote: "Lower the inductance or the frequency and the ripple grows. If the ripple dips below zero at light load, a non-synchronous buck enters discontinuous mode.",
    quiz: [
      { q: "A buck converter runs at 48 V input and D = 0.25. What is V<sub>out</sub>?", options: ["6 V", "12 V", "24 V", "36 V"], answer: 1, why: "48 × 0.25 = 12 V." },
      { q: "Doubling the switching frequency (everything else fixed) changes ripple current by…", options: ["×2", "×0.5", "×1", "×0.25"], answer: 1, why: "ΔI is proportional to 1/f<sub>sw</sub>." },
      { q: "One inverter leg driving a motor winding behaves most like…", options: ["a boost converter", "a synchronous buck", "a flyback", "a linear regulator"], answer: 1, why: "Two complementary switches and an inductive load form a bidirectional buck." }
    ],
    challenges: [
      { q: "V<sub>in</sub> = 48 V, V<sub>out</sub> = 12 V, L = 47 µH, f = 50 kHz. What is the peak-to-peak ripple current?", answer: 3.83, tol: 0.02, unit: "A",
        hints: ["D = 12/48", "ΔI = (V<sub>in</sub> − V<sub>out</sub>)·D / (L·f)"], solution: "36 × 0.25 / (47e-6 × 50e3) = 3.83 A." },
      { q: "What duty cycle gives 18 V from a 24 V input?", answer: 75, tol: 0.01, unit: "%",
        hints: ["D = V<sub>out</sub>/V<sub>in</sub>"], solution: "18/24 = 0.75, which is 75%." }
    ],
    debug: {
      scenario: "You configured STM32 TIM1 for 20 kHz center-aligned PWM, but the scope shows 10 kHz.",
      code: `<span class="cm">// 72 MHz timer clock, want 20 kHz center-aligned PWM</span>
TIM1-&gt;ARR = 72000000 / 20000 - 1;   <span class="cm">// = 3599</span>
TIM1-&gt;CR1 |= TIM_CR1_CMS_0;          <span class="cm">// center-aligned mode 1</span>`,
      options: ["The clock is actually 36 MHz", "Center-aligned mode counts up and then down, so the period is 2·ARR. ARR should be about 1800.", "CMS_0 should be CMS_1", "ARR must be a power of 2"],
      answer: 1, why: "In center-aligned mode, f<sub>pwm</sub> = f<sub>clk</sub> / (2·ARR). For 20 kHz, ARR = 72e6 / (2 × 20e3) = 1800."
    },
    pow: "LTspice: a 48 V → 12 V synchronous buck at 50 kHz. Measure the ripple, compare it with the formula, then halve L and measure again."
  },
  {
    id: "mosfet-losses", level: "Fundamental", title: "MOSFET losses, dead time and heat", minutes: 75, sim: "mosfetloss",
    theory: `
<p>Every inverter switch loses power in two ways.</p>
<div class="eq">P<sub>cond</sub> = I<sub>rms</sub>² · R<sub>ds(on)</sub> &nbsp;&nbsp;&nbsp; P<sub>sw</sub> ≈ ½ · V · I · (t<sub>r</sub> + t<sub>f</sub>) · f<sub>sw</sub></div>
<div class="eq">T<sub>j</sub> = T<sub>a</sub> + P<sub>total</sub> · R<sub>θ,ja</sub></div>
<ul>
<li>R<sub>ds(on)</sub> rises with temperature, roughly 1.5–2× at 125 °C. Use the hot value.</li>
<li><b>Dead time</b> is a short gap where both switches of a leg are off. It prevents shoot-through, where both conduct and short the DC bus. It also distorts the output voltage near current zero crossings.</li>
<li>SiC and GaN switch much faster (smaller t<sub>r</sub> + t<sub>f</sub>), which lets you raise f<sub>sw</sub> without paying more switching loss.</li>
<li>Gate drivers set how fast the gate charges. Faster switching means lower loss but more EMI and voltage overshoot.</li>
</ul>`,
    simNote: "Push f<sub>sw</sub> until switching loss overtakes conduction loss, and watch the junction temperature cross the 150 °C limit.",
    quiz: [
      { q: "Which loss scales with switching frequency?", options: ["Conduction loss", "Switching loss", "Neither", "Both equally"], answer: 1, why: "Every transition dissipates energy, and there are f<sub>sw</sub> transitions each second." },
      { q: "As a MOSFET heats up, its R<sub>ds(on)</sub>…", options: ["falls", "rises", "stays constant", "becomes zero"], answer: 1, why: "Silicon MOSFETs have a positive temperature coefficient. This helps parallel devices share current." },
      { q: "What is dead time for?", options: ["Reducing EMI", "Preventing shoot-through", "Increasing torque", "Measuring current"], answer: 1, why: "Switches turn off with a delay. Without a gap, both switches of a leg briefly conduct and short the DC bus." }
    ],
    challenges: [
      { q: "30 A rms through R<sub>ds(on)</sub> = 5 mΩ. What is the conduction loss?", answer: 4.5, tol: 0.01, unit: "W",
        hints: ["P = I²R"], solution: "900 × 0.005 = 4.5 W." },
      { q: "V = 48 V, I = 30 A, t<sub>r</sub> + t<sub>f</sub> = 100 ns, f = 20 kHz. What is the switching loss?", answer: 1.44, tol: 0.02, unit: "W",
        hints: ["P = 0.5·V·I·t·f"], solution: "0.5 × 48 × 30 × 100e-9 × 20e3 = 1.44 W." }
    ],
    debug: {
      scenario: "With the motor disconnected, the inverter MOSFETs get hot within seconds and the bench supply shows current spikes at every PWM edge.",
      code: `<span class="cm">// complementary outputs CH1/CH1N on TIM1</span>
TIM1-&gt;BDTR = (TIM1-&gt;BDTR &amp; ~TIM_BDTR_DTG) | 0;   <span class="cm">// DTG = 0</span>
TIM1-&gt;BDTR |= TIM_BDTR_MOE;`,
      options: ["The MOE bit must not be set", "Dead time is zero, so the high and low switches overlap during transitions (shoot-through)", "PWM frequency too low", "The bus capacitor is too large"],
      answer: 1, why: "Heat with no load plus spikes at every edge is the signature of shoot-through. Set DTG to about 200–500 ns, based on the switches' turn-off delay."
    },
    pow: "Loss budget sheet for a 48 V / 30 A, 3-phase inverter at 20 kHz. Compare two real MOSFET datasheets and pick a heatsink that keeps T<sub>j</sub> below 110 °C."
  },
  {
    id: "inverter-svpwm", level: "Advanced", title: "Three-phase inverter and SVPWM", minutes: 90, sim: "svpwm",
    theory: `
<p>Three legs give 2³ = <b>8 switching states</b>: 6 active vectors at the corners of a hexagon and 2 zero vectors (all high or all low). Space vector PWM (SVPWM) builds any reference vector inside the hexagon by time-averaging its two neighbouring active vectors and a zero vector within each PWM period.</p>
<div class="eq">T<sub>1</sub> = √3 · T<sub>s</sub> · (V<sub>ref</sub>/V<sub>dc</sub>) · sin(60° − θ) &nbsp;&nbsp; T<sub>2</sub> = √3 · T<sub>s</sub> · (V<sub>ref</sub>/V<sub>dc</sub>) · sin θ &nbsp;&nbsp; T<sub>0</sub> = T<sub>s</sub> − T<sub>1</sub> − T<sub>2</sub></div>
<ul>
<li>The largest circle inside the hexagon has radius V<sub>dc</sub>/√3. That is the linear limit of SVPWM.</li>
<li>Sine PWM only reaches V<sub>dc</sub>/2, so SVPWM gives <b>15.5% more voltage</b> from the same battery, which means more top speed.</li>
<li>The duty waveforms look like "saddles": a sine plus a triangular third harmonic that cancels between phases.</li>
<li>The DC-link capacitor supplies the ripple current. Size it for ripple current and voltage ripple, not just capacitance.</li>
</ul>`,
    simNote: "Push the modulation past the inscribed circle and T<sub>0</sub> goes negative, which is overmodulation. Watch the saddle-shaped duty waveforms.",
    quiz: [
      { q: "How many switching states does a three-phase two-level inverter have?", options: ["6", "8", "9", "27"], answer: 1, why: "Each leg is high or low: 2³ = 8 states (6 active, 2 zero)." },
      { q: "What is the maximum phase voltage peak in linear SVPWM?", options: ["V<sub>dc</sub>/2", "V<sub>dc</sub>/√3", "V<sub>dc</sub>", "2V<sub>dc</sub>/3"], answer: 1, why: "It is the radius of the circle inscribed in the hexagon." },
      { q: "Why does SVPWM reach a higher voltage than sine PWM?", options: ["Higher switching frequency", "It effectively injects a third harmonic that cancels line-to-line", "Bigger capacitors", "It uses only zero vectors"], answer: 1, why: "The common-mode third harmonic flattens the phase peaks while the line-line voltage stays sinusoidal." }
    ],
    challenges: [
      { q: "V<sub>dc</sub> = 48 V. What is the maximum phase peak voltage in linear SVPWM?", answer: 27.71, tol: 0.01, unit: "V",
        hints: ["V<sub>dc</sub>/√3"], solution: "48/1.732 = 27.7 V." },
      { q: "By what percentage does SVPWM's linear limit exceed sine PWM's?", answer: 15.47, tol: 0.02, unit: "%",
        hints: ["(1/√3) / (1/2) − 1"], solution: "2/√3 − 1 = 0.1547, which is 15.5%." }
    ],
    debug: {
      scenario: "Your SVPWM output is stuck in sector 1: the motor only gets vectors V1/V2 and buzzes without turning.",
      code: `float theta = atan2f(v_beta, v_alpha);   <span class="cm">// radians, -pi..pi</span>
if (theta &lt; 0) theta += 2.0f * PI;
int sector = (int)(theta / 60.0f) + 1;`,
      options: ["atan2f arguments reversed", "theta is in radians but divided by 60 degrees: sector is always 1. Use theta / (PI/3).", "Need floor() instead of cast", "Sector should start at 0"],
      answer: 1, why: "θ never exceeds 2π ≈ 6.28, so θ/60 is always below 1. Units mix-ups like this are among the most common firmware bugs."
    },
    pow: "Python: an SVPWM generator. Plot the duty cycles over one electrical cycle, show the saddle shape, and check that the line-line voltage is sinusoidal."
  }]
},
/* ======================================================================= */
{
  id: "control", code: "T04", title: "Motor Control",
  summary: "PI loops, Clarke/Park transforms, full FOC, field weakening and regeneration.",
  rating: "PI · Clarke · Park · FOC",
  lessons: [
  {
    id: "pi-control", level: "Basic", title: "Feedback and PI control", minutes: 60, sim: "pi",
    theory: `
<p>A controller compares a setpoint with a measurement and acts on the error. In motor control almost every loop is a <b>PI</b> controller.</p>
<div class="eq">u = K<sub>p</sub>·e + K<sub>i</sub>·∫e d<i>t</i></div>
<ul>
<li>A proportional term alone leaves a <b>steady-state error</b> on a first-order plant. The integral removes it.</li>
<li>For a current loop (plant 1/(R + sL)), cancel the plant pole: <b>K<sub>p</sub> = L·ω<sub>c</sub></b> and <b>K<sub>i</sub> = R·ω<sub>c</sub></b>, where ω<sub>c</sub> is the bandwidth you want.</li>
<li><b>Integrator windup</b>: when the output saturates (voltage limit), the integral keeps growing, which causes a big overshoot later. Clamp it or use back-calculation.</li>
<li>Cascade rule: each outer loop should be about 5–10× slower than the loop inside it (position &lt; speed &lt; current).</li>
</ul>`,
    simNote: "Try K<sub>i</sub> = 0 to see the steady-state error. Turn on saturation without anti-windup and watch the overshoot.",
    quiz: [
      { q: "What does a P-only controller on a first-order plant leave behind?", options: ["Oscillation", "A steady-state error", "Instability", "Nothing, it is perfect"], answer: 1, why: "Holding a non-zero output needs a non-zero error. The integral term is what lets the error reach zero." },
      { q: "When does integrator windup happen?", options: ["When gains are too low", "While the actuator is saturated", "Only at startup", "When the setpoint is zero"], answer: 1, why: "The error persists because the output can't grow, so the integral keeps accumulating." },
      { q: "How fast is the speed loop compared with the current loop?", options: ["Faster", "Same", "About 5–10× slower", "100× faster"], answer: 2, why: "The inner loop must settle quickly enough that the outer loop sees it as ideal." }
    ],
    challenges: [
      { q: "L = 0.2 mH, R = 0.1 Ω, target bandwidth 1 kHz. What is K<sub>p</sub>?", answer: 1.2566, tol: 0.02, unit: "V/A",
        hints: ["ω<sub>c</sub> = 2π × 1000", "K<sub>p</sub> = L·ω<sub>c</sub>"], solution: "0.0002 × 6283 = 1.257 V/A." },
      { q: "Same motor. What is K<sub>i</sub>?", answer: 628.3, tol: 0.02, unit: "V/(A·s)",
        hints: ["K<sub>i</sub> = R·ω<sub>c</sub>"], solution: "0.1 × 6283 = 628.3." }
    ],
    debug: {
      scenario: "After the motor hits the voltage limit during a hard acceleration, the speed overshoots by 40% and takes seconds to recover.",
      code: `integ += Ki * err * Ts;
out = Kp * err + integ;
if (out &gt;  VMAX) out =  VMAX;
if (out &lt; -VMAX) out = -VMAX;`,
      options: ["Kp too low", "The output is clamped but the integrator is not: windup. Clamp integ, or stop integrating while saturated.", "Ts is wrong", "VMAX is too high"],
      answer: 1, why: "During saturation the integral keeps growing, and it has to unwind before the output drops. Clamp the integrator or use conditional integration or back-calculation."
    },
    pow: "Notebook: tune a PI for the plant 1/(0.1 + 0.0002s) by pole cancellation. Compare the step responses at 200 Hz, 1 kHz and 3 kHz bandwidth with a one-sample delay."
  },
  {
    id: "clarke-park", level: "Fundamental", title: "Clarke and Park transforms", minutes: 75, sim: "clarkepark",
    theory: `
<p>The <b>Clarke</b> transform turns three phase currents into a two-axis stationary vector (α, β). The <b>Park</b> transform rotates that vector by the rotor angle, so a sinusoidal current turns into two DC values (d, q) that a PI controller can track.</p>
<div class="eq">i<sub>α</sub> = i<sub>a</sub> &nbsp;&nbsp; i<sub>β</sub> = (i<sub>a</sub> + 2·i<sub>b</sub>) / √3 &nbsp;&nbsp;(amplitude-invariant)</div>
<div class="eq">i<sub>d</sub> = i<sub>α</sub>·cos θ<sub>e</sub> + i<sub>β</sub>·sin θ<sub>e</sub> &nbsp;&nbsp; i<sub>q</sub> = −i<sub>α</sub>·sin θ<sub>e</sub> + i<sub>β</sub>·cos θ<sub>e</sub></div>
<ul>
<li>θ<sub>e</sub> = p · θ<sub>mech</sub> + offset. Getting the pole pairs or the offset wrong is the classic FOC bug.</li>
<li>Balanced sinusoids trace a circle in α-β and give a still point in d-q.</li>
<li>Unbalance, sensor offsets and harmonics all show up as <b>ripple</b> in d-q, which makes d-q a good diagnostic view.</li>
</ul>`,
    simNote: "Add an angle error and see i<sub>d</sub> become non-zero. Add a current-sensor offset and d-q starts to ripple at the electrical frequency.",
    quiz: [
      { q: "In steady state, balanced sinusoidal currents appear in d-q as…", options: ["sinusoids at f<sub>e</sub>", "constant DC values", "square waves", "noise"], answer: 1, why: "The Park transform rotates at the same speed as the current vector, so the vector looks still." },
      { q: "An encoder gives the mechanical angle. What does Park need?", options: ["The mechanical angle", "θ<sub>mech</sub> / p", "p · θ<sub>mech</sub> + offset", "θ<sub>mech</sub> + 90°"], answer: 2, why: "Electrical angle = pole pairs × mechanical angle, plus the alignment offset." },
      { q: "A DC offset on one current sensor appears in d-q as ripple at…", options: ["DC", "1 × f<sub>e</sub>", "2 × f<sub>e</sub>", "6 × f<sub>e</sub>"], answer: 1, why: "A constant offset in the stationary frame rotates at −ω<sub>e</sub> in the rotor frame." }
    ],
    challenges: [
      { q: "i<sub>a</sub> = 10 A, i<sub>b</sub> = −5 A, θ<sub>e</sub> = 30°. What is i<sub>d</sub>?", answer: 8.66, tol: 0.02, unit: "A",
        hints: ["i<sub>α</sub> = 10, i<sub>β</sub> = (10 − 10)/√3 = 0", "i<sub>d</sub> = i<sub>α</sub> cos 30°"], solution: "10 × 0.866 = 8.66 A (and i<sub>q</sub> = −5 A)." },
      { q: "Mechanical angle 50°, 4 pole pairs, zero offset. What is the electrical angle (0–360°)?", answer: 200, tol: 0, unit: "°",
        hints: ["θ<sub>e</sub> = p · θ<sub>m</sub>, wrapped to 360"], solution: "4 × 50 = 200°." }
    ],
    debug: {
      scenario: "FOC with an incremental encoder: the motor vibrates violently, draws large current and never spins smoothly. The 7-pole-pair motor works in open loop.",
      code: `theta = encoder_count * (2.0f * PI / ENC_CPR);
park(i_alpha, i_beta, theta, &amp;id, &amp;iq);`,
      options: ["ENC_CPR is wrong", "It uses the mechanical angle. Park needs θe = p·θm + offset.", "Park arguments swapped", "Current sensors are inverted"],
      answer: 1, why: "With θ<sub>mech</sub> the controller's frame rotates 7× too slowly, so d and q mix continuously. Multiply by pole pairs and calibrate the offset."
    },
    pow: "Python: implement Clarke/Park/inverse Park with unit tests (a balanced input must give constant d-q; round trip abc→dq→abc must be exact)."
  },
  {
    id: "foc-fw", level: "Advanced", title: "Field-oriented control, field weakening and regen", minutes: 120, sim: "foc",
    theory: `
<p>FOC chains everything together and runs every PWM period:</p>
<div class="eq">ADC → Clarke → Park(θ<sub>e</sub>) → PI(i<sub>d</sub>), PI(i<sub>q</sub>) → inverse Park → SVPWM → gates</div>
<ul>
<li>The speed PI outputs i<sub>q</sub>*. i<sub>d</sub>* = 0 for an SPMSM, or MTPA for an IPMSM.</li>
<li><b>Decoupling</b>: add the feed-forward terms −ω<sub>e</sub>L<sub>q</sub>i<sub>q</sub> and +ω<sub>e</sub>(L<sub>d</sub>i<sub>d</sub> + λ) so the d and q loops stop fighting each other.</li>
<li><b>Voltage limit</b>: |v<sub>dq</sub>| ≤ V<sub>dc</sub>/√3. Near base speed, back-EMF uses up this headroom.</li>
<li><b>Field weakening</b>: when the voltage saturates, inject negative i<sub>d</sub> to reduce the effective flux and keep accelerating. You trade torque for speed.</li>
<li><b>Regeneration</b>: negative i<sub>q</sub> while spinning forward brakes the motor and pushes energy back into the DC link. Something must absorb it: the battery, or a brake resistor.</li>
</ul>
<div class="eq">ω<sub>e,base</sub> ≈ (V<sub>dc</sub>/√3) / λ<sub>m</sub> &nbsp;&nbsp;(ignoring R and L)</div>`,
    simNote: "This is the live drive model. Raise the speed setpoint past about 3000 rpm with field weakening off: it stalls at the voltage limit. Turn field weakening on and watch i<sub>d</sub> go negative. Drop the setpoint quickly to see regeneration (negative power).",
    quiz: [
      { q: "Negative i<sub>q</sub> while spinning forward means…", options: ["field weakening", "braking and regeneration", "reverse direction start", "a sensor fault"], answer: 1, why: "Torque opposes motion, so mechanical power turns into electrical power and flows to the DC link." },
      { q: "Field weakening injects…", options: ["positive i<sub>d</sub>", "negative i<sub>d</sub>", "more i<sub>q</sub>", "a higher switching frequency"], answer: 1, why: "Negative i<sub>d</sub> produces flux that opposes the magnet's, which lowers the back-EMF the inverter has to overcome." },
      { q: "Why add decoupling feed-forward terms?", options: ["To reduce switching loss", "To cancel the ω·L cross-coupling between the d and q axes", "To measure speed", "For SVPWM"], answer: 1, why: "Without it, a change in i<sub>q</sub> disturbs v<sub>d</sub> and the reverse, more and more as speed rises." }
    ],
    challenges: [
      { q: "V<sub>dc</sub> = 48 V, λ<sub>m</sub> = 0.01 Wb, p = 5. Ignoring R and L, what is the base speed?", answer: 5293, tol: 0.03, unit: "rpm",
        hints: ["V<sub>max</sub> = 48/√3 = 27.7 V", "ω<sub>e</sub> = V<sub>max</sub>/λ, ω<sub>m</sub> = ω<sub>e</sub>/p"], solution: "ω<sub>e</sub> = 2771 rad/s, ω<sub>m</sub> = 554 rad/s, about 5290 rpm." },
      { q: "The motor brakes at −2 N·m while spinning at 3000 rpm. How much power is regenerated, before losses?", answer: 628, tol: 0.02, unit: "W",
        hints: ["P = T·ω", "3000 rpm = 314.16 rad/s"], solution: "2 × 314.16 = 628 W." }
    ],
    debug: {
      scenario: "In the Live Lab, a step from 500 to 3000 rpm overshoots to about 3700 rpm. During the acceleration, i<sub>q</sub> sits at its 30 A limit for 200 ms.",
      options: ["Current loop bandwidth too high", "Speed PI integrator winds up while i<sub>q</sub>* is clamped at the current limit. Add anti-windup.", "Encoder offset wrong", "Dead time too large"],
      answer: 1, why: "The speed error stays large while i<sub>q</sub> is limited, so the integrator keeps charging. Try the \"Anti-windup\" toggle in the lab."
    },
    pow: "Project 3: FOC on a real gimbal or drone motor (STM32 + driver board). Show the step responses of i<sub>q</sub> and speed, and a regenerative stop, on the telemetry dashboard."
  }]
},
/* ======================================================================= */
{
  id: "embedded", code: "T05", title: "Embedded & Real-time",
  summary: "Timers, ADC sampling, ISR budgets, telemetry, and debugging a running drive.",
  rating: "ADC · ISR · CAN · Telemetry",
  lessons: [
  {
    id: "adc-sampling", level: "Basic", title: "PWM-synchronised ADC sampling", minutes: 60, sim: "adc",
    theory: `
<p>Phase current has switching ripple on top and ringing at every edge. Sampling it at the wrong moment gives noise and bias. The fix: trigger the ADC from the PWM timer at the <b>center of the PWM period</b>. There the ripple crosses its average and no switch is changing state.</p>
<div class="eq">I = (counts − offset) · V<sub>ref</sub> / 2<sup>N</sup> / (G · R<sub>shunt</sub>)</div>
<ul>
<li>Low-side shunts only see current while the low switch is on, so sample at the counter's peak or valley, inside the zero vector (000).</li>
<li>Use DMA so the CPU doesn't have to copy ADC results.</li>
<li>Calibrate the offset with PWM <b>off</b> and the motor still.</li>
<li>A 12-bit ADC has 4096 levels. Resolution in amps = V<sub>ref</sub> / 4096 / (G·R).</li>
</ul>`,
    simNote: "Slide the sample point toward a PWM edge and the measurement error grows, with ringing spikes. Center-aligned sampling hits the average.",
    quiz: [
      { q: "With center-aligned PWM, the best point to sample average current is…", options: ["at the rising edge", "at the counter peak or valley (center of the zero vector)", "randomly", "just after the falling edge"], answer: 1, why: "The triangular ripple crosses its mean there, and it is furthest from any switching edge." },
      { q: "Why use DMA for the ADC?", options: ["Higher resolution", "It moves results to memory without CPU time", "It reduces noise", "It is required for 12-bit"], answer: 1, why: "It frees the ISR to spend its time on the control maths." },
      { q: "How many levels does a 12-bit ADC have?", options: ["1024", "2048", "4096", "65536"], answer: 2, why: "2¹² = 4096." }
    ],
    challenges: [
      { q: "Shunt 1 mΩ, gain 20, V<sub>ref</sub> 3.3 V, 12-bit, offset 2048. The ADC reads 2648 counts. What is the current?", answer: 24.17, tol: 0.02, unit: "A",
        hints: ["Δcounts = 600", "V = 600 × 3.3/4096", "I = V / (20 × 0.001)"], solution: "0.4834 V / 0.02 = 24.17 A." },
      { q: "Same front end. What is the resolution in amps per count?", answer: 0.0403, tol: 0.02, unit: "A",
        hints: ["3.3/4096/(G·R)"], solution: "3.3/4096/0.02 = 0.040 A per count." }
    ],
    debug: {
      scenario: "Positive phase current reads correctly. Negative current reads as about +4,000,000 A.",
      code: `uint32_t adc    = ADC1-&gt;DR;
uint32_t offset = 2048;
uint32_t diff   = adc - offset;
float    amps   = diff * AMPS_PER_COUNT;`,
      options: ["AMPS_PER_COUNT is wrong", "Unsigned subtraction wraps when adc &lt; offset. Use int32_t.", "The ADC is 10-bit", "The offset should be 4096"],
      answer: 1, why: "In uint32_t, 2000 − 2048 wraps to 4294967248. Signed types are essential for bipolar signals."
    },
    pow: "STM32: trigger the ADC from TIM1 at the center-aligned peak (TRGO/OC4REF), move the results with DMA, and plot the raw samples showing a clean current with no edge spikes."
  },
  {
    id: "loop-timing", level: "Fundamental", title: "ISR timing budgets and jitter", minutes: 60, sim: "timing",
    theory: `
<p>A FOC current loop runs inside the PWM interrupt. At 20 kHz you have <b>50 µs</b> for ADC readout, transforms, two PIs, SVPWM and protection checks, every single period.</p>
<div class="eq">CPU load = t<sub>ISR</sub> · f<sub>PWM</sub> &nbsp;&nbsp;&nbsp; keep it below about 60–70% for headroom</div>
<ul>
<li>Priorities: current loop (highest), then protection, then speed loop (about 1 kHz), then comms and telemetry (background).</li>
<li>Never call printf, malloc or blocking I/O in the ISR.</li>
<li>Measure, don't guess: toggle a GPIO at ISR entry and exit and look at it on a scope or logic analyser. The pulse width is t<sub>ISR</sub> and its spread is the jitter.</li>
<li>If t<sub>ISR</sub> &gt; T<sub>PWM</sub>, interrupts get missed. Duty updates arrive late, the control becomes unstable and the motor screeches.</li>
</ul>`,
    simNote: "Raise the ISR time or turn on \"printf in ISR\" and watch overruns appear (red). Background work starves as the load rises.",
    quiz: [
      { q: "How long is one control period at 20 kHz PWM?", options: ["5 µs", "20 µs", "50 µs", "500 µs"], answer: 2, why: "1/20000 = 50 µs." },
      { q: "What is the most reliable way to measure ISR execution time on hardware?", options: ["printf timestamps", "Toggle a GPIO and measure it with a scope", "Count lines of code", "Guess from the clock speed"], answer: 1, why: "It is non-intrusive and shows the jitter too." },
      { q: "Where should CAN telemetry transmission run?", options: ["In the current-loop ISR", "In a low-priority task or main loop, ideally with DMA or a hardware FIFO", "In the HardFault handler", "Only at startup"], answer: 1, why: "Communication must never delay the time-critical control loop." }
    ],
    challenges: [
      { q: "The ISR takes 18 µs at 20 kHz. What is the CPU load?", answer: 36, tol: 0.01, unit: "%",
        hints: ["load = t · f"], solution: "18e-6 × 20e3 = 0.36, which is 36%." },
      { q: "The ISR takes 30 µs and you allow a 70% load. What is the maximum PWM frequency?", answer: 23.33, tol: 0.02, unit: "kHz",
        hints: ["f = 0.7 / t"], solution: "0.7 / 30e-6 = 23.3 kHz." }
    ],
    debug: {
      scenario: "The drive works until you add debug output. Then the motor screeches, the current is noisy, and the GPIO timing pin shows ISR pulses longer than the PWM period.",
      code: `void TIM1_UP_IRQHandler(void) {
    foc_step();
    printf("iq=%f\\r\\n", iq);   <span class="cm">// debug</span>
    TIM1-&gt;SR = 0;
}`,
      options: ["foc_step is too slow", "printf over UART blocks for hundreds of µs, so the ISR overruns the 50 µs period", "SR must be cleared first", "%f is unsupported"],
      answer: 1, why: "At 115200 baud, 12 characters take about 1 ms. Put samples in a ring buffer and send them from the main loop or by DMA."
    },
    pow: "Measure your FOC ISR with GPIO toggling. Report the mean, max and jitter, and show the effect of compiler -O0 against -O2 and of FPU usage."
  },
  {
    id: "telemetry-debug", level: "Advanced", title: "Telemetry and debugging a live drive", minutes: 120, sim: "focfaults",
    theory: `
<p>A running drive tells you what's wrong if you look in the right frame. Stream i<sub>d</sub>, i<sub>q</sub>, speed and voltage at a fixed rate, then look at the <b>harmonic spectrum of i<sub>q</sub></b> in multiples of the electrical frequency.</p>
<ul>
<li><b>1st harmonic</b> ripple in d-q: current sensor <b>DC offset</b>.</li>
<li><b>2nd harmonic</b>: current sensor <b>gain mismatch</b> between phases.</li>
<li><b>6th harmonic</b>: <b>dead-time</b> distortion or back-EMF harmonics.</li>
<li>Large i<sub>d</sub> with poor torque per amp: <b>angle offset</b> error.</li>
<li>Broadband chaos, no lock: wrong <b>pole-pair</b> count or wrong encoder direction.</li>
<li>Slow oscillation in speed: <b>speed-loop tuning</b>.</li>
</ul>
<div class="eq">Telemetry bandwidth = channels × bytes × rate &nbsp;&nbsp; UART 8N1: 10 bits per byte &nbsp;&nbsp; classic CAN: 8-byte payload, about 130 bits per frame</div>`,
    simNote: "Learning mode: choose a fault and study its fingerprint on the scopes and the spectrum. Then go to the Live Lab missions, where the fault is hidden.",
    quiz: [
      { q: "A current-sensor DC offset appears in i<sub>q</sub> as which harmonic?", options: ["DC", "1st", "2nd", "6th"], answer: 1, why: "A stationary-frame offset becomes a rotating vector at −ω<sub>e</sub> in the rotor frame." },
      { q: "A phase gain mismatch appears as…", options: ["1st", "2nd", "3rd", "6th"], answer: 1, why: "A gain imbalance creates a negative-sequence component, which shows up at 2·ω<sub>e</sub> in d-q." },
      { q: "What is the maximum payload of a classic CAN frame?", options: ["4 bytes", "8 bytes", "64 bytes", "256 bytes"], answer: 1, why: "Classic CAN carries 8 bytes. CAN FD extends this to 64." }
    ],
    challenges: [
      { q: "6 channels × 2 bytes at 1 kHz over UART 8N1. What is the minimum baud rate?", answer: 120000, tol: 0.01, unit: "baud",
        hints: ["Bytes/s = 6 × 2 × 1000", "8N1 sends 10 bits per byte"], solution: "12,000 B/s × 10 = 120,000 baud, so 115200 is not enough. Use 230400 or more." },
      { q: "CAN at 500 kbit/s with about 130 bits per frame. How many frames per second at most?", answer: 3846, tol: 0.02, unit: "frames/s",
        hints: ["500000 / 130"], solution: "About 3846 frames/s, before any other bus traffic." }
    ],
    debug: {
      scenario: "Your dashboard shows 21,000 rpm while a tachometer reads 3000 rpm. The motor has 7 pole pairs.",
      code: `float rpm = omega_e * 60.0f / (2.0f * PI);
telemetry_send(CH_SPEED, rpm);`,
      options: ["The tachometer is wrong", "The telemetry sends electrical speed. Mechanical rpm = ω_e / p · 60 / 2π.", "Float overflow", "Sample rate too low"],
      answer: 1, why: "21000 / 7 = 3000. Always label telemetry channels with their frame and units."
    },
    pow: "Build the telemetry bridge: STM32 → UART/USB → Python → WebSocket → browser scope. Record a fault fingerprint (for example, an offset you add on purpose) and show its spectrum."
  }]
},
/* ======================================================================= */
{
  id: "flyboard", code: "T06", title: "Flying Board Capstone",
  summary: "Thrust physics, full-scale sizing for a person-carrying board, and stability with motor failure. Simulation first.",
  rating: "Thrust · Sizing · Stability",
  lessons: [
  {
    id: "thrust-hover", level: "Basic", title: "Thrust, disc loading and hover power", minutes: 60, sim: "thrust",
    theory: `
<p>A rotor holds itself up by pushing air down. Momentum theory gives the minimum power needed to hover:</p>
<div class="eq">P<sub>ideal</sub> = T<sup>3/2</sup> / √(2·ρ·A) &nbsp;&nbsp;&nbsp; P<sub>shaft</sub> = P<sub>ideal</sub> / FM &nbsp;&nbsp;&nbsp; P<sub>elec</sub> = P<sub>shaft</sub> / η<sub>drive</sub></div>
<ul>
<li><b>Disc loading</b> T/A sets everything. Halving the disc area raises hover power by √2.</li>
<li>That is why a compact board is so hard to build: small fans need several times the power of big propellers.</li>
<li>FM (figure of merit) is about 0.6–0.75 for good propellers. η<sub>drive</sub> (motor × ESC) is about 0.8–0.9.</li>
<li>Design for a thrust-to-weight ratio of about 2. The controller needs headroom to correct attitude.</li>
<li>Efficiency in grams per watt (g/W) is highest at low throttle. Thrust stands measure exactly this.</li>
</ul>
<div class="callout">Safety: a person-carrying vehicle at roughly 20 kW and 100 V is a regulated aircraft in India (DGCA). In this track the full-size board is simulation only. You build and test hardware at small scale.</div>`,
    simNote: "Shrink the propeller diameter and watch the hover power climb. Try 8 × 30″ propellers, then 8 × 12″ fans.",
    quiz: [
      { q: "Halving the total disc area changes ideal hover power by…", options: ["×0.5", "×√2", "×2", "×4"], answer: 1, why: "P ∝ 1/√A." },
      { q: "Why aim for a thrust-to-weight ratio of about 2?", options: ["Faster climb only", "Control authority: the controller needs extra thrust to correct attitude and gusts", "Lower cost", "Regulations"], answer: 1, why: "At T/W = 1 the board can hover but has nothing left to correct with." },
      { q: "At what throttle is the g/W efficiency of a prop and motor usually best?", options: ["Low throttle", "Full throttle", "It is constant", "Only at 50%"], answer: 0, why: "Induced power grows as T<sup>1.5</sup>, so each extra gram costs more watts." }
    ],
    challenges: [
      { q: "Hover thrust 1177 N (120 kg), total disc area 3.53 m², ρ = 1.225. What is the ideal hover power?", answer: 13.73, tol: 0.03, unit: "kW",
        hints: ["T<sup>1.5</sup> = 40,380", "√(2·1.225·3.53) = 2.941"], solution: "40380 / 2.941 = 13.7 kW." },
      { q: "Electrical hover power is 23 kW for 120 kg. What is the system efficiency in g/W?", answer: 5.22, tol: 0.03, unit: "g/W",
        hints: ["120,000 g / 23,000 W"], solution: "5.2 g/W, typical for heavy multirotors." }
    ],
    debug: {
      scenario: "Your thrust stand measures 30% less thrust than the motor's datasheet. The propeller is mounted pushing air straight into the stand's flat base plate, 5 cm away.",
      options: ["The load cell is broken", "Flow blockage: the prop wash hits the plate and pushes back. Mount the prop blowing away from the stand with a clear wake.", "The battery voltage is too high", "Thrust formula wrong"],
      answer: 1, why: "Blockage and ground effect in the wake distort the measurement. Test rigs keep the wake free for several propeller diameters."
    },
    pow: "Thrust stand: load cell + HX711 + RPM + current sensor. Log thrust, power and g/W across throttle for one motor and propeller, and compare with momentum theory."
  },
  {
    id: "board-sizing", level: "Fundamental", title: "Sizing the full-scale board", minutes: 90, sim: "sizing",
    theory: `
<p>Sizing is a loop: battery mass depends on energy, energy depends on power, power depends on total mass, and total mass includes the battery. The loop must <b>converge</b>. If it diverges, the design cannot fly.</p>
<div class="eq">m<sub>total</sub> = m<sub>rider</sub> + m<sub>structure</sub> + m<sub>motors</sub> + m<sub>battery</sub>(E) &nbsp;&nbsp; E = P<sub>hover</sub>(m<sub>total</sub>) · t / (DoD · η)</div>
<ul>
<li>Pack-level energy density is about 150–200 Wh/kg for Li-ion. Cell-level figures are higher and misleading.</li>
<li>A higher bus voltage means less current for the same power. Copper loss (I²R) and cable mass fall.</li>
<li>C-rate = current / capacity. Hover at 24 kW from a 4 kWh pack is 6C, which is hard on cells.</li>
<li>Usable energy: keep 20% depth-of-discharge margin and a landing reserve.</li>
</ul>`,
    simNote: "Raise the flight time and watch the iteration table. Past a certain point the mass spiral diverges and the design cannot close.",
    quiz: [
      { q: "Why choose a higher bus voltage for a 24 kW board?", options: ["Motors spin slower", "Lower current, so less I²R loss and lighter cables", "Batteries get lighter", "It is safer to touch"], answer: 1, why: "For P = V·I, doubling V halves I and quarters the I²R loss. (High voltage is more dangerous, not safer.)" },
      { q: "A 4 kWh pack delivering 24 kW is running at…", options: ["0.17C", "4C", "6C", "24C"], answer: 2, why: "24/4 = 6C." },
      { q: "What does it mean when the sizing loop diverges?", options: ["Need a better computer", "Every kg of battery needs more than 1 kg of extra battery to lift it: the design cannot close", "Rider too light", "Nothing"], answer: 1, why: "That is the mass spiral. Fix it with more disc area, better energy density or a shorter flight time." }
    ],
    challenges: [
      { q: "4 kWh needed, pack at 170 Wh/kg. What is the battery mass?", answer: 23.5, tol: 0.02, unit: "kg",
        hints: ["4000 / 170"], solution: "23.5 kg." },
      { q: "24 kW at a 100 V bus, shared equally by 8 motors. What is the current per motor?", answer: 30, tol: 0.01, unit: "A",
        hints: ["Total current = 24000/100"], solution: "240 A total, 30 A per motor." }
    ],
    debug: {
      scenario: "Your spreadsheet predicts 12 minutes of flight, but the scale model lands with a low-voltage cutoff at 7 minutes.",
      code: `flight_time_min = pack_Wh / hover_W * 60`,
      options: ["Wrong units", "It assumes 100% usable energy at nominal voltage: no depth-of-discharge limit, no voltage sag, no drive losses, no reserve", "Hover power is too low", "Pack is too big"],
      answer: 1, why: "Real usable energy is about 80% of nominal or less. Voltage sag under high C-rate and extra power for control push the result down further."
    },
    pow: "Sizing report: full-scale board design closure for 3 propeller sizes and 2 bus voltages. Show the mass breakdown, the hover power and why you picked your design."
  },
  {
    id: "stability-failure", level: "Advanced", title: "Attitude stability and motor-out failure", minutes: 120, sim: "attitude",
    theory: `
<p>A multirotor is unstable on its own: any tilt grows. The flight controller measures the angle with an IMU and adjusts thrust differences between motors many times a second.</p>
<div class="eq">J · θ̈ = τ = Σ (ΔT<sub>i</sub> · r<sub>i</sub>) &nbsp;&nbsp;&nbsp; τ<sub>cmd</sub> = K<sub>p</sub>·(θ* − θ) − K<sub>d</sub>·θ̇</div>
<ul>
<li>The derivative term damps the motion. Too little and the board oscillates, too much and noise gets amplified.</li>
<li>Delay (IMU filtering, ESC response, propeller spin-up) eats phase margin. Large propellers spin up slowly, which limits bandwidth.</li>
<li><b>Motor-out</b>: a quad cannot keep full control after losing one motor. An octo (or coaxial X8) can, if every remaining motor has enough thrust headroom.</li>
<li>Saturation: when a motor hits 100%, the requested torque can't be delivered. Leave headroom (T/W ≈ 2).</li>
</ul>`,
    simNote: "Fail a motor while hovering. With little thrust headroom the remaining motors saturate and the board tips over. Add delay and watch the oscillation grow.",
    quiz: [
      { q: "What does the derivative term do in attitude control?", options: ["Removes steady-state error", "Adds damping", "Increases thrust", "Filters noise"], answer: 1, why: "It opposes the angular rate, which damps oscillation." },
      { q: "Adding sensor filter delay usually…", options: ["improves stability", "reduces phase margin, causing oscillation", "has no effect", "increases thrust"], answer: 1, why: "Delay adds phase lag that grows with frequency." },
      { q: "Why use 8 motors for a person-carrying vehicle?", options: ["Looks better", "Redundancy: it stays controllable after a single motor failure", "Cheaper", "Less noise"], answer: 1, why: "Losing one of 4 motors loses controllability. Losing one of 8 can be survived with headroom." }
    ],
    challenges: [
      { q: "A motor 0.6 m from the roll axis produces 30 N more than its opposite. What is the roll torque?", answer: 18, tol: 0.01, unit: "N·m",
        hints: ["τ = F·r"], solution: "30 × 0.6 = 18 N·m." },
      { q: "With J = 12 kg·m², what angular acceleration does that torque produce?", answer: 1.5, tol: 0.01, unit: "rad/s²",
        hints: ["α = τ/J"], solution: "18/12 = 1.5 rad/s²." }
    ],
    debug: {
      scenario: "After you add a heavier low-pass filter on the gyro to reduce noise, the scale board starts a growing roll oscillation at about 4 Hz.",
      options: ["Motors too weak", "The filter adds phase lag at the control bandwidth, reducing phase margin. Lower its delay, or lower Kp/raise Kd carefully.", "Battery too heavy", "Propellers reversed"],
      answer: 1, why: "Filtering always trades noise for delay. Try the delay slider in the sim to see the same instability."
    },
    pow: "Project 4: 1–1.5 kg scale board, tethered hover with a dummy payload. Log attitude and motor commands, and simulate a motor-out case for the full-scale octo design."
  }]
}
];

/* Live Lab missions: hidden faults to diagnose from the scopes. */
export const MISSIONS: Mission[] = [
  { id: "m-offset", fault: "offsetA", title: "Mystery ripple I", brief: "The customer reports a vibration whose pitch rises with speed. Run at 1500 rpm and check the i<sub>q</sub> spectrum.", answer: "Current sensor DC offset on phase A", why: "1st-order ripple in d-q is the fingerprint of a DC offset. Calibrate offsets with PWM disabled at startup." },
  { id: "m-gain", fault: "gainB", title: "Mystery ripple II", brief: "Torque ripple at twice the electrical frequency shows up at all speeds.", answer: "Phase B current sensor gain mismatch", why: "2nd-order ripple means a gain imbalance between phases. Calibrate each channel's gain or check the shunt amplifier resistors." },
  { id: "m-angle", fault: "angle", title: "Hot and weak", brief: "The motor reaches speed but runs hot and draws far more current than expected under load.", answer: "Rotor angle (encoder) offset error", why: "In the controller's misaligned frame, part of the current lands on the true d-axis and makes no torque, so you get large |I| for little torque. Redo the alignment calibration." },
  { id: "m-deadtime", fault: "deadtime", title: "Low-speed growl", brief: "At low speed the motor growls and the phase currents look flattened near zero crossings.", answer: "Uncompensated dead time", why: "Dead time produces a voltage error that changes sign with the current, which shows up as 6th-order ripple in d-q. Add dead-time compensation." },
  { id: "m-tuning", fault: "tuning", title: "Hunting speed", brief: "Speed oscillates around the setpoint and never settles.", answer: "Speed loop gains too aggressive", why: "A slow sustained oscillation in speed, with clean current spectra, points to the outer loop. Lower Kp/Ki for speed or raise the current-loop bandwidth." },
  { id: "m-windup", fault: "windup", title: "Overshoot on launch", brief: "Every hard acceleration overshoots badly, but small steps are fine.", answer: "Speed integrator windup at the current limit", why: "Overshoot only on large steps, after i<sub>q</sub> has been at its limit, means windup. Add anti-windup." },
  { id: "m-thermal", fault: "thermal", title: "Fades after a minute", brief: "The drive is strong at first, then torque fades after a minute at high load.", answer: "Cooling failure: thermal derating", why: "Winding temperature climbs past the derating threshold and the drive cuts the current limit. Check the fan or coolant path and the thermal resistance." }
];
export const DIAGNOSES: string[] = [
  "Current sensor DC offset on phase A",
  "Phase B current sensor gain mismatch",
  "Rotor angle (encoder) offset error",
  "Uncompensated dead time",
  "Speed loop gains too aggressive",
  "Speed integrator windup at the current limit",
  "Cooling failure: thermal derating",
  "DC bus voltage too low"
];
