import { createRouter, createWebHistory } from 'vue-router'
import PacijentiView from '../views/PacijentiView.vue'

const routes = [
  {
    path: '/',
    name: 'pacijenti',
    component: PacijentiView
  },

  {
    path: '/pacijenti/:id/povijest-bolesti', // 👈 Nova ruta
    name: 'povijest-bolesti',
    component: () => import('../views/PovijestBolestiView.vue')
  },

  {
  path: '/pacijenti/:id/pregledi',
  name: 'pregledi',
  component: () => import('../views/PreglediView.vue')
},

{
  path: '/pacijenti/:id/recepti',
  name: 'recepti',
  component: () => import('../views/ReceptiView.vue')
}

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router