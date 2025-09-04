<template>
  <div class="recepti-container">
    <!-- HEADER -->
    <div class="header">
      <h1>Recepti za: {{ pacijent?.firstName }} {{ pacijent?.lastName }}</h1>
      <div class="actions">
        <button @click="goBack" class="btn-secondary">← Natrag na pacijente</button>
        <button @click="showDodajRecept" class="btn-primary">+ Novi recept</button>
      </div>
    </div>

    <!-- FILTERI -->
    <div class="filter-section">
      <div class="filter-inputs">
        <select v-model="filterExamination" class="filter-select">
          <option value="">Svi pregledi</option>
          <option v-for="pregled in pregledi" :key="pregled.id" :value="pregled.id">
            {{ getExaminationTypeName(pregled.examinationType) }} - {{ formatDate(pregled.examinationDate) }}
          </option>
        </select>
        
        <select v-model="filterStatus" class="filter-select">
          <option value="">Svi statusi</option>
          <option value="active">Aktivni</option>
          <option value="expired">Istekli</option>
          <option value="completed">Završeni</option>
        </select>
        
        <button @click="fetchRecepti" class="btn-filter">🔍 Filtriraj</button>
      </div>
    </div>

    <!-- TABLICA RECEPATA -->
    <div class="table-container">
      <table v-if="filteredRecepti.length > 0">
        <thead>
          <tr>
            <th>Lijek</th>
            <th>Doza</th>
            <th>Uputa</th>
            <th>Datum izdavanja</th>
            <th>Pregled</th>
            <th>Status</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="recept in filteredRecepti" :key="recept.id">
            <td>{{ recept.medicationName }}</td>
            <td>{{ recept.dosage || '-' }}</td>
            <td>{{ recept.instructions || '-' }}</td>
            <td>{{ formatDate(recept.prescriptionDate) }}</td>
            <td>{{ getExaminationForRecept(recept.examinationId) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(recept)]">
                {{ getStatusText(recept) }}
              </span>
            </td>
            <td>
              <button @click="printRecept(recept)" class="btn-print">🖨️ Print</button>
              <button @click="editRecept(recept)" class="btn-edit">✏️ Uredi</button>
              <button @click="deleteRecept(recept)" class="btn-delete">🗑️ Obriši</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-data">Nema recepata za ovog pacijenta.</p>
    </div>

    <!-- MODAL ZA RECEPT -->
    <ReceptForm 
      v-if="showModal"
      :show="showModal"
      :recept="selectedRecept"
      :pacijentId="pacijentId"
      :pregledi="pregledi"
      @close="closeModal"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import ReceptForm from '@/components/ReceptForm.vue'

const route = useRoute()
const router = useRouter()

const pacijentId = computed(() => parseInt(route.params.id))
const pacijent = ref(null)
const recepti = ref([])
const pregledi = ref([])
const showModal = ref(false)
const selectedRecept = ref(null)
const filterExamination = ref('')
const filterStatus = ref('')

// Dohvati podatke
const fetchData = async () => {
  try {
    console.log('🔄 Dohvaćam podatke za pacijenta ID:', pacijentId.value)
    
    // Dohvati pacijenta
    const patientResponse = await api.get(`/patients/${pacijentId.value}`)
    pacijent.value = patientResponse.data

    // Dohvati preglede
    const examinationsResponse = await api.get(`/patients/${pacijentId.value}/examinations`)
    pregledi.value = examinationsResponse.data

    // Dohvati recepte
    await fetchRecepti()

  } catch (error) {
    console.error('❌ Greška pri dohvaćanju podataka:', error)
    alert('Došlo je do greške pri dohvaćanju podataka')
  }
}

// Dohvati recepte za sve preglede pacijenta
const fetchRecepti = async () => {
  try {
    recepti.value = []
    for (const pregled of pregledi.value) {
      const response = await api.get(`/examinations/${pregled.id}/prescriptions`)
      recepti.value.push(...response.data.map(r => ({ ...r, examinationId: pregled.id })))
    }
    console.log('✅ Recepti:', recepti.value)
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju recepata:', error)
  }
}

// Filtriraj recepte
const filteredRecepti = computed(() => {
  let filtered = recepti.value

  if (filterExamination.value) {
    filtered = filtered.filter(r => r.examinationId === parseInt(filterExamination.value))
  }

  if (filterStatus.value) {
    filtered = filtered.filter(r => {
      const status = getReceptStatus(r)
      return status === filterStatus.value
    })
  }

  return filtered
})

// Modal methods
const showDodajRecept = () => {
  selectedRecept.value = null
  showModal.value = true
}

const editRecept = (recept) => {
  selectedRecept.value = recept
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedRecept.value = null
}

const handleSaved = () => {
  fetchData()
}

// Print recepta
const printRecept = (recept) => {
  const printContent = `
    <h2>Recept</h2>
    <p><strong>Pacijent:</strong> ${pacijent.value.firstName} ${pacijent.value.lastName}</p>
    <p><strong>Lijek:</strong> ${recept.medicationName}</p>
    <p><strong>Doza:</strong> ${recept.dosage || '-'}</p>
    <p><strong>Uputa:</strong> ${recept.instructions || '-'}</p>
    <p><strong>Datum:</strong> ${formatDate(recept.prescriptionDate)}</p>
    <p><strong>Liječnik:</strong> Dr. Medicinski Sustav</p>
  `
  
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.print()
  printWindow.close()
}

// Brisanje recepta
const deleteRecept = async (recept) => {
  if (!confirm(`Jeste li sigurni da želite obrisati recept za "${recept.medicationName}"?`)) {
    return
  }

  try {
    await api.delete(`/examinations/${recept.examinationId}/prescriptions/${recept.id}`)
    alert('Recept uspješno obrisan!')
    fetchData()
  } catch (error) {
    console.error('❌ Greška pri brisanju recepta:', error)
    alert('Došlo je do greške pri brisanju recepta')
  }
}

// Pomocne metode
const getExaminationTypeName = (typeCode) => {
  const types = {
    'GP': 'Opći pregled', 'KRV': 'Test krvi', 'X-RAY': 'Rendgen', 'CT': 'CT', 'MR': 'MR',
    'ULTRA': 'Ultrazvuk', 'EKG': 'EKG', 'ECHO': 'ECHO', 'EYE': 'Oči', 'DERM': 'Koža',
    'DENTA': 'Zubi', 'MAMMO': 'Mamografija', 'NEURO': 'Neurologija'
  }
  return types[typeCode] || typeCode
}

const getExaminationForRecept = (examinationId) => {
  const pregled = pregledi.value.find(p => p.id === examinationId)
  return pregled ? `${getExaminationTypeName(pregled.examinationType)} (${formatDate(pregled.examinationDate)})` : '-'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('hr-HR')
}

const getReceptStatus = (recept) => {
  const prescriptionDate = new Date(recept.prescriptionDate)
  const today = new Date()
  const diffDays = Math.floor((today - prescriptionDate) / (1000 * 60 * 60 * 24))
  
  if (diffDays > 30) return 'expired'
  if (diffDays > 14) return 'completed'
  return 'active'
}

const getStatusText = (recept) => {
  const status = getReceptStatus(recept)
  return { active: 'Aktivan', expired: 'Istekao', completed: 'Završen' }[status]
}

const getStatusClass = (recept) => {
  const status = getReceptStatus(recept)
  return { active: 'status-active', expired: 'status-expired', completed: 'status-completed' }[status]
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
.recepti-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-filter {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-completed {
  background: #fff3cd;
  color: #856404;
}

.status-expired {
  background: #f8d7da;
  color: #721c24;
}

.btn-print {
  background: #17a2b8;
  color: white;
  margin-right: 5px;
}
</style>