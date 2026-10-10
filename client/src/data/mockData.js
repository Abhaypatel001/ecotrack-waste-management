export const requests = [
  {
    id: "WR-1024",
    citizen: "Aarav Sharma",
    wasteType: "Plastic",
    quantity: "12 kg",
    location: "Civil Lines",
    date: "2026-10-10",
    status: "Pending",
  },
  {
    id: "WR-1023",
    citizen: "Priya Verma",
    wasteType: "Organic",
    quantity: "8 kg",
    location: "Swaroop Nagar",
    date: "2026-10-10",
    status: "Assigned",
  },
  {
    id: "WR-1022",
    citizen: "Rohan Gupta",
    wasteType: "E-waste",
    quantity: "5 kg",
    location: "Kakadeo",
    date: "2026-10-09",
    status: "In Progress",
  },
  {
    id: "WR-1021",
    citizen: "Ananya Singh",
    wasteType: "Paper",
    quantity: "15 kg",
    location: "Arya Nagar",
    date: "2026-10-09",
    status: "Completed",
  },
  {
    id: "WR-1020",
    citizen: "Vivek Mishra",
    wasteType: "Mixed",
    quantity: "10 kg",
    location: "Kidwai Nagar",
    date: "2026-10-08",
    status: "Cancelled",
  },
];

export const collectors = [
  {
    id: "COL-101",
    name: "Rahul Kumar",
    zone: "Civil Lines",
    phone: "+91 90000 00001",
    tasks: 12,
    completed: 9,
    status: "Active",
  },
  {
    id: "COL-102",
    name: "Neha Singh",
    zone: "Swaroop Nagar",
    phone: "+91 90000 00002",
    tasks: 10,
    completed: 10,
    status: "Active",
  },
  {
    id: "COL-103",
    name: "Amit Verma",
    zone: "Kakadeo",
    phone: "+91 90000 00003",
    tasks: 8,
    completed: 5,
    status: "On Leave",
  },
];

export const users = [
  {
    id: "USR-001",
    name: "Aarav Sharma",
    email: "aarav@example.com",
    role: "Citizen",
    joined: "2026-09-15",
    status: "Active",
  },
  {
    id: "USR-002",
    name: "Priya Verma",
    email: "priya@example.com",
    role: "Citizen",
    joined: "2026-09-18",
    status: "Active",
  },
  {
    id: "USR-003",
    name: "Rahul Kumar",
    email: "rahul@example.com",
    role: "Collector",
    joined: "2026-08-21",
    status: "Active",
  },
  {
    id: "USR-004",
    name: "Neha Singh",
    email: "neha@example.com",
    role: "Collector",
    joined: "2026-08-27",
    status: "Active",
  },
];

export const categories = [
  {
    id: "CAT-01",
    name: "Organic Waste",
    type: "Biodegradable",
    recyclable: false,
    color: "green",
    description: "Food scraps and garden waste",
  },
  {
    id: "CAT-02",
    name: "Plastic",
    type: "Dry Waste",
    recyclable: true,
    color: "blue",
    description: "Bottles, containers and packaging",
  },
  {
    id: "CAT-03",
    name: "Paper",
    type: "Dry Waste",
    recyclable: true,
    color: "amber",
    description: "Newspapers, cardboard and paper",
  },
  {
    id: "CAT-04",
    name: "E-waste",
    type: "Hazardous Special Waste",
    recyclable: true,
    color: "purple",
    description: "Electronics, cables and small devices",
  },
];

export const complaints = [
  {
    id: "CMP-201",
    subject: "Missed waste pickup",
    citizen: "Aarav Sharma",
    date: "2026-10-09",
    priority: "High",
    status: "Open",
  },
  {
    id: "CMP-202",
    subject: "Overflowing community bin",
    citizen: "Priya Verma",
    date: "2026-10-08",
    priority: "Medium",
    status: "In Progress",
  },
  {
    id: "CMP-203",
    subject: "Incorrect pickup schedule",
    citizen: "Rohan Gupta",
    date: "2026-10-07",
    priority: "Low",
    status: "Resolved",
  },
];

export const monthlyWaste = [
  { month: "May", collected: 320, recycled: 210 },
  { month: "Jun", collected: 380, recycled: 260 },
  { month: "Jul", collected: 350, recycled: 245 },
  { month: "Aug", collected: 430, recycled: 310 },
  { month: "Sep", collected: 410, recycled: 305 },
  { month: "Oct", collected: 480, recycled: 360 },
];

export const wasteDistribution = [
  { name: "Organic", value: 38, fill: "#16a34a" },
  { name: "Plastic", value: 24, fill: "#3b82f6" },
  { name: "Paper", value: 22, fill: "#f59e0b" },
  { name: "E-waste", value: 16, fill: "#8b5cf6" },
];