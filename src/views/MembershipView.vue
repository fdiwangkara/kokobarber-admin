<template>
  <div>
    <!-- Statistik -->
    <div class="stats-grid mb-24">
      <div class="stat-card">
        <div class="stat-label">Total Member</div>
        <div class="stat-value maroon">{{ store.members.length }}</div>
        <div class="stat-sub">pelanggan terdaftar</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Siap Diskon</div>
        <div class="stat-value gold">{{ discountReadyCount }}</div>
        <div class="stat-sub">sudah 10/10 kunjungan</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Kunjungan</div>
        <div class="stat-value">{{ totalVisitsAll }}</div>
        <div class="stat-sub">dari semua member</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Rata-rata Kunjungan</div>
        <div class="stat-value">{{ avgVisits }}</div>
        <div class="stat-sub">per member</div>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <!-- Form Tambah Member -->
      <div class="card">
        <div class="card-header">
          <h3>{{ editingMember ? 'Edit Member' : 'Tambah Member Baru' }}</h3>
        </div>
        <div class="form-group">
          <label>Nama Pelanggan</label>
          <input v-model="form.name" placeholder="Nama lengkap" />
        </div>
        <div class="form-group">
          <label>No. Telepon</label>
          <input v-model="form.phone" placeholder="08xx-xxxx-xxxx" />
        </div>
        <p v-if="formError" class="text-sm" style="color: #b02a2a; margin-bottom: 8px;">{{ formError }}</p>
        <div class="form-actions">
          <button v-if="editingMember" class="btn btn-secondary" @click="cancelEdit">Batal</button>
          <button class="btn btn-primary" @click="saveMember" :disabled="!form.name || !form.phone">
            <Icon :icon="editingMember ? 'mdi:check' : 'mdi:account-plus-outline'" width="16" />
            {{ editingMember ? 'Simpan Perubahan' : 'Daftarkan Member' }}
          </button>
        </div>
      </div>

      <!-- Info Membership -->
      <div class="card">
        <div class="card-header">
          <h3>Info Membership</h3>
        </div>
        <div class="info-section">
          <div class="info-item">
            <Icon icon="mdi:card-account-details-star-outline" width="20" class="info-icon" />
            <div>
              <div class="info-title">Cara Kerja Membership</div>
              <div class="info-desc">Setiap kunjungan yang sudah dibayar akan menambah 1 poin kunjungan. Setelah mencapai 10/10 kunjungan, member berhak mendapatkan diskon 50% pada pembayaran berikutnya.</div>
            </div>
          </div>
          <div class="info-item">
            <Icon icon="mdi:percent-circle-outline" width="20" class="info-icon" />
            <div>
              <div class="info-title">Diskon 50%</div>
              <div class="info-desc">Diskon otomatis diterapkan saat pembayaran ketika member sudah 10/10. Setelah diskon digunakan, kunjungan direset ke 0.</div>
            </div>
          </div>
          <div class="info-item">
            <Icon icon="mdi:refresh" width="20" class="info-icon" />
            <div>
              <div class="info-title">Reset Otomatis</div>
              <div class="info-desc">Setelah diskon digunakan, penghitung kunjungan direset dan mulai dari 1 lagi.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabel Member -->
    <div class="card">
      <div class="card-header">
        <h3>Daftar Member</h3>
        <div class="search-input">
          <Icon icon="mdi:magnify" class="search-icon" width="16" />
          <input v-model="search" placeholder="Cari member..." />
        </div>
      </div>
      <div v-if="filteredMembers.length === 0" class="empty-state">
        <div class="empty-icon"><Icon icon="mdi:account-group-outline" width="36" /></div>
        <p>Belum ada member terdaftar.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Telepon</th>
            <th>Tgl Daftar</th>
            <th>Progress Kunjungan</th>
            <th>Status</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in filteredMembers" :key="member.id">
            <td>
              <div class="flex-gap">
                <div class="avatar">{{ getInitials(member.name) }}</div>
                <span style="font-weight: 500;">{{ member.name }}</span>
              </div>
            </td>
            <td>{{ member.phone }}</td>
            <td>{{ member.joinDate }}</td>
            <td>
              <div class="visit-progress">
                <div class="progress-bar">
                  <div class="progress-bar-fill" :class="{ full: member.totalVisits >= 10 }" :style="{ width: (member.totalVisits / 10 * 100) + '%' }"></div>
                </div>
                <span class="progress-text" :class="{ full: member.totalVisits >= 10 }">{{ member.totalVisits }}/10</span>
              </div>
            </td>
            <td>
              <span v-if="member.totalVisits >= 10" class="badge badge-discount-ready">🎉 Diskon Siap!</span>
              <span v-else class="badge badge-member">Member</span>
            </td>
            <td class="text-right">
              <div class="action-btns">
                <button class="btn-icon" @click="editMember(member)" title="Edit"><Icon icon="mdi:pencil-outline" width="15" /></button>
                <button class="btn-icon" @click="confirmDelete(member)" title="Hapus" style="margin-left:4px;"><Icon icon="mdi:trash-can-outline" width="15" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click.self="showDeleteConfirm = false">
      <div class="modal confirm-modal">
        <div class="confirm-icon"><Icon icon="mdi:alert-circle-outline" width="40" /></div>
        <h2>Hapus Member</h2>
        <p class="confirm-msg">Apakah Anda yakin ingin menghapus <strong>{{ deleteTarget?.name }}</strong> dari daftar member?</p>
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
import { store } from '../store.js'

