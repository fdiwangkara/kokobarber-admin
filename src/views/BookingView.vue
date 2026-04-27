<template>
  <div>
    <div class="grid-2 mb-24" v-if="!store.isBarber()">
      <!-- Form Booking -->
      <div class="card">
        <div class="card-header"><h3>Buat Booking Baru</h3></div>
        <div class="form-group">
          <label>Nama Pelanggan</label>
          <div class="customer-select-wrap">
            <select v-model="form.customerType" class="customer-type-select">
              <option value="member">Member</option>
              <option value="nonmember">Non-Member</option>
            </select>
            <select v-if="form.customerType === 'member'" v-model="form.customer" @change="checkMember" class="customer-input">
              <option value="">-- Pilih Member --</option>
              <option v-for="m in store.members" :key="m.id" :value="m.name">{{ m.name }} ({{ m.totalVisits }}/10)</option>
            </select>
            <input v-else v-model="form.customer" placeholder="Nama pelanggan" class="customer-input" />
          </div>
          <div v-if="customerMember" class="member-indicator mt-8">
            <span class="badge badge-member"><Icon icon="mdi:card-account-details-star-outline" width="12" style="vertical-align: -1px;" /> Member</span>
            <span class="text-sm text-muted" style="margin-left: 6px;">
              Kunjungan: {{ customerMember.totalVisits }}/10
              <span v-if="customerMember.totalVisits >= 10" style="color: var(--gold-dark); font-weight: 600;"> — 🎉 Diskon 50% tersedia!</span>
              <span v-else> — {{ 10 - customerMember.totalVisits }} lagi untuk diskon</span>
            </span>
          </div>
        </div>
        <div class="form-group">
          <label>Tanggal</label>
          <input type="date" v-model="form.date" :min="minDate" @change="onDateChange" />
          <p v-if="form.date && store.isDateInPast(form.date)" class="text-sm mt-8" style="color: #b02a2a;">Tanggal tidak boleh di masa lalu.</p>
        </div>
        <div class="form-group">
          <label>Pilih Barber</label>
          <select v-model="form.barber" @change="onBarberChange">
            <option value="">-- Pilih barber --</option>
            <option v-for="b in activeBarbers" :key="b.id" :value="b.name">
              {{ b.name }}
              <template v-if="b.workStart && b.workEnd"> ({{ b.workStart }}-{{ b.workEnd }})</template>
            </option>
          </select>
          <p class="text-sm text-muted mt-8" v-if="store.barbers.length === 0">Belum ada barber terdaftar.</p>
          <p v-if="form.barber && selectedBarberHours" class="text-sm mt-8" style="color: var(--maroon);">
            <Icon icon="mdi:clock-outline" width="12" style="vertical-align: -1px;" />
            Jam kerja: {{ selectedBarberHours }}
          </p>
        </div>
        <div class="form-group">
          <label>Waktu</label>
          <select v-model="form.time" :disabled="!form.date || !form.barber">
            <option value="">-- Pilih waktu --</option>
            <option v-for="t in timeSlots" :key="t" :value="t" :disabled="isTimeUnavailable(t)">
              {{ t }}{{ getTimeLabel(t) }}
            </option>
          </select>
          <p class="text-sm mt-8" style="color: #b02a2a;" v-if="form.date && form.barber && availableTimeCount === 0">
            Tidak ada waktu tersedia untuk barber ini pada tanggal tersebut.
          </p>
        </div>
        <div class="form-group">
          <label>Pilih Layanan</label>
          <select v-model="form.service" @change="updatePrice" :disabled="!form.barber">
            <option value="">-- Pilih layanan --</option>
            <option v-for="s in availableServices" :key="s.id" :value="s.name">{{ s.name }} — {{ formatCurrency(s.price) }}</option>
          </select>
          <p class="text-sm mt-8" style="color: #b02a2a;" v-if="form.barber && availableServices.length === 0">
            Barber ini belum mengatur layanan yang dikuasai.
          </p>
        </div>

        <div class="booking-summary" v-if="form.service && form.barber">
          <div class="summary-row"><span>Barber</span><span>{{ form.barber }}</span></div>
          <div class="summary-row"><span>Layanan</span><span>{{ form.service }}</span></div>
          <div class="summary-row"><span>Harga</span><strong class="text-maroon">{{ formatCurrency(selectedPrice) }}</strong></div>
          <div v-if="customerMember && customerMember.totalVisits >= 10" class="discount-banner mt-8" style="margin-bottom: 0;">
            <span class="discount-icon">🎉</span>
            <div class="discount-info">
              <div class="discount-title">Diskon Member 50% diterapkan saat pembayaran</div>
              <div class="discount-desc">Estimasi bayar: {{ formatCurrency(Math.floor(selectedPrice * 0.5)) }}</div>
            </div>
          </div>
        </div>

        <p v-if="formError" class="text-sm mt-8" style="color: #b02a2a;">{{ formError }}</p>
        <div class="form-actions">
          <button class="btn btn-primary" @click="createBooking" :disabled="!formValid">
            <Icon icon="mdi:check" width="16" /> Konfirmasi Booking
          </button>
        </div>
      </div>

      <!-- Status Pembayaran -->
      <div class="card">
        <div class="card-header"><h3>Status Pembayaran</h3></div>
        <div class="payment-stats">
          <div class="payment-stat">
            <div class="stat-label">Belum Bayar</div>
            <div class="stat-value" style="color: #a67a00;">{{ unpaidCount }}</div>
            <div class="stat-sub">{{ formatCurrency(unpaidTotal) }}</div>
          </div>
          <div class="payment-stat">
            <div class="stat-label">Sudah Lunas</div>
            <div class="stat-value" style="color: #1a7a3a;">{{ paidCount }}</div>
            <div class="stat-sub">{{ formatCurrency(paidTotal) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabel Booking -->
    <div class="card">
      <div class="card-header">
        <h3>Daftar Booking</h3>
        <div class="flex-gap">
          <select v-model="filterStatus" style="padding: 6px 10px; font-size: 0.8125rem;">
            <option value="">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Dikonfirmasi">Dikonfirmasi</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
          <div class="export-dropdown" v-if="store.appointments.length > 0">
            <button class="btn btn-secondary btn-sm" @click="showExportMenu = !showExportMenu">
              <Icon icon="mdi:download-outline" width="14" /> Ekspor
            </button>
            <div class="dropdown-menu" v-if="showExportMenu">
              <button @click="exportCSV('appointments')"><Icon icon="mdi:file-delimited-outline" width="14" /> Booking (CSV)</button>
              <button @click="exportCSV('barbers')"><Icon icon="mdi:file-delimited-outline" width="14" /> Akun (CSV)</button>
              <button @click="exportCSV('reviews')"><Icon icon="mdi:file-delimited-outline" width="14" /> Ulasan (CSV)</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="filteredBookings.length === 0" class="empty-state">
        <div class="empty-icon"><Icon icon="mdi:clipboard-text-outline" width="36" /></div>
        <p>Belum ada booking.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Pelanggan</th>
            <th>Barber</th>
            <th>Layanan</th>
            <th>Tanggal</th>
            <th>Waktu</th>
            <th>Jumlah</th>
            <th>Status</th>
            <th>Pembayaran</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="apt in filteredBookings" :key="apt.id">
            <td>
              <div class="flex-gap">
                <span style="font-weight: 500;">{{ apt.customer }}</span>
                <span v-if="isMember(apt.customer)" class="badge badge-member" style="font-size: 0.6rem; padding: 1px 6px;">M</span>
              </div>
            </td>
            <td>{{ apt.barber }}</td>
            <td>{{ apt.service }}</td>
            <td>{{ apt.date }}</td>
            <td>{{ apt.time }}</td>
            <td>
              <span v-if="apt.discountApplied">
                <span class="price-original">{{ formatCurrency(apt.amount) }}</span><br/>
                <strong class="text-maroon">{{ formatCurrency(apt.finalAmount) }}</strong>
              </span>
              <span v-else>{{ formatCurrency(apt.amount) }}</span>
            </td>
            <td><span :class="'badge badge-' + statusClass(apt.status)">{{ apt.status }}</span></td>
            <td>
              <span :class="'badge badge-' + paymentClass(apt.payment)">{{ apt.payment }}</span>
              <span v-if="apt.paymentMethod" class="text-sm text-muted" style="margin-left: 4px;">({{ apt.paymentMethod }})</span>
              <span v-if="apt.discountApplied" class="text-sm" style="color: var(--gold-dark); margin-left: 4px;">-50%</span>
            </td>
            <td class="text-right">
              <div class="action-btns">
                <button class="btn-icon" @click="openDetailModal(apt)" title="Detail"><Icon icon="mdi:eye-outline" width="15" /></button>
                <!-- Cancel button for Menunggu or Dikonfirmasi -->
                <button v-if="apt.status === 'Menunggu' || apt.status === 'Dikonfirmasi'" class="btn btn-sm" style="background:#fde8e8;color:#b02a2a;" @click="openCancelConfirm(apt)">
                  <Icon icon="mdi:close" width="13" /> Batal
                </button>
                <button v-if="apt.status === 'Menunggu'" class="btn btn-secondary btn-sm" @click="openConfirmAction(apt, 'Dikonfirmasi')">Konfirmasi</button>
                <button v-if="apt.status === 'Dikonfirmasi'" class="btn btn-secondary btn-sm" @click="openConfirmAction(apt, 'Selesai')">Selesai</button>
                <button v-if="apt.status === 'Selesai' && apt.payment === 'Belum Bayar'" class="btn btn-primary btn-sm" @click="openPaymentModal(apt)">
                  <Icon icon="mdi:cash-register" width="13" /> Bayar
                </button>
                <button v-if="apt.status === 'Selesai' && apt.payment === 'Lunas' && !apt.rated" class="btn btn-sm btn-rating" @click="openRatingModal(apt)">
                  <Icon icon="mdi:star-outline" width="13" /> Beri Ulasan
                </button>
                <span v-if="apt.status === 'Selesai' && apt.payment === 'Lunas' && apt.rated" class="text-sm text-muted">
                  <Icon icon="mdi:check-circle" width="14" style="color: #1a7a3a; vertical-align: -2px;" /> Selesai
                </span>
                <span v-if="apt.status === 'Dibatalkan'" class="text-sm text-muted">Dibatalkan</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Detail -->
    <div class="modal-overlay" v-if="showDetailModal" @click.self="showDetailModal = false">
      <div class="modal">
        <h2>Detail Booking</h2>
        <div class="payment-modal-info">
          <div class="summary-row"><span>ID</span><span>#{{ detailTarget.id }}</span></div>
          <div class="summary-row"><span>Pelanggan</span><span style="font-weight:500;">{{ detailTarget.customer }} <span v-if="isMember(detailTarget.customer)" class="badge badge-member" style="font-size: 0.6rem; padding: 1px 6px; margin-left: 4px;">Member</span></span></div>
          <div class="summary-row"><span>Barber</span><span>{{ detailTarget.barber }}</span></div>
          <div class="summary-row"><span>Layanan</span><span>{{ detailTarget.service }}</span></div>
          <div class="summary-row"><span>Tanggal</span><span>{{ detailTarget.date }}</span></div>
          <div class="summary-row"><span>Waktu</span><span>{{ detailTarget.time }}</span></div>
          <div class="summary-row"><span>Harga Asli</span><span>{{ formatCurrency(detailTarget.amount) }}</span></div>
          <div v-if="detailTarget.discountApplied" class="summary-row" style="color: #1a7a3a;"><span>Diskon Member (50%)</span><span>-{{ formatCurrency(detailTarget.discountAmount) }}</span></div>
          <div class="summary-row"><span>Total Bayar</span><strong class="text-maroon">{{ formatCurrency(detailTarget.finalAmount || detailTarget.amount) }}</strong></div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Status</div>
          <span :class="'badge badge-' + statusClass(detailTarget.status)">{{ detailTarget.status }}</span>
        </div>
        <div class="detail-section">
          <div class="detail-label">Pembayaran</div>
          <span :class="'badge badge-' + paymentClass(detailTarget.payment)">{{ detailTarget.payment }}</span>
          <span v-if="detailTarget.paymentMethod" class="text-sm text-muted" style="margin-left: 6px;">via {{ detailTarget.paymentMethod }}</span>
        </div>
        <div class="detail-section" v-if="detailTarget.receiptImage">
          <div class="detail-label">Bukti Pembayaran</div>
          <div class="receipt-preview"><img :src="detailTarget.receiptImage" alt="Bukti" /></div>
        </div>
        <div class="detail-section" v-if="detailTarget.rated">
          <div class="detail-label">Ulasan</div>
          <div class="flex-gap">
            <span class="stars"><span v-for="n in 5" :key="n" :class="{ empty: n > getReviewRating(detailTarget.id) }">★</span></span>
            <span class="text-sm text-muted">{{ getReviewComment(detailTarget.id) }}</span>
          </div>
        </div>
        <div class="form-actions"><button class="btn btn-secondary" @click="showDetailModal = false">Tutup</button></div>
      </div>
    </div>

    <!-- Modal Konfirmasi Aksi (Konfirmasi/Selesai) -->
    <div class="modal-overlay" v-if="showActionConfirm" @click.self="showActionConfirm = false">
      <div class="modal confirm-modal">
        <div class="confirm-icon" style="color: var(--maroon);"><Icon icon="mdi:help-circle-outline" width="40" /></div>
        <h2>{{ actionConfirmTitle }}</h2>
        <p class="confirm-msg">{{ actionConfirmMsg }}</p>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showActionConfirm = false">Batal</button>
          <button class="btn btn-primary" @click="doActionConfirm">Ya, Lanjutkan</button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Batal -->
    <div class="modal-overlay" v-if="showCancelConfirm" @click.self="showCancelConfirm = false">
      <div class="modal confirm-modal">
        <div class="confirm-icon"><Icon icon="mdi:alert-circle-outline" width="40" /></div>
        <h2>Batalkan Booking</h2>
        <p class="confirm-msg">Apakah Anda yakin ingin membatalkan booking <strong>{{ cancelTarget?.customer }}</strong> ({{ cancelTarget?.service }})? Tindakan ini tidak dapat dibatalkan.</p>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showCancelConfirm = false">Tidak</button>
          <button class="btn btn-danger" @click="doCancelBooking">Ya, Batalkan</button>
        </div>
      </div>
    </div>

    <!-- Modal Pembayaran -->
    <div class="modal-overlay" v-if="showPaymentModal" @click.self="showPaymentModal = false">
      <div class="modal">
        <h2>Konfirmasi Pembayaran</h2>
        <div v-if="paymentMember && paymentMember.totalVisits >= 10" class="discount-banner">
          <span class="discount-icon">🎉</span>
          <div class="discount-info">
            <div class="discount-title">Diskon Member 50%!</div>
            <div class="discount-desc">{{ paymentTarget.customer }} telah mencapai 10/10 kunjungan</div>
          </div>
        </div>
        <div v-if="paymentMember && paymentMember.totalVisits < 10" class="member-visit-info mb-16">
          <div class="flex-gap">
            <span class="badge badge-member"><Icon icon="mdi:card-account-details-star-outline" width="11" style="vertical-align: -1px;" /> Member</span>
            <span class="text-sm text-muted">Kunjungan {{ paymentMember.totalVisits }}/10</span>
          </div>
          <div class="visit-progress mt-8">
            <div class="progress-bar"><div class="progress-bar-fill" :style="{ width: (paymentMember.totalVisits / 10 * 100) + '%' }"></div></div>
            <span class="progress-text">{{ paymentMember.totalVisits }}/10</span>
          </div>
        </div>
        <div class="payment-modal-info">
          <div class="summary-row"><span>Pelanggan</span><span>{{ paymentTarget.customer }}</span></div>
          <div class="summary-row"><span>Layanan</span><span>{{ paymentTarget.service }}</span></div>
        </div>
        <div class="price-breakdown">
          <div class="price-row"><span>Harga Layanan</span><span>{{ formatCurrency(paymentTarget.amount) }}</span></div>
          <div v-if="paymentHasDiscount" class="price-row discount"><span>Diskon Member (50%)</span><span>-{{ formatCurrency(Math.floor(paymentTarget.amount * 0.5)) }}</span></div>
          <div class="price-row total"><span>Total Bayar</span><span>{{ formatCurrency(paymentHasDiscount ? Math.ceil(paymentTarget.amount * 0.5) : paymentTarget.amount) }}</span></div>
        </div>
        <div class="form-group mt-16">
          <label>Metode Pembayaran</label>
          <select v-model="paymentForm.method">
            <option value="">-- Pilih metode --</option>
            <option>Tunai</option>
            <option>Transfer Bank</option>
            <option>QRIS</option>
          </select>
        </div>
        <div class="form-group">
          <label>Unggah Bukti / Nota (Opsional)</label>
          <input type="file" accept="image/*" @change="handleReceiptUpload" class="file-input" />
          <div v-if="paymentForm.receiptPreview" class="receipt-preview"><img :src="paymentForm.receiptPreview" alt="Bukti" /></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showPaymentModal = false">Batal</button>
          <button class="btn btn-primary" @click="submitPayment" :disabled="!paymentForm.method">Konfirmasi Bayar</button>
        </div>
      </div>
    </div>

    <!-- Modal Ulasan -->
    <div class="modal-overlay" v-if="showRatingModal" @click.self="showRatingModal = false">
      <div class="modal">
        <h2>Beri Ulasan</h2>
        <div class="payment-modal-info">
          <div class="summary-row"><span>Pelanggan</span><span>{{ ratingTarget.customer }}</span></div>
          <div class="summary-row"><span>Barber</span><span>{{ ratingTarget.barber }}</span></div>
          <div class="summary-row"><span>Layanan</span><span>{{ ratingTarget.service }}</span></div>
        </div>
        <div class="form-group">
          <label>Rating</label>
          <div class="star-picker"><span v-for="n in 5" :key="n" class="star-pick" :class="{ active: n <= ratingForm.rating }" @click="ratingForm.rating = n">★</span></div>
        </div>
        <div class="form-group">
          <label>Komentar</label>
          <textarea v-model="ratingForm.comment" rows="3" placeholder="Tulis komentar..."></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showRatingModal = false">Batal</button>
          <button class="btn btn-primary" @click="submitRating" :disabled="!ratingForm.rating">Kirim Ulasan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Icon } from '@iconify/vue'
import { store } from '../store.js'

export default {
  components: { Icon },
  data() {
    return {
      store,
      form: { customer: '', customerType: 'member', barber: '', service: '', date: store.todayStr(), time: '' },
      selectedPrice: 0,
      customerMember: null,
      formError: '',
      filterStatus: '',
      showExportMenu: false,
      showDetailModal: false, detailTarget: {},
      showPaymentModal: false, paymentTarget: {}, paymentForm: { method: '', receiptPreview: null },
      showRatingModal: false, ratingTarget: {}, ratingForm: { rating: 0, comment: '' },
      showCancelConfirm: false, cancelTarget: null,
      showActionConfirm: false, actionTarget: null, actionNewStatus: '', actionConfirmTitle: '', actionConfirmMsg: '',
      timeSlots: [
        '09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
        '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30',
        '17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30',
      ],
    }
  },
  computed: {
    minDate() { return store.todayStr() },
    activeBarbers() { return store.barbers.filter(b => b.status === 'Aktif' && b.available && b.role === 'Barber') },
    selectedBarberHours() {
      const b = store.barbers.find(b => b.name === this.form.barber)
      if (b && b.workStart && b.workEnd) return `${b.workStart} - ${b.workEnd}`
      return null
    },
    availableServices() {
      if (!this.form.barber) return store.services
      const barber = store.barbers.find(b => b.name === this.form.barber)
      if (!barber || !barber.myServices || barber.myServices.length === 0) {
        // Barber hasn't configured services → show all as fallback
        return store.services
      }
      return store.services.filter(s => barber.myServices.includes(s.id))
    },
    formValid() {
      return this.form.customer && this.form.barber && this.form.service && this.form.date && this.form.time
        && !store.isDateInPast(this.form.date)
        && !store.isTimeSlotInPast(this.form.date, this.form.time)
    },
    allBookings() {
      // Barber only sees their own bookings
      if (store.isBarber()) {
        const barber = store.getCurrentBarber()
        if (barber) return store.appointments.filter(a => a.barber === barber.name)
        return []
      }
      return store.appointments
    },
    filteredBookings() {
      if (!this.filterStatus) return this.allBookings
      return this.allBookings.filter(a => a.status === this.filterStatus)
    },
    unpaidCount() { return this.allBookings.filter(b => b.payment === 'Belum Bayar' && b.status !== 'Dibatalkan').length },
    unpaidTotal() { return this.allBookings.filter(b => b.payment === 'Belum Bayar' && b.status !== 'Dibatalkan').reduce((s, b) => s + b.amount, 0) },
    paidCount() { return this.allBookings.filter(b => b.payment === 'Lunas').length },
    paidTotal() { return this.allBookings.filter(b => b.payment === 'Lunas').reduce((s, b) => s + (b.finalAmount || b.amount), 0) },
    paymentMember() { return this.paymentTarget.customer ? store.getMemberByName(this.paymentTarget.customer) : null },
    paymentHasDiscount() { return this.paymentMember && this.paymentMember.totalVisits >= 10 },
    availableTimeCount() {
      if (!this.form.date || !this.form.barber) return this.timeSlots.length
      return this.timeSlots.filter(t => !this.isTimeUnavailable(t)).length
    },
  },
  methods: {
    formatCurrency(val) { return 'Rp ' + val.toLocaleString('id-ID') },
    updatePrice() { const svc = store.services.find(s => s.name === this.form.service); this.selectedPrice = svc ? svc.price : 0 },
    onDateChange() { this.form.time = '' },
    onBarberChange() { this.form.time = ''; this.form.service = ''; this.selectedPrice = 0 },
    isTimeUnavailable(time) {
      if (!this.form.date || !this.form.barber) return false
      // Past time check
      if (store.isTimeSlotInPast(this.form.date, time)) return true
      // Already booked check
      if (store.isBarberBookedAtSlot(this.form.date, time, this.form.barber)) return true
      // Outside barber working hours
      if (!store.isBarberWorkingAtTime(this.form.barber, time)) return true
      return false
    },
    getTimeLabel(time) {
      if (!this.form.date || !this.form.barber) return ''
      if (store.isTimeSlotInPast(this.form.date, time)) return ' (Sudah lewat)'
      if (store.isBarberBookedAtSlot(this.form.date, time, this.form.barber)) return ' (Sudah dibooking)'
      if (!store.isBarberWorkingAtTime(this.form.barber, time)) return ' (Di luar jam kerja)'
      return ''
    },
    checkMember() { this.customerMember = this.form.customer.trim() ? store.getMemberByName(this.form.customer.trim()) : null },
    isMember(name) { return !!store.getMemberByName(name) },
    statusClass(s) { return { 'Menunggu': 'pending', 'Dikonfirmasi': 'confirmed', 'Selesai': 'done', 'Dibatalkan': 'cancelled' }[s] || 'pending' },
    paymentClass(p) { return { 'Belum Bayar': 'unpaid', 'Lunas': 'paid' }[p] || 'unpaid' },

    createBooking() {
      this.formError = ''
      if (store.isDateInPast(this.form.date)) { this.formError = 'Tanggal tidak boleh di masa lalu.'; return }
      if (store.isTimeSlotInPast(this.form.date, this.form.time)) { this.formError = 'Waktu yang dipilih sudah lewat.'; return }
      if (store.isBarberBookedAtSlot(this.form.date, this.form.time, this.form.barber)) { this.formError = 'Barber sudah dibooking pada waktu ini.'; return }
      if (!store.isBarberWorkingAtTime(this.form.barber, this.form.time)) { this.formError = 'Waktu di luar jam kerja barber.'; return }
      store.addBooking({ customer: this.form.customer, barber: this.form.barber, service: this.form.service, date: this.form.date, time: this.form.time, amount: this.selectedPrice })
      this.form = { customer: '', customerType: 'member', barber: '', service: '', date: store.todayStr(), time: '' }
      this.selectedPrice = 0; this.customerMember = null; this.formError = ''
    },

    // Confirm actions with modal
    openConfirmAction(apt, newStatus) {
      this.actionTarget = apt; this.actionNewStatus = newStatus
      if (newStatus === 'Dikonfirmasi') { this.actionConfirmTitle = 'Konfirmasi Booking'; this.actionConfirmMsg = `Konfirmasi booking ${apt.customer} untuk layanan ${apt.service}?` }
      else if (newStatus === 'Selesai') { this.actionConfirmTitle = 'Selesaikan Booking'; this.actionConfirmMsg = `Tandai booking ${apt.customer} sebagai selesai?` }
      this.showActionConfirm = true
    },
    doActionConfirm() { store.updateStatus(this.actionTarget.id, this.actionNewStatus); this.showActionConfirm = false },

    // Cancel booking
    openCancelConfirm(apt) { this.cancelTarget = apt; this.showCancelConfirm = true },
    doCancelBooking() { store.cancelBooking(this.cancelTarget.id); this.showCancelConfirm = false },

    openDetailModal(apt) { this.detailTarget = apt; this.showDetailModal = true },
    getReviewRating(id) { const r = store.reviews.find(r => r.appointmentId === id); return r ? r.rating : 0 },
    getReviewComment(id) { const r = store.reviews.find(r => r.appointmentId === id); return r ? r.comment : '' },
    openPaymentModal(apt) { this.paymentTarget = apt; this.paymentForm = { method: '', receiptPreview: null }; this.showPaymentModal = true },
    handleReceiptUpload(e) { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { this.paymentForm.receiptPreview = ev.target.result }; r.readAsDataURL(f) } },
    submitPayment() { store.confirmPayment(this.paymentTarget.id, this.paymentForm.method, this.paymentForm.receiptPreview); this.showPaymentModal = false },
    openRatingModal(apt) { this.ratingTarget = apt; this.ratingForm = { rating: 0, comment: '' }; this.showRatingModal = true },
    submitRating() {
      store.addReview({ customer: this.ratingTarget.customer, barber: this.ratingTarget.barber, rating: this.ratingForm.rating, comment: this.ratingForm.comment, date: store.todayStr(), appointmentId: this.ratingTarget.id })
      this.showRatingModal = false
    },
    exportCSV(type) {
      let csv = '', fn = ''
      if (type === 'appointments') { csv = store.exportAppointmentsCSV(); fn = 'booking_data.csv' }
      else if (type === 'barbers') { csv = store.exportBarbersCSV(); fn = 'akun_data.csv' }
      else if (type === 'reviews') { csv = store.exportReviewsCSV(); fn = 'ulasan_data.csv' }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = fn; link.click(); URL.revokeObjectURL(url)
      this.showExportMenu = false
    },
  },
  mounted() { document.addEventListener('click', (e) => { if (!e.target.closest('.export-dropdown')) this.showExportMenu = false }) },
}
</script>

