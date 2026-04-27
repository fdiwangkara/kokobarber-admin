<template>
  <div>
    <div class="grid-2 mb-24">
      <!-- Jam Operasional -->
      <div class="card">
        <div class="card-header">
          <h3>Jam Operasional</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Hari</th>
              <th>Jam</th>
              <th>Status</th>
              <th class="text-right">Buka/Tutup</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(slot, i) in store.scheduleSlots" :key="slot.day">
              <td style="font-weight: 500;">{{ slot.day }}</td>
              <td>{{ slot.open ? slot.hours : '-' }}</td>
              <td>
                <span :class="'badge ' + (slot.open ? 'badge-open' : 'badge-closed')">
                  {{ slot.open ? 'Buka' : 'Tutup' }}
                </span>
              </td>
              <td class="text-right">
                <label class="toggle">
                  <input type="checkbox" :checked="slot.open" @change="toggleDay(i)" />
                  <span class="toggle-slider"></span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Barber Schedule -->
      <div class="card">
        <div class="card-header">
          <h3>Jadwal Barber Hari Ini</h3>
        </div>
        <div v-if="availableBarbers.length === 0" class="empty-state">
          <div class="empty-icon"><Icon icon="mdi:account-clock-outline" width="36" /></div>
          <p>Belum ada barber terdaftar.</p>
        </div>
        <div v-else>
          <div v-for="barber in availableBarbers" :key="barber.id" class="schedule-barber-row">
            <div class="flex-gap">
              <div class="avatar">{{ barber.avatar }}</div>
              <div>
                <div style="font-weight: 500; font-size: 0.8125rem;">{{ barber.name }}</div>
                <div class="text-sm text-muted">{{ barberAppointments(barber.name).length }} booking hari ini</div>
              </div>
            </div>
            <span :class="'badge ' + (barber.available ? 'badge-aktif' : 'badge-tidak-aktif')">
              {{ barber.available ? 'Tersedia' : 'Sibuk' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- All Appointments -->
    <div class="card">
      <div class="card-header">
        <h3>Semua Appointment</h3>
        <div class="flex-gap">
          <select v-model="filterStatus" style="padding: 6px 10px; font-size: 0.8125rem;">
            <option value="">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Dikonfirmasi">Dikonfirmasi</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>
      <div v-if="filteredAppointments.length === 0" class="empty-state">
        <div class="empty-icon"><Icon icon="mdi:calendar-blank-outline" width="36" /></div>
        <p>Belum ada appointment.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Pelanggan</th>
            <th>Barber</th>
            <th>Layanan</th>
            <th>Tanggal</th>
            <th>Waktu</th>
            <th>Status</th>
            <th>Pembayaran</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="apt in filteredAppointments" :key="apt.id">
            <td style="font-weight: 500;">{{ apt.customer }}</td>
            <td>{{ apt.barber }}</td>
            <td>{{ apt.service }}</td>
            <td>{{ apt.date }}</td>
            <td>{{ apt.time }}</td>
            <td><span :class="'badge badge-' + statusClass(apt.status)">{{ apt.status }}</span></td>
            <td><span :class="'badge badge-' + paymentClass(apt.payment)">{{ apt.payment }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { Icon } from '@iconify/vue'
import { store } from '../store.js'

export default {
  components: { Icon },
  data() {
    return { store, filterStatus: '' }
  },
  computed: {
    availableBarbers() {
      return store.barbers.filter(b => b.status === 'Aktif' && b.role === 'Barber')
    },
    filteredAppointments() {
      if (!this.filterStatus) return store.appointments
      return store.appointments.filter(a => a.status === this.filterStatus)
    },
  },
  methods: {
    toggleDay(i) {
      store.scheduleSlots[i].open = !store.scheduleSlots[i].open
    },
    barberAppointments(name) {
      const d = new Date()
      const today = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
      return store.appointments.filter(a => a.barber === name && a.date === today)
    },
    statusClass(status) {
      const map = { 'Menunggu': 'pending', 'Dikonfirmasi': 'confirmed', 'Selesai': 'done', 'Dibatalkan': 'cancelled' }
      return map[status] || 'pending'
    },
    paymentClass(payment) {
      const map = { 'Belum Bayar': 'unpaid', 'Lunas': 'paid' }
      return map[payment] || 'unpaid'
    },
  },
}
</script>

<style scoped>
.schedule-barber-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-100);
}
.schedule-barber-row:last-child {
  border-bottom: none;
}
</style>
