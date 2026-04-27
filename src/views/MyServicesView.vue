<template>
  <div>
    <div class="card mb-24">
      <div class="card-header">
        <h3>Profil Barber</h3>
      </div>
      <div v-if="barberData" class="profile-section">
        <div class="flex-gap mb-16">
          <div class="avatar-lg">{{ barberData.avatar }}</div>
          <div>
            <div style="font-weight: 600; font-size: 1rem;">{{ barberData.name }}</div>
            <div class="text-sm text-muted">{{ barberData.role }} — {{ barberData.phone }}</div>
            <div class="text-sm text-muted mt-8">
              Jam Kerja: 
              <strong v-if="barberData.workStart && barberData.workEnd">{{ barberData.workStart }} - {{ barberData.workEnd }}</strong>
              <span v-else>Belum diatur (hubungi admin)</span>
            </div>
          </div>
        </div>
        <div class="flex-gap">
          <div class="mini-stat">
            <div class="mini-stat-value">{{ myAppointments.length }}</div>
            <div class="mini-stat-label">Total Booking</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-value gold">{{ barberData.rating }}</div>
            <div class="mini-stat-label">Rating</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-value">{{ barberData.totalReviews }}</div>
            <div class="mini-stat-label">Ulasan</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>Data barber tidak ditemukan.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Layanan yang Saya Kuasai</h3>
        <p class="text-sm text-muted">Centang layanan yang bisa Anda lakukan</p>
      </div>

      <div v-if="store.services.length === 0" class="empty-state">
        <div class="empty-icon"><Icon icon="mdi:content-cut" width="36" /></div>
        <p>Belum ada layanan terdaftar. Hubungi admin untuk menambahkan layanan.</p>
      </div>

      <div v-else class="service-checklist">
        <div v-for="svc in store.services" :key="svc.id" class="service-check-item" :class="{ active: isServiceEnabled(svc.id) }">
          <label class="check-label">
            <input type="checkbox" :checked="isServiceEnabled(svc.id)" @change="toggleService(svc.id)" />
            <div class="check-content">
              <div class="check-name">{{ svc.name }}</div>
              <div class="check-desc">{{ svc.description }} — {{ formatCurrency(svc.price) }} · {{ svc.duration }}</div>
            </div>
          </label>
        </div>
      </div>
      <p class="text-sm text-muted" style="margin-top: 12px; padding: 0 4px;">
        Hanya layanan yang dicentang yang akan ditampilkan saat pelanggan memilih Anda sebagai barber.
      </p>
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
    barberData() { return store.getCurrentBarber() },
    myAppointments() {
      if (!this.barberData) return []
      return store.appointments.filter(a => a.barber === this.barberData.name)
    },
  },
  methods: {
    formatCurrency(val) { return 'Rp ' + val.toLocaleString('id-ID') },
    isServiceEnabled(serviceId) {
      if (!this.barberData) return false
      if (!this.barberData.myServices) return false
      return this.barberData.myServices.includes(serviceId)
    },
    toggleService(serviceId) {
      if (!this.barberData) return
      if (!this.barberData.myServices) this.barberData.myServices = []
      const idx = this.barberData.myServices.indexOf(serviceId)
      if (idx > -1) {
        this.barberData.myServices.splice(idx, 1)
      } else {
        this.barberData.myServices.push(serviceId)
      }
    },
  },
}
</script>

<style scoped>
.profile-section { padding: 4px 0; }
.avatar-lg { width: 56px; height: 56px; border-radius: 50%; background: var(--maroon); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem; flex-shrink: 0; }
.mini-stat { text-align: center; padding: 12px 20px; background: var(--gray-50); border-radius: var(--radius-sm); min-width: 80px; }
.mini-stat-value { font-size: 1.25rem; font-weight: 700; color: var(--maroon-dark); }
.mini-stat-value.gold { color: var(--gold-dark); }
.mini-stat-label { font-size: 0.6875rem; color: var(--gray-500); margin-top: 2px; }
.service-checklist { display: flex; flex-direction: column; gap: 8px; }
.service-check-item { border: 1px solid var(--gray-200); border-radius: var(--radius-sm); padding: 12px 16px; transition: all 0.2s; }
.service-check-item.active { border-color: var(--maroon); background: var(--maroon-bg); }
.check-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; }
.check-label input[type="checkbox"] { margin-top: 3px; accent-color: var(--maroon); width: 16px; height: 16px; cursor: pointer; }
.check-name { font-weight: 600; font-size: 0.875rem; }
.check-desc { font-size: 0.75rem; color: var(--gray-500); margin-top: 2px; }
</style>