<style scoped>
.customer-select-wrap { display: flex; gap: 8px; }
.customer-type-select { width: 140px; flex-shrink: 0; }
.customer-input { flex: 1; }
.booking-summary, .payment-modal-info { background: var(--gray-50); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; }
.summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.8125rem; }
.payment-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.payment-stat { text-align: center; padding: 16px; background: var(--gray-50); border-radius: var(--radius-sm); }
.payment-stat .stat-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-500); margin-bottom: 4px; }
.payment-stat .stat-value { font-size: 1.5rem; font-weight: 700; }
.payment-stat .stat-sub { font-size: 0.75rem; color: var(--gray-400); margin-top: 2px; }
.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; align-items: center; }
.btn-rating { background: #fff5e0; color: #a67a00; }
.btn-rating:hover { background: #ffecbf; }
.file-input { border: none; padding: 0; font-size: 0.8125rem; }
.receipt-preview { margin-top: 10px; border: 1px solid var(--gray-200); border-radius: var(--radius-sm); overflow: hidden; }
.receipt-preview img { width: 100%; max-height: 200px; object-fit: contain; display: block; }
.star-picker { display: flex; gap: 6px; }
.star-pick { font-size: 1.75rem; color: var(--gray-200); cursor: pointer; transition: color 0.15s; }
.star-pick.active { color: var(--gold); }
.star-pick:hover { color: var(--gold-light); }
.detail-section { margin-bottom: 14px; }
.detail-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-500); margin-bottom: 6px; font-weight: 500; }
.export-dropdown { position: relative; }
.dropdown-menu { position: absolute; right: 0; top: 100%; margin-top: 4px; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); z-index: 50; min-width: 180px; padding: 4px; }
.dropdown-menu button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; background: none; border: none; font-size: 0.8125rem; color: var(--dark); text-align: left; border-radius: 4px; transition: background var(--transition); }
.dropdown-menu button:hover { background: var(--gray-50); }
.member-indicator { display: flex; align-items: center; flex-wrap: wrap; }
.member-visit-info { background: var(--gray-50); border-radius: var(--radius-sm); padding: 12px 14px; }
</style>
