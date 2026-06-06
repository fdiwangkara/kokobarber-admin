<template>
  <div>
    <!-- Stats -->
    <div class="stats-grid-4 mb-24">
      <div class="stat-card stat-card-accent">
        <div class="stat-icon-wrap" style="background: #e7f5ec; color: #1a7a3a;"><Icon icon="mdi:receipt-text-check-outline" width="20" /></div>
        <div>
          <div class="stat-card-value">{{ totalPaid }}</div>
          <div class="stat-card-label">Transaksi Lunas</div>
        </div>
      </div>
      <div class="stat-card stat-card-accent">
        <div class="stat-icon-wrap" style="background: #e8f0fe; color: #2a5db0;"><Icon icon="mdi:cash-multiple" width="20" /></div>
        <div>
          <div class="stat-card-value" style="color: #1a7a3a;">{{ formatCurrency(totalRevenue) }}</div>
          <div class="stat-card-label">Total Pendapatan</div>
        </div>
      </div>
      <div class="stat-card stat-card-accent" :class="{ 'stat-alert': paymentQueue.length > 0 }">
        <div class="stat-icon-wrap" style="background: #fff5e0; color: #a67a00;"><Icon icon="mdi:clock-alert-outline" width="20" /></div>
        <div>
          <div class="stat-card-value" style="color: #a67a00;">{{ paymentQueue.length }}</div>
          <div class="stat-card-label">Antrian Bayar</div>
        </div>
      </div>
      <div class="stat-card stat-card-accent">
        <div class="stat-icon-wrap" style="background: var(--maroon-bg); color: var(--maroon);"><Icon icon="mdi:chart-line" width="20" /></div>
        <div>
          <div class="stat-card-value">{{ formatCurrency(avgTransaction) }}</div>
          <div class="stat-card-label">Rata-rata / Transaksi</div>
        </div>
      </div>
    </div>

    <!-- Payment Queue -->
    <div class="card payment-queue-card mb-24" v-if="paymentQueue.length > 0">
      <div class="card-header">
        <div class="header-title-group">
          <h3><Icon icon="mdi:cash-register" width="16" style="vertical-align: -2px; margin-right: 4px;" /> Antrian Pembayaran</h3>
          <span class="queue-badge">{{ paymentQueue.length }} menunggu</span>
        </div>
        <p class="queue-hint">Layanan selesai — konfirmasi pembayaran agar masuk riwayat</p>
      </div>
      <div class="queue-grid">
        <div v-for="apt in paymentQueue" :key="apt.id" class="queue-item" :class="{ 'queue-declined': apt.payment === 'Ditolak' }">
          <div class="queue-item-top">
            <div class="queue-avatar">{{ apt.customer[0] }}</div>
            <div class="queue-info">
              <div class="queue-customer">
                {{ apt.customer }}
                <span v-if="isMember(apt.customer)" class="badge badge-member" style="font-size: 0.55rem; padding: 1px 5px;">M</span>
              </div>
              <div class="queue-service">{{ apt.service }} · {{ apt.barber }}</div>
            </div>
            <div class="queue-amount">{{ formatCurrency(apt.amount) }}</div>
          </div>
          <div class="queue-item-meta">
            <span><Icon icon="mdi:calendar" width="12" /> {{ formatDateShort(apt.date) }}</span>
            <span><Icon icon="mdi:clock-outline" width="12" /> {{ apt.time }}</span>
            <span :class="'badge badge-' + paymentClass(apt.payment)" style="font-size: 0.6rem;">{{ apt.payment }}</span>
          </div>
          <button class="btn btn-primary btn-sm queue-pay-btn" @click="openPaymentModal(apt)">
            <Icon icon="mdi:cash-check" width="14" /> Proses Pembayaran
          </button>
        </div>
      </div>
    </div>

    <div class="riwayat-layout">
      <!-- History -->
      <div class="card history-card">
        <div class="card-header">
          <div class="header-title-group">
            <h3><Icon icon="mdi:history" width="16" style="vertical-align: -2px; margin-right: 4px;" /> Riwayat Transaksi</h3>
            <span class="history-subtitle">Hanya transaksi selesai & lunas</span>
          </div>
          <div class="flex-gap history-filters">
            <div class="search-input">
              <Icon icon="mdi:magnify" class="search-icon" width="16" />
              <input v-model="search" placeholder="Cari pelanggan, barber, layanan..." />
            </div>
            <select v-model="filterMethod" class="filter-select">
              <option value="">Semua Metode</option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
            </select>
            <button class="btn btn-secondary btn-sm" @click="exportPayments" v-if="allRecords.length > 0">
              <Icon icon="mdi:download-outline" width="14" /> Export CSV
            </button>
          </div>
        </div>

        <div v-if="filteredRecords.length === 0" class="empty-state history-empty">
          <div class="empty-icon"><Icon icon="mdi:receipt-text-outline" width="40" /></div>
          <p>Belum ada transaksi lunas.</p>
          <span class="text-sm text-muted">Transaksi akan muncul setelah layanan selesai dan pembayaran dikonfirmasi.</span>
        </div>

        <div class="history-timeline" v-else>
          <div v-for="(group, date) in groupedByDate" :key="date" class="timeline-group">
            <div class="timeline-date">
              <div class="timeline-dot"></div>
              <span class="timeline-date-label">{{ formatDateFull(date) }}</span>
              <span class="timeline-date-revenue">{{ formatCurrency(groupRevenue(group)) }}</span>
              <span class="timeline-date-count">{{ group.length }} transaksi</span>
            </div>
            <div class="timeline-entries">
              <div v-for="apt in group" :key="apt.id" class="history-entry">
                <div class="he-time">{{ apt.time }}</div>
                <div class="he-body">
                  <div class="he-main">
                    <div class="he-customer-row">
                      <span class="he-avatar">{{ apt.customer[0] }}</span>
                      <div>
                        <div class="he-customer">
                          {{ apt.customer }}
                          <span v-if="isMember(apt.customer)" class="badge badge-member" style="font-size: 0.55rem; padding: 1px 5px;">M</span>
                        </div>
                        <div class="he-service">{{ apt.service }}</div>
                      </div>
                    </div>
                    <div class="he-barber">
                      <Icon icon="mdi:content-cut" width="12" /> {{ apt.barber }}
                    </div>
                  </div>
                  <div class="he-right">
                    <div class="he-amount">
                      <span v-if="apt.discountApplied" class="price-original">{{ formatCurrency(apt.amount) }}</span>
                      <strong class="text-maroon">{{ formatCurrency(apt.finalAmount || apt.amount) }}</strong>
                    </div>
                    <div class="he-meta">
                      <span class="method-chip"><Icon icon="mdi:credit-card-outline" width="11" /> {{ apt.paymentMethod || 'Tunai' }}</span>
                      <span v-if="apt.discountApplied" class="discount-chip">-50%</span>
                    </div>
                    <div class="he-actions">
                      <button class="btn-icon" @click="openDetail(apt)" title="Detail"><Icon icon="mdi:eye-outline" width="14" /></button>
                      <button v-if="!apt.rated" class="btn btn-sm btn-rating" @click="openRatingModal(apt)">
                        <Icon icon="mdi:star-outline" width="12" /> Ulasan
                      </button>
                      <span v-if="apt.rated" class="rating-done">
                        <Icon icon="mdi:star" width="12" /> {{ getReviewRating(apt.id) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Sidebar -->
      <div class="customer-sidebar">
        <div class="card sidebar-card">
          <div class="card-header">
            <h3><Icon icon="mdi:account-star-outline" width="16" style="vertical-align: -2px; margin-right: 4px;" /> Pelanggan Teratas</h3>
          </div>
          <div class="customer-list">
            <div v-for="(cust, idx) in customerSummary" :key="cust.name" class="cust-card" :class="{ 'cust-active': selectedCustomer === cust.name }" @click="filterByCustomer(cust.name)">
              <div class="cust-rank">{{ idx + 1 }}</div>
              <div class="cust-top">
                <div class="cust-avatar">{{ cust.name[0] }}</div>
                <div class="cust-info">
                  <div class="cust-name">
                    {{ cust.name }}
                    <span v-if="cust.isMember" class="badge badge-member" style="font-size: 0.55rem; padding: 0px 4px; margin-left: 3px;">M</span>
                  </div>
                  <div class="cust-stats">{{ cust.totalVisits }}x · {{ formatCurrency(cust.totalSpent) }}</div>
                </div>
              </div>
              <div class="cust-meta">
                <span class="cust-meta-item"><Icon icon="mdi:calendar-check" width="11" /> {{ cust.lastVisit }}</span>
                <span class="cust-meta-item"><Icon icon="mdi:scissors-cutting" width="11" /> {{ cust.favoriteService }}</span>
              </div>
            </div>
          </div>
          <div v-if="selectedCustomer" class="cust-filter-clear mt-8">
            <button class="btn btn-secondary btn-sm" @click="clearCustomerFilter" style="width: 100%;">
              <Icon icon="mdi:close" width="12" /> Hapus Filter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="modal modal-detail">
        <div class="modal-detail-header">
          <div>
            <h2>Detail Transaksi</h2>
            <span class="modal-id">#{{ detailTarget.id }}</span>
          </div>
          <span class="badge badge-paid">Lunas</span>
        </div>
        <div class="payment-modal-info">
          <div class="summary-row"><span>Pelanggan</span><span style="font-weight:500;">{{ detailTarget.customer }}
            <span v-if="isMember(detailTarget.customer)" class="badge badge-member" style="font-size: 0.6rem; padding: 1px 6px; margin-left: 4px;">Member</span>
          </span></div>
          <div class="summary-row"><span>Barber</span><span>{{ detailTarget.barber }}</span></div>
          <div class="summary-row"><span>Layanan</span><span>{{ detailTarget.service }}</span></div>
          <div class="summary-row"><span>Tanggal & Waktu</span><span>{{ detailTarget.date }} · {{ detailTarget.time }}</span></div>
        </div>
        <div class="price-breakdown">
          <div class="price-row"><span>Harga Layanan</span><span>{{ formatCurrency(detailTarget.amount) }}</span></div>
          <div v-if="detailTarget.discountApplied" class="price-row discount"><span>Diskon Member (50%)</span><span>-{{ formatCurrency(detailTarget.discountAmount) }}</span></div>
          <div class="price-row total"><span>Total Bayar</span><span>{{ formatCurrency(detailTarget.finalAmount || detailTarget.amount) }}</span></div>
        </div>
        <div class="detail-section mt-16">
          <div class="detail-label">Metode Pembayaran</div>
          <span class="method-chip lg">{{ detailTarget.paymentMethod || 'Tunai' }}</span>
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
        <div class="form-actions"><button class="btn btn-secondary" @click="showDetail = false">Tutup</button></div>
      </div>
    </div>

    <!-- Payment Modal -->
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
          <button class="btn btn-sm btn-decline" @click="declinePayment" :disabled="!paymentForm.method">
            <Icon icon="mdi:close-circle-outline" width="13" /> Tolak
          </button>
          <button class="btn btn-primary" @click="submitPayment" :disabled="!paymentForm.method">
            <Icon icon="mdi:check-circle-outline" width="13" /> Terima & Bayar
          </button>
        </div>
      </div>
    </div>

    <!-- Rating Modal -->
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
      search: '',
      filterMethod: '',
      selectedCustomer: '',
      showDetail: false, detailTarget: {},
      showPaymentModal: false, paymentTarget: {}, paymentForm: { method: '', receiptPreview: null },
      showRatingModal: false, ratingTarget: {}, ratingForm: { rating: 0, comment: '' },
    }
  },
  computed: {
    paymentQueue() {
      return store.getPaymentQueue().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    },
    allRecords() {
      return store.getPaidTransactions()
    },
    filteredRecords() {
      let list = this.allRecords
      if (this.filterMethod) list = list.filter(a => (a.paymentMethod || 'Tunai') === this.filterMethod)
      if (this.selectedCustomer) list = list.filter(a => a.customer === this.selectedCustomer)
      if (this.search) {
        const q = this.search.toLowerCase()
        list = list.filter(a => a.customer.toLowerCase().includes(q) || a.barber.toLowerCase().includes(q) || a.service.toLowerCase().includes(q))
      }
      return list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    },
    groupedByDate() {
      const groups = {}
      this.filteredRecords.forEach(apt => {
        if (!groups[apt.date]) groups[apt.date] = []
        groups[apt.date].push(apt)
      })
      const sorted = {}
      Object.keys(groups).sort((a, b) => b.localeCompare(a)).forEach(k => { sorted[k] = groups[k] })
      return sorted
    },
    totalPaid() { return this.allRecords.length },
    totalRevenue() { return this.allRecords.reduce((s, a) => s + (a.finalAmount || a.amount), 0) },
    avgTransaction() { return this.totalPaid > 0 ? Math.round(this.totalRevenue / this.totalPaid) : 0 },
    paymentMember() { return this.paymentTarget.customer ? store.getMemberByName(this.paymentTarget.customer) : null },
    paymentHasDiscount() { return this.paymentMember && this.paymentMember.totalVisits >= 10 },

    customerSummary() {
      const map = {}
      this.allRecords.forEach(a => {
        if (!map[a.customer]) {
          map[a.customer] = { name: a.customer, totalVisits: 0, totalSpent: 0, lastVisit: a.date, services: {}, isMember: this.isMember(a.customer) }
        }
        const c = map[a.customer]
        c.totalVisits++
        c.totalSpent += (a.finalAmount || a.amount)
        if (a.date > c.lastVisit) c.lastVisit = a.date
        c.services[a.service] = (c.services[a.service] || 0) + 1
      })
      return Object.values(map).map(c => {
        const fav = Object.entries(c.services).sort((a, b) => b[1] - a[1])
        c.favoriteService = fav.length > 0 ? fav[0][0] : '-'
        c.lastVisit = this.formatDateShort(c.lastVisit)
        return c
      }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 8)
    },
  },
  methods: {
    formatCurrency(val) { return 'Rp ' + val.toLocaleString('id-ID') },
    formatDateFull(dateStr) {
      const d = new Date(dateStr)
      const today = new Date()
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
      if (dateStr === this.toDateStr(today)) return 'Hari Ini'
      if (dateStr === this.toDateStr(yesterday)) return 'Kemarin'
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    },
    formatDateShort(dateStr) {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    },
    toDateStr(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    },
    groupRevenue(group) { return group.reduce((s, a) => s + (a.finalAmount || a.amount), 0) },
    isMember(name) { return !!store.getMemberByName(name) },
    paymentClass(p) { return { 'Belum Bayar': 'unpaid', 'Lunas': 'paid', 'Ditolak': 'declined' }[p] || 'unpaid' },
    openDetail(apt) { this.detailTarget = apt; this.showDetail = true },
    getReviewRating(id) { const r = store.reviews.find(r => r.appointmentId === id); return r ? r.rating : 0 },
    getReviewComment(id) { const r = store.reviews.find(r => r.appointmentId === id); return r ? r.comment : '' },
    filterByCustomer(name) { this.selectedCustomer = this.selectedCustomer === name ? '' : name },
    clearCustomerFilter() { this.selectedCustomer = '' },
    openPaymentModal(apt) { this.paymentTarget = apt; this.paymentForm = { method: '', receiptPreview: null }; this.showPaymentModal = true },
    handleReceiptUpload(e) { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { this.paymentForm.receiptPreview = ev.target.result }; r.readAsDataURL(f) } },
    submitPayment() { store.confirmPayment(this.paymentTarget.id, this.paymentForm.method, this.paymentForm.receiptPreview); this.showPaymentModal = false },
    declinePayment() { store.declinePayment(this.paymentTarget.id); this.showPaymentModal = false },
    openRatingModal(apt) { this.ratingTarget = apt; this.ratingForm = { rating: 0, comment: '' }; this.showRatingModal = true },
    submitRating() {
      store.addReview({ customer: this.ratingTarget.customer, barber: this.ratingTarget.barber, rating: this.ratingForm.rating, comment: this.ratingForm.comment, date: store.todayStr(), appointmentId: this.ratingTarget.id })
      this.showRatingModal = false
    },
    exportPayments() {
      const csv = store.exportPaymentsCSV()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = 'riwayat_pembayaran.csv'; link.click()
      URL.revokeObjectURL(url)
    },
  },
}
</script>

