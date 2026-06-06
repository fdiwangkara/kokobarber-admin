<template>
  <div v-if="$route.path === '/login'">
    <router-view />
  </div>
  <div v-else class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <Icon icon="mdi:content-cut" width="22" />
        </div>
        <div>
          <h2><span>Koko</span> Barber</h2>
          <p>{{ store.currentUser?.role || 'Panel Admin' }}</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in visibleNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <Icon :icon="item.icon" class="nav-icon" width="18" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="avatar-sm">{{ userInitials }}</div>
        <div class="user-info">
          <div class="name">{{ store.currentUser?.name || 'Pengguna' }}</div>
          <div class="role">{{ store.currentUser?.role || '-' }}</div>
        </div>
        <button class="btn-logout" @click="confirmLogout" title="Keluar">
          <Icon icon="mdi:logout" width="14" />
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="page-header">
        <h1>{{ currentPageTitle }}</h1>
        <div class="header-right">
          <div class="header-clock">
            <Icon icon="mdi:clock-outline" width="15" />
            <span>{{ currentTime }}</span>
          </div>
          <span class="header-divider"></span>
          <span class="header-date">{{ formattedDate }}</span>
        </div>
      </header>
      <div class="page-body">
        <router-view />
      </div>
    </main>

    <!-- Modal Konfirmasi -->
    <div class="modal-overlay" v-if="showConfirm" @click.self="cancelConfirm">
      <div class="modal confirm-modal">
        <div class="confirm-icon">
          <Icon icon="mdi:alert-circle-outline" width="40" />
        </div>
        <h2>{{ confirmTitle }}</h2>
        <p class="confirm-msg">{{ confirmMessage }}</p>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="cancelConfirm">Batal</button>
          <button class="btn btn-danger" @click="doConfirm">{{ confirmAction }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Icon } from '@iconify/vue'
import { store } from './store.js'

export default {
  components: { Icon },
  data() {
    return {
      store,
      allNavItems: [
        { path: '/', icon: 'mdi:view-dashboard-outline', label: 'Beranda', roles: ['Super Admin', 'Barber', 'Cashier'] },
        { path: '/barbers', icon: 'mdi:account-group-outline', label: 'Akun', roles: ['Super Admin'] },
        { path: '/services', icon: 'mdi:content-cut', label: 'Layanan', roles: ['Super Admin'] },
        { path: '/my-services', icon: 'mdi:content-cut', label: 'Layanan Saya', roles: ['Barber'] },
        { path: '/booking', icon: 'mdi:clipboard-text-outline', label: 'Booking', roles: ['Super Admin', 'Barber', 'Cashier'] },
        { path: '/payment-history', icon: 'mdi:receipt-text-outline', label: 'Riwayat Pembayaran', roles: ['Super Admin', 'Cashier'] },
        { path: '/membership', icon: 'mdi:card-account-details-star-outline', label: 'Membership', roles: ['Super Admin', 'Cashier'] },
        { path: '/ratings', icon: 'mdi:star-outline', label: 'Ulasan', roles: ['Super Admin', 'Barber'] },
        { path: '/roles', icon: 'mdi:shield-account-outline', label: 'Peran', roles: ['Super Admin'] },
      ],
      currentTime: '',
      clockInterval: null,
      showConfirm: false,
      confirmTitle: '',
      confirmMessage: '',
      confirmAction: '',
      confirmCallback: null,
    }
  },
  computed: {
    visibleNavItems() {
      const role = store.currentUser?.role || 'Super Admin'
      return this.allNavItems.filter(item => item.roles.includes(role))
    },
    userInitials() {
      if (!store.currentUser) return 'U'
      return store.currentUser.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)
    },
    currentPageTitle() {
      const titles = {
        '/': 'Beranda',
        '/barbers': 'Kelola Akun',
        '/services': 'Layanan',
        '/my-services': 'Layanan Saya',
        '/booking': 'Booking',
        '/payment-history': 'Riwayat Pembayaran',
        '/membership': 'Membership',
        '/ratings': 'Ulasan Barber',
        '/roles': 'Peran & Jobdesk',
      }
      return titles[this.$route.path] || 'Beranda'
    },
    formattedDate() {
      return new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
  },
  methods: {
    updateClock() {
      const now = new Date()
      this.currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    },
    confirmLogout() {
      this.showConfirm = true
      this.confirmTitle = 'Keluar'
      this.confirmMessage = 'Apakah Anda yakin ingin keluar dari dashboard?'
      this.confirmAction = 'Keluar'
      this.confirmCallback = () => {
        store.logout()
        this.$router.push('/login')
      }
    },
    doConfirm() {
      if (this.confirmCallback) this.confirmCallback()
      this.showConfirm = false
    },
    cancelConfirm() {
      this.showConfirm = false
    },
  },
  mounted() {
    this.updateClock()
    this.clockInterval = setInterval(this.updateClock, 1000)
  },
  beforeUnmount() {
    clearInterval(this.clockInterval)
  },
}
</script>
