<template>
  <div class="modal-overlay" v-if="show" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ editMode ? 'Uredi recept' : 'Novi recept' }}</h2>
      
      <form @submit.prevent="saveRecept">
        <div class="form-group">
          <label>Pregled *</label>
          <select v-model="form.examinationId" required>
            <option value="">Odaberite pregled</option>
            <option v-for="pregled in props.pregledi" :key="pregled.id" :value="pregled.id">
              {{ getExaminationTypeName(pregled.examinationType) }} - {{ formatDate(pregled.examinationDate) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Naziv lijeka *</label>
          <input v-model="form.medicationName" required placeholder="Unesite naziv lijeka"/>
        </div>

        <div class="form-group">
          <label>Doza</label>
          <input v-model="form.dosage" placeholder="npr. 500mg, 1 tableta dnevno"/>
        </div>

        <div class="form-group">
          <label>Uputa za upotrebu</label>
          <textarea v-model="form.instructions" placeholder="Detaljne upute za pacijenta..." rows="3"/>
        </div>

        <div class="form-group">
          <label>Datum izdavanja *</label>
          <input v-model="form.prescriptionDate" type="date" required/>
        </div>

        <div class="form-actions">
          <button type="button" @click="closeModal" class="btn-cancel">Odustani</button>
          <button type="submit" class="btn-save">{{ editMode ? 'Spremi' : 'Dodaj' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import api from '@/services/api'

const props = defineProps({
  show: Boolean,
  recept: Object,
  pacijentId: Number,
  pregledi: Array
})

const emit = defineEmits(['close', 'saved'])

const examinationTypes = {
  'GP': 'Opći pregled', 'KRV': 'Test krvi', 'X-RAY': 'Rendgen', 'CT': 'CT', 'MR': 'MR',
  'ULTRA': 'Ultrazvuk', 'EKG': 'EKG', 'ECHO': 'ECHO', 'EYE': 'Oči', 'DERM': 'Koža',
  'DENTA': 'Zubi', 'MAMMO': 'Mamografija', 'NEURO': 'Neurologija'
}

const editMode = ref(false)
const form = reactive({
  examinationId: '',
  medicationName: '',
  dosage: '',
  instructions: '',
  prescriptionDate: new Date().toISOString().split('T')[0]
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.recept) {
      editMode.value = true
      Object.assign(form, props.recept)
      form.prescriptionDate = form.prescriptionDate ? form.prescriptionDate.split('T')[0] : new Date().toISOString().split('T')[0]
    } else {
      editMode.value = false
      resetForm()
    }
  }
})

const resetForm = () => {
  Object.assign(form, {
    examinationId: '',
    medicationName: '',
    dosage: '',
    instructions: '',
    prescriptionDate: new Date().toISOString().split('T')[0]
  })
}

const closeModal = () => {
  emit('close')
  resetForm()
}

const saveRecept = async () => {
  try {
    console.log('💊 Spremanje recepta...')
    console.log('Form data:', JSON.stringify(form, null, 2))
    
    const payload = {
      medicationName: form.medicationName,
      dosage: form.dosage,
      instructions: form.instructions,
      prescriptionDate: new Date(form.prescriptionDate).toISOString()
    }

    console.log('📤 Payload:', JSON.stringify(payload, null, 2))

    let endpoint
    if (editMode.value) {
      endpoint = `/examinations/${form.examinationId}/prescriptions/${props.recept.id}`
      console.log('🔄 PUT endpoint:', endpoint)
      const response = await api.put(endpoint, payload)
      console.log('✅ Uređeno:', response.data)
    } else {
      endpoint = `/examinations/${form.examinationId}/prescriptions`
      console.log('🆕 POST endpoint:', endpoint)
      const response = await api.post(endpoint, payload)
      console.log('✅ Dodano:', response.data)
    }
    
    emit('saved')
    closeModal()
    alert(editMode.value ? 'Recept uspješno uređen!' : 'Recept uspješno dodan!')
    
  } catch (error) {
    console.error('❌ Cijela greška:', error)
    console.error('❌ Status:', error.response?.status)
    console.error('❌ Podaci:', error.response?.data)
    console.error('❌ URL:', error.config?.url)
    alert('Greška: ' + (error.response?.data?.message || error.message))
  }
}

const getExaminationTypeName = (typeCode) => {
  return examinationTypes[typeCode] || typeCode
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('hr-HR')
}
</script>

<style scoped>
.modal-content {
  max-width: 600px;
}
</style>