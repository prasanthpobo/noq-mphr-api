import type { Doctor, Token, TokenQueue, Patient, Clinic, FrontDesk, Nurse, AdminUser, ChartDay, Alert, NavGroup } from '@/types'

export const DOCTORS: Doctor[] = [
  { id: 1, code: 'A', name: 'Dr. Ananya Rao',    spec: 'General medicine', exp: '12 yrs', dept: 'OPD',       room: 'Room 1', status: 'on',    fee: 400, today: 24, week: 132, rating: 4.8, av: 'AR', tone: 'pink',   email: 'ananya.rao@noq.health',   phone: '+91 98765 43210' },
  { id: 2, code: 'B', name: 'Dr. Vikram Mehta',  spec: 'Cardiology',       exp: '18 yrs', dept: 'Cardio',    room: 'Room 4', status: 'busy',  fee: 800, today: 18, week: 96,  rating: 4.9, av: 'VM', tone: 'indigo', email: 'vikram.mehta@noq.health', phone: '+91 98765 43211' },
  { id: 3, code: 'C', name: 'Dr. Priya Iyer',    spec: 'Dermatology',      exp: '8 yrs',  dept: 'Derm',      room: 'Room 2', status: 'on',    fee: 600, today: 16, week: 88,  rating: 4.7, av: 'PI', tone: 'amber',  email: 'priya.iyer@noq.health',   phone: '+91 98765 43212' },
  { id: 4, code: 'D', name: 'Dr. Rahul Khanna',  spec: 'Pediatrics',       exp: '14 yrs', dept: 'Peds',      room: 'Room 3', status: 'leave', fee: 500, today: 0,  week: 0,   rating: 4.8, av: 'RK', tone: 'mint',   email: 'rahul.khanna@noq.health', phone: '+91 98765 43213' },
  { id: 5, code: 'E', name: 'Dr. Neha Sharma',   spec: 'Gynecology',       exp: '10 yrs', dept: 'Gyn',       room: 'Room 5', status: 'on',    fee: 700, today: 14, week: 76,  rating: 4.9, av: 'NS', tone: 'plum',   email: 'neha.sharma@noq.health',  phone: '+91 98765 43214' },
  { id: 6, code: 'F', name: 'Dr. Arjun Desai',   spec: 'Orthopedics',      exp: '16 yrs', dept: 'Ortho',     room: 'Room 6', status: 'on',    fee: 750, today: 12, week: 64,  rating: 4.6, av: 'AD', tone: 'blue',   email: 'arjun.desai@noq.health',  phone: '+91 98765 43215' },
]

export const TOKENS: Token[] = [
  { token: 'A-024', emergency: false, patient: 'Aarav Sharma',       age: '34 · M', doctor: 'Dr. Ananya Rao',   dept: 'General medicine', time: '09:30 AM', status: 'in-room',   wait: '0 min',  av: 'AS', tone: 'blue'   },
  { token: 'A-025', emergency: false, patient: 'Meera Iyer',         age: '28 · F', doctor: 'Dr. Ananya Rao',   dept: 'General medicine', time: '09:45 AM', status: 'waiting',   wait: '8 min',  av: 'MI', tone: 'pink'   },
  { token: 'E-002', emergency: true,  patient: 'Suresh Patel',       age: '52 · M', doctor: 'Dr. Vikram Mehta', dept: 'Cardiology',       time: '09:50 AM', status: 'priority',  wait: '0 min',  av: 'SP', tone: 'amber'  },
  { token: 'A-026', emergency: false, patient: 'Riya Kapoor',        age: '6 · F',  doctor: 'Dr. Rahul Khanna', dept: 'Pediatrics',       time: '10:00 AM', status: 'waiting',   wait: '14 min', av: 'RK', tone: 'mint'   },
  { token: 'B-013', emergency: false, patient: 'Karthik Nair',       age: '45 · M', doctor: 'Dr. Vikram Mehta', dept: 'Cardiology',       time: '10:15 AM', status: 'waiting',   wait: '22 min', av: 'KN', tone: 'indigo' },
  { token: 'A-027', emergency: false, patient: 'Ishaan Verma',       age: '31 · M', doctor: 'Dr. Ananya Rao',   dept: 'General medicine', time: '10:30 AM', status: 'waiting',   wait: '38 min', av: 'IV', tone: 'plum'   },
  { token: 'C-008', emergency: false, patient: 'Aanya Bhattacharya', age: '24 · F', doctor: 'Dr. Priya Iyer',   dept: 'Dermatology',      time: '10:45 AM', status: 'waiting',   wait: '46 min', av: 'AB', tone: 'amber'  },
  { token: 'A-022', emergency: false, patient: 'Rohan Singh',        age: '40 · M', doctor: 'Dr. Ananya Rao',   dept: 'General medicine', time: '08:45 AM', status: 'completed', wait: '—',      av: 'RS', tone: 'blue'   },
  { token: 'A-023', emergency: false, patient: 'Tanvi Joshi',        age: '36 · F', doctor: 'Dr. Ananya Rao',   dept: 'General medicine', time: '09:00 AM', status: 'completed', wait: '—',      av: 'TJ', tone: 'pink'   },
  { token: 'B-011', emergency: false, patient: 'Devansh Gupta',      age: '58 · M', doctor: 'Dr. Vikram Mehta', dept: 'Cardiology',       time: '08:30 AM', status: 'cancelled', wait: '—',      av: 'DG', tone: 'mint'   },
]