export default {
  components: { Icon },
  data() {
    return {
      store, search: '', form: { name: '', phone: '' }, formError: '', editingMember: null, showDeleteConfirm: false, deleteTarget: null,
    }
  },
  computed: {
    filteredMembers() {
      if (!this.search) return store.members
      const q = this.search.toLowerCase()
      return store.members.filter(m => m.name.toLowerCase().includes(q) || m.phone.includes(q))
    },
    discountReadyCount() { return store.members.filter(m => m.totalVisits >= 10).length },
    totalVisitsAll() { return store.members.reduce((s, m) => s + m.totalVisits, 0) },
    avgVisits() {
      if (store.members.length === 0) return '0'
      return (this.totalVisitsAll / store.members.length).toFixed(1)
    },
  },
  methods: {
    getInitials(name) { return name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2) },
    saveMember() {
      this.formError = ''
      if (!this.form.name.trim() || !this.form.phone.trim()) { this.formError = 'Nama dan nomor telepon wajib diisi.'; return }
      if (this.editingMember) {
        store.updateMember(this.editingMember.id, this.form.name.trim(), this.form.phone.trim())
        this.editingMember = null
      } else {
        if (store.getMemberByName(this.form.name.trim())) { this.formError = 'Member dengan nama ini sudah terdaftar.'; return }
        store.addMember(this.form.name.trim(), this.form.phone.trim())
      }
      this.form = { name: '', phone: '' }
    },
    editMember(member) { this.editingMember = member; this.form = { name: member.name, phone: member.phone }; this.formError = '' },
    cancelEdit() { this.editingMember = null; this.form = { name: '', phone: '' }; this.formError = '' },
    confirmDelete(member) { this.deleteTarget = member; this.showDeleteConfirm = true },
    doDelete() { store.removeMember(this.deleteTarget.id); this.showDeleteConfirm = false },
  },
}
</script>

<style scoped>
.info-section { display: flex; flex-direction: column; gap: 16px; }
.info-item { display: flex; align-items: flex-start; gap: 12px; }
.info-icon { color: var(--maroon); flex-shrink: 0; margin-top: 2px; }
.info-title { font-size: 0.8125rem; font-weight: 600; margin-bottom: 2px; }
.info-desc { font-size: 0.75rem; color: var(--gray-500); line-height: 1.5; }
.action-btns { display: flex; gap: 4px; justify-content: flex-end; }
</style>
