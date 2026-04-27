<template>
  <div>
    <div class="flex-between mb-24">
      <p class="text-muted">{{ store.services.length }} layanan tersedia</p>
      <button class="btn btn-primary" @click="openModal()">
        <Icon icon="mdi:plus" width="16" /> Tambah Layanan
      </button>
    </div>

    <div class="grid-3">
      <div class="service-card" v-for="svc in store.services" :key="svc.id">
        <div class="service-name">{{ svc.name }}</div>
        <div class="service-desc">{{ svc.description }}</div>
        <div class="service-meta">
          <span class="service-price">{{ formatCurrency(svc.price) }}</span>
          <span class="service-duration">{{ svc.duration }}</span>
        </div>
        <div class="service-actions">
          <button class="btn btn-secondary btn-sm" @click="openModal(svc)">
            <Icon icon="mdi:pencil-outline" width="13" /> Edit
          </button>
          <button class="btn btn-danger btn-sm" style="background:#fde8e8;color:#b02a2a;" @click="confirmDelete(svc)">
            <Icon icon="mdi:trash-can-outline" width="13" /> Hapus
          </button>
        </div>
      </div>
    </div>

    <!-- Edit/Add Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editing ? 'Edit Layanan' : 'Tambah Layanan' }}</h2>
        <div class="form-group">
          <label>Nama Layanan</label>
          <input v-model="form.name" placeholder="Nama layanan" />
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <input v-model="form.description" placeholder="Deskripsi singkat" />
        </div>
        <div class="form-group">
          <label>Durasi</label>
          <input v-model="form.duration" placeholder="30 min" />
        </div>
        <div class="form-group">
          <label>Harga (Rp)</label>
          <input v-model.number="form.price" type="number" placeholder="50000" />
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showModal = false">Batal</button>
          <button class="btn btn-primary" @click="saveService">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click.self="showDeleteConfirm = false">
      <div class="modal confirm-modal">
        <div class="confirm-icon">
          <Icon icon="mdi:alert-circle-outline" width="40" />
        </div>
        <h2>Hapus Layanan</h2>
        <p class="confirm-msg">Apakah Anda yakin ingin menghapus layanan <strong>{{ deleteTarget?.name }}</strong>?</p>
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
      store,
      showModal: false,
      editing: null,
      form: { name: '', description: '', duration: '', price: 0 },
      showDeleteConfirm: false,
      deleteTarget: null,
    }
  },
  methods: {
    formatCurrency(val) {
      return 'Rp ' + val.toLocaleString('id-ID')
    },
    openModal(svc) {
      if (svc) {
        this.editing = svc.id
        this.form = { name: svc.name, description: svc.description, duration: svc.duration, price: svc.price }
      } else {
        this.editing = null
        this.form = { name: '', description: '', duration: '', price: 0 }
      }
      this.showModal = true
    },
    saveService() {
      if (this.editing) {
        const s = store.services.find(s => s.id === this.editing)
        if (s) {
          s.name = this.form.name
          s.description = this.form.description
          s.duration = this.form.duration
          s.price = this.form.price
        }
      } else {
        const newId = store.services.length > 0 ? Math.max(...store.services.map(s => s.id)) + 1 : 1
        store.services.push({ id: newId, ...this.form })
      }
      this.showModal = false
    },
    confirmDelete(svc) {
      this.deleteTarget = svc
      this.showDeleteConfirm = true
    },
    doDelete() {
      const idx = store.services.findIndex(s => s.id === this.deleteTarget.id)
      if (idx > -1) store.services.splice(idx, 1)
      this.showDeleteConfirm = false
    },
  },
}
</script>
