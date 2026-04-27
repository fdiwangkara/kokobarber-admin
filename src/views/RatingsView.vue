<template>
  <div>
    <div class="flex-between mb-24" v-if="!store.isBarber()">
      <div class="flex-gap">
        <select v-model="filterBarber" style="padding: 6px 10px; font-size: 0.8125rem;">
          <option value="">Semua Barber</option>
          <option v-for="b in store.barbers.filter(b => b.role === 'Barber')" :key="b.id" :value="b.name">{{ b.name }}</option>
        </select>
      </div>
    </div>

    <!-- Rating Cards -->
    <div v-if="displayBarbers.length === 0" class="card mb-24">
      <div class="empty-state">
        <div class="empty-icon"><Icon icon="mdi:star-off-outline" width="36" /></div>
        <p>Belum ada barber untuk ditampilkan rating-nya.</p>
      </div>
    </div>
    <div v-else class="grid-3 mb-24">
      <div class="rating-card" v-for="barber in displayBarbers" :key="barber.id">
        <div class="flex-gap mb-16">
          <div class="avatar">{{ barber.avatar }}</div>
          <div>
            <div style="font-weight: 600; font-size: 0.9375rem;">{{ barber.name }}</div>
            <div class="text-sm text-muted">{{ barberReviewCount(barber.name) }} ulasan</div>
          </div>
        </div>
        <div class="rating-score">
          <span class="rating-number">{{ barberAvgRating(barber.name) }}</span>
          <span class="stars">
            <span v-for="n in 5" :key="n" :class="{ empty: n > Math.round(parseFloat(barberAvgRating(barber.name))) }">★</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Recent Reviews -->
    <div class="card">
      <div class="card-header">
        <h3>Ulasan Terbaru</h3>
      </div>
      <div v-if="filteredReviews.length === 0" class="empty-state">
        <div class="empty-icon"><Icon icon="mdi:comment-text-outline" width="36" /></div>
        <p>Belum ada ulasan.</p>
      </div>
      <div v-for="review in filteredReviews" :key="review.id" class="review-item">
        <div class="flex-between">
          <div>
            <span style="font-weight: 500; font-size: 0.8125rem;">{{ review.customer }}</span>
            <span class="text-sm text-muted" style="margin-left: 8px;">→ {{ review.barber }}</span>
          </div>
          <div class="flex-gap">
            <span class="stars">
              <span v-for="n in 5" :key="n" :class="{ empty: n > review.rating }">★</span>
            </span>
            <span class="text-sm text-muted">{{ review.date }}</span>
          </div>
        </div>
        <p class="review-comment">{{ review.comment }}</p>
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
    return { store, filterBarber: '' }
  },
  computed: {
    currentBarber() { return store.getCurrentBarber() },
    displayBarbers() {
      // Barber only sees themselves
      if (store.isBarber() && this.currentBarber) {
        return [this.currentBarber]
      }
      if (!this.filterBarber) return store.barbers.filter(b => b.role === 'Barber')
      return store.barbers.filter(b => b.name === this.filterBarber && b.role === 'Barber')
    },
    filteredReviews() {
      if (store.isBarber() && this.currentBarber) {
        return store.reviews.filter(r => r.barber === this.currentBarber.name)
      }
      if (!this.filterBarber) return store.reviews
      return store.reviews.filter(r => r.barber === this.filterBarber)
    },
  },
  methods: {
    barberReviewCount(name) {
      return store.reviews.filter(r => r.barber === name).length
    },
    barberAvgRating(name) {
      const revs = store.reviews.filter(r => r.barber === name)
      if (revs.length === 0) return '0'
      return (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1)
    },
  },
}
</script>

<style scoped>
.rating-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}
.rating-score {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rating-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gold-dark);
}
.review-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--gray-100);
}
.review-item:last-child {
  border-bottom: none;
}
.review-comment {
  font-size: 0.8125rem;
  color: var(--gray-500);
  margin-top: 6px;
}
</style>
