export const barbers = [
  { id: 1, name: 'Rizky', phone: '0812-3456-7890', role: 'Barber', status: 'Aktif', rating: 4.8, totalReviews: 12, avatar: 'RZ', available: true, username: 'rizky', shift: 'Pagi', myServices: [1, 2, 3] },
  { id: 2, name: 'Fajar', phone: '0813-4567-8901', role: 'Barber', status: 'Aktif', rating: 4.5, totalReviews: 8, avatar: 'FJ', available: true, username: 'fajar', shift: 'Siang', myServices: [1, 2, 4] },
  { id: 3, name: 'Dimas', phone: '0814-5678-9012', role: 'Barber', status: 'Aktif', rating: 4.9, totalReviews: 15, avatar: 'DM', available: true, username: 'dimas', shift: 'Full Day', myServices: [1, 2, 3, 4, 5] },
  { id: 4, name: 'Yoga', phone: '0815-6789-0123', role: 'Barber', status: 'Aktif', rating: 4.3, totalReviews: 5, avatar: 'YG', available: true, username: 'yoga', shift: 'Sore', myServices: [1, 3, 5] },
  { id: 5, name: 'Sari', phone: '0816-7890-1234', role: 'Cashier', status: 'Aktif', rating: 0, totalReviews: 0, avatar: 'SR', available: true, username: 'sari', shift: '' },
]

export const services = [
  { id: 1, name: 'Potong Rambut', price: 35000, duration: 30, description: 'Potong rambut pria standar' },
  { id: 2, name: 'Cukur Jenggot', price: 20000, duration: 15, description: 'Rapikan dan bentuk jenggot' },
  { id: 3, name: 'Hair Wash', price: 25000, duration: 20, description: 'Cuci rambut dengan shampoo premium' },
  { id: 4, name: 'Hair Coloring', price: 150000, duration: 60, description: 'Pewarnaan rambut profesional' },
  { id: 5, name: 'Creambath', price: 75000, duration: 45, description: 'Perawatan rambut dengan cream nutrisi' },
]

const today = new Date()
const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d) }
const todayStr = fmt(today)

export const appointments = [
  // Hari ini
  { id: 1, customer: 'Andi', barber: 'Rizky', service: 'Potong Rambut', date: todayStr, time: '09:00', amount: 35000, status: 'Dikonfirmasi', payment: 'Belum Bayar' },
  { id: 2, customer: 'Budi', barber: 'Fajar', service: 'Hair Coloring', date: todayStr, time: '14:00', amount: 150000, status: 'Menunggu', payment: 'Belum Bayar' },
  { id: 3, customer: 'Citra', barber: 'Dimas', service: 'Creambath', date: todayStr, time: '10:00', amount: 75000, status: 'Selesai', payment: 'Lunas' },
  { id: 4, customer: 'Dewi', barber: 'Yoga', service: 'Hair Wash', date: todayStr, time: '17:30', amount: 25000, status: 'Menunggu', payment: 'Belum Bayar' },

  // Kemarin
  { id: 5, customer: 'Eko', barber: 'Rizky', service: 'Potong Rambut', date: daysAgo(1), time: '09:30', amount: 35000, status: 'Selesai', payment: 'Lunas' },
  { id: 6, customer: 'Fani', barber: 'Dimas', service: 'Cukur Jenggot', date: daysAgo(1), time: '11:00', amount: 20000, status: 'Selesai', payment: 'Lunas' },
  { id: 7, customer: 'Galih', barber: 'Fajar', service: 'Hair Coloring', date: daysAgo(1), time: '15:00', amount: 150000, status: 'Selesai', payment: 'Lunas' },

  // 2 hari lalu
  { id: 8, customer: 'Hani', barber: 'Yoga', service: 'Creambath', date: daysAgo(2), time: '18:00', amount: 75000, status: 'Selesai', payment: 'Lunas' },
  { id: 9, customer: 'Iwan', barber: 'Rizky', service: 'Hair Wash', date: daysAgo(2), time: '10:00', amount: 25000, status: 'Dibatalkan', payment: 'Belum Bayar' },
  { id: 10, customer: 'Joni', barber: 'Dimas', service: 'Potong Rambut', date: daysAgo(2), time: '13:00', amount: 35000, status: 'Selesai', payment: 'Lunas' },

  // 3 hari lalu
  { id: 11, customer: 'Kiki', barber: 'Fajar', service: 'Potong Rambut', date: daysAgo(3), time: '14:30', amount: 35000, status: 'Selesai', payment: 'Lunas' },
  { id: 12, customer: 'Lina', barber: 'Dimas', service: 'Hair Coloring', date: daysAgo(3), time: '09:00', amount: 150000, status: 'Selesai', payment: 'Ditolak' },

  // 4-6 hari lalu
  { id: 13, customer: 'Mira', barber: 'Rizky', service: 'Cukur Jenggot', date: daysAgo(4), time: '11:30', amount: 20000, status: 'Selesai', payment: 'Lunas' },
  { id: 14, customer: 'Niko', barber: 'Yoga', service: 'Potong Rambut', date: daysAgo(5), time: '17:00', amount: 35000, status: 'Selesai', payment: 'Lunas' },
  { id: 15, customer: 'Opi', barber: 'Dimas', service: 'Creambath', date: daysAgo(6), time: '15:00', amount: 75000, status: 'Selesai', payment: 'Lunas' },
]