<style scoped>
/* Stats */
.stats-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card-accent { display: flex; align-items: center; gap: 14px; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 16px 20px; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, transform 0.2s; }
.stat-card-accent:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.stat-card-accent.stat-alert { border-color: #f0d080; background: linear-gradient(135deg, #fffdf8 0%, #fff9ee 100%); }
.stat-icon-wrap { width: 44px; height: 44px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-card-value { font-size: 1.25rem; font-weight: 700; color: var(--dark); line-height: 1.2; }
.stat-card-label { font-size: 0.6875rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; }

/* Payment Queue */
.payment-queue-card { border-color: #f0d080; background: linear-gradient(180deg, #fffdf8 0%, var(--white) 100%); }
.header-title-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.queue-badge { font-size: 0.6875rem; font-weight: 600; background: #fff5e0; color: #a67a00; padding: 3px 10px; border-radius: 20px; }
.queue-hint { font-size: 0.75rem; color: var(--gray-400); margin-top: 4px; width: 100%; }
.queue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.queue-item { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 14px; transition: box-shadow 0.2s; }
.queue-item:hover { box-shadow: var(--shadow-md); }
.queue-item.queue-declined { border-color: #f0c0c0; background: #fffafa; }
.queue-item-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.queue-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--maroon-light), var(--maroon)); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; flex-shrink: 0; }
.queue-info { flex: 1; min-width: 0; }
.queue-customer { font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 4px; }
.queue-service { font-size: 0.75rem; color: var(--gray-400); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.queue-amount { font-weight: 700; color: var(--maroon); font-size: 0.875rem; flex-shrink: 0; }
.queue-item-meta { display: flex; align-items: center; gap: 10px; font-size: 0.6875rem; color: var(--gray-500); margin-bottom: 10px; flex-wrap: wrap; }
.queue-item-meta span { display: flex; align-items: center; gap: 3px; }
.queue-pay-btn { width: 100%; justify-content: center; }

/* Layout */
.riwayat-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }
.history-subtitle { font-size: 0.6875rem; color: var(--gray-400); font-weight: 400; }
.history-filters { flex-wrap: wrap; }
.filter-select { padding: 6px 10px; font-size: 0.8125rem; border-radius: var(--radius-sm); border: 1px solid var(--gray-200); }

/* Timeline History */
.history-timeline { position: relative; }
.timeline-group { margin-bottom: 20px; }
.timeline-date { display: flex; align-items: center; gap: 10px; padding: 8px 0 12px; position: relative; }
.timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--maroon); flex-shrink: 0; box-shadow: 0 0 0 3px var(--maroon-bg); }
.timeline-date-label { font-size: 0.875rem; font-weight: 600; color: var(--maroon-dark); }
.timeline-date-revenue { font-size: 0.75rem; font-weight: 600; color: #1a7a3a; background: #e7f5ec; padding: 2px 8px; border-radius: 12px; }
.timeline-date-count { font-size: 0.6875rem; color: var(--gray-400); margin-left: auto; }
.timeline-entries { border-left: 2px solid var(--gray-100); margin-left: 4px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }

.history-entry { background: var(--gray-50); border: 1px solid var(--gray-100); border-radius: var(--radius-md); padding: 14px 16px; display: flex; gap: 14px; transition: all 0.15s; }
.history-entry:hover { background: var(--white); border-color: var(--gray-200); box-shadow: var(--shadow-sm); }
.he-time { font-size: 0.75rem; font-weight: 600; color: var(--gray-400); min-width: 44px; padding-top: 4px; font-variant-numeric: tabular-nums; }
.he-body { flex: 1; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.he-main { flex: 1; }
.he-customer-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.he-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--maroon-light), var(--maroon)); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
.he-customer { font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 4px; }
.he-service { font-size: 0.8125rem; color: var(--gray-500); }
.he-barber { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--gray-400); margin-top: 6px; }
.he-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; min-width: 140px; }
.he-amount { font-size: 0.9375rem; text-align: right; }
.he-meta { display: flex; gap: 6px; align-items: center; }
.method-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 0.6875rem; color: var(--gray-500); background: var(--white); border: 1px solid var(--gray-200); padding: 2px 8px; border-radius: 12px; }
.method-chip.lg { font-size: 0.8125rem; padding: 4px 12px; }
.discount-chip { font-size: 0.625rem; font-weight: 700; color: #1a7a3a; background: #e7f5ec; padding: 2px 6px; border-radius: 8px; }
.he-actions { display: flex; gap: 4px; align-items: center; }
.rating-done { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; color: var(--gold-dark); font-weight: 600; }
.history-empty { padding: 48px 20px; }

/* Customer Sidebar */
.customer-sidebar { position: sticky; top: 84px; }
.sidebar-card { max-height: calc(100vh - 120px); display: flex; flex-direction: column; }
.customer-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; }
.cust-card { position: relative; padding: 10px 12px 10px 28px; border: 1px solid var(--gray-100); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.15s; }
.cust-card:hover { background: var(--gray-50); border-color: var(--gray-200); }
.cust-card.cust-active { background: var(--maroon-bg); border-color: var(--maroon-glow); }
.cust-rank { position: absolute; left: 8px; top: 12px; font-size: 0.625rem; font-weight: 700; color: var(--gray-300); }
.cust-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.cust-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--maroon-light), var(--maroon)); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; flex-shrink: 0; }
.cust-info { flex: 1; min-width: 0; }
.cust-name { font-size: 0.8125rem; font-weight: 600; display: flex; align-items: center; }
.cust-stats { font-size: 0.6875rem; color: var(--gray-400); }
.cust-meta { display: flex; flex-direction: column; gap: 3px; }
.cust-meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.6875rem; color: var(--gray-500); }

