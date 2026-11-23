import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding LabLink database...");

  // Clean existing tables in reverse order of foreign keys
  await prisma.approval.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.request.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users (2 students, 2 faculty across ECE & CSE, 1 admin)
  const student1 = await prisma.user.create({
    data: {
      id: "usr-student-alex",
      name: "Alex Chen",
      email: "alex.chen@campus.edu",
      role: "STUDENT",
      department: "ECE",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      id: "usr-student-priya",
      name: "Priya Sharma",
      email: "priya.sharma@campus.edu",
      role: "STUDENT",
      department: "CSE",
    },
  });

  const faculty1 = await prisma.user.create({
    data: {
      id: "usr-faculty-miller",
      name: "Prof. David Miller",
      email: "david.miller@campus.edu",
      role: "FACULTY",
      department: "ECE",
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      id: "usr-faculty-jenkins",
      name: "Prof. Sarah Jenkins",
      email: "sarah.jenkins@campus.edu",
      role: "FACULTY",
      department: "CSE",
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: "usr-admin-office",
      name: "Campus Lab Administration",
      email: "admin@campus.edu",
      role: "ADMIN",
      department: null,
    },
  });

  console.log(`Seeded 5 users: ${student1.name}, ${student2.name}, ${faculty1.name}, ${faculty2.name}, ${admin.name}`);

  // 2. Seed Equipment across 4 departments (ECE, CSE, Mechanical, EEE)
  // ~15 items with realistic specs, single-unit scarce items + multi-unit items
  const equipments = [
    // --- ECE ---
    {
      id: "eq-ece-fpga-zynq",
      name: "Xilinx Zynq UltraScale+ MPSoC Board",
      department: "ECE",
      category: "FPGA",
      specs: JSON.stringify({
        processor: "Quad-core ARM Cortex-A53",
        logicCells: "504K",
        dspSlices: "1728",
        memory: "4GB DDR4",
        interfaces: ["PCIe Gen3", "Dual Gigabit Ethernet", "USB 3.0", "HDMI"],
        suitability: "High-throughput DSP, Neural Network Acceleration, Software Defined Radio",
      }),
      quantity: 1, // Scarce single-unit
      location: "ECE Lab 304 - Advanced Embedded Systems",
      openHoursStart: "08:00",
      openHoursEnd: "20:00",
      isActive: true,
    },
    {
      id: "eq-ece-scope-keysight",
      name: "Keysight Infiniium 4-Channel 1GHz Oscilloscope",
      department: "ECE",
      category: "Oscilloscope",
      specs: JSON.stringify({
        bandwidth: "1 GHz",
        channels: 4,
        sampleRate: "5 GSa/s",
        memoryDepth: "100 Mpts",
        probes: ["Passive 500MHz x4", "Active Differential x1"],
      }),
      quantity: 2,
      location: "ECE Lab 201 - RF & Analog Electronics",
      openHoursStart: "08:00",
      openHoursEnd: "20:00",
      isActive: true,
    },
    {
      id: "eq-ece-sdr-hackrf",
      name: "HackRF One SDR Transceiver Kit",
      department: "ECE",
      category: "Sensor Kit",
      specs: JSON.stringify({
        operatingFreq: "1 MHz to 6 GHz",
        sampleRate: "20 MSPS",
        bandwidth: "20 MHz",
        interface: "USB 2.0 High Speed",
        antennas: ["ANT500 Telescopic", "Log-Periodic directional"],
      }),
      quantity: 3,
      location: "ECE Lab 308 - Wireless Telecommunications",
      openHoursStart: "09:00",
      openHoursEnd: "18:00",
      isActive: true,
    },
    {
      id: "eq-ece-spectrum-analyzer",
      name: "Rohde & Schwarz 3.6 GHz Spectrum Analyzer",
      department: "ECE",
      category: "Oscilloscope",
      specs: JSON.stringify({
        freqRange: "9 kHz to 3.6 GHz",
        danl: "-163 dBm/Hz",
        phaseNoise: "-102 dBc/Hz @ 100 kHz offset",
        detector: ["Auto Peak", "Min Peak", "RMS"],
      }),
      quantity: 1, // Scarce
      location: "ECE Lab 205 - Microwave & Antenna Lab",
      openHoursStart: "09:00",
      openHoursEnd: "18:00",
      isActive: true,
    },

    // --- CSE ---
    {
      id: "eq-cse-fpga-de10",
      name: "Terasic DE10-Lite Altera MAX 10 FPGA",
      department: "CSE",
      category: "FPGA",
      specs: JSON.stringify({
        logicElements: "50,000",
        memory: "64MB SDRAM",
        onBoardADC: "Dual 12-bit ADC 1 MSPS",
        connectors: ["Arduino Uno R3 header", "VGA 4-bit DAC", "Accelerometer"],
        suitability: "Computer Architecture synthesis, RISC-V softcore, VLSI verification",
      }),
      quantity: 2, // Equivalent cross-department FPGA substitute!
      location: "CSE Wing B - Hardware & Systems Lab 102",
      openHoursStart: "08:00",
      openHoursEnd: "21:00",
      isActive: true,
    },
    {
      id: "eq-cse-jetson-orin",
      name: "NVIDIA Jetson AGX Orin 64GB Developer Kit",
      department: "CSE",
      category: "Workstation",
      specs: JSON.stringify({
        aiPerformance: "275 TOPS (INT8)",
        gpu: "2048-core NVIDIA Ampere with 64 Tensor Cores",
        cpu: "12-core Arm Cortex-A78AE v8.2",
        memory: "64GB 256-bit LPDDR5 204.8 GB/s",
        storage: "64GB eMMC 5.1 + 1TB NVMe SSD",
        suitability: "Edge AI vision models, Robotics simulation, Multi-camera inference",
      }),
      quantity: 1, // Scarce AI accelerator
      location: "CSE Wing A - AI & Robotics Research Lab 401",
      openHoursStart: "08:00",
      openHoursEnd: "22:00",
      isActive: true,
    },
    {
      id: "eq-cse-gpu-workstation",
      name: "Deep Learning Workstation Dual RTX 4090",
      department: "CSE",
      category: "Workstation",
      specs: JSON.stringify({
        gpu: "Dual NVIDIA GeForce RTX 4090 24GB (48GB total)",
        cpu: "AMD Threadripper PRO 5965WX 24-core",
        ram: "256GB ECC DDR4",
        nvme: "4TB PCIe Gen4 NVMe",
        os: "Ubuntu 24.04 LTS with CUDA 12.4 & PyTorch 2.4",
      }),
      quantity: 2,
      location: "CSE Wing A - High Performance Computing Lab 403",
      openHoursStart: "08:00",
      openHoursEnd: "22:00",
      isActive: true,
    },
    {
      id: "eq-cse-iot-sensor-rig",
      name: "Multi-Protocol Wireless IoT Mesh Testbed",
      department: "CSE",
      category: "Sensor Kit",
      specs: JSON.stringify({
        protocols: ["Zigbee 3.0", "BLE 5.2 Mesh", "Thread/Matter", "LoRaWAN EU868"],
        nodes: "16 battery-powered nodes with environmental sensor arrays",
        gateway: "Raspberry Pi 5 with Cellular LTE backup",
      }),
      quantity: 3,
      location: "CSE Wing B - Networking & Ubiquitous Computing Lab",
      openHoursStart: "09:00",
      openHoursEnd: "19:00",
      isActive: true,
    },

    // --- Mechanical ---
    {
      id: "eq-mech-3d-bambu",
      name: "Bambu Lab X1-Carbon Combo 3D Printer",
      department: "Mechanical",
      category: "3D Printer",
      specs: JSON.stringify({
        buildVolume: "256 x 256 x 256 mm³",
        nozzleTemp: "Up to 300°C",
        supportedFilaments: ["Carbon Fiber PET/PA", "ABS", "ASA", "PC", "TPU"],
        features: ["Dual Auto Bed Leveling", "AI Lidar first layer inspection", "Multi-Material 4-color AMS"],
      }),
      quantity: 2,
      location: "Mechanical Building - Rapid Prototyping Workshop M-110",
      openHoursStart: "08:00",
      openHoursEnd: "20:00",
      isActive: true,
    },
    {
      id: "eq-mech-stratasys",
      name: "Stratasys F370 Industrial 3D Printer",
      department: "Mechanical",
      category: "3D Printer",
      specs: JSON.stringify({
        buildSize: "355 x 254 x 355 mm",
        accuracy: "+/- 0.200 mm",
        materials: ["PLA", "ABS-M30", "ASA", "PC-ABS", "Diran 410MF07"],
        chamber: "Heated build chamber with soluble support",
      }),
      quantity: 1, // Scarce industrial printer
      location: "Mechanical Building - Advanced Manufacturing Suite M-115",
      openHoursStart: "09:00",
      openHoursEnd: "18:00",
      isActive: true,
    },
    {
      id: "eq-mech-utm-instron",
      name: "Instron 5969 Dual Column Universal Testing Machine",
      department: "Mechanical",
      category: "Workstation",
      specs: JSON.stringify({
        loadCapacity: "50 kN (11,250 lbf)",
        testSpeed: "0.001 to 1000 mm/min",
        applications: ["Tensile testing", "Compression", "3-Point Flexure", "Peel shear"],
        extensometer: "Non-contact video extensometer AVE2",
      }),
      quantity: 1, // Scarce mechanical testing
      location: "Mechanical Materials Characterization Lab M-201",
      openHoursStart: "09:00",
      openHoursEnd: "17:00",
      isActive: true,
    },
    {
      id: "eq-mech-laser-cutter",
      name: "Epilog Fusion Pro 48 CO2 Laser Cutter & Engraver",
      department: "Mechanical",
      category: "3D Printer",
      specs: JSON.stringify({
        laserWattage: "80W CO2 Laser",
        workArea: "1219 x 914 mm (48 x 36 in)",
        maxThickness: "12mm Acrylic / 10mm Plywood",
        cameraSystem: "IRIS dual overhead cameras with real-time vector alignment",
      }),
      quantity: 1,
      location: "Mechanical Building - FabLab Ground Floor",
      openHoursStart: "08:30",
      openHoursEnd: "19:00",
      isActive: true,
    },

    // --- EEE ---
    {
      id: "eq-eee-ti-c2000",
      name: "TI C2000 Delfino Dual-Core Motor Control Kit",
      department: "EEE",
      category: "Microcontroller",
      specs: JSON.stringify({
        mcu: "TMS320F28379D Dual Core 200MHz C28x CPUs with Dual CLAs",
        inverterStage: "GaN-based 48V 10A three-phase inverter board",
        feedbackSensors: ["Hall effect", "Rotary optical encoder", "Current shunt transimpedance"],
        suitability: "Field-Oriented Control (FOC), EV drivetrain, Solar Inverter MPPT",
      }),
      quantity: 2,
      location: "EEE Power Electronics & Drives Lab - Room E-102",
      openHoursStart: "08:00",
      openHoursEnd: "19:00",
      isActive: true,
    },
    {
      id: "eq-eee-grid-sim",
      name: "Regatron Regenerative 4-Quadrant AC/DC Grid Simulator",
      department: "EEE",
      category: "Workstation",
      specs: JSON.stringify({
        powerRating: "15 kVA",
        voltageRange: "0 to 300 VAC line-to-neutral",
        frequencyRange: "DC to 1000 Hz",
        features: ["Harmonics injection up to 50th order", "Low Voltage Ride Through (LVRT) simulation"],
      }),
      quantity: 1, // Scarce power hardware
      location: "EEE Smart Grid Integration Testbed - Room E-204",
      openHoursStart: "09:00",
      openHoursEnd: "17:00",
      isActive: true,
    },
    {
      id: "eq-eee-fluke-power",
      name: "Fluke 435 Series II Three-Phase Power Quality Analyzer",
      department: "EEE",
      category: "Oscilloscope",
      specs: JSON.stringify({
        voltageInputs: "4 channels up to 1000 Vrms",
        currentInputs: "4 iFlex flexible current probes up to 6000 A",
        analysis: ["Harmonics (up to 50th)", "Flicker (Pst, Plt)", "Power Inverter Efficiency", "Transients (6 kV)"],
      }),
      quantity: 2,
      location: "EEE Measurements & High Voltage Lab - Room E-105",
      openHoursStart: "08:00",
      openHoursEnd: "19:00",
      isActive: true,
    },
  ];

  for (const eq of equipments) {
    await prisma.equipment.create({ data: eq });
  }

  console.log(`Seeded ${equipments.length} equipment items across ECE, CSE, Mechanical, EEE.`);

  // 3. Pre-existing bookings and SEEDED CONFLICT SCENARIO
  // Let's create dates relative to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tomorrow 10:00 to 14:00 (Peak Slot)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const slotStartTomorrow = new Date(tomorrow);
  slotStartTomorrow.setHours(10, 0, 0, 0);
  const slotEndTomorrow = new Date(tomorrow);
  slotEndTomorrow.setHours(14, 0, 0, 0);

  // Confirmed booking on the scarce Xilinx Zynq FPGA for Student 1 (Alex Chen)
  const alexConfirmedReq = await prisma.request.create({
    data: {
      id: "req-alex-confirmed-fpga",
      studentId: student1.id,
      equipmentId: "eq-ece-fpga-zynq",
      projectTitle: "Ultra-Low Latency ECG Feature Extraction on Zynq MPSoC",
      projectDescription: "Implementing hardware pipelined Wavelet transforms for real-time arrhythmia detection on FPGA logic.",
      justification: "Requires high-throughput hardware DSP slices and ARM Cortex-A53 dual-domain synchronization for clinical deadline.",
      deadline: new Date(tomorrow.getTime() + 2 * 24 * 3600 * 1000), // 2 days later
      durationHours: 4,
      preferredStart: slotStartTomorrow,
      priorityScore: 0.88,
      status: "APPROVED",
      decisionReason: "Approved by Prof. Miller — verified capstone milestone deadline.",
    },
  });

  await prisma.booking.create({
    data: {
      id: "book-alex-fpga-confirmed",
      requestId: alexConfirmedReq.id,
      equipmentId: "eq-ece-fpga-zynq",
      start: slotStartTomorrow,
      end: slotEndTomorrow,
      status: "CONFIRMED",
    },
  });

  await prisma.approval.create({
    data: {
      id: "app-alex-fpga",
      requestId: alexConfirmedReq.id,
      facultyId: faculty1.id,
      decision: "APPROVED",
      reason: "High priority capstone milestone with impending publication submission.",
    },
  });

  // Seeded competing request: Student 2 (Priya Sharma) requesting the SAME scarce FPGA at the exact same slot!
  // Demonstrates conflict resolution engine in action!
  await prisma.request.create({
    data: {
      id: "req-priya-conflict-fpga",
      studentId: student2.id,
      equipmentId: "eq-ece-fpga-zynq",
      projectTitle: "Accelerated Transformer Attention Matrix Multiplication",
      projectDescription: "Testing quantization of scaled dot-product attention cores for sub-millisecond LLM edge inference.",
      justification: "Seeking FPGA logic cells with DSP block support for hardware benchmarking before final symposium review.",
      deadline: new Date(tomorrow.getTime() + 1 * 24 * 3600 * 1000), // Tomorrow evening
      durationHours: 4,
      preferredStart: slotStartTomorrow, // Conflicts with Alex's booking!
      priorityScore: 0.85,
      status: "PENDING",
      decisionReason: "Pending faculty evaluation. Conflicting slot detected; recommendations generated.",
    },
  });

  // Additional existing booking for Bambu 3D printer
  const printStart = new Date(tomorrow);
  printStart.setHours(14, 0, 0, 0);
  const printEnd = new Date(tomorrow);
  printEnd.setHours(18, 0, 0, 0);

  const printReq = await prisma.request.create({
    data: {
      id: "req-alex-3dprint",
      studentId: student1.id,
      equipmentId: "eq-mech-3d-bambu",
      projectTitle: "Carbon-Fiber Quadcopter Motor Mount Chassis",
      projectDescription: "Printing high-stiffness lightweight arm joints with continuous carbon fiber filament.",
      justification: "Robotics competition flight trials scheduled for Friday.",
      deadline: new Date(tomorrow.getTime() + 3 * 24 * 3600 * 1000),
      durationHours: 4,
      preferredStart: printStart,
      priorityScore: 0.75,
      status: "APPROVED",
      decisionReason: "Approved for inter-department robotics team prototype.",
    },
  });

  await prisma.booking.create({
    data: {
      id: "book-alex-3dprint",
      requestId: printReq.id,
      equipmentId: "eq-mech-3d-bambu",
      start: printStart,
      end: printEnd,
      status: "CONFIRMED",
    },
  });

  // Seed another pending request in CSE for Jetson Orin
  const orinStart = new Date(tomorrow);
  orinStart.setHours(9, 0, 0, 0);
  await prisma.request.create({
    data: {
      id: "req-priya-jetson-pending",
      studentId: student2.id,
      equipmentId: "eq-cse-jetson-orin",
      projectTitle: "Autonomous Drone SLAM & Visual Odometry",
      projectDescription: "Benchmarking stereo camera depth estimation using TensorRT on Jetson Orin.",
      justification: "Requires 275 TOPS INT8 capability for real-time ROS2 point cloud generation.",
      deadline: new Date(tomorrow.getTime() + 4 * 24 * 3600 * 1000),
      durationHours: 3,
      preferredStart: orinStart,
      priorityScore: 0.82,
      status: "PENDING",
      decisionReason: null,
    },
  });

  console.log("Database seeded successfully with users, equipment, pre-existing bookings, and conflict scenario.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
