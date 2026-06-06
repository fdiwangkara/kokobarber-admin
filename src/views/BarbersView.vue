<template>
  <div>
    <div class="flex-between mb-24">
      <div class="search-input">
        <Icon icon="mdi:magnify" class="search-icon" width="16" />
        <input v-model="search" placeholder="Cari akun..." />
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <Icon icon="mdi:plus" width="16" /> Tambah Akun
      </button>
    </div>

    <div class="card">
      <div v-if="filteredBarbers.length === 0" class="empty-state">
        <div class="empty-icon"><Icon icon="mdi:account-group-outline" width="40" /></div>
        <p>Belum ada akun. Tambahkan akun pertama Anda.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Telepon</th>
            <th>Peran</th>
            <th>Username</th>
            <th>Shift</th>
            <th>Rating</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="barber in filteredBarbers" :key="barber.id">
            <td>
              <div class="flex-gap">
                <div class="avatar">{{ barber.avatar }}</div>
                <span style="font-weight: 500;">{{ barber.name }}</span>
              </div>
            </td>
            <td>{{ barber.phone }}</td>
            <td>{{ barber.role }}</td>
            <td>
              <span v-if="barber.username" class="text-sm">{{ barber.username }}</span>
              <span v-else class="text-sm text-muted">-</span>
            </td>
            <td>
              <span v-if="barber.shift" class="badge badge-shift">{{ barber.shift }}
                <span class="text-sm text-muted" style="margin-left: 4px;">{{ getShiftHours(barber.shift) }}</span>
              </span>
              <span v-else class="text-sm text-muted">Belum diatur</span>
            </td>
            <td>
              <span class="inline-flex">
                <span class="stars">★</span> {{ barber.rating }}
              </span>
            </td>
            <td class="text-right">
              <button class="btn-icon" @click="openModal(barber)" title="Edit">
                <Icon icon="mdi:pencil-outline" width="15" />
              </button>
              <button class="btn-icon" @click="confirmDelete(barber)" title="Hapus" style="margin-left:4px;">
                <Icon icon="mdi:trash-can-outline" width="15" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tambah/Edit -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editing ? 'Edit Akun' : 'Tambah Akun' }}</h2>
        <div class="form-group">
          <label>Nama Lengkap</label>
          <input v-model="form.name" placeholder="Nama lengkap" />
        </div>
        <div class="form-group">
          <label>No. Telepon</label>
          <input v-model="form.phone" placeholder="08xx-xxxx-xxxx" />
        </div>
        <div class="form-group">
          <label>Peran</label>
          <select v-model="form.role">
            <option>Barber</option>
            <option>Cashier</option>
          </select>
        </div>

        <!-- Shift (hanya untuk Barber) -->
        <div class="work-hours-section" v-if="form.role === 'Barber'">
          <div class="section-divider"><span>Shift Kerja</span></div>
          <div class="form-group">
            <label>Pilih Shift</label>
            <select v-model="form.shift">
              <option value="">-- Pilih Shift --</option>
              <option v-for="(info, name) in shifts" :key="name" :value="name">{{ name }} ({{ info.start }} - {{ info.end }})</option>
            </select>
          </div>
          <p class="text-sm text-muted" style="margin-top: -6px;">Jika tidak diatur, barber dianggap tersedia sepanjang jam operasional.</p>
        </div>

        <!-- Akun Login -->
        <div v-if="!editing">
          <div class="section-divider"><span>Akun Login</span></div>
          <div class="form-group">
            <label>Username</label>
            <input v-model="form.username" placeholder="Username untuk login" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input v-model="form.password" type="password" placeholder="Password untuk login" />
          </div>
          <p v-if="accountError" class="text-sm" style="color: #b02a2a; margin-bottom: 8px;">{{ accountError }}</p>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="showModal = false">Batal</button>
          <button class="btn btn-primary" @click="saveBarber">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click.self="showDeleteConfirm = false">
      <div class="modal confirm-modal">
        <div class="confirm-icon"><Icon icon="mdi:alert-circle-outline" width="40" /></div>
        <h2>Hapus Akun</h2>
        <p class="confirm-msg">Apakah Anda yakin ingin menghapus <strong>{{ deleteTarget?.name }}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">Batal</button>
          <button class="btn btn-danger" @click="doDelete">Hapus</button>
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
      search: '',
      showModal: false,
      editing: null,
      form: { name: '', phone: '', role: 'Barber', username: '', password: '', shift: '' },
      accountError: '',
      showDeleteConfirm: false,
      deleteTarget: null,
      shifts: SHIFTS,
    }
  },
  computed: {
    filteredBarbers() {
      if (!this.search) return store.barbers
      const q = this.search.toLowerCase()
      return store.barbers.filter(b => b.name.toLowerCase().includes(q) || b.phone.includes(q))
    },
  },
  methods: {
    openModal(barber) {
      this.accountError = ''
      if (barber) {
        this.editing = barber.id
        this.form = { name: barber.name, phone: barber.phone, role: barber.role, username: '', password: '', shift: barber.shift || '' }
      } else {
        this.editing = null
        this.form = { name: '', phone: '', role: 'Barber', username: '', password: '', shift: '' }
      }
      this.showModal = true
    },
    saveBarber() {
      this.accountError = ''
      if (!this.editing) {
        if (!this.form.username || !this.form.password) { this.accountError = 'Username dan password wajib diisi.'; return }
        if (this.form.password.length < 4) { this.accountError = 'Password minimal 4 karakter.'; return }
        const success = store.addAccount(this.form.username, this.form.password, this.form.name, this.form.role)
        if (!success) { this.accountError = 'Username sudah digunakan.'; return }
      }
      if (this.editing) {
        const b = store.barbers.find(b => b.id === this.editing)
        if (b) {
          b.name = this.form.name
          b.phone = this.form.phone
          b.role = this.form.role
          b.status = 'Aktif'
          b.shift = this.form.shift || ''
        }
      } else {
        const newId = store.barbers.length > 0 ? Math.max(...store.barbers.map(b => b.id)) + 1 : 1
        const initials = this.form.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)
        store.barbers.push({
          id: newId, name: this.form.name, phone: this.form.phone, role: this.form.role, status: 'Aktif',
          rating: 0, totalReviews: 0, avatar: initials, available: true, username: this.form.username,
          shift: this.form.shift || '',
        })
      }
      this.showModal = false
    },
    confirmDelete(barber) { this.deleteTarget = barber; this.showDeleteConfirm = true },
    doDelete() {
      if (this.deleteTarget.username) store.removeAccount(this.deleteTarget.username)
      const idx = store.barbers.findIndex(b => b.id === this.deleteTarget.id)
      if (idx > -1) store.barbers.splice(idx, 1)
      this.showDeleteConfirm = false
    },
    getShiftHours(shiftName) {
      const shift = SHIFTS[shiftName]
      if (!shift) return ''
      return `(${shift.start} - ${shift.end})`
    },
  },
}
</script>

<style scoped>
.section-divider { border-top: 1px solid var(--gray-200); padding-top: 14px; margin-top: 6px; margin-bottom: 14px; }
.section-divider span { font-size: 0.6875rem; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
.grid-2-compact { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.badge-shift { background: #edf0ff; color: #3a4eb0; }
</style>
