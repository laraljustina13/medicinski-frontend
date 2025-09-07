<template>
  <div class="pregledi-container">
    <!-- HEADER -->
    <div class="header">
      <h1>Pregledi za: {{ pacijent?.firstName }} {{ pacijent?.lastName }}</h1>
      <div class="actions">
        <button @click="goBack" class="btn-secondary">← Natrag na pacijente</button>
        <button @click="showDodajPregled" class="btn-primary">+ Novi pregled</button>
      </div>
    </div>

    <!-- FILTERI -->
    <div class="filter-section">
      <div class="filter-inputs">
        <select v-model="filterTip" class="filter-select">
          <option value="">Svi tipovi pregleda</option>
          <option v-for="(naziv, šifra) in examinationTypes" :key="šifra" :value="šifra">
            {{ šifra }} – {{ naziv }}
          </option>
        </select>

        <input v-model="filterDatum" type="date" class="filter-input" placeholder="Filter po datumu">

        <button @click="resetFilter" class="btn-secondary">❌ Očisti filtere</button>
      </div>
    </div>

    <!-- STATISTIKA -->
    <div class="stats-section">
      <div class="stat-card">
        <h3>Ukupno pregleda</h3>
        <p class="stat-number">{{ pregledi.length }}</p>
      </div>
      <div class="stat-card">
        <h3>Aktivni pregledi (ovaj mjesec)</h3>
        <p class="stat-number">{{ aktivniPregledi.length }}</p>
      </div>
      <div class="stat-card">
        <h3>Pregledi s dokumentacijom</h3>
        <p class="stat-number">{{ preglediSDokumentacijom.length }}</p>
      </div>
    </div>

    <!-- TABLICA PREGLEDA -->
    <div class="table-container">
      <table v-if="filtriraniPregledi.length > 0">
        <thead>
          <tr>
            <th>Šifra</th>
            <th>Tip pregleda</th>
            <th>Datum i vrijeme</th>
            <th>Napomene</th>
            <th>Recepti</th>
            <th>Prilozi</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pregled in filtriraniPregledi" :key="pregled.id">
            <td class="šifra-cell">
              <span class="šifra-badge">{{ pregled.examinationType }}</span>
            </td>
            <td>
              <strong>{{ getExaminationTypeName(pregled.examinationType) }}</strong>
            </td>
            <td>
              {{ formatDateTime(pregled.examinationDate) }}
              <span v-if="isRecent(pregled.examinationDate)" class="badge-new">NOVO</span>
            </td>
            <td>{{ pregled.notes || '-' }}</td>
            <td>
              <span class="badge" :class="{ 'badge-zero': !pregled.prescriptions?.length }">
                {{ pregled.prescriptions?.length || 0 }}
              </span>
            </td>
            <td>
              <span class="badge" :class="{ 'badge-zero': !pregled.examinationFiles?.length }">
                {{ pregled.examinationFiles?.length || 0 }}
              </span>
              <button
                v-if="canUploadFiles(pregled.examinationType)"
                @click="showUploadForPregled(pregled)"
                class="btn-upload"
                :title="`Upload dokumentacije za ${getExaminationTypeName(pregled.examinationType)}`"
              >
                📁 Upload
              </button>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="viewDetails(pregled)" class="btn-details" title="Detalji pregleda">👁️</button>
                <button @click="editPregled(pregled)" class="btn-edit" title="Uredi pregled">✏️</button>
                <button
                  v-if="(pregled.prescriptions?.length || 0) === 0 && (pregled.examinationFiles?.length || 0) === 0"
                  @click="deletePregled(pregled)"
                  class="btn-delete"
                  title="Obriši pregled"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-data">
        {{ pregledi.length === 0 ? 'Nema evidentiranih pregleda za ovog pacijenta.' : 'Nema pregleda koji odgovaraju filterima.' }}
      </p>
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

    <!-- UPLOAD MODAL -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📁 Upload dokumentacije</h3>
          <button @click="closeUploadModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedPregledForUpload">
            <div class="upload-info">
              <p><strong>Pacijent:</strong> {{ pacijent?.firstName }} {{ pacijent?.lastName }}</p>
              <p><strong>Pregled:</strong> {{ selectedPregledForUpload.examinationType }} -
                {{ getExaminationTypeName(selectedPregledForUpload.examinationType) }}</p>
              <p><strong>Datum:</strong> {{ formatDateTime(selectedPregledForUpload.examinationDate) }}</p>
            </div>

            <FileUpload
              :examination-id="selectedPregledForUpload.id"
              @uploaded="handleFileUploaded"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PregledForm from '@/components/PregledForm.vue'
import PregledDetails from '@/components/PregledDetails.vue'
import FileUpload from '@/components/FileUpload.vue'

const route = useRoute()
const router = useRouter()

const pacijentId = computed(() => parseInt(route.params.id))
const pacijent = ref(null)
const pregledi = ref([])

const showModal = ref(false)
const selectedPregled = ref(null)

const showDetailsModal = ref(false)
const selectedPregledDetails = ref(null)

const showUploadModal = ref(false)
const selectedPregledForUpload = ref(null)

const filterTip = ref('')
const filterDatum = ref('')

// Definicija tipova pregleda
const examinationTypes = {
  GP: 'Opći tjelesni pregled',
  KRV: 'Test krvi',
  'X-RAY': 'Rendgensko skeniranje',
  CT: 'CT sken',
  MR: 'MRI sken',
  ULTRA: 'Ultrazvuk',
  EKG: 'Elektrokardiogram',
  ECHO: 'Ehokardiogram',
  EYE: 'Pregled očiju',
  DERM: 'Dermatološki pregled',
  DENTA: 'Pregled zuba',
  MAMMO: 'Mamografija',
  NEURO: 'Neurološki pregled'
}

