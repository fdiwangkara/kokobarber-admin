export const barbers = []

export const services = []

export const appointments = []

export const reviews = []

export const roles = [
  { id: 1, name: 'Super Admin', permissions: ['manage_barbers', 'manage_services', 'manage_schedule', 'manage_booking', 'manage_payment', 'manage_roles', 'view_ratings', 'manage_members'], description: 'Akses penuh ke semua fitur' },
  { id: 2, name: 'Barber', permissions: ['view_schedule', 'view_booking'], description: 'Lihat jadwal dan booking sendiri' },
  { id: 3, name: 'Cashier', permissions: ['manage_booking', 'manage_payment', 'view_schedule', 'view_members'], description: 'Kelola booking dan pembayaran' },
]

export const scheduleSlots = [
  { day: 'Senin', open: true, hours: '09:00 - 21:00' },
  { day: 'Selasa', open: true, hours: '09:00 - 21:00' },
  { day: 'Rabu', open: true, hours: '09:00 - 21:00' },
  { day: 'Kamis', open: true, hours: '09:00 - 21:00' },
  { day: 'Jumat', open: true, hours: '09:00 - 17:00' },
  { day: 'Sabtu', open: true, hours: '10:00 - 22:00' },
  { day: 'Minggu', open: false, hours: '-' },
]

export const members = []
