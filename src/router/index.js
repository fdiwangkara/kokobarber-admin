import { createRouter, createWebHistory } from 'vue-router'
import { store } from '../store.js'

import DashboardView from '../views/DashboardView.vue'
import BarbersView from '../views/BarbersView.vue'
import ServicesView from '../views/ServicesView.vue'
import MyServicesView from '../views/MyServicesView.vue'
import BookingView from '../views/BookingView.vue'
import PaymentHistoryView from '../views/PaymentHistoryView.vue'
import MembershipView from '../views/MembershipView.vue'
import RatingsView from '../views/RatingsView.vue'
import RolesView from '../views/RolesView.vue'
import LoginView from '../views/LoginView.vue'

const routes = [
    { path: '/', component: DashboardView },
    { path: '/barbers', component: BarbersView, meta: { roles: ['Super Admin'] } },
    { path: '/services', component: ServicesView, meta: { roles: ['Super Admin'] } },
    { path: '/my-services', component: MyServicesView, meta: { roles: ['Barber'] } },
    { path: '/booking', component: BookingView },
    { path: '/payment-history', component: PaymentHistoryView, meta: { roles: ['Super Admin', 'Cashier'] } },
    { path: '/membership', component: MembershipView, meta: { roles: ['Super Admin', 'Cashier'] } },
    { path: '/ratings', component: RatingsView, meta: { roles: ['Super Admin', 'Barber'] } },
    { path: '/roles', component: RolesView, meta: { roles: ['Super Admin'] } },
    { path: '/login', component: LoginView },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
    if (to.path !== '/login' && !store.isLoggedIn) return '/login'
    if (to.path === '/login' && store.isLoggedIn) return '/'
    // Role-based route guard
    if (to.meta.roles && !to.meta.roles.includes(store.currentUser?.role)) return '/'
})

export default router