export const PATIENTS: Patient[] = [
  { id: 'P-1042', name: 'Aarav Sharma',      age: 34, gender: 'M', phone: '+91 98765 11001', email: 'aarav.s@email.com',   last: 'Today',       visits: 4,  bg: 'O+',  tag: 'active',    tone: 'blue'   },
  { id: 'P-1043', name: 'Meera Iyer',        age: 28, gender: 'F', phone: '+91 98765 11002', email: 'meera.i@email.com',   last: 'Today',       visits: 2,  bg: 'A+',  tag: 'active',    tone: 'pink'   },
  { id: 'P-1044', name: 'Suresh Patel',      age: 52, gender: 'M', phone: '+91 98765 11003', email: 'suresh.p@email.com',  last: 'Today',       visits: 9,  bg: 'B+',  tag: 'critical',  tone: 'amber'  },
  { id: 'P-1045', name: 'Riya Kapoor',       age: 6,  gender: 'F', phone: '+91 98765 11004', email: 'guardian@email.com',  last: 'Today',       visits: 1,  bg: 'O-',  tag: 'new',       tone: 'mint'   },
  { id: 'P-1046', name: 'Karthik Nair',      age: 45, gender: 'M', phone: '+91 98765 11005', email: 'karthik.n@email.com', last: 'Today',       visits: 6,  bg: 'AB+', tag: 'active',    tone: 'indigo' },
  { id: 'P-1047', name: 'Ishaan Verma',      age: 31, gender: 'M', phone: '+91 98765 11006', email: 'ishaan.v@email.com',  last: 'Today',       visits: 3,  bg: 'A-',  tag: 'active',    tone: 'plum'   },
  { id: 'P-1048', name: 'Aanya Bhattacharya',age: 24, gender: 'F', phone: '+91 98765 11007', email: 'aanya.b@email.com',   last: 'Today',       visits: 2,  bg: 'O+',  tag: 'active',    tone: 'amber'  },
  { id: 'P-1031', name: 'Rohan Singh',       age: 40, gender: 'M', phone: '+91 98765 11008', email: 'rohan.s@email.com',   last: '2 days ago',  visits: 8,  bg: 'B+',  tag: 'follow-up', tone: 'blue'   },
  { id: 'P-1029', name: 'Tanvi Joshi',       age: 36, gender: 'F', phone: '+91 98765 11009', email: 'tanvi.j@email.com',   last: '1 week ago',  visits: 5,  bg: 'A+',  tag: 'active',    tone: 'pink'   },
  { id: 'P-1018', name: 'Devansh Gupta',     age: 58, gender: 'M', phone: '+91 98765 11010', email: 'devansh.g@email.com', last: '3 weeks ago', visits: 12, bg: 'O+',  tag: 'follow-up', tone: 'mint'   },
]

