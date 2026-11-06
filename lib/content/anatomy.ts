/* Labelled teardowns ("anatomy" pages): exploded view, parts and functions, cross-section,
   system diagram and a step-by-step of how the machine works. The drawing for each id lives in
   components/anatomy; this file holds only the words, so it stays easy to edit. */

export type PartId = string;
export type StepIcon = "battery" | "switches" | "field" | "magnet" | "chip" | "gate" | "heat" | "wave";
export interface AnatomyGroup { id: string; label: string; tag: string; color: string }

export interface AnatomyPart {
  id: PartId;
  name: string;
  sub?: string;
  group: string;
  fn: string;
  lesson?: string;
}
export interface AnatomyStep { title: string; text: string; parts: PartId[]; icon: StepIcon; lesson?: string }
export interface Anatomy {
  id: string;
  title: string;
  short: string;
  blurb: string;
  intro: string;
  groups: AnatomyGroup[];
  live: { title: string; hint: string };
  system: { hint: string };
  parts: AnatomyPart[];
  steps: AnatomyStep[];
  takeaways: [string, string][];
  quiz: { q: string; options: string[]; answer: number; why: string }[];
  lessons: string[];
}

export const ANATOMIES: Anatomy[] = [
  {
    id: "bldc",
    title: "Inside a brushless DC motor",
    short: "BLDC teardown",
    blurb: "Exploded view of every part, a running cross-section, the full drive system and how it works step by step.",
    groups: [
      { id: "fixed", label: "Stator side · fixed", tag: "fixed", color: "#6b7078" },
      { id: "rotating", label: "Rotor side · turns", tag: "turns", color: "var(--accent)" },
    ],
    live: { title: "Cross-section, running", hint: "front view" },
    system: { hint: "click a block for its lesson" },
    intro: "A brushless DC motor swaps the brushes and commutator of a DC motor for electronics. A controller switches current through three stator windings in sequence, and a permanent-magnet rotor follows the field. No brushes to wear out means higher efficiency, longer life and less maintenance.",
    parts: [
      { id: "front-cover", name: "Front end cover", sub: "drive end", group: "fixed", fn: "Holds the front bearing, locates the shaft and bolts the motor to whatever it drives." },
      { id: "bearing", name: "Bearings", group: "fixed", fn: "Support the shaft and keep it centred, so the airgap stays even all the way round. Usually one at each end.", lesson: "motor-thermal" },
      { id: "shaft", name: "Shaft", group: "rotating", fn: "Carries the torque out to the load: a wheel, propeller, fan or gearbox.", lesson: "dc-motor" },
      { id: "stator", name: "Stator core", sub: "laminated steel", group: "fixed", fn: "Stacked thin steel sheets with teeth that carry the windings. Laminations stop eddy currents from heating the core.", lesson: "magnetic-circuit" },
      { id: "windings", name: "Windings", sub: "phases A, B, C", group: "fixed", fn: "Copper coils on the stator teeth, in three phases. Current through them turns each tooth into an electromagnet.", lesson: "three-phase" },
      { id: "rotor", name: "Rotor", sub: "permanent magnets", group: "rotating", fn: "A steel core carrying alternating N and S magnets. It is pulled round by the stator's rotating field and produces torque.", lesson: "em-torque" },
      { id: "housing", name: "Housing", sub: "frame", group: "fixed", fn: "Holds the stator, takes the reaction torque, and spreads heat from the windings out through its fins.", lesson: "motor-thermal" },
      { id: "sensor", name: "Position sensor", sub: "Hall sensors or encoder", group: "fixed", fn: "Reads where the rotor magnets are and tells the controller which phases to switch next.", lesson: "bldc-sixstep" },
      { id: "end-cover", name: "Rear end cover", group: "fixed", fn: "Closes the motor, holds the rear bearing and the sensor board, and keeps everything aligned." },
    ],
    steps: [
      { title: "DC in", text: "A battery or DC bus feeds the controller. The motor itself never sees DC.", parts: [], icon: "battery", lesson: "battery-pack" },
      { title: "Electronic commutation", text: "Six MOSFETs in the inverter switch the three phases on and off in sequence: six-step blocks, or smooth sine-shaped PWM.", parts: ["windings"], icon: "switches", lesson: "bldc-sixstep" },
      { title: "Rotating field", text: "The phase currents turn stator teeth into N and S poles. As the sequence advances, that pattern of poles moves round the stator.", parts: ["stator", "windings"], icon: "field", lesson: "three-phase" },
      { title: "Rotor follows", text: "The permanent magnets are pulled towards the moving poles, so the rotor and shaft turn and deliver torque.", parts: ["rotor", "shaft"], icon: "magnet", lesson: "em-torque" },
      { title: "Feedback", text: "The position sensor reports the rotor angle, so the controller always energises the phases that pull hardest in the right direction.", parts: ["sensor"], icon: "chip", lesson: "clarke-park" },
    ],
    takeaways: [
      ["No brushes", "nothing rubs on the rotor, so less wear, less sparking and a longer life"],
      ["Electronic commutation", "an inverter does the switching that brushes used to do"],
      ["Permanent-magnet rotor", "no rotor current, so higher efficiency and more torque per kilogram"],
      ["Needs a controller", "it cannot run from DC alone: something must switch the phases and know the rotor angle"],
      ["Everywhere", "EVs, e-bikes, drones, fans, pumps, robots and industrial drives"],
    ],
    quiz: [
      { q: "In a BLDC motor, which part carries the permanent magnets?", options: ["The stator", "The rotor", "The housing", "The end cover"], answer: 1, why: "The magnets spin with the rotor. The windings sit on the stationary stator, so no brushes are needed to reach them." },
      { q: "What replaces the brushes and commutator?", options: ["A gearbox", "A bigger magnet", "The controller's inverter, switching the phases electronically", "Slip rings"], answer: 2, why: "The inverter switches the three phases in sequence, using the position sensor to know when." },
      { q: "Why is the stator made of thin laminations rather than solid steel?", options: ["It is cheaper to cut", "To cut eddy-current losses in the core", "To make the motor lighter", "To hold the windings better"], answer: 1, why: "A changing field induces circulating currents in solid steel. Thin insulated sheets break those loops and cut the heat they cause." },
    ],
    lessons: ["bldc-sixstep", "em-torque", "three-phase", "magnetic-circuit", "pmsm-dq"],
  },
  {
    id: "inverter",
    title: "Inside a motor inverter",
    short: "Inverter teardown",
    blurb: "Every layer of a 48 V three-phase motor controller, live switching states, the control and power paths, and how DC becomes three-phase AC.",
    intro: "A motor inverter turns the battery's DC into three-phase AC of whatever voltage and frequency the motor needs. Six power switches chop the DC bus thousands of times a second, a microcontroller decides when, and a heatsink carries away the losses. This one is a typical 48 V, 60 A controller of the kind used in e-bikes, scooters and small EVs.",
    groups: [
      { id: "power", label: "Power path · high current", tag: "power", color: "var(--accent)" },
      { id: "control", label: "Control · low voltage", tag: "control", color: "var(--ph-b)" },
      { id: "thermal", label: "Housing and cooling", tag: "cooling", color: "#6b7078" },
    ],
    live: { title: "Switching states, live", hint: "six MOSFETs, eight states" },
    system: { hint: "power path in ink, signals in colour" },
    parts: [
      { id: "lid", name: "Enclosure lid", sub: "die-cast aluminium", group: "thermal", fn: "Seals out water and dust, shields the electronics from the motor's switching noise, and adds a second path for heat." },
      { id: "control", name: "Control board", sub: "microcontroller", group: "control", fn: "Runs field-oriented control 20,000 times a second: reads currents and rotor angle, works out the voltages, and sets six PWM duty cycles. Also talks CAN to the vehicle.", lesson: "foc-fw" },
      { id: "gate", name: "Gate drivers", sub: "one per half-bridge", group: "control", fn: "Turn the microcontroller's 3.3 V logic into 12 V gate pulses strong enough to switch big MOSFETs in tens of nanoseconds, and insert dead time so the two switches of a leg never conduct together.", lesson: "mosfet-losses" },
      { id: "caps", name: "DC-link capacitors", sub: "electrolytic bank", group: "power", fn: "Sit right beside the switches and supply the fast pulses of current the battery cables are too inductive to deliver. They hold the bus voltage steady.", lesson: "dc-link" },
      { id: "mosfets", name: "Power stage", sub: "6 MOSFETs, 3 half-bridges", group: "power", fn: "Three legs of two switches each. Every leg connects its motor phase to either the positive or negative bus, so the average voltage on each phase follows the duty cycle.", lesson: "inverter-svpwm" },
      { id: "shunts", name: "Current sensors", sub: "shunt resistors", group: "power", fn: "Milliohm resistors in the low side of each leg. An amplifier turns their tiny voltage into a signal the ADC samples in the middle of every PWM period.", lesson: "adc-sampling" },
      { id: "terminals", name: "Power terminals", sub: "B+, B−, U, V, W", group: "power", fn: "Heavy studs for the battery leads and the three motor phases. At 60 A, a loose terminal turns into a heater." },
      { id: "pad", name: "Thermal interface", sub: "insulating pad", group: "thermal", fn: "A thin pad that conducts heat but not electricity, so the MOSFETs can sit on the heatsink without shorting to it.", lesson: "motor-thermal" },
      { id: "heatsink", name: "Heatsink baseplate", sub: "finned aluminium", group: "thermal", fn: "Takes the conduction and switching losses from the MOSFETs and spreads them to air through its fins.", lesson: "mosfet-losses" },
    ],
    steps: [
      { title: "DC bus in", text: "The battery connects to B+ and B−. The DC-link capacitors hold the bus steady and supply each fast switching pulse locally.", parts: ["terminals", "caps"], icon: "battery", lesson: "dc-link" },
      { title: "Control decides", text: "The microcontroller samples the phase currents and rotor angle, runs FOC, and sets three duty cycles for the next 50 µs.", parts: ["control", "shunts"], icon: "chip", lesson: "foc-fw" },
      { title: "Gates driven", text: "Gate drivers boost the PWM signals to 12 V, with a bootstrap supply for the high side and a few hundred nanoseconds of dead time.", parts: ["gate"], icon: "gate", lesson: "mosfet-losses" },
      { title: "Switches build AC", text: "Each leg flips between the bus rails at 20 kHz. The motor's inductance averages the pulses, so the currents come out as smooth sine waves.", parts: ["mosfets", "terminals"], icon: "wave", lesson: "inverter-svpwm" },
      { title: "Heat goes out", text: "A few percent of the power is lost in the switches. It flows through the thermal pad into the heatsink and away.", parts: ["mosfets", "pad", "heatsink"], icon: "heat", lesson: "mosfet-losses" },
    ],
    takeaways: [
      ["Six switches, three legs", "each leg ties one motor phase to the positive or negative rail"],
      ["PWM makes the voltage", "the average of fast on-off pulses sets each phase voltage, and SVPWM gets 15% more out of the bus"],
      ["Capacitors must sit close", "the DC-link bank supplies the switching current, so loop inductance must be tiny"],
      ["Dead time is mandatory", "both switches of a leg on at once short the battery (shoot-through)"],
      ["Heat sets the rating", "the current an inverter can deliver is decided by MOSFET junction temperature, not the silicon alone"],
    ],
    quiz: [
      { q: "Why must the DC-link capacitors be mounted right next to the MOSFETs?", options: ["To keep them cool", "To keep the switching current loop's inductance small, so voltage spikes stay low", "Because the battery cables are too thin", "So the lid fits"], answer: 1, why: "Every switching edge draws a fast pulse of current. Any inductance in that loop turns the pulse into a voltage spike across the switches." },
      { q: "In switching state 100, which switches are on?", options: ["All three upper switches", "Upper A, lower B and lower C", "Lower A, upper B and upper C", "None"], answer: 1, why: "Each digit is one leg: 1 means the upper switch is on, 0 the lower. Current flows into phase A and back out through B and C." },
      { q: "What does the thermal pad have to do?", options: ["Conduct heat and electricity", "Conduct heat but insulate electrically", "Insulate heat", "Absorb vibration only"], answer: 1, why: "MOSFET tabs are often connected to the drain, at bus voltage. The pad passes heat to the grounded heatsink without shorting them." },
    ],
    lessons: ["inverter-svpwm", "mosfet-losses", "dc-link", "pwm-buck", "adc-sampling"],
  },
  {
    id: "drone",
    title: "Inside a drone's flight stack",
    short: "Drone teardown",
    blurb: "Exploded view of a quadcopter's flight stack — battery, ESCs, flight controller and receiver — with a live mixer showing how four spinning props steer it.",
    intro: "A multirotor has no rudder, ailerons or any moving control surface. It flies entirely by changing how fast four propellers spin. A flight controller reads a gyroscope and accelerometer hundreds of times a second, mixes the pilot's commands into four throttle values, and an ESC drives each brushless motor to match. Here is the whole stack, from the LiPo pack down to the props.",
    groups: [
      { id: "frame", label: "Airframe · holds it together", tag: "frame", color: "#6b7078" },
      { id: "power", label: "Power path · high current", tag: "power", color: "var(--accent)" },
      { id: "control", label: "Control · low voltage", tag: "control", color: "var(--ph-b)" },
    ],
    live: { title: "Quad mixer, live", hint: "throttle, pitch, roll, yaw" },
    system: { hint: "power path in ink, signals in colour" },
    parts: [
      { id: "battery", name: "LiPo battery", sub: "4S flight pack", group: "power", fn: "Stores the energy for the whole flight and delivers it in big bursts. Its voltage sags under the current of a hard climb, and that sag usually caps performance before the motors do.", lesson: "battery-pack" },
      { id: "esc", name: "4-in-1 ESC", sub: "four inverters", group: "power", fn: "Four brushless speed controllers on one board. Each is a tiny three-phase inverter: it takes a throttle command and switches its motor's phases to hit that speed.", lesson: "inverter-svpwm" },
      { id: "fc", name: "Flight controller", sub: "the brain", group: "control", fn: "Runs the flight loop hundreds of times a second: read the IMU, compare with the pilot's command, mix the correction into four motor throttles, send them to the ESCs.", lesson: "stability-failure" },
      { id: "imu", name: "IMU", sub: "gyro + accelerometer", group: "control", fn: "A gyroscope measures how fast the craft is rotating; an accelerometer senses which way is down. Together they tell the controller its attitude every loop.", lesson: "loop-timing" },
      { id: "rx", name: "Radio receiver", sub: "pilot link", group: "control", fn: "Decodes the stick positions the pilot's transmitter sends and hands them to the flight controller as throttle, pitch, roll and yaw demands.", lesson: "telemetry-debug" },
      { id: "gps", name: "GPS & compass", sub: "position hold", group: "control", fn: "Fixes where the craft is and which way it points, so the controller can hold position, return home or fly a route. Optional on a racing quad, essential on a camera drone.", lesson: "sensor-fusion" },
      { id: "frame", name: "Frame & arms", sub: "carbon fibre", group: "frame", fn: "A stiff, light cross that spaces the four motors out and carries every landing load and vibration back to the stack in the middle.", lesson: "board-sizing" },
      { id: "motors", name: "Motors", sub: "four outrunner BLDC", group: "frame", fn: "One brushless motor per arm. The magnets are in the spinning outer bell, so it makes high torque at low speed — just what a propeller wants.", lesson: "bldc-sixstep" },
      { id: "props", name: "Propellers", sub: "two CW, two CCW", group: "frame", fn: "Turn shaft power into thrust. Diagonally opposite props spin the same way and adjacent ones oppose, so their reaction torques cancel and the craft holds heading.", lesson: "thrust-hover" },
    ],
    steps: [
      { title: "Battery feeds the stack", text: "The LiPo supplies the ESC board directly and, through a small regulator, the 5 V logic that runs the flight controller and receiver.", parts: ["battery", "esc"], icon: "battery", lesson: "battery-pack" },
      { title: "Pilot commands arrive", text: "The receiver decodes the transmitter's stick positions into throttle, pitch, roll and yaw demands and passes them to the flight controller.", parts: ["rx"], icon: "wave", lesson: "telemetry-debug" },
      { title: "Controller reads attitude", text: "The IMU reports rotation rate and the down direction. The flight loop compares the craft's actual attitude with what the pilot asked for.", parts: ["fc", "imu"], icon: "chip", lesson: "stability-failure" },
      { title: "Mix into four throttles", text: "One correction becomes four motor commands: to pitch forward, slow the front pair and speed the rear; to yaw, unbalance the two spin directions. The ESCs drive the motors to match.", parts: ["esc"], icon: "switches", lesson: "pi-control" },
      { title: "Props make thrust", text: "Each motor spins its propeller, turning electrical power into the thrust and torque that lift the craft and turn it. Faster props on one side tilt it that way.", parts: ["motors", "props"], icon: "field", lesson: "thrust-hover" },
    ],
    takeaways: [
      ["Four motor teardowns in one", "every arm is a brushless motor driven by its own ESC channel, the same inverter you met earlier, shrunk four to a board"],
      ["The flight controller is the brain", "an IMU-fed loop corrects attitude hundreds of times a second, far faster than a pilot could"],
      ["Mixing, not steering", "there is no rudder — pitch, roll and yaw all come from speeding some props up and slowing others down"],
      ["Opposite spins cancel torque", "two props turn each way so the craft holds heading; unbalancing them on purpose is exactly how it yaws"],
      ["Battery sag sets the limit", "under the current of a hard climb a LiPo's voltage drops, and that, not the silicon, usually caps what the craft can do"],
    ],
    quiz: [
      { q: "How does a quadcopter yaw (turn to face a new direction)?", options: ["It banks the whole frame over", "It speeds up one diagonal pair of motors and slows the other, so the reaction torques no longer cancel", "It speeds up all four motors equally", "It deflects a small rudder in the prop wash"], answer: 1, why: "Each prop pushes back on the frame with a reaction torque. Letting the two same-spinning motors dominate leaves a net torque that rotates the craft — no moving surface needed." },
      { q: "Why do adjacent propellers spin in opposite directions?", options: ["It looks balanced", "So their reaction torques cancel and the craft doesn't spin on its own", "To cool the motors", "To push more air downward"], answer: 1, why: "A spinning prop twists the frame the opposite way. Pairing clockwise and counter-clockwise props cancels that twist, leaving the craft free to hold a heading." },
      { q: "What does the IMU give the flight controller?", options: ["The battery voltage", "GPS coordinates", "How fast the craft is rotating and which way is down", "The motor temperatures"], answer: 2, why: "The gyroscope measures rotation rate and the accelerometer senses gravity. Together they define the craft's attitude, which the loop corrects every pass." },
    ],
    lessons: ["thrust-hover", "stability-failure", "bldc-sixstep", "battery-pack", "pi-control", "motor-constants"],
  },
];

export const findAnatomy = (id: string) => ANATOMIES.find((a) => a.id === id);
export const anatomiesForLesson = (lessonId: string) => ANATOMIES.filter((a) => a.lessons.includes(lessonId));