// Dohvati podatke
const fetchData = async () => {
  try {
    const patientResponse = await api.get(`/patients/${pacijentId.value}`)
    pacijent.value = patientResponse.data

    const examinationsResponse = await api.get(`/patients/${pacijentId.value}/examinations`)
    pregledi.value = examinationsResponse.data
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju podataka:', error)
    alert('Došlo je do greške pri dohvaćanju podataka')
  }
}

// Filtriraj preglede
const filtriraniPregledi = computed(() => {
  let filtered = [...pregledi.value]

  if (filterTip.value) {
    filtered = filtered.filter(p => p.examinationType === filterTip.value)
  }

  if (filterDatum.value) {
    const filterDate = new Date(filterDatum.value)
    filtered = filtered.filter(p => {
      const pregledDate = new Date(p.examinationDate)
      return pregledDate.toDateString() === filterDate.toDateString()
    })
  }

  return filtered.sort((a, b) => new Date(b.examinationDate) - new Date(a.examinationDate))
})

// Aktivni pregledi (ovaj mjesec)
const aktivniPregledi = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return pregledi.value.filter(p => new Date(p.examinationDate) >= startOfMonth)
})

// Pregledi s dokumentacijom
const preglediSDokumentacijom = computed(() => pregledi.value.filter(p => (p.examinationFiles?.length || 0) > 0))

// Upload funkcionalnost
const showUploadForPregled = (pregled) => {
  selectedPregledForUpload.value = pregled
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  selectedPregledForUpload.value = null
}

const handleFileUploaded = (payload) => {
  console.log('File upload complete:', payload)
  const successful = payload?.successful ?? 0
  if (successful > 0) {
    alert(`✅ Uspješno uploadano ${successful} datoteka`)
  }
  closeUploadModal()
  fetchData()
}

// Provjeri može li se uploadati dokumentacija za ovaj tip pregleda
const canUploadFiles = (tipPregleda) => {
  const typesWithFiles = ['X-RAY', 'CT', 'MR', 'ULTRA', 'EKG', 'ECHO', 'EYE', 'MAMMO']
  return typesWithFiles.includes(tipPregleda)
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
  fetchData()
}

// Brisanje pregleda
const deletePregled = async (pregled) => {
  if (!confirm(`Jeste li sigurni da želite obrisati pregled: "${getExaminationTypeName(pregled.examinationType)}"?`)) {
    return
  }

  try {
    await api.delete(`/patients/${pacijentId.value}/examinations/${pregled.id}`)
    alert('✅ Pregled uspješno obrisan!')
    fetchData()
  } catch (error) {
    console.error('❌ Greška pri brisanju pregleda:', error)
    alert('❌ Došlo je do greške pri brisanju pregleda')
  }
}

const viewDetails = (pregled) => {
  selectedPregledDetails.value = pregled
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
}

// Filter helpers
const resetFilter = () => {
  filterTip.value = ''
  filterDatum.value = ''
}

// Helpers
const getExaminationTypeName = (typeCode) => {
  return examinationTypes[typeCode] || typeCode
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isRecent = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

const goBack = () => {
  router.push('/')
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>


<style scoped>
.pregledi-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.filter-section {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 25px;
}

.filter-inputs {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select, .filter-input {
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 6px;
  min-width: 250px;
  font-size: 14px;
}

.filter-select:focus, .filter-input:focus {
  outline: none;
  border-color: #3498db;
}

.stats-section {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  text-align: center;
  min-width: 180px;
  color: white;
  flex: 1;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

th {
  background-color: #34495e;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

tr:hover {
  background-color: #f8f9fa;
}

.šifra-cell {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.šifra-badge {
  background-color: #e74c3c;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.badge {
  background-color: #27ae60;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
  min-width: 30px;
  text-align: center;
}

.badge-zero {
  background-color: #bdc3c7;
}

.badge-new {
  background-color: #e74c3c;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  margin-left: 8px;
  font-weight: bold;
}

/* UPLOAD GUMB - OVO JE KLJUČNA PROMJENA */
.btn-upload {
  background-color: #f39c12;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  margin-left: 10px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-upload:hover {
  background-color: #e67e22;
  transform: translateY(-1px);
}

.btn-upload:active {
  transform: translateY(0);
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-details, .btn-edit, .btn-delete {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-details {
  background-color: #3498db;
  color: white;
}

.btn-details:hover {
  background-color: #2980b9;
}

.btn-edit {
  background-color: #27ae60;
  color: white;
}

.btn-edit:hover {
  background-color: #229954;
}

.btn-delete {
  background-color: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background-color: #c0392b;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-style: italic;
  font-size: 16px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #e74c3c;
}

.upload-info {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  border-left: 4px solid #3498db;
}

.upload-info p {
  margin: 8px 0;
  color: #2c3e50;
}

.upload-info strong {
  color: #34495e;
}

/* Responsive design */
@media (max-width: 1200px) {
  .table-container {
    overflow-x: auto;
  }
  
  table {
    min-width: 1000px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select, .filter-input {
    min-width: auto;
    width: 100%;
  }
  
  .stats-section {
    flex-direction: column;
  }
  
  .stat-card {
    min-width: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modal-content {
    padding: 20px;
    margin: 10px;
  }
}

/* Animations */
.modal-content {
  animation: modalSlideIn 0.4s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.btn-upload {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(243, 156, 18, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(243, 156, 18, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(243, 156, 18, 0);
  }
}
</style>