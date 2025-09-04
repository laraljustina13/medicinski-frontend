<template>
  <div class="modal-overlay" v-if="show" @click.self="closeModal">
    <div class="modal-content details-modal">
      <h2>Detalji pregleda: {{ getExaminationTypeName(pregled.examinationType) }}</h2>
      
      <div class="details-section">
        <h3>📋 Osnovne informacije</h3>
        <div class="detail-row">
          <span class="label">Pacijent:</span>
          <span class="value">{{ pregled.patientName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Tip pregleda:</span>
          <span class="value">{{ getExaminationTypeName(pregled.examinationType) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Datum i vrijeme:</span>
          <span class="value">{{ formatDateTime(pregled.examinationDate) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Napomene:</span>
          <span class="value">{{ pregled.notes || 'Nema napomena' }}</span>
        </div>
      </div>

      <!-- RECEPTI -->
      <div class="details-section" v-if="pregled.prescriptions && pregled.prescriptions.length > 0">
        <h3>💊 Recepti</h3>
        <div v-for="(prescription, index) in pregled.prescriptions" :key="prescription.id" class="prescription-item">
          <div class="detail-row">
            <span class="label">Lijek {{ index + 1 }}:</span>
            <span class="value">{{ prescription.medicationName }}</span>
          </div>
          <div class="detail-row" v-if="prescription.dosage">
            <span class="label">Doza:</span>
            <span class="value">{{ prescription.dosage }}</span>
          </div>
          <div class="detail-row" v-if="prescription.instructions">
            <span class="label">Uputa:</span>
            <span class="value">{{ prescription.instructions }}</span>
          </div>
        </div>
      </div>

      <!-- PRILOZI -->
      <div class="details-section" v-if="pregled.examinationFiles && pregled.examinationFiles.length > 0">
        <h3>📎 Prilozi ({{ pregled.examinationFiles.length }})</h3>
        <div v-for="file in pregled.examinationFiles" :key="file.id" class="file-item">
          <span class="file-name">{{ file.fileName }}</span>
          <span class="file-size">({{ formatFileSize(file.fileSize) }})</span>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="closeModal" class="btn-cancel">Zatvori</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  show: Boolean,
  pregled: Object
})

const emit = defineEmits(['close'])

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

const closeModal = () => {
  emit('close')
}

const getExaminationTypeName = (typeCode) => {
  return examinationTypes[typeCode] || typeCode
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('hr-HR')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}
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

.prescription-item {
  background: white;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  border-left: 4px solid #28a745;
}

.file-item {
  background: white;
  padding: 8px;
  margin-bottom: 5px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  font-weight: 500;
}

.file-size {
  color: #6c757d;
  font-size: 0.9em;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>