export const CLINICS: Clinic[] = [
  { id: 'C-001', name: 'Sunshine Clinic',      area: 'Koramangala 6th',   city: 'Bengaluru', state: 'Karnataka', pincode: '560095', phone: '+91 80 4567 1100', email: 'hello@sunshine.health',  type: 'Multi-specialty', doctors: 14, rooms: 6,  status: 'active',   rating: 4.7, hours: 'Mon–Sat · 09:00–20:00', established: '2014', tone: 'blue',   logo: 'SC' },
  { id: 'C-002', name: 'Fortis Hospital',      area: 'Bannerghatta Rd',   city: 'Bengaluru', state: 'Karnataka', pincode: '560076', phone: '+91 80 6621 4444', email: 'admin@fortis.in',        type: 'Hospital',        doctors: 48, rooms: 24, status: 'active',   rating: 4.8, hours: '24×7',                 established: '2006', tone: 'indigo', logo: 'FH' },
  { id: 'C-003', name: 'Apollo Clinic',        area: 'Indiranagar',       city: 'Bengaluru', state: 'Karnataka', pincode: '560038', phone: '+91 80 4012 9090', email: 'care@apollo.com',        type: 'Multi-specialty', doctors: 22, rooms: 9,  status: 'active',   rating: 4.6, hours: 'Mon–Sun · 08:00–22:00', established: '2010', tone: 'plum',   logo: 'AC' },
  { id: 'C-004', name: 'Manipal Hospital',     area: 'HAL Old Airport',   city: 'Bengaluru', state: 'Karnataka', pincode: '560017', phone: '+91 80 2502 4444', email: 'info@manipal.in',        type: 'Hospital',        doctors: 64, rooms: 36, status: 'active',   rating: 4.9, hours: '24×7',                 established: '1991', tone: 'amber',  logo: 'MH' },
  { id: 'C-005', name: 'Cloudnine',            area: 'Jayanagar 4th Blk', city: 'Bengaluru', state: 'Karnataka', pincode: '560011', phone: '+91 80 4070 8080', email: 'reach@cloudnine.com',    type: 'Specialty',       doctors: 18, rooms: 8,  status: 'inactive', rating: 4.7, hours: 'Mon–Sat · 09:00–18:00', established: '2007', tone: 'pink',   logo: 'C9' },
  { id: 'C-006', name: 'Skin+ Clinic',         area: 'HSR Layout',        city: 'Bengaluru', state: 'Karnataka', pincode: '560102', phone: '+91 80 4567 2200', email: 'hello@skinplus.in',      type: 'Specialty',       doctors: 9,  rooms: 4,  status: 'active',   rating: 4.5, hours: 'Tue–Sun · 10:00–19:00', established: '2018', tone: 'rose',   logo: 'S+' },
  { id: 'C-007', name: 'NoQ Wellness',         area: 'Whitefield',        city: 'Bengaluru', state: 'Karnataka', pincode: '560066', phone: '+91 80 4567 3300', email: 'wellness@noq.health',    type: 'Multi-specialty', doctors: 14, rooms: 7,  status: 'active',   rating: 4.7, hours: 'Mon–Sat · 08:00–21:00', established: '2021', tone: 'mint',   logo: 'NW' },
  { id: 'C-008', name: 'Care Plus Polyclinic', area: 'Marathahalli',      city: 'Bengaluru', state: 'Karnataka', pincode: '560037', phone: '+91 80 4567 4400', email: 'desk@careplus.in',       type: 'Polyclinic',      doctors: 11, rooms: 5,  status: 'pending',  rating: 4.4, hours: 'Mon–Sun · 09:00–21:00', established: '2019', tone: 'teal',   logo: 'CP' },
]

