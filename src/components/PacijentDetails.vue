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
        <h3>📋 Pregledi:</h3>
        <div v-for="pregled in pregledi" :key="pregled.id" 
             @click="odaberiPregled(pregled)"
             :class="{ selected: selectedExaminationId === pregled.id }"
             class="pregled-item">
          {{ getExaminationTypeName(pregled.examinationType) }} - 
          {{ formatDate(pregled.examinationDate) }}
        </div>

        <FileUpload :pacijent="pacijent" @uploaded="handleFileUploaded" />
      </div>
      

      <div class="modal-actions">
        <button @click="closeModal" class="btn-cancel">Zatvori</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue'
import api from '@/services/api'
import FileUpload from '@/components/FileUpload.vue' 

const props = defineProps({
  show: Boolean,
  pacijent: Object
})

const emit = defineEmits(['close'])

// State
const pregledi = ref([])
const selectedExaminationId = ref(null)

// Dohvati preglede za pacijenta
const fetchPregledi = async () => {
  try {
    if (props.pacijent?.id) {
      const response = await api.get(`/api/patients/${props.pacijent.id}/examinations`)
      pregledi.value = response.data
    }
  } catch (error) {
    console.error('Greška pri dohvaćanju pregleda:', error)
  }
}

const odaberiPregled = (pregled) => {
  selectedExaminationId.value = pregled.id
  console.log('Odabran pregled ID:', pregled.id)
}

const closeModal = () => {
  selectedExaminationId.value = null // 👈 Resetiraj odabir
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
  // Osvježi podatke ili prikaži poruku
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
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}

.details-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.details-section h3 {
  margin-bottom: 15px;
  color: #007bff;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
  width: 120px;
  color: #555;
  flex-shrink: 0;
}

.value {
  flex: 1;
}

.pregled-item {
  padding: 10px;
  border: 1px solid #ddd;
  margin: 5px 0;
  cursor: pointer;
  border-radius: 5px;
}

.pregled-item.selected {
  background-color: #007bff;
  color: white;
  border-color: #0056b3;
}

.pregled-item:hover {
  background-color: #e9ecef;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>