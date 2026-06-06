<template>
  <div>
    <!-- Quick Stats Bar -->
    <div class="booking-stats mb-24">
      <div class="bstat">
        <div class="bstat-icon bstat-pending"><Icon icon="mdi:clock-outline" width="18" /></div>
        <div>
          <div class="bstat-val">{{ pendingCount }}</div>
          <div class="bstat-label">Menunggu</div>
        </div>
      </div>
      <div class="bstat">
        <div class="bstat-icon bstat-confirmed"><Icon icon="mdi:check-circle-outline" width="18" /></div>
        <div>
          <div class="bstat-val">{{ confirmedCount }}</div>
          <div class="bstat-label">Dikonfirmasi</div>
        </div>
      </div>
      <div class="bstat">
        <div class="bstat-icon bstat-today"><Icon icon="mdi:calendar-today" width="18" /></div>
        <div>
          <div class="bstat-val">{{ todayCount }}</div>
          <div class="bstat-label">Hari Ini</div>
        </div>
      </div>
      <div class="bstat">
        <div class="bstat-icon bstat-barbers"><Icon icon="mdi:account-group-outline" width="18" /></div>
        <div>
          <div class="bstat-val">{{ activeBarbers.length }}</div>
          <div class="bstat-label">Barber Aktif</div>
        </div>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="booking-layout" v-if="!store.isBarber()">
      <!-- Form Booking -->
      <div class="card booking-form-card">
        <div class="form-card-header">
          <div class="form-card-icon"><Icon icon="mdi:plus-circle-outline" width="20" /></div>
          <div>
            <h3>Buat Booking Baru</h3>
            <p class="form-card-desc">Isi detail pelanggan dan jadwal</p>
          </div>
        </div>

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
              <span v-if="customerMember.totalVisits >= 10" class="discount-text"> — 🎉 Diskon 50%!</span>
              <span v-else> — {{ 10 - customerMember.totalVisits }} lagi</span>
            </span>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Tanggal</label>
            <input type="date" v-model="form.date" :min="minDate" @change="onDateChange" />
          </div>
          <div class="form-group">
            <label>Pilih Barber</label>
            <select v-model="form.barber" @change="onBarberChange">
              <option value="">-- Pilih barber --</option>
              <option v-for="b in activeBarbers" :key="b.id" :value="b.name">
                {{ b.name }}<template v-if="b.shift"> ({{ b.shift }})</template>
              </option>
            </select>
          </div>
        </div>
        <p v-if="form.date && store.isDateInPast(form.date)" class="form-hint error">Tanggal tidak boleh di masa lalu.</p>
        <p v-if="form.barber && selectedBarberShift" class="form-hint info">
          <Icon icon="mdi:clock-outline" width="12" style="vertical-align: -1px;" /> Shift: {{ selectedBarberShift }}
        </p>

        <div class="form-row-2">
          <div class="form-group">
            <label>Waktu</label>
            <select v-model="form.time" :disabled="!form.date || !form.barber">
              <option value="">-- Pilih waktu --</option>
              <option v-for="t in timeSlots" :key="t" :value="t" :disabled="isTimeUnavailable(t)">
                {{ t }}{{ getTimeLabel(t) }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Pilih Layanan</label>
            <select v-model="form.service" @change="updatePrice" :disabled="!form.barber">
              <option value="">-- Pilih layanan --</option>
              <option v-for="s in availableServices" :key="s.id" :value="s.name">{{ s.name }} — {{ formatCurrency(s.price) }}</option>
            </select>
          </div>
        </div>
        <p class="form-hint error" v-if="form.date && form.barber && availableTimeCount === 0">
          Tidak ada waktu tersedia untuk barber ini.
        </p>

        <div class="booking-summary" v-if="form.service && form.barber">
          <div class="summary-header">Ringkasan</div>
          <div class="summary-row"><span>Barber</span><span>{{ form.barber }}</span></div>
          <div class="summary-row"><span>Layanan</span><span>{{ form.service }}</span></div>
          <div class="summary-row"><span>Harga</span><strong class="text-maroon">{{ formatCurrency(selectedPrice) }}</strong></div>
          <div v-if="customerMember && customerMember.totalVisits >= 10" class="discount-banner mt-8" style="margin-bottom: 0;">
            <span class="discount-icon">🎉</span>
            <div class="discount-info">
              <div class="discount-title">Diskon Member 50%</div>
              <div class="discount-desc">Estimasi: {{ formatCurrency(Math.floor(selectedPrice * 0.5)) }}</div>
            </div>
          </div>
        </div>

        <p v-if="formError" class="form-hint error mt-8">{{ formError }}</p>
        <button class="btn btn-primary btn-book" @click="createBooking" :disabled="!formValid">
          <Icon icon="mdi:check" width="16" /> Konfirmasi Booking
        </button>
      </div>

      <!-- Active Bookings List -->
      <div class="booking-list-area">
        <div class="card">
          <div class="card-header">
            <div class="list-header-left">
              <h3><Icon icon="mdi:clipboard-list-outline" width="16" style="vertical-align: -2px; margin-right: 4px;" /> Booking Aktif</h3>
              <span class="active-count">{{ filteredBookings.length }} booking</span>
            </div>
            <div class="filter-tabs">
              <button class="filter-tab" :class="{ active: filterStatus === '' }" @click="filterStatus = ''">Semua</button>
              <button class="filter-tab" :class="{ active: filterStatus === 'Menunggu' }" @click="filterStatus = 'Menunggu'">Menunggu</button>
              <button class="filter-tab" :class="{ active: filterStatus === 'Dikonfirmasi' }" @click="filterStatus = 'Dikonfirmasi'">Dikonfirmasi</button>
            </div>
          </div>

          <div v-if="filteredBookings.length === 0" class="empty-state booking-empty">
            <div class="empty-icon"><Icon icon="mdi:calendar-blank-outline" width="40" /></div>
            <p>Tidak ada booking aktif saat ini.</p>
            <span class="text-sm text-muted">Buat booking baru menggunakan form di sebelah kiri.</span>
          </div>

          <div class="booking-cards" v-else>
            <div v-for="apt in filteredBookings" :key="apt.id" class="booking-card" :class="'bc-' + statusClass(apt.status)">
              <div class="bc-status-strip"></div>
              <div class="bc-content">
                <div class="bc-top">
                  <div class="bc-customer-block">
                    <div class="bc-avatar">{{ apt.customer[0] }}</div>
                    <div>
                      <div class="bc-customer">
                        <span class="bc-name">{{ apt.customer }}</span>
                        <span v-if="isMember(apt.customer)" class="badge badge-member" style="font-size: 0.55rem; padding: 1px 5px;">M</span>
                      </div>
                      <div class="bc-service">{{ apt.service }}</div>
                    </div>
                  </div>
                  <span :class="'badge badge-' + statusClass(apt.status)">{{ apt.status }}</span>
                </div>
                <div class="bc-details">
                  <div class="bc-detail"><Icon icon="mdi:content-cut" width="13" /> {{ apt.barber }}</div>
                  <div class="bc-detail"><Icon icon="mdi:calendar" width="13" /> {{ formatDate(apt.date) }}</div>
                  <div class="bc-detail"><Icon icon="mdi:clock-outline" width="13" /> {{ apt.time }}</div>
                  <div class="bc-detail bc-price"><Icon icon="mdi:cash" width="13" /> {{ formatCurrency(apt.amount) }}</div>
                </div>
                <div class="bc-bottom">
                  <div class="action-btns">
                    <button class="btn-icon" @click="openDetailModal(apt)" title="Detail"><Icon icon="mdi:eye-outline" width="15" /></button>
                    <button v-if="apt.status === 'Menunggu' || apt.status === 'Dikonfirmasi'" class="btn btn-sm btn-cancel" @click="openCancelConfirm(apt)">
                      <Icon icon="mdi:close" width="13" /> Batal
                    </button>
                    <button v-if="apt.status === 'Menunggu'" class="btn btn-secondary btn-sm" @click="openConfirmAction(apt, 'Dikonfirmasi')">
                      <Icon icon="mdi:check" width="13" /> Konfirmasi
                    </button>
                    <button v-if="apt.status === 'Dikonfirmasi'" class="btn btn-primary btn-sm" @click="openConfirmAction(apt, 'Selesai')">
                      <Icon icon="mdi:check-all" width="13" /> Selesai
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barber-only view -->
    <div v-if="store.isBarber()">
      <div class="card">
        <div class="card-header">
          <h3><Icon icon="mdi:clipboard-text-outline" width="16" style="vertical-align: -2px; margin-right: 4px;" /> Booking Saya</h3>
          <span class="active-count">{{ filteredBookings.length }} booking</span>
        </div>
        <div v-if="filteredBookings.length === 0" class="empty-state booking-empty">
          <div class="empty-icon"><Icon icon="mdi:clipboard-text-outline" width="40" /></div>
          <p>Belum ada booking aktif.</p>
        </div>
        <div class="booking-cards barber-cards" v-else>
          <div v-for="apt in filteredBookings" :key="apt.id" class="booking-card" :class="'bc-' + statusClass(apt.status)">
            <div class="bc-status-strip"></div>
            <div class="bc-content">
              <div class="bc-top">
                <div class="bc-customer-block">
                  <div class="bc-avatar">{{ apt.customer[0] }}</div>
                  <div>
                    <div class="bc-name">{{ apt.customer }}</div>
                    <div class="bc-service">{{ apt.service }}</div>
                  </div>
                </div>
                <span :class="'badge badge-' + statusClass(apt.status)">{{ apt.status }}</span>
              </div>
              <div class="bc-details bc-details-3">
                <div class="bc-detail"><Icon icon="mdi:calendar" width="13" /> {{ formatDate(apt.date) }}</div>
                <div class="bc-detail"><Icon icon="mdi:clock-outline" width="13" /> {{ apt.time }}</div>
                <div class="bc-detail bc-price"><Icon icon="mdi:cash" width="13" /> {{ formatCurrency(apt.amount) }}</div>
              </div>
              <div class="bc-bottom">
                <button class="btn-icon" @click="openDetailModal(apt)" title="Detail"><Icon icon="mdi:eye-outline" width="15" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detail -->
    <div class="modal-overlay" v-if="showDetailModal" @click.self="showDetailModal = false">
      <div class="modal modal-detail">
        <div class="modal-detail-top">
          <h2>Detail Booking</h2>
          <span class="modal-id">#{{ detailTarget.id }}</span>
        </div>
        <div class="payment-modal-info">
          <div class="summary-row"><span>Pelanggan</span><span style="font-weight:500;">{{ detailTarget.customer }}
            <span v-if="isMember(detailTarget.customer)" class="badge badge-member" style="font-size: 0.6rem; padding: 1px 6px; margin-left: 4px;">Member</span>
          </span></div>
          <div class="summary-row"><span>Barber</span><span>{{ detailTarget.barber }}</span></div>
          <div class="summary-row"><span>Layanan</span><span>{{ detailTarget.service }}</span></div>
          <div class="summary-row"><span>Tanggal & Waktu</span><span>{{ detailTarget.date }} · {{ detailTarget.time }}</span></div>
          <div class="summary-row"><span>Jumlah</span><strong class="text-maroon">{{ formatCurrency(detailTarget.amount) }}</strong></div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Status</div>
          <span :class="'badge badge-' + statusClass(detailTarget.status)">{{ detailTarget.status }}</span>
        </div>
        <div class="form-actions"><button class="btn btn-secondary" @click="showDetailModal = false">Tutup</button></div>
      </div>
    </div>

    <!-- Modal Konfirmasi Aksi -->
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
  </div>
</template>

<script>
import { Icon } from '@iconify/vue'
import { store, SHIFTS } from '../store.js'

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
      showDetailModal: false, detailTarget: {},
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
    selectedBarberShift() {
      const b = store.barbers.find(b => b.name === this.form.barber)
      if (b && b.shift) {
        const shift = SHIFTS[b.shift]
        if (shift) return `${b.shift} (${shift.start} - ${shift.end})`
      }
      return null
    },
    availableServices() {
      if (!this.form.barber) return store.services
      const barber = store.barbers.find(b => b.name === this.form.barber)
      if (!barber || !barber.myServices || barber.myServices.length === 0) return store.services
      return store.services.filter(s => barber.myServices.includes(s.id))
    },
    formValid() {
      return this.form.customer && this.form.barber && this.form.service && this.form.date && this.form.time
        && !store.isDateInPast(this.form.date)
        && !store.isTimeSlotInPast(this.form.date, this.form.time)
    },
    allBookings() {
      let list = store.appointments
      if (store.isBarber()) {
        const barber = store.getCurrentBarber()
        if (barber) list = list.filter(a => a.barber === barber.name)
        else return []
      }
      return list.filter(a => a.status === 'Menunggu' || a.status === 'Dikonfirmasi')
    },
    filteredBookings() {
      if (!this.filterStatus) return this.allBookings
      return this.allBookings.filter(a => a.status === this.filterStatus)
    },
    pendingCount() { return this.allBookings.filter(a => a.status === 'Menunggu').length },
    confirmedCount() { return this.allBookings.filter(a => a.status === 'Dikonfirmasi').length },
    todayCount() {
      const today = store.todayStr()
      return this.allBookings.filter(a => a.date === today).length
    },
    availableTimeCount() {
      if (!this.form.date || !this.form.barber) return this.timeSlots.length
      return this.timeSlots.filter(t => !this.isTimeUnavailable(t)).length
    },
  },
  methods: {
    formatCurrency(val) { return 'Rp ' + val.toLocaleString('id-ID') },
    formatDate(dateStr) {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    updatePrice() { const svc = store.services.find(s => s.name === this.form.service); this.selectedPrice = svc ? svc.price : 0 },
    onDateChange() { this.form.time = '' },
    onBarberChange() { this.form.time = ''; this.form.service = ''; this.selectedPrice = 0 },
    isTimeUnavailable(time) {
      if (!this.form.date || !this.form.barber) return false
      if (store.isTimeSlotInPast(this.form.date, time)) return true
      if (store.isBarberBookedAtSlot(this.form.date, time, this.form.barber)) return true
      if (!store.isBarberWorkingAtTime(this.form.barber, time)) return true
      return false
    },
    getTimeLabel(time) {
      if (!this.form.date || !this.form.barber) return ''
      if (store.isTimeSlotInPast(this.form.date, time)) return ' (Sudah lewat)'
      if (store.isBarberBookedAtSlot(this.form.date, time, this.form.barber)) return ' (Sudah dibooking)'
      if (!store.isBarberWorkingAtTime(this.form.barber, time)) return ' (Di luar shift)'
      return ''
    },
    checkMember() { this.customerMember = this.form.customer.trim() ? store.getMemberByName(this.form.customer.trim()) : null },
    isMember(name) { return !!store.getMemberByName(name) },
    statusClass(s) { return { 'Menunggu': 'pending', 'Dikonfirmasi': 'confirmed', 'Selesai': 'done', 'Dibatalkan': 'cancelled' }[s] || 'pending' },

    createBooking() {
      this.formError = ''
      if (store.isDateInPast(this.form.date)) { this.formError = 'Tanggal tidak boleh di masa lalu.'; return }
      if (store.isTimeSlotInPast(this.form.date, this.form.time)) { this.formError = 'Waktu yang dipilih sudah lewat.'; return }
      if (store.isBarberBookedAtSlot(this.form.date, this.form.time, this.form.barber)) { this.formError = 'Barber sudah dibooking pada waktu ini.'; return }
      if (!store.isBarberWorkingAtTime(this.form.barber, this.form.time)) { this.formError = 'Waktu di luar shift barber.'; return }
      store.addBooking({ customer: this.form.customer, barber: this.form.barber, service: this.form.service, date: this.form.date, time: this.form.time, amount: this.selectedPrice })
      this.form = { customer: '', customerType: 'member', barber: '', service: '', date: store.todayStr(), time: '' }
      this.selectedPrice = 0; this.customerMember = null; this.formError = ''
    },

    openConfirmAction(apt, newStatus) {
      this.actionTarget = apt; this.actionNewStatus = newStatus
      if (newStatus === 'Dikonfirmasi') { this.actionConfirmTitle = 'Konfirmasi Booking'; this.actionConfirmMsg = `Konfirmasi booking ${apt.customer} untuk layanan ${apt.service}?` }
      else if (newStatus === 'Selesai') { this.actionConfirmTitle = 'Selesaikan Booking'; this.actionConfirmMsg = `Tandai booking ${apt.customer} sebagai selesai? Booking akan pindah ke antrian pembayaran.` }
      this.showActionConfirm = true
    },
    doActionConfirm() { store.updateStatus(this.actionTarget.id, this.actionNewStatus); this.showActionConfirm = false },

    openCancelConfirm(apt) { this.cancelTarget = apt; this.showCancelConfirm = true },
    doCancelBooking() { store.cancelBooking(this.cancelTarget.id); this.showCancelConfirm = false },

    openDetailModal(apt) { this.detailTarget = apt; this.showDetailModal = true },
  },
}
</script>