export const FRONT_DESK: FrontDesk[] = [
  { id: 'FD-001', name: 'Reena Aggarwal',   role: 'Lead receptionist',  clinic: 'Sunshine Clinic',   shift: 'Morning · 09:00–18:00', phone: '+91 98765 00001', email: 'reena.a@noq.health',   status: 'active',   joined: '2022-03-12', av: 'RA', tone: 'blue'   },
  { id: 'FD-002', name: 'Mohit Bansal',     role: 'Receptionist',       clinic: 'Sunshine Clinic',   shift: 'Evening · 14:00–22:00', phone: '+91 98765 00002', email: 'mohit.b@noq.health',   status: 'active',   joined: '2023-07-04', av: 'MB', tone: 'indigo' },
  { id: 'FD-003', name: 'Anjali Kapoor',    role: 'Front desk admin',   clinic: 'Fortis Hospital',   shift: 'Morning · 08:00–17:00', phone: '+91 98765 00003', email: 'anjali.k@noq.health',  status: 'active',   joined: '2021-11-20', av: 'AK', tone: 'pink'   },
  { id: 'FD-004', name: 'Ravi Subramanian', role: 'Receptionist',       clinic: 'Apollo Clinic',     shift: 'Night · 22:00–06:00',   phone: '+91 98765 00004', email: 'ravi.s@noq.health',    status: 'on-leave', joined: '2023-01-15', av: 'RS', tone: 'amber'  },
  { id: 'FD-005', name: 'Pooja Naidu',      role: 'Receptionist',       clinic: 'Cloudnine',         shift: 'Morning · 09:00–18:00', phone: '+91 98765 00005', email: 'pooja.n@noq.health',   status: 'active',   joined: '2024-04-08', av: 'PN', tone: 'mint'   },
  { id: 'FD-006', name: 'Karthik Iyer',     role: 'Senior receptionist', clinic: 'Manipal Hospital', shift: 'Morning · 07:00–16:00', phone: '+91 98765 00006', email: 'karthik.i@noq.health', status: 'active',   joined: '2020-06-22', av: 'KI', tone: 'plum'   },
  { id: 'FD-007', name: 'Sneha Bhatt',      role: 'Trainee',            clinic: 'NoQ Wellness',      shift: 'Morning · 09:00–13:00', phone: '+91 98765 00007', email: 'sneha.b@noq.health',   status: 'inactive', joined: '2025-02-01', av: 'SB', tone: 'rose'   },
]

export const NURSES: Nurse[] = [
  { id: 'NR-001', name: 'Sister Mary George', role: 'Head nurse',     dept: 'ICU',          ward: 'ICU-A',      clinic: 'Sunshine Clinic',  shift: 'Morning · 07:00–15:00', phone: '+91 98765 20001', email: 'mary.g@noq.health',    status: 'active',   joined: '2018-04-12', av: 'MG', tone: 'pink'   },
  { id: 'NR-002', name: 'Anita Verma',        role: 'Charge nurse',   dept: 'Emergency',    ward: 'ER',         clinic: 'Fortis Hospital',  shift: 'Night · 22:00–06:00',   phone: '+91 98765 20002', email: 'anita.v@noq.health',   status: 'active',   joined: '2020-09-03', av: 'AV', tone: 'plum'   },
  { id: 'NR-003', name: 'Lakshmi Pillai',     role: 'Senior nurse',   dept: 'Pediatrics',   ward: 'Peds-2',     clinic: 'Cloudnine',        shift: 'Morning · 08:00–17:00', phone: '+91 98765 20003', email: 'lakshmi.p@noq.health', status: 'active',   joined: '2019-11-22', av: 'LP', tone: 'mint'   },
  { id: 'NR-004', name: 'Rohit Mishra',       role: 'Staff nurse',    dept: 'Surgery',      ward: 'OT-3',       clinic: 'Manipal Hospital', shift: 'Evening · 14:00–22:00', phone: '+91 98765 20004', email: 'rohit.m@noq.health',   status: 'on-leave', joined: '2022-06-18', av: 'RM', tone: 'blue'   },
  { id: 'NR-005', name: 'Sister Teresa Lobo', role: 'Senior nurse',   dept: 'Maternity',    ward: 'Mat-1',      clinic: 'Cloudnine',        shift: 'Rotational',           phone: '+91 98765 20005', email: 'teresa.l@noq.health',  status: 'active',   joined: '2017-01-30', av: 'TL', tone: 'rose'   },
  { id: 'NR-006', name: 'Priya Deshmukh',     role: 'Staff nurse',    dept: 'OPD',          ward: 'OPD-Ground', clinic: 'Sunshine Clinic',  shift: 'Morning · 09:00–18:00', phone: '+91 98765 20006', email: 'priya.d@noq.health',   status: 'active',   joined: '2023-08-14', av: 'PD', tone: 'amber'  },
  { id: 'NR-007', name: 'Aman Khurana',       role: 'Trainee nurse',  dept: 'General',      ward: 'Ward-5',     clinic: 'Apollo Clinic',    shift: 'Morning · 09:00–17:00', phone: '+91 98765 20007', email: 'aman.k@noq.health',    status: 'active',   joined: '2025-01-10', av: 'AK', tone: 'indigo' },
  { id: 'NR-008', name: 'Sangeetha Rao',      role: 'Charge nurse',   dept: 'Cardiology',   ward: 'Cath Lab',   clinic: 'Fortis Hospital',  shift: 'Morning · 07:00–15:00', phone: '+91 98765 20008', email: 'sangeetha.r@noq.health', status: 'inactive', joined: '2021-03-04', av: 'SR', tone: 'plum'   },
]

