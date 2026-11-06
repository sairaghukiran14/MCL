/* Animated step-by-step explainers. Drawing code lives in lib/sim/stories.ts under the same id. */
export interface Explainer {
  id: string;
  title: string;
  summary: string;
  glyph: "motor" | "power" | "embedded" | "ev" | "drone" | "battery";
  lessons: string[];
  steps: { title: string; text: string }[];
}

export const EXPLAINERS: Explainer[] = [
  {
    id: "motor-torque", title: "How a motor turns current into motion", glyph: "motor",
    summary: "From a magnet and a wire to a rotating magnetic field, in five pictures.",
    lessons: ["em-torque", "dc-motor", "ac-phasors"],
    steps: [
      { title: "Magnets make a field", text: "Field lines run from the north pole to the south pole. That invisible field is what a motor pushes against." },
      { title: "Current in a field feels a force", text: "Put a wire carrying current in the field and it gets pushed sideways. The push is F = B·I·L: stronger field, more current or a longer wire all mean more force." },
      { title: "A loop of wire gets a twist", text: "Bend the wire into a loop. Current flows out on one side and back on the other, so one side is pushed up and the other down. That pair of forces is torque. Watch the meter: the twist reverses every half-turn." },
      { title: "Flip the current, keep turning", text: "Reverse the current exactly when the twist would reverse. Now the torque never changes sign and the loop keeps spinning. Brushes do this mechanically; an inverter does it electronically." },
      { title: "Three phases make a rotating field", text: "Three coils, fed with currents 120° apart, add up to one field that spins at constant strength. The rotor magnet simply follows it. This is how every PMSM and BLDC motor works." },
    ],
  },
  {
    id: "inverter", title: "How an inverter makes AC from a battery", glyph: "power",
    summary: "Two switches, fast timing and an inductor turn flat DC into smooth sine waves.",
    lessons: ["pwm-buck", "inverter-svpwm", "three-phase"],
    steps: [
      { title: "A battery only gives DC", text: "The battery holds a steady voltage. A motor needs alternating currents whose size and frequency we can change." },
      { title: "One switch leg makes a square wave", text: "Two switches stacked between + and −. Turn on the top one and the output sits at +V. Turn on the bottom one and it sits at 0. Never both at once." },
      { title: "PWM: vary the width", text: "Switch thousands of times a second and vary how long the top switch stays on. The average voltage follows whatever shape you want, here a sine." },
      { title: "The motor smooths it for you", text: "The winding's inductance resists fast changes, so the current follows the average and only a small ripple remains." },
      { title: "Three legs make three phases", text: "Copy the leg three times with sines 120° apart. That is a three-phase inverter, the box between every EV battery and its motor." },
    ],
  },
  {
    id: "foc", title: "How field-oriented control works", glyph: "embedded",
    summary: "Measure three currents, turn them into two steady numbers, control those, and go back.",
    lessons: ["clarke-park", "foc-fw", "pi-control"],
    steps: [
      { title: "Measure three currents", text: "The phase currents are three sines that never sit still. Controlling them directly is like aiming at a spinning target." },
      { title: "Clarke: three become two", text: "Add the three phase currents as arrows 120° apart. They make one arrow that spins in a circle. Two numbers, α and β, describe it." },
      { title: "Park: ride along with the rotor", text: "Now spin your viewpoint with the rotor. The arrow stops moving. Its two parts, id (along the magnet) and iq (90° ahead) are plain DC values." },
      { title: "Control two DC numbers", text: "A PI controller holds iq at the torque you want and id at zero. Then the maths runs backwards: inverse Park, SVPWM, and out to the switches." },
      { title: "Twenty thousand times a second", text: "The whole loop runs every PWM period. Each pass takes tens of microseconds, so the motor sees smooth, precise torque." },
    ],
  },
  {
    id: "regen", title: "How regenerative braking works", glyph: "ev",
    summary: "The motor becomes a generator and sends the car's energy back into the battery.",
    lessons: ["boost-regen", "foc-fw", "dc-link"],
    steps: [
      { title: "Driving: battery to wheels", text: "Energy flows from the battery through the inverter to the motor, which pushes the car forward." },
      { title: "Brake: the motor becomes a generator", text: "Ask for negative torque (negative iq) while the wheels still turn. The motor now resists motion and turns kinetic energy into electrical energy." },
      { title: "The bus voltage rises", text: "That energy charges the DC link and the battery. The bus voltage climbs a little while current flows backwards." },
      { title: "Battery full? Burn it off", text: "If the battery can't accept charge, a brake chopper dumps the energy into a resistor so the bus doesn't overshoot." },
      { title: "Where the energy goes", text: "Some energy is lost in the motor, inverter and battery, and some to drag. Typically well over half of the braking energy comes back. The bars are illustrative." },
    ],
  },
  {
    id: "drone", title: "How a drone stays level", glyph: "drone",
    summary: "Sense the tilt, push harder on the low side, repeat hundreds of times a second.",
    lessons: ["stability-failure", "thrust-hover", "pi-control"],
    steps: [
      { title: "Props push air down", text: "Every propeller throws air downward, and the air pushes the board up. Equal thrust on both sides keeps it level." },
      { title: "A gust tilts it", text: "Nothing in the physics brings it back. Left alone, the tilt grows and the board slides off sideways." },
      { title: "The IMU notices", text: "A gyroscope and accelerometer measure the tilt and how fast it is changing, hundreds of times a second." },
      { title: "Speed up the low side", text: "The controller raises thrust on the low side and lowers it on the high side. The board rotates back and settles." },
      { title: "Lose a motor and survive", text: "One motor stops. The others pick up its share. With enough spare thrust (T/W near 2) the board wobbles and recovers." },
    ],
  },
  {
    id: "battery", title: "How a battery pack is built", glyph: "battery",
    summary: "Cells in series add voltage, in parallel add capacity, and under load they sag and heat.",
    lessons: ["battery-pack", "board-sizing"],
    steps: [
      { title: "One cell", text: "A lithium-ion cell sits near 3.7 V and stores a few amp-hours. On its own it can't power much." },
      { title: "Series adds voltage", text: "Connect cells end to end and the voltages add. Six in series give about 22 V." },
      { title: "Parallel adds capacity", text: "Put strings side by side and the amp-hours add. The current is shared, so each cell works less hard." },
      { title: "Load makes it sag", text: "Every cell has internal resistance. Draw current and the voltage drops by I·R. More current, more sag." },
      { title: "And it gets warm", text: "That same resistance turns current into heat: P = I²R. Double the current and you get four times the heat." },
    ],
  },
];

export const findExplainer = (id: string) => EXPLAINERS.find((e) => e.id === id);
export const explainersForLesson = (lessonId: string) => EXPLAINERS.filter((e) => e.lessons.includes(lessonId));