<style scoped>
/* Stats Bar */
.booking-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.bstat { display: flex; align-items: center; gap: 14px; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 16px 20px; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, transform 0.2s; }
.bstat:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.bstat-icon { width: 42px; height: 42px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bstat-pending { background: #fff5e0; color: #a67a00; }
.bstat-confirmed { background: #e7f5ec; color: #1a7a3a; }
.bstat-today { background: var(--maroon-bg); color: var(--maroon); }
.bstat-barbers { background: #edf0ff; color: #3a4eb0; }
.bstat-val { font-size: 1.375rem; font-weight: 700; color: var(--dark); line-height: 1.2; }
.bstat-label { font-size: 0.6875rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; }

/* Layout */
.booking-layout { display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: start; }
.booking-form-card { position: sticky; top: 84px; }

/* Form */
.form-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--gray-100); }
.form-card-icon { width: 40px; height: 40px; border-radius: var(--radius-sm); background: var(--maroon-bg); color: var(--maroon); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.form-card-header h3 { font-size: 0.9375rem; font-weight: 600; margin: 0; }
.form-card-desc { font-size: 0.75rem; color: var(--gray-400); margin-top: 2px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.customer-select-wrap { display: flex; gap: 8px; }
.customer-type-select { width: 130px; flex-shrink: 0; }
.customer-input { flex: 1; }
.form-hint { font-size: 0.75rem; margin-top: -8px; margin-bottom: 8px; }
.form-hint.error { color: #b02a2a; }
.form-hint.info { color: var(--maroon); }
.discount-text { color: var(--gold-dark); font-weight: 600; }

.booking-summary { background: linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 14px; margin: 16px 0; }
.summary-header { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-500); font-weight: 600; margin-bottom: 8px; }
.summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.8125rem; }
.btn-book { width: 100%; padding: 11px; font-size: 0.875rem; justify-content: center; display: flex; align-items: center; gap: 6px; }

/* List Header */
.list-header-left { display: flex; align-items: center; gap: 10px; }
.active-count { font-size: 0.6875rem; font-weight: 600; color: var(--gray-400); background: var(--gray-100); padding: 3px 10px; border-radius: 20px; }
.filter-tabs { display: flex; gap: 4px; background: var(--gray-100); padding: 3px; border-radius: var(--radius-sm); }
.filter-tab { padding: 5px 12px; font-size: 0.75rem; font-weight: 500; color: var(--gray-500); background: transparent; border-radius: 4px; transition: all 0.15s; }
.filter-tab:hover { color: var(--dark); }
.filter-tab.active { background: var(--white); color: var(--maroon); box-shadow: var(--shadow-sm); }

/* Booking Cards */
.booking-cards { display: flex; flex-direction: column; gap: 12px; }
.barber-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.booking-card { display: flex; border: 1px solid var(--gray-200); border-radius: var(--radius-md); overflow: hidden; transition: all 0.2s; background: var(--white); }
.booking-card:hover { box-shadow: var(--shadow-md); border-color: var(--gray-300); transform: translateY(-1px); }
.bc-status-strip { width: 4px; flex-shrink: 0; }
.bc-pending .bc-status-strip { background: linear-gradient(180deg, #E8C84A, #D4A820); }
.bc-confirmed .bc-status-strip { background: linear-gradient(180deg, #2ea855, #1a7a3a); }
.bc-content { flex: 1; padding: 16px; }
.bc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.bc-customer-block { display: flex; align-items: center; gap: 10px; }
.bc-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--maroon-light), var(--maroon)); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; flex-shrink: 0; }
.bc-customer { display: flex; align-items: center; gap: 5px; }
.bc-name { font-weight: 600; font-size: 0.9375rem; }
.bc-service { font-size: 0.8125rem; color: var(--gray-500); margin-top: 2px; }
.bc-details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 14px; padding: 10px 12px; background: var(--gray-50); border-radius: var(--radius-sm); }
.bc-details-3 { grid-template-columns: 1fr 1fr 1fr; }
.bc-detail { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--gray-500); }
.bc-detail.bc-price { color: var(--maroon); font-weight: 600; }
.bc-bottom { display: flex; justify-content: flex-end; padding-top: 4px; }
.action-btns { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.btn-cancel { background: #fde8e8; color: #b02a2a; }
.btn-cancel:hover { background: #fad4d4; }
.booking-empty { padding: 48px 20px; }

/* Modals */
.payment-modal-info { background: var(--gray-50); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; }
.modal-detail-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-id { font-size: 0.75rem; color: var(--gray-400); }
.detail-section { margin-bottom: 14px; }
.detail-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-500); margin-bottom: 6px; font-weight: 500; }
.member-indicator { display: flex; align-items: center; flex-wrap: wrap; }

@media (max-width: 960px) {
  .booking-stats { grid-template-columns: repeat(2, 1fr); }
  .booking-layout { grid-template-columns: 1fr; }
  .booking-form-card { position: static; }
}
</style>
