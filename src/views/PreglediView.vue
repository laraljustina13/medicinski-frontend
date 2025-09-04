<template>
  <div class="pregledi-container">

     <div class="upload-section">
      <h3>📁 Upload medicinske dokumentacije</h3>
      <FileUpload @uploaded="handleFileUploaded" />
    </div>

    <!-- HEADER -->
    <div class="header">
      <h1>Pregledi za: {{ pacijent?.firstName }} {{ pacijent?.lastName }}</h1>
      <div class="actions">
        <button @click="goBack" class="btn-secondary">← Natrag na pacijente</button>
        <button @click="showDodajPregled" class="btn-primary">+ Novi pregled</button>
      </div>
    </div>

    <!-- TABLICA PREGLEDA -->
    <div class="table-container">
      <table v-if="pregledi.length > 0">
        <thead>
          <tr>
            <th>Tip pregleda</th>
            <th>Datum</th>
            <th>Napomene</th>
            <th>Recepti</th>
            <th>Prilozi</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pregled in pregledi" :key="pregled.id">
            <td>{{ getExaminationTypeName(pregled.examinationType) }}</td>
            <td>{{ formatDate(pregled.examinationDate) }}</td>
            <td>{{ pregled.notes || '-' }}</td>
            <td>{{ pregled.prescriptions?.length || 0 }}</td>
            <td>{{ pregled.examinationFiles?.length || 0 }}</td>
            <td>
              <button @click="editPregled(pregled)" class="btn-edit">✏️ Uredi</button>
              <button @click="viewDetails(pregled)" class="btn-details">👁️ Detalji</button>
              <button @click="deletePregled(pregled)" class="btn-delete">🗑️ Obriši</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-data">Nema evidentiranih pregleda za ovog pacijenta.</p>
    </div>

    <!-- MODAL ZA PREGLED -->
    <PregledForm 
      v-if="showModal"
      :show="showModal"
      :pregled="selectedPregled"
      :pacijentId="pacijentId"
      @close="closeModal"
      @saved="handleSaved"
    />
    <PregledDetails 
  :show="showDetailsModal"
  :pregled="selectedPregledDetails"
  @close="closeDetailsModal"
/>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PregledForm from '@/components/PregledForm.vue'
import PregledDetails from '@/components/PregledDetails.vue'
import FileUpload from '@/components/FileUpload.vue'




const showDetailsModal = ref(false)
const selectedPregledDetails = ref(null)

const route = useRoute()
const router = useRouter()


const pacijentId = computed(() => parseInt(route.params.id))
const pacijent = ref(null)
const pregledi = ref([])
const showModal = ref(false)
const selectedPregled = ref(null)

// Tipovi pregleda
const examinationTypes = {
  'GP': 'Opći tjelesni pregled',
  'KRV': 'Test krvi',
  'X-RAY': 'Rendgensko snimanje',
  'CT': 'CT sken',
  'MR': 'MRI sken',
  'ULTRA': 'Ultrazvuk',
  'EKG': 'Elektrokardiogram',
  'ECHO': 'Ehokardiogram',
  'EYE': 'Pregled očiju',
  'DERM': 'Dermatološki pregled',
  'DENTA': 'Pregled zuba',
  'MAMMO': 'Mamografija',
  'NEURO': 'Neurološki pregled'
}

// Dohvati podatke
const fetchData = async () => {
  try {
    console.log('🔄 Dohvaćam podatke za pacijenta ID:', pacijentId.value)
    
    // Dohvati pacijenta
    const patientResponse = await api.get(`/patients/${pacijentId.value}`)
    pacijent.value = patientResponse.data
    console.log('✅ Pacijent:', patientResponse.data)

    // Dohvati preglede
    const examinationsResponse = await api.get(`/patients/${pacijentId.value}/examinations`)
    pregledi.value = examinationsResponse.data
    console.log('✅ Pregledi:', examinationsResponse.data)

  } catch (error) {
    console.error('❌ Greška pri dohvaćanju podataka:', error)
    alert('Došlo je do greške pri dohvaćanju podataka')
  }
}

// Modal methods
const showDodajPregled = () => {
  selectedPregled.value = null
  showModal.value = true
}

const editPregled = (pregled) => {
  selectedPregled.value = pregled
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedPregled.value = null
}

const handleSaved = () => {
  fetchData() // Refresh podatke
}

// Brisanje pregleda
const deletePregled = async (pregled) => {
  if (!confirm(`Jeste li sigurni da želite obrisati pregled: "${getExaminationTypeName(pregled.examinationType)}"?`)) {
    return
  }

  try {
    await api.delete(`/patients/${pacijentId.value}/examinations/${pregled.id}`)
    alert('Pregled uspješno obrisan!')
    fetchData()
  } catch (error) {
    console.error('❌ Greška pri brisanju pregleda:', error)
    alert('Došlo je do greške pri brisanju pregleda')
  }
}

const viewDetails = (pregled) => {
  selectedPregledDetails.value = pregled
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
}

// Pomocne metode
const getExaminationTypeName = (typeCode) => {
  return examinationTypes[typeCode] || typeCode
}

const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('hr-HR')
}

const goBack = () => {
  router.push('/')
}

const handleFileUploaded = (fileData) => {
  console.log('File uploaded:', fileData)
  // Osvježi podatke ili prikaži poruku
  fetchData()
}

// Lifecycle hook
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pregledi-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>