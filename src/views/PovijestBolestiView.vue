<template>
  <div class="povijest-container">
    <!-- HEADER -->
    <div class="header">
      <h1>Povijest bolesti za: {{ pacijent?.firstName }} {{ pacijent?.lastName }}</h1>
      <div class="actions">
        <button @click="goBack" class="btn-secondary">← Natrag na pacijente</button>
        <button @click="showDodajBolest" class="btn-primary">+ Nova bolest</button>
      </div>
    </div>

    <!-- TABLICA POVIJESTI BOLESTI -->
    <div class="table-container">
      <table v-if="bolesti.length > 0">
        <thead>
          <tr>
            <th>Naziv bolesti</th>
            <th>Početak</th>
            <th>Završetak</th>
            <th>Trajanje</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bolest in bolesti" :key="bolest.id">
            <td>{{ bolest.diseaseName }}</td>
            <td>{{ formatDate(bolest.startDate) }}</td>
            <td>{{ formatDate(bolest.endDate) || 'Aktivna' }}</td>
            <td>{{ calculateDuration(bolest.startDate, bolest.endDate) }}</td>
            <td>
              <button @click="editBolest(bolest)" class="btn-edit">✏️ Uredi</button>
              <button @click="deleteBolest(bolest)" class="btn-delete">🗑️ Obriši</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-data">Nema evidentiranih bolesti za ovog pacijenta.</p>
    </div>

    <!-- MODAL ZA BOLEST -->
    <BolestForm 
      v-if="showModal"
      :show="showModal"
      :bolest="selectedBolest"
      :pacijentId="pacijentId"
      @close="closeModal"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import BolestForm from '@/components/BolestForm.vue'



const route = useRoute()
const router = useRouter()

const pacijentId = computed(() => parseInt(route.params.id))
const pacijent = ref(null)
const bolesti = ref([])
const showModal = ref(false)
const selectedBolest = ref(null)

// Dohvati podatke
// Dohvati podatke
const fetchData = async () => {
  try {
    console.log('🔄 Dohvaćam podatke za pacijenta ID:', pacijentId.value)
    
    // Dohvati pacijenta
    const patientResponse = await api.get(`/patients/${pacijentId.value}`)
    pacijent.value = patientResponse.data
    console.log('✅ Pacijent:', patientResponse.data)

    // Dohvati povijest bolesti - NOVI ENDPOINT!
    const medicalResponse = await api.get(`/patients/${pacijentId.value}/medicalrecords`)
    bolesti.value = medicalResponse.data
    console.log('✅ Medicinski zapisi:', medicalResponse.data)

  } catch (error) {
    console.error('❌ Greška pri dohvaćanju podataka:', error)
    console.error('❌ Status:', error.response?.status)
    console.error('❌ Podaci:', error.response?.data)
    alert('Došlo je do greške pri dohvaćanju podataka')
  }
}

// Modal methods
const showDodajBolest = () => {
  console.log('🎯 showDodajBolest called')
  console.log('showModal prije:', showModal.value)
  console.log('selectedBolest prije:', selectedBolest.value)
  
  selectedBolest.value = null
  showModal.value = true
  
  console.log('showModal poslije:', showModal.value)
  console.log('selectedBolest poslije:', selectedBolest.value)
  console.log('BolestForm komponenta:', BolestForm) // 👈 Provjeri da li je komponenta učitana
}

const editBolest = (bolest) => {
  selectedBolest.value = bolest
  showModal.value = true
}

const closeModal = () => {
  console.log('🎯 closeModal called')
  showModal.value = false
  selectedBolest.value = null
}

const handleSaved = () => {
  fetchData() // Refresh podatke
}

const deleteBolest = async (bolest) => {
  console.log('🗑️ Pokrećem brisanje bolesti:', bolest.id, bolest.diseaseName)
  
  if (!confirm(`Jeste li sigurni da želite obrisati bolest: "${bolest.diseaseName}"?`)) {
    console.log('❌ Brisanje bolesti otkazano')
    return
  }

  try {
    console.log('🔄 Brišem bolest ID:', bolest.id)
    await api.delete(`/patients/${pacijentId.value}/medicalrecords/${bolest.id}`)
    console.log('✅ Bolest uspješno obrisana')
    alert('Bolest uspješno obrisana!')
    fetchData() // Refresh podatke
  } catch (error) {
    console.error('❌ Greška pri brisanju bolesti:', error)
    console.error('Status:', error.response?.status)
    console.error('Podaci:', error.response?.data)
    alert('Došlo je do greške pri brisanju bolesti: ' + (error.response?.data || error.message))
  }
}

// Pomocne metode
const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('hr-HR')
}

const calculateDuration = (startDate, endDate) => {
  if (!startDate) return '-'
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `${diffDays} dana`
}


const goBack = () => {
  router.push('/')
}

// Lifecycle hook
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.povijest-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-medical {
  background: #17a2b8;
  color: white;
  margin-left: 5px;
}
</style>