export const reviews = [
  { id: 1, customer: 'Citra', barber: 'Dimas', rating: 5, comment: 'Mantap banget hasilnya, rapi!', date: todayStr, appointmentId: 3 },
  { id: 2, customer: 'Eko', barber: 'Rizky', rating: 5, comment: 'Cepat dan bagus seperti biasa.', date: daysAgo(1), appointmentId: 5 },
  { id: 3, customer: 'Fani', barber: 'Dimas', rating: 4, comment: 'Oke lah, lumayan rapi.', date: daysAgo(1), appointmentId: 6 },
  { id: 4, customer: 'Galih', barber: 'Fajar', rating: 5, comment: 'Warna rambutnya keren abis!', date: daysAgo(1), appointmentId: 7 },
  { id: 5, customer: 'Hani', barber: 'Yoga', rating: 4, comment: 'Creambath-nya enak, rileks.', date: daysAgo(2), appointmentId: 8 },
  { id: 6, customer: 'Joni', barber: 'Dimas', rating: 5, comment: 'Potongannya pas, sesuai request.', date: daysAgo(2), appointmentId: 10 },
  { id: 7, customer: 'Kiki', barber: 'Fajar', rating: 4, comment: 'Bagus, cuma agak lama nunggu.', date: daysAgo(3), appointmentId: 11 },
  { id: 8, customer: 'Mira', barber: 'Rizky', rating: 5, comment: 'Jenggotnya rapi banget, suka!', date: daysAgo(4), appointmentId: 13 },
  { id: 9, customer: 'Niko', barber: 'Yoga', rating: 4, comment: 'Hasilnya oke, recommended.', date: daysAgo(5), appointmentId: 14 },
  { id: 10, customer: 'Opi', barber: 'Dimas', rating: 5, comment: 'Creambath terbaik, rambut jadi lembut.', date: daysAgo(6), appointmentId: 15 },
]

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

export const members = [
  { id: 1, name: 'Andi', phone: '0821-1111-2222', totalVisits: 7, joinDate: daysAgo(60) },
  { id: 2, name: 'Citra', phone: '0822-3333-4444', totalVisits: 10, joinDate: daysAgo(90) },
  { id: 3, name: 'Eko', phone: '0823-5555-6666', totalVisits: 3, joinDate: daysAgo(30) },
  { id: 4, name: 'Hani', phone: '0824-7777-8888', totalVisits: 5, joinDate: daysAgo(45) },
  { id: 5, name: 'Lina', phone: '0825-9999-0000', totalVisits: 1, joinDate: daysAgo(14) },
]
