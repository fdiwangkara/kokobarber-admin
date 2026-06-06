import { reactive } from 'vue'
import { barbers as mockBarbers, services as mockServices, appointments as mockAppointments, reviews as mockReviews, roles as mockRoles, scheduleSlots as mockSchedule, members as mockMembers } from './data/mock.js'

export const SHIFTS = {
    'Pagi': { label: 'Pagi', start: '09:00', end: '14:00' },
    'Siang': { label: 'Siang', start: '14:00', end: '19:00' },
    'Sore': { label: 'Sore', start: '17:00', end: '21:00' },
    'Full Day': { label: 'Full Day', start: '09:00', end: '21:00' },
}

export const store = reactive({
    isLoggedIn: false,
    currentUser: null,
    accounts: [
        { username: 'admin', password: 'admin123', name: 'Admin', role: 'Super Admin' },
        { username: 'rizky', password: '1234', name: 'Rizky', role: 'Barber' },
        { username: 'fajar', password: '1234', name: 'Fajar', role: 'Barber' },
        { username: 'dimas', password: '1234', name: 'Dimas', role: 'Barber' },
        { username: 'yoga', password: '1234', name: 'Yoga', role: 'Barber' },
        { username: 'sari', password: '1234', name: 'Sari', role: 'Cashier' },
    ],

    barbers: [...mockBarbers.map(b => ({ ...b }))],
    services: [...mockServices.map(s => ({ ...s }))],
    appointments: [...mockAppointments.map(a => {
        const hasReview = mockReviews.some(r => r.appointmentId === a.id)
        return { ...a, paymentMethod: a.payment === 'Lunas' ? 'Tunai' : '', receiptImage: null, rated: hasReview, discountApplied: false, discountAmount: 0, finalAmount: a.amount }
    })],
    reviews: [...mockReviews.map(r => ({ ...r }))],
    roles: [...mockRoles],
    scheduleSlots: [...mockSchedule.map(s => ({ ...s }))],
    members: [...mockMembers.map(m => ({ ...m }))],

    login(username, password) {
        const account = this.accounts.find(a => a.username === username && a.password === password)
        if (account) {
            this.isLoggedIn = true
            this.currentUser = { username: account.username, name: account.name, role: account.role }
            return true
        }
        return false
    },
    logout() { this.isLoggedIn = false; this.currentUser = null },
    isAdmin() { return this.currentUser?.role === 'Super Admin' },
    isCashier() { return this.currentUser?.role === 'Cashier' },
    isBarber() { return this.currentUser?.role === 'Barber' },
    getBarberByUsername(username) { return this.barbers.find(b => b.username === username) },
    getCurrentBarber() { return this.currentUser ? this.getBarberByUsername(this.currentUser.username) : null },

    addAccount(username, password, name, role) {
        if (this.accounts.find(a => a.username === username)) return false
        this.accounts.push({ username, password, name, role })
        return true
    },
    removeAccount(username) {
        const idx = this.accounts.findIndex(a => a.username === username && a.username !== 'admin')
        if (idx > -1) this.accounts.splice(idx, 1)
    },

    // ===== Membership =====
    addMember(name, phone) {
        const newId = this.members.length > 0 ? Math.max(...this.members.map(m => m.id)) + 1 : 1
        const joinDate = this.todayStr()
        this.members.push({ id: newId, name, phone, totalVisits: 0, joinDate })
    },
    removeMember(id) { const idx = this.members.findIndex(m => m.id === id); if (idx > -1) this.members.splice(idx, 1) },
    updateMember(id, name, phone) { const m = this.members.find(m => m.id === id); if (m) { m.name = name; m.phone = phone } },
    getMemberByName(name) { return this.members.find(m => m.name.toLowerCase() === name.toLowerCase()) },
    incrementMemberVisits(memberName) { const m = this.getMemberByName(memberName); if (m) m.totalVisits = Math.min(m.totalVisits + 1, 10) },
    getMemberDiscount(memberName) { const m = this.getMemberByName(memberName); return (m && m.totalVisits >= 10) ? 0.5 : 0 },
    resetMemberVisits(memberName) { const m = this.getMemberByName(memberName); if (m) m.totalVisits = 0 },

    // ===== Date/Time Helpers =====
    todayStr() {
        const d = new Date()
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    },
    nowTimeStr() {
        const d = new Date()
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
    },
    isDateInPast(dateStr) {
        return dateStr < this.todayStr()
    },
    isTimeSlotInPast(dateStr, timeStr) {
        if (dateStr > this.todayStr()) return false
        if (dateStr < this.todayStr()) return true
        // Same day — check if time has passed
        return timeStr <= this.nowTimeStr()
    },

    // ===== Barber Working Hours (Shift-based) =====
    getBarberShiftHours(barberName) {
        const barber = this.barbers.find(b => b.name === barberName)
        if (!barber || !barber.shift) return null
        return SHIFTS[barber.shift] || null
    },
    isBarberWorkingAtTime(barberName, timeStr) {
        const barber = this.barbers.find(b => b.name === barberName)
        if (!barber) return false
        if (!barber.shift) return true // No shift set = always available
        const shift = SHIFTS[barber.shift]
        if (!shift) return true
        return timeStr >= shift.start && timeStr < shift.end
    },

    // ===== Booking =====
    addBooking(booking) {
        const newId = this.appointments.length > 0 ? Math.max(...this.appointments.map(a => a.id)) + 1 : 1
        this.appointments.unshift({
            id: newId, ...booking,
            status: 'Menunggu', payment: 'Belum Bayar', paymentMethod: '', receiptImage: null,
            rated: false, discountApplied: false, discountAmount: 0, finalAmount: booking.amount,
        })
    },

    updateStatus(id, newStatus) {
        const apt = this.appointments.find(a => a.id === id)
        if (apt) apt.status = newStatus
    },

    cancelBooking(id) {
        const apt = this.appointments.find(a => a.id === id)
        if (apt) apt.status = 'Dibatalkan'
    },

    confirmPayment(id, method, receiptImage) {
        const apt = this.appointments.find(a => a.id === id)
        if (apt) {
            const member = this.getMemberByName(apt.customer)
            const discount = this.getMemberDiscount(apt.customer)
            if (discount > 0) {
                apt.discountApplied = true
                apt.discountAmount = Math.floor(apt.amount * discount)
                apt.finalAmount = apt.amount - apt.discountAmount
                this.resetMemberVisits(apt.customer)
            } else {
                apt.finalAmount = apt.amount
            }
            apt.payment = 'Lunas'
            apt.paymentMethod = method
            apt.receiptImage = receiptImage || null
            if (member) this.incrementMemberVisits(apt.customer)
        }
    },

    declinePayment(id) {
        const apt = this.appointments.find(a => a.id === id)
        if (apt) {
            apt.payment = 'Ditolak'
            apt.paymentMethod = ''
            apt.receiptImage = null
        }
    },

    addReview(review) {
        const newId = this.reviews.length > 0 ? Math.max(...this.reviews.map(r => r.id)) + 1 : 1
        this.reviews.unshift({ id: newId, ...review })
        const apt = this.appointments.find(a => a.id === review.appointmentId)
        if (apt) apt.rated = true
        this.recalcBarberRating(review.barber)
    },

    recalcBarberRating(barberName) {
        const barber = this.barbers.find(b => b.name === barberName)
        if (!barber) return
        const revs = this.reviews.filter(r => r.barber === barberName)
        if (revs.length > 0) {
            barber.rating = parseFloat((revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1))
            barber.totalReviews = revs.length
        }
    },

    getBookedBarbersAtSlot(date, time) {
        return this.appointments.filter(a => a.date === date && a.time === time && a.status !== 'Dibatalkan').map(a => a.barber)
    },
    getAvailableBarbersAtSlot(date, time) {
        const bookedNames = this.getBookedBarbersAtSlot(date, time)
        return this.barbers.filter(b => b.status === 'Aktif' && b.available && b.role === 'Barber' && !bookedNames.includes(b.name))
    },
    isSlotFullyBooked(date, time) {
        const active = this.barbers.filter(b => b.status === 'Aktif' && b.available && b.role === 'Barber')
        if (active.length === 0) return false
        const booked = this.getBookedBarbersAtSlot(date, time)
        return active.every(b => booked.includes(b.name))
    },
    isBarberBookedAtSlot(date, time, barberName) {
        return this.appointments.some(a => a.date === date && a.time === time && a.barber === barberName && a.status !== 'Dibatalkan')
    },

    // Export
    exportAppointmentsCSV() {
        const h = ['ID', 'Pelanggan', 'Barber', 'Layanan', 'Tanggal', 'Waktu', 'Jumlah', 'Status', 'Pembayaran', 'Metode', 'Diskon', 'Total']
        const r = this.appointments.map(a => [a.id, a.customer, a.barber, a.service, a.date, a.time, a.amount, a.status, a.payment, a.paymentMethod || '-', a.discountAmount || 0, a.finalAmount || a.amount])
        return [h, ...r].map(r => r.join(',')).join('\n')
    },
    exportBarbersCSV() {
        const h = ['ID', 'Nama', 'Telepon', 'Peran', 'Rating', 'Ulasan', 'Shift']
        const r = this.barbers.map(b => [b.id, b.name, b.phone, b.role, b.rating, b.totalReviews, b.shift || '-'])
        return [h, ...r].map(r => r.join(',')).join('\n')
    },
    exportReviewsCSV() {
        const h = ['ID', 'Pelanggan', 'Barber', 'Rating', 'Komentar', 'Tanggal']
        const r = this.reviews.map(r => [r.id, r.customer, r.barber, r.rating, `"${(r.comment || '').replace(/"/g, '""')}"`, r.date])
        return [h, ...r].map(r => r.join(',')).join('\n')
    },
    isPaidCompleted(apt) {
        return apt.status === 'Selesai' && apt.payment === 'Lunas'
    },
    needsPayment(apt) {
        return apt.status === 'Selesai' && (apt.payment === 'Belum Bayar' || apt.payment === 'Ditolak')
    },
    getPaidTransactions() {
        return this.appointments.filter(a => this.isPaidCompleted(a))
    },
    getPaymentQueue() {
        return this.appointments.filter(a => this.needsPayment(a))
    },

    exportPaymentsCSV() {
        const h = ['ID', 'Pelanggan', 'Barber', 'Layanan', 'Tanggal', 'Waktu', 'Harga', 'Diskon', 'Total', 'Metode']
        const r = this.getPaidTransactions().map(a => [a.id, a.customer, a.barber, a.service, a.date, a.time, a.amount, a.discountAmount || 0, a.finalAmount || a.amount, a.paymentMethod || '-'])
        return [h, ...r].map(r => r.join(',')).join('\n')
    },
})
