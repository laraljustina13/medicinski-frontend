<template>
  <div class="modal-overlay" v-if="show" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ editMode ? 'Uredi bolest' : 'Nova bolest' }}</h2>
      
      <form @submit.prevent="saveBolest">
        <div class="form-group">
          <label>Naziv bolesti *</label>
          <input v-model="form.diseaseName" required placeholder="Unesite naziv bolesti"/>
        </div>

       <div class="form-group">
  <label>Opis bolesti</label>
  <textarea 
    v-model="form.description" 
    placeholder="Opcionalni opis bolesti..." 
    rows="3"
    class="form-textarea"
/>
</div>

        <div class="form-group">
          <label>Datum početka *</label>
          <input v-model="form.startDate" type="date" required/>
        </div>

        <div class="form-group">
          <label>Datum završetka</label>
          <input v-model="form.endDate" type="date"/>
          <small>Ostavite prazno ako je bolest još aktivna</small>
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
  bolest: Object,
  pacijentId: Number
})

const emit = defineEmits(['close', 'saved'])

const editMode = ref(false)
const form = reactive({
  diseaseName: '',
  startDate: '',
  endDate: ''
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.bolest) {
      editMode.value = true
      Object.assign(form, props.bolest)
    } else {
      editMode.value = false
      resetForm()
    }
  }
})

const resetForm = () => {
  Object.assign(form, {
    diseaseName: '',
    startDate: '',
    endDate: ''
  })
}

const closeModal = () => {
  emit('close')
  resetForm()
}

const saveBolest = async () => {
  try {
    console.log('💾 Spremanje bolesti za pacijenta ID:', props.pacijentId)
    
    const payload = {
      patientId: props.pacijentId,
      diseaseName: form.diseaseName,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      description: form.description || ''
    }

    console.log('📤 Payload:', payload)

    let response
    if (editMode.value) {
      response = await api.put(`/patients/${props.pacijentId}/medicalrecords/${props.bolest.id}`, payload)
      console.log('✅ Uređeno:', response.data)
    } else {
      response = await api.post(`/patients/${props.pacijentId}/medicalrecords`, payload)
      console.log('✅ Dodano:', response.data)
    }
    
    emit('saved')
    closeModal()
    alert(editMode.value ? 'Bolest uspješno uređena!' : 'Bolest uspješno dodana!')
    
  } catch (error) {
    console.error('❌ Greška pri spremanju bolesti:', error)
    console.error('❌ Status:', error.response?.status)
    console.error('❌ Podaci:', error.response?.data)
    alert('Došlo je do greške pri spremanju bolesti: ' + (error.response?.data || error.message))
  }
}
</script>
<style scoped>
.form-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
}
</style>