import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/game',
    name: 'Game Room',
    component: () => import('../views/GameRoom.vue')
  },
  {
    path: '/editor',
    name: 'Game Editor',
    component: () => import('../views/GameEditor.vue'),
    props: {
      type: 'hearts'
    }
  },
  {
    path: '/login',
    name: 'User Challenge',
    component: () => import('../views/Challenge.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  }
]
if(process.env.NODE_ENV === 'development') {
  routes.push({
    path: '/rifTest',
    name: 'Rifs',
    component: () => import('../views/RifTest.vue')
  })
}

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