export const ADMIN_USERS: AdminUser[] = [
  { id: 'AU-001', name: 'Aarav Khanna',   role: 'Super admin',    scope: 'All clinics',     clinic: '—',               lastLogin: 'Today · 09:42', phone: '+91 98765 30001', email: 'aarav.k@noq.health',    status: 'active',   twoFactor: true,  joined: '2019-02-04', av: 'AK', tone: 'blue'   },
  { id: 'AU-002', name: 'Priya Sundaram', role: 'Clinic admin',   scope: 'Sunshine Clinic', clinic: 'Sunshine Clinic', lastLogin: 'Today · 08:11', phone: '+91 98765 30002', email: 'priya.s@noq.health',    status: 'active',   twoFactor: true,  joined: '2021-06-18', av: 'PS', tone: 'pink'   },
  { id: 'AU-003', name: 'Rahul Sethi',    role: 'Clinic admin',   scope: 'Fortis Hospital', clinic: 'Fortis Hospital', lastLogin: 'Yesterday',     phone: '+91 98765 30003', email: 'rahul.s@noq.health',    status: 'active',   twoFactor: true,  joined: '2020-11-23', av: 'RS', tone: 'plum'   },
  { id: 'AU-004', name: 'Neha Bansal',    role: 'Billing admin',  scope: 'All clinics',     clinic: '—',               lastLogin: 'Today · 10:22', phone: '+91 98765 30004', email: 'neha.b@noq.health',     status: 'active',   twoFactor: false, joined: '2022-03-09', av: 'NB', tone: 'amber'  },
  { id: 'AU-005', name: 'Vivek Anand',    role: 'Operations',     scope: 'North zone',      clinic: '—',               lastLogin: '2 days ago',    phone: '+91 98765 30005', email: 'vivek.a@noq.health',    status: 'active',   twoFactor: true,  joined: '2023-01-14', av: 'VA', tone: 'mint'   },
  { id: 'AU-006', name: 'Sanjana Kapoor', role: 'Compliance',     scope: 'All clinics',     clinic: '—',               lastLogin: 'Today · 07:55', phone: '+91 98765 30006', email: 'sanjana.k@noq.health',  status: 'active',   twoFactor: true,  joined: '2021-09-30', av: 'SK', tone: 'indigo' },
  { id: 'AU-007', name: 'Manish Iyer',    role: 'Reports analyst', scope: 'All clinics',    clinic: '—',               lastLogin: '5 days ago',    phone: '+91 98765 30007', email: 'manish.i@noq.health',   status: 'inactive', twoFactor: false, joined: '2024-02-12', av: 'MI', tone: 'rose'   },
  { id: 'AU-008', name: 'Divya Menon',    role: 'Clinic admin',   scope: 'Cloudnine',       clinic: 'Cloudnine',       lastLogin: 'Today · 11:08', phone: '+91 98765 30008', email: 'divya.m@noq.health',    status: 'active',   twoFactor: true,  joined: '2022-07-05', av: 'DM', tone: 'blue'   },
  { id: 'AU-009', name: 'Anil Bose',      role: 'Support admin',  scope: 'All clinics',     clinic: '—',               lastLogin: 'Today · 09:18', phone: '+91 98765 30009', email: 'anil.b@noq.health',     status: 'active',   twoFactor: true,  joined: '2023-05-22', av: 'AB', tone: 'mint'   },
  { id: 'AU-010', name: 'Kavya Pillai',   role: 'Read-only',      scope: 'All clinics',     clinic: '—',               lastLogin: '1 week ago',    phone: '+91 98765 30010', email: 'kavya.p@noq.health',    status: 'on-leave', twoFactor: true,  joined: '2024-08-19', av: 'KP', tone: 'amber'  },
]