/* Modals */
.modal-detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.modal-id { font-size: 0.75rem; color: var(--gray-400); }
.payment-modal-info, .booking-summary { background: var(--gray-50); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; }
.summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.8125rem; }
.detail-section { margin-bottom: 14px; }
.detail-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-500); margin-bottom: 6px; font-weight: 500; }
.receipt-preview { margin-top: 10px; border: 1px solid var(--gray-200); border-radius: var(--radius-sm); overflow: hidden; }
.receipt-preview img { width: 100%; max-height: 200px; object-fit: contain; display: block; }
.btn-rating { background: #fff5e0; color: #a67a00; }
.btn-rating:hover { background: #ffecbf; }
.btn-decline { background: #fde8e8; color: #b02a2a; }
.btn-decline:hover { background: #fad4d4; }
.file-input { border: none; padding: 0; font-size: 0.8125rem; }
.star-picker { display: flex; gap: 6px; }
.star-pick { font-size: 1.75rem; color: var(--gray-200); cursor: pointer; transition: color 0.15s; }
.star-pick.active { color: var(--gold); }
.star-pick:hover { color: var(--gold-light); }

@media (max-width: 1100px) {
  .stats-grid-4 { grid-template-columns: repeat(2, 1fr); }
  .riwayat-layout { grid-template-columns: 1fr; }
  .customer-sidebar { position: static; }
}
</style>
