<template>
  <div class="modal-overlay" v-if="show" @click.self="closeModal">
    <div class="modal-content details-modal">
      <h2>Detalji pacijenta: {{ pacijent.firstName }} {{ pacijent.lastName }}</h2>
      
      <div class="details-section">
        <h3>📋 Osnovni podaci</h3>
        <div class="detail-row">
          <span class="label">OIB:</span>
          <span class="value">{{ pacijent.oib }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Ime:</span>
          <span class="value">{{ pacijent.firstName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Prezime:</span>
          <span class="value">{{ pacijent.lastName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Datum rođenja:</span>
          <span class="value">{{ formatDate(pacijent.dateOfBirth) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Spol:</span>
          <span class="value">{{ pacijent.gender === 'F' ? 'Ženski' : 'Muški' }}</span>
        </div>
      </div>

      <!-- PREGLEDI I UPLOAD -->
      <div class="details-section">
        <h3>📁 Upload dokumentacije</h3>
        
        <div v-if="pregledi.length === 0">
          <p class="no-exams">Trenutno nema pregleda za ovog pacijenta.</p>
          <button @click="navigirajNaPreglede" class="btn-primary">
            🏥 Idi na preglede
          </button>
        </div>
        
        <div v-else>
          <p class="instruction">Odaberite pregled za upload dokumentacije:</p>
          
          <div class="pregledi-lista">
            <div 
              v-for="pregled in pregledi" 
              :key="pregled.id" 
              @click="odaberiPregled(pregled)"
              :class="{ 
                selected: selectedExaminationId === pregled.id,
                'can-upload': canUploadFiles(pregled.examinationType)
              }"
              class="pregled-item"
            >
              <div class="pregled-info">
                <strong>{{ getExaminationTypeName(pregled.examinationType) }}</strong>
                <span>{{ formatDate(pregled.examinationDate) }}</span>
              </div>
              <div class="pregled-actions">
                <span v-if="pregled.examinationFiles?.length > 0" class="file-count">
                  📎 {{ pregled.examinationFiles.length }}
                </span>
                <span class="upload-indicator" v-if="canUploadFiles(pregled.examinationType)">
                  📁 Upload
                </span>
              </div>
            </div>
          </div>

          <div v-if="selectedExaminationId" class="upload-container">
            <h4>Upload dokumentacije za odabrani pregled</h4>
            <FileUpload 
              :examination-id="selectedExaminationId"
              @uploaded="handleFileUploaded"
            />
          </div>

          <div v-else class="upload-placeholder">
            <p>↖️ Odaberite pregled iz liste za upload dokumentacije</p>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="closeModal" class="btn-cancel">Zatvori</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import FileUpload from '@/components/FileUpload.vue' 

const props = defineProps({
  show: Boolean,
  pacijent: Object
})

const emit = defineEmits(['close'])
const router = useRouter()

// State
const pregledi = ref([])
const selectedExaminationId = ref(null)

// Dohvati preglede za pacijenta
const fetchPregledi = async () => {
  try {
    if (props.pacijent?.id) {
      const response = await api.get(`/patients/${props.pacijent.id}/examinations`)
      pregledi.value = response.data
      console.log('Pregledi:', pregledi.value)
    }
  } catch (error) {
    console.error('Greška pri dohvaćanju pregleda:', error)
  }
}

const odaberiPregled = (pregled) => {
  // Omogući upload samo za preglede koji podržavaju dokumentaciju
  if (canUploadFiles(pregled.examinationType)) {
    selectedExaminationId.value = pregled.id
    console.log('Odabran pregled ID:', pregled.id)
  }
}

// Provjeri može li se uploadati dokumentacija za ovaj tip pregleda
const canUploadFiles = (tipPregleda) => {
  const typesWithFiles = ['X-RAY', 'CT', 'MR', 'ULTRA', 'EKG', 'ECHO', 'EYE', 'MAMMO']
  return typesWithFiles.includes(tipPregleda)
}

const closeModal = () => {
  selectedExaminationId.value = null
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('hr-HR')
}

const getExaminationTypeName = (typeCode) => {
  const types = {
    'GP': 'Opći pregled', 'KRV': 'Test krvi', 'X-RAY': 'Rendgen', 'CT': 'CT', 
    'MR': 'MR', 'ULTRA': 'Ultrazvuk', 'EKG': 'EKG', 'ECHO': 'ECHO', 
    'EYE': 'Oči', 'DERM': 'Koža', 'DENTA': 'Zubi', 'MAMMO': 'Mamografija', 
    'NEURO': 'Neurologija'
  }
  return types[typeCode] || typeCode
}

const handleFileUploaded = (data) => {
  console.log('File uploaded:', data)
  // Osvježi listu pregleda nakon uploada
  fetchPregledi()
  selectedExaminationId.value = null // Resetiraj odabir
}

const navigirajNaPreglede = () => {
  closeModal()
  router.push(`/pacijenti/${props.pacijent.id}/pregledi`)
}

// Dohvati preglede kada se modal otvori
onMounted(async () => {
  if (props.show && props.pacijent) {
    await fetchPregledi()
  }
})
</script>

<style scoped>
.details-modal {
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.details-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.details-section h3 {
  margin-bottom: 15px;
  color: #007bff;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.no-exams {
  text-align: center;
  color: #6c757d;
  margin-bottom: 15px;
}

.instruction {
  color: #495057;
  margin-bottom: 15px;
  font-style: italic;
}

.pregledi-lista {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}

.pregled-item {
  padding: 12px 15px;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.pregled-item:last-child {
  border-bottom: none;
}

.pregled-item:hover {
  background-color: #e3f2fd;
}

.pregled-item.selected {
  background-color: #007bff;
  color: white;
}

.pregled-item.can-upload {
  border-left: 4px solid #28a745;
}

.pregled-item:not(.can-upload) {
  opacity: 0.6;
  cursor: not-allowed;
  border-left: 4px solid #6c757d;
}

.pregled-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pregled-info strong {
  font-size: 14px;
}

.pregled-info span {
  font-size: 12px;
  opacity: 0.8;
}

.pregled-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.file-count {
  background: #17a2b8;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.upload-indicator {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.upload-container {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 2px dashed #007bff;
}

.upload-container h4 {
  margin: 0 0 15px 0;
  color: #007bff;
}

.upload-placeholder {
  text-align: center;
  padding: 30px;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.btn-primary {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  display: block;
  margin: 0 auto;
}

.btn-primary:hover {
  background: #0056b3;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #5a6268;
}

/* Responsive */
@media (max-width: 768px) {
  .details-modal {
    margin: 10px;
    width: calc(100% - 20px);
  }
  
  .pregled-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .pregled-actions {
    align-self: flex-end;
  }
}
</style>