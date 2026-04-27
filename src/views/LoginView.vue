<template>
  <div class="login-page">
    <div class="login-wrapper">
      <div class="login-brand">
        <div class="login-brand-icon">
          <Icon icon="mdi:content-cut" width="28" />
        </div>
        <h1><span>Koko</span> Barber</h1>
        <p>Kelola barbershop Anda dengan mudah</p>
      </div>
      <div class="login-card">
        <h2>Masuk ke Dashboard</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>Username</label>
            <div class="input-icon-wrap">
              <Icon icon="mdi:account-outline" class="input-icon" width="18" />
              <input v-model="username" placeholder="Masukkan username" autocomplete="username" />
            </div>
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="input-icon-wrap">
              <Icon icon="mdi:lock-outline" class="input-icon" width="18" />
              <input v-model="password" type="password" placeholder="Masukkan password" autocomplete="current-password" />
            </div>
          </div>
          <p class="login-error" v-if="error">{{ error }}</p>
          <button class="btn btn-primary login-btn" type="submit">
            <Icon icon="mdi:login" width="16" />
            Masuk
          </button>
        </form>
        <p class="login-hint">Demo: admin / admin123</p>
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
    return { username: '', password: '', error: '' }
  },
  methods: {
    handleLogin() {
      if (store.login(this.username, this.password)) {
        this.$router.push('/')
      } else {
        this.error = 'Username atau password salah'
      }
    },
  },
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #faf8f9 0%, #f0e8eb 50%, #ece2d8 100%);
  padding: 20px;
}
.login-wrapper {
  width: 380px;
  max-width: 100%;
}
.login-brand {
  margin-bottom: 28px;
  text-align: center;
}
.login-brand-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--maroon-dark), var(--maroon));
  color: var(--gold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
.login-brand h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--maroon-dark);
  letter-spacing: -0.03em;
}
.login-brand h1 span {
  color: var(--maroon);
}
.login-brand p {
  font-size: 0.8125rem;
  color: var(--gray-400);
  margin-top: 4px;
}
.login-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: 0 8px 30px rgba(74, 11, 26, 0.06);
  text-align: left;
}
.login-card h2 {
  font-size: 1.0625rem;
  font-weight: 600;
  margin-bottom: 22px;
  text-align: center;
}
.input-icon-wrap {
  position: relative;
}
.input-icon-wrap .input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}
.input-icon-wrap input {
  padding-left: 38px;
  width: 100%;
}
.login-btn {
  width: 100%;
  padding: 10px;
  margin-top: 6px;
  font-weight: 600;
  justify-content: center;
}
.login-error {
  color: #b02a2a;
  font-size: 0.75rem;
  margin-bottom: 8px;
  text-align: center;
}
.login-hint {
  text-align: center;
  font-size: 0.6875rem;
  color: var(--gray-400);
  margin-top: 16px;
}
</style>
