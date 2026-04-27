<template>
  <div>
    <!-- Role List -->
    <div class="card mb-24">
      <div class="card-header">
        <h3>Peran yang Tersedia</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Nama Peran</th>
            <th>Deskripsi</th>
            <th>Hak Akses</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in store.roles" :key="role.id">
            <td style="font-weight: 600;">{{ role.name }}</td>
            <td>{{ role.description }}</td>
            <td>
              <span class="permission-tag" v-for="p in role.permissions" :key="p">{{ formatPermission(p) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Assign Roles -->
    <div class="card">
      <div class="card-header">
        <h3>Tetapkan Peran ke Barber</h3>
      </div>
      <div v-if="store.barbers.length === 0" class="empty-state">
        <div class="empty-icon"><Icon icon="mdi:shield-account-outline" width="36" /></div>
        <p>Belum ada barber terdaftar.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Peran Saat Ini</th>
            <th>Ubah Peran</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="barber in store.barbers" :key="barber.id">
            <td>
              <div class="flex-gap">
                <div class="avatar">{{ barber.avatar }}</div>
                <span style="font-weight: 500;">{{ barber.name }}</span>
              </div>
            </td>
            <td><span class="badge badge-aktif">{{ barber.role }}</span></td>
            <td>
              <select v-model="barber.role" style="padding: 6px 10px; font-size: 0.8125rem;">
                <option v-for="role in store.roles" :key="role.id" :value="role.name">{{ role.name }}</option>
              </select>
            </td>
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
    return { store }
  },
  methods: {
    formatPermission(p) {
      return p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    },
  },
}
</script>

<style scoped>
.permission-tag {
  display: inline-block;
  padding: 2px 8px;
  margin: 2px 4px 2px 0;
  background: var(--gray-100);
  border-radius: 4px;
  font-size: 0.6875rem;
  color: var(--gray-500);
}
</style>
