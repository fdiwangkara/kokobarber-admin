<template>
  <div>
    <div class="stats-grid-5">
      <div class="stat-card">
        <div class="stat-label">Total Barber</div>
        <div class="stat-value">{{ activeBarbers.length }}</div>
        <div class="stat-sub">{{ activeBarbers.filter(b => b.available).length }} tersedia hari ini</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Appointment Hari Ini</div>
        <div class="stat-value maroon">{{ todayAppointments.length }}</div>
        <div class="stat-sub">{{ confirmedToday }} dikonfirmasi</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pendapatan Hari Ini</div>
        <div class="stat-value">{{ formatCurrency(todayRevenue) }}</div>
        <div class="stat-sub">dari {{ paidToday }} transaksi</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Rating Rata-rata</div>
        <div class="stat-value gold">{{ avgRating }}</div>
        <div class="stat-sub">dari {{ totalReviews }} ulasan</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Member</div>
        <div class="stat-value maroon">{{ store.members.length }}</div>
        <div class="stat-sub">{{ discountReady }} siap diskon</div>
      </div>
    </div>

    <!-- Grafik Baris 1 -->
    <div class="grid-2 mb-24">
      <div class="chart-card">
        <h3>Pendapatan 7 Hari Terakhir</h3>
        <apexchart type="area" height="280" :options="revenueChartOptions" :series="revenueChartSeries" />
      </div>
      <div class="chart-card">
        <h3>Status Appointment</h3>
        <apexchart type="donut" height="280" :options="statusChartOptions" :series="statusChartSeries" />
      </div>
    </div>

    <!-- Grafik Baris 2 -->
    <div class="grid-2 mb-24">
      <div class="chart-card">
        <h3>Performa Barber</h3>
        <apexchart type="bar" height="280" :options="barberChartOptions" :series="barberChartSeries" />
      </div>
      <div class="chart-card">
        <h3>Layanan Populer</h3>
        <apexchart type="polarArea" height="280" :options="serviceChartOptions" :series="serviceChartSeries" />
      </div>
    </div>

    <!-- Tabel Data -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3>Appointment Terbaru</h3>
        </div>
        <div v-if="todayAppointments.length === 0" class="empty-state">
          <div class="empty-icon"><Icon icon="mdi:calendar-blank-outline" width="36" /></div>
          <p>Belum ada appointment hari ini.</p>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>Barber</th>
              <th>Layanan</th>
              <th>Waktu</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in todayAppointments" :key="apt.id">
              <td>{{ apt.customer }}</td>
              <td>{{ apt.barber }}</td>
              <td>{{ apt.service }}</td>
              <td>{{ apt.time }}</td>
              <td><span :class="'badge badge-' + statusClass(apt.status)">{{ apt.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Barber Tersedia</h3>
        </div>
        <div v-if="activeBarbers.length === 0" class="empty-state">
          <div class="empty-icon"><Icon icon="mdi:account-off-outline" width="36" /></div>
          <p>Belum ada barber terdaftar.</p>
        </div>
        <div v-else>
          <div v-for="barber in activeBarbers" :key="barber.id" class="barber-row">
            <div class="flex-gap">
              <div class="avatar">{{ barber.avatar }}</div>
              <div>
                <div class="barber-name">{{ barber.name }}</div>
                <div class="text-sm text-muted">{{ barber.role }}</div>
              </div>
            </div>
            <span :class="'badge ' + (barber.available ? 'badge-aktif' : 'badge-tidak-aktif')">
              {{ barber.available ? 'Tersedia' : 'Tidak Tersedia' }}
            </span>
          </div>
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
    return { store }
  },
  computed: {
    currentBarber() { return store.getCurrentBarber() },
    activeBarbers() {
      return store.barbers.filter(b => b.status === 'Aktif' && b.role === 'Barber')
    },
    myAppointments() {
      // Barber sees only their own
      if (store.isBarber() && this.currentBarber) {
        return store.appointments.filter(a => a.barber === this.currentBarber.name)
      }
      return store.appointments
    },
    todayAppointments() {
      const today = this.todayStr()
      return this.myAppointments.filter(a => a.date === today)
    },
    confirmedToday() {
      return this.todayAppointments.filter(a => a.status === 'Dikonfirmasi').length
    },
    todayRevenue() {
      return this.todayAppointments.filter(a => a.payment === 'Lunas').reduce((sum, a) => sum + (a.finalAmount || a.amount), 0)
    },
    paidToday() {
      return this.todayAppointments.filter(a => a.payment === 'Lunas').length
    },
    avgRating() {
      if (store.isBarber() && this.currentBarber) {
        return this.currentBarber.rating.toFixed(1)
      }
      const rated = store.barbers.filter(b => b.totalReviews > 0)
      if (rated.length === 0) return '0'
      return (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1)
    },
    totalReviews() {
      if (store.isBarber() && this.currentBarber) {
        return store.reviews.filter(r => r.barber === this.currentBarber.name).length
      }
      return store.reviews.length
    },
    discountReady() {
      return store.members.filter(m => m.totalVisits >= 10).length
    },

    // ===== Grafik =====
    revenueChartOptions() {
      const days = this.getLast7Days()
      return {
        chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Inter, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 1000, animateGradually: { enabled: true, delay: 150 }, dynamicAnimation: { enabled: true, speed: 350 } }, dropShadow: { enabled: true, top: 3, left: 0, blur: 6, color: '#6B1024', opacity: 0.15 } },
        colors: ['#6B1024'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100], colorStops: [{ offset: 0, color: '#6B1024', opacity: 0.3 }, { offset: 100, color: '#6B1024', opacity: 0.02 }] } },
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: days.map(d => this.formatShortDate(d)), labels: { style: { fontSize: '11px', colors: '#706872' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#706872' }, formatter: (v) => 'Rp ' + (v / 1000) + 'k' } },
        grid: { borderColor: '#f3f0f2', strokeDashArray: 4, padding: { left: 10, right: 10 } },
        tooltip: { y: { formatter: (v) => 'Rp ' + v.toLocaleString('id-ID') }, theme: 'light', style: { fontSize: '12px' } },
      }
    },
    revenueChartSeries() {
      const days = this.getLast7Days()
      const data = days.map(day => store.appointments.filter(a => a.date === day && a.payment === 'Lunas').reduce((sum, a) => sum + (a.finalAmount || a.amount), 0))
      return [{ name: 'Pendapatan', data }]
    },

    statusChartOptions() {
      return {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 800, animateGradually: { enabled: true, delay: 200 } } },
        labels: ['Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'],
        colors: ['#D4A820', '#6B1024', '#2a5db0', '#ccc5ca'],
        stroke: { width: 2, colors: ['#fff'] },
        dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 600 }, dropShadow: { enabled: false } },
        legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#706872' }, markers: { radius: 3 } },
        plotOptions: { pie: { donut: { size: '60%', labels: { show: true, name: { fontSize: '13px', color: '#1a1118' }, value: { fontSize: '22px', fontWeight: 700, color: '#6B1024' }, total: { show: true, label: 'Total', fontSize: '12px', color: '#706872', formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } }, expandOnClick: true } },
        tooltip: { style: { fontSize: '12px' } },
      }
    },
    statusChartSeries() {
      return [
        store.appointments.filter(a => a.status === 'Menunggu').length,
        store.appointments.filter(a => a.status === 'Dikonfirmasi').length,
        store.appointments.filter(a => a.status === 'Selesai').length,
        store.appointments.filter(a => a.status === 'Dibatalkan').length,
      ]
    },

    barberChartOptions() {
      const barberNames = this.activeBarbers.map(b => b.name.split(' ')[0])
      return {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 800, animateGradually: { enabled: true, delay: 100 } } },
        plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', distributed: false, dataLabels: { position: 'top' } } },
        colors: ['#6B1024', '#D4A820'],
        dataLabels: { enabled: true, offsetY: -20, style: { fontSize: '11px', colors: ['#706872'] } },
        xaxis: { categories: barberNames, labels: { style: { fontSize: '11px', colors: '#706872' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#706872' } } },
        grid: { borderColor: '#f3f0f2', strokeDashArray: 4 },
        legend: { position: 'top', fontSize: '12px', labels: { colors: '#706872' } },
        tooltip: { theme: 'light', style: { fontSize: '12px' } },
      }
    },
    barberChartSeries() {
      return [
        { name: 'Appointment', data: this.activeBarbers.map(b => store.appointments.filter(a => a.barber === b.name).length) },
        { name: 'Rating', data: this.activeBarbers.map(b => b.rating) }
      ]
    },

    serviceChartOptions() {
      return {
        chart: { type: 'polarArea', fontFamily: 'Inter, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 1000, animateGradually: { enabled: true, delay: 150 } } },
        labels: store.services.map(s => s.name),
        colors: ['#6B1024', '#8B1E38', '#4A0B1A', '#D4A820', '#B08C18', '#9e95a0'],
        stroke: { width: 1, colors: ['#fff'] },
        fill: { opacity: 0.85 },
        legend: { position: 'bottom', fontSize: '11px', labels: { colors: '#706872' }, markers: { radius: 3 } },
        plotOptions: { polarArea: { rings: { strokeColor: '#f3f0f2' }, spokes: { strokeColor: '#f3f0f2' } } },
        yaxis: { show: false },
        tooltip: { style: { fontSize: '12px' } },
      }
    },
    serviceChartSeries() {
      return store.services.map(s => store.appointments.filter(a => a.service === s.name).length)
    },
  },
  methods: {
    formatCurrency(val) { return 'Rp ' + val.toLocaleString('id-ID') },
    todayStr() {
      const d = new Date()
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
    },
    getLast7Days() {
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        days.push(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'))
      }
      return days
    },
    formatShortDate(dateStr) {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    },
    statusClass(status) {
      const map = { 'Menunggu': 'pending', 'Dikonfirmasi': 'confirmed', 'Selesai': 'done', 'Dibatalkan': 'cancelled' }
      return map[status] || 'pending'
    },
  },
}
</script>

<style scoped>
.barber-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--gray-100); }
.barber-row:last-child { border-bottom: none; }
.barber-name { font-size: 0.8125rem; font-weight: 500; }
</style>