export const TOKEN_QUEUE: TokenQueue[] = [
  { id: 'A-001', patient: 'Aarav Sharma',       patientId: 'P-1042', clinic: 'Sunshine Clinic', doctor: 'Dr. Ananya Rao',   slot: '09:00 AM', status: 'in-consultation', priority: 'normal',    pos: 1,  created: '09:02 AM', notes: '',                               av: 'AS', tone: 'blue'   },
  { id: 'A-002', patient: 'Meera Iyer',         patientId: 'P-1043', clinic: 'Sunshine Clinic', doctor: 'Dr. Ananya Rao',   slot: '09:15 AM', status: 'waiting',         priority: 'normal',    pos: 2,  created: '09:08 AM', notes: '',                               av: 'MI', tone: 'pink'   },
  { id: 'E-001', patient: 'Suresh Patel',       patientId: 'P-1044', clinic: 'Fortis Hospital', doctor: 'Dr. Vikram Mehta', slot: '09:20 AM', status: 'waiting',         priority: 'emergency', pos: 3,  created: '09:18 AM', notes: 'Chest pain — fast-track',        av: 'SP', tone: 'amber'  },
  { id: 'A-003', patient: 'Riya Kapoor',        patientId: 'P-1045', clinic: 'Sunshine Clinic', doctor: 'Dr. Rahul Khanna', slot: '09:30 AM', status: 'waiting',         priority: 'normal',    pos: 4,  created: '09:11 AM', notes: 'Guardian present',               av: 'RK', tone: 'mint'   },
  { id: 'B-001', patient: 'Karthik Nair',       patientId: 'P-1046', clinic: 'Fortis Hospital', doctor: 'Dr. Vikram Mehta', slot: '09:45 AM', status: 'waiting',         priority: 'normal',    pos: 5,  created: '09:14 AM', notes: '',                               av: 'KN', tone: 'indigo' },
  { id: 'A-004', patient: 'Ishaan Verma',       patientId: 'P-1047', clinic: 'Sunshine Clinic', doctor: 'Dr. Ananya Rao',   slot: '10:00 AM', status: 'not-visited',     priority: 'normal',    pos: 6,  created: '09:20 AM', notes: '',                               av: 'IV', tone: 'plum'   },
  { id: 'C-001', patient: 'Aanya Bhattacharya', patientId: 'P-1048', clinic: 'Apollo Clinic',   doctor: 'Dr. Priya Iyer',   slot: '10:15 AM', status: 'not-visited',     priority: 'normal',    pos: 7,  created: '09:24 AM', notes: '',                               av: 'AB', tone: 'amber'  },
  { id: 'A-005', patient: 'Rohan Singh',        patientId: 'P-1031', clinic: 'Sunshine Clinic', doctor: 'Dr. Ananya Rao',   slot: '08:30 AM', status: 'completed',       priority: 'normal',    pos: 8,  created: '08:25 AM', notes: 'Discharged with prescription',   av: 'RS', tone: 'blue'   },
  { id: 'A-006', patient: 'Tanvi Joshi',        patientId: 'P-1029', clinic: 'Sunshine Clinic', doctor: 'Dr. Ananya Rao',   slot: '08:45 AM', status: 'completed',       priority: 'normal',    pos: 9,  created: '08:42 AM', notes: '',                               av: 'TJ', tone: 'pink'   },
  { id: 'B-002', patient: 'Devansh Gupta',      patientId: 'P-1018', clinic: 'Fortis Hospital', doctor: 'Dr. Vikram Mehta', slot: '08:30 AM', status: 'cancelled',       priority: 'normal',    pos: 10, created: '08:10 AM', notes: 'Patient no-show',                av: 'DG', tone: 'mint'   },
]

export const CHART_DAYS: ChartDay[] = [
  { d: 'Mon',   tokens: 142, visits: 118 },
  { d: 'Tue',   tokens: 168, visits: 144 },
  { d: 'Wed',   tokens: 156, visits: 130 },
  { d: 'Thu',   tokens: 192, visits: 160 },
  { d: 'Fri',   tokens: 218, visits: 184 },
  { d: 'Sat',   tokens: 246, visits: 210 },
  { d: 'Today', tokens: 184, visits: 142 },
]

export const ALERTS: Alert[] = [
  { kind: 'warn',   t: 'Dr. Khanna on leave',  s: 'Pediatrics rescheduled · 6 patients notified', when: '08:12 AM' },
  { kind: 'danger', t: 'Emergency token E-002', s: 'Suresh Patel · Cardiology · priority queue',   when: '09:50 AM' },
  { kind: 'info',   t: 'Pharmacy stock low',    s: 'Amoxicillin 500mg · 12 units left',             when: '07:40 AM' },
]

export const TOKEN_FILTERS = ['All', 'Waiting', 'In room', 'Completed', 'Cancelled', 'Emergency']

export const NAV: NavGroup[] = [
  { g: 'Workspace', items: [
    { k: 'dashboard',      l: 'Admin dashboard',      ic: 'dashboard' },
    { k: 'dash-clinic',    l: 'Clinic dashboard',     ic: 'building' },
    { k: 'dash-doctor',    l: 'Doctor dashboard',     ic: 'stethoscope' },
    { k: 'dash-nurse',     l: 'Nurse dashboard',      ic: 'heart' },
    { k: 'dash-frontdesk', l: 'Front desk dashboard', ic: 'user' },
  ]},
  { g: 'Clinic', items: [
    { k: 'appointments', l: 'Appointments',  ic: 'calendar', badge: 62 },
    { k: 'live-tokens',  l: 'Live tokens',   ic: 'ticket' },
    { k: 'tokens-mgr',   l: 'Tokens',        ic: 'ticket' },
    { k: 'tokens',       l: 'Token display', ic: 'dashboard' },
  ]},
  { g: 'Manage', items: [
    { k: 'clinics',     l: 'Clinics',    ic: 'building' },
    { k: 'doctors',     l: 'Doctors',    ic: 'stethoscope' },
    { k: 'nurses',      l: 'Nurses',     ic: 'heart' },
    { k: 'frontdesk',   l: 'Front desk', ic: 'user' },
    { k: 'patients',    l: 'Patients',   ic: 'users' },
    { k: 'admin-users', l: 'Users',      ic: 'shield' },
  ]},
  { g: 'Operations', items: [
    { k: 'pharmacy', l: 'Pharmacy', ic: 'pill' },
    { k: 'lab',      l: 'Lab',      ic: 'flask' },
    { k: 'billing',  l: 'Billing',  ic: 'receipt' },
    { k: 'reports',  l: 'Reports',  ic: 'chart' },
  ]},
  { g: 'System', items: [
    { k: 'master-data', l: 'Master data', ic: 'database' },
  ]},
  { g: 'Account', items: [
    { k: 'support',  l: 'Support tickets', ic: 'lifebuoy' },
    { k: 'settings', l: 'Settings',        ic: 'settings' },
  ]},
